#!/usr/bin/env node
/**
 * Validacao end-to-end da Etapa 1 contra um projeto REAL do Supabase.
 *
 * Usa apenas NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (lidos de .env.local). Nenhuma chave secreta e necessaria ou exibida.
 *
 *   npm run validate:supabase
 *
 * Se o app estiver rodando em http://localhost:3000, o script tambem testa
 * a protecao de rotas e a renderizacao do dashboard com a sessao real.
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// ---------------------------------------------------------------- utilidades
const results = [];
let failures = 0;
let skipped = 0;

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const icon = ok ? '\x1b[32mOK  \x1b[0m' : '\x1b[31mFALHA\x1b[0m';
  console.log(`  ${icon} ${name}${detail ? ` \x1b[90m(${detail})\x1b[0m` : ''}`);
  if (!ok) failures += 1;
}

/** Verificacao que nao se aplica neste ambiente: nao conta como OK nem como falha. */
function skip(name, reason) {
  results.push({ name, ok: null, detail: reason });
  skipped += 1;
  console.log(`  \x1b[90mPULADO\x1b[0m ${name} \x1b[90m(${reason})\x1b[0m`);
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

function stop(message, hint) {
  console.error(`\n\x1b[31mPAROU:\x1b[0m ${message}`);
  if (hint) console.error(`\x1b[33m=> ${hint}\x1b[0m`);
  process.exit(2);
}

function loadEnv(file = '.env.local') {
  let raw;
  try {
    raw = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  } catch {
    stop(
      `nao encontrei o arquivo ${file}.`,
      'Copie .env.example para .env.local e preencha com os dados do seu projeto Supabase.',
    );
  }

  const env = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}

const anonClient = (url, key) =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/** Traduz a falha de cadastro na acao concreta que resolve. */
function signUpHint(error) {
  const code = error?.code ?? '';
  const message = (error?.message ?? '').toLowerCase();

  if (code === 'over_email_send_rate_limit' || message.includes('email rate limit')) {
    return (
      'O limite de envio de e-mails do Supabase foi atingido. Isso so acontece porque "Confirm email" ' +
      'esta LIGADO: com ele ligado, cada cadastro dispara um e-mail, e o SMTP padrao permite poucos por hora. ' +
      'Desligue em Authentication > Sign In / Providers > Email (botao Save) e rode o script de novo — ' +
      'sem confirmacao nenhum e-mail e enviado e o limite deixa de valer. ' +
      'Religue depois para testar a confirmacao manualmente com o seu e-mail real.'
    );
  }
  if (code === 'signup_disabled' || message.includes('signups not allowed')) {
    return 'Cadastro desativado. Ligue "Allow new users to sign up" em Authentication > Sign In / Providers.';
  }
  if (code === 'email_provider_disabled' || message.includes('email signups are disabled')) {
    return 'Provedor Email desativado. Ligue "Enable Email provider" em Authentication > Sign In / Providers > Email.';
  }
  if (code === 'email_address_invalid') {
    return 'O Supabase recusou os enderecos de teste. Verifique se ha restricao de dominio em Authentication > Attack Protection.';
  }

  return 'Confira Authentication > Sign In / Providers > Email: provedor habilitado e cadastro liberado.';
}

/** Diagnostica a recusa do INSERT em businesses com o estado real da sessao. */
function insertHint(error, session, user) {
  if (error.code !== '42501') return error.message;

  if (!session || !user) {
    return (
      'O pedido chegou ao Supabase SEM sessao (como visitante anonimo), por isso o RLS recusou. ' +
      'Rode o script de novo; se repetir, o login nao esta sendo mantido entre as chamadas.'
    );
  }

  return (
    `A sessao esta ativa (usuario ${user.id}), entao o RLS recusou o INSERT mesmo com o usuario logado. ` +
    'Isso indica que a policy de insercao nao foi criada. No SQL Editor do Supabase rode:\n\n' +
    "    select policyname, cmd, roles::text, with_check\n" +
    "      from pg_policies where schemaname='public' and tablename='businesses';\n\n" +
    'Tem que aparecer businesses_insert_authenticated com cmd=INSERT, roles={authenticated} e ' +
    'with_check=(auth.uid() IS NOT NULL). Se nao aparecer, rode a migration novamente ' +
    '(supabase/migrations/20260101000000_init_multitenant.sql) e repita a validacao.'
  );
}

// ------------------------------------------------------------------- inicio
const env = loadEnv();
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SITE = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!URL_ || !KEY) {
  stop(
    'NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes no .env.local.',
    'Preencha as duas variaveis (Project Settings > API no painel do Supabase).',
  );
}
if (URL_.includes('placeholder') || KEY.includes('placeholder')) {
  stop(
    'o .env.local ainda esta com os valores de exemplo.',
    'Substitua pelos valores reais do seu projeto Supabase.',
  );
}

console.log(`\n\x1b[1mValidacao da Etapa 1\x1b[0m`);
console.log(`Projeto: ${URL_}`);

const stamp = Date.now();
// Dominios reservados (RFC 2606): mensagens nunca chegam a uma caixa real.
const TEST_DOMAINS = ['example.com', 'example.org', 'example.net'];
const userA = { email: `qa-${stamp}-a@${TEST_DOMAINS[0]}`, password: `Senha!${stamp}A` };
const userB = { email: `qa-${stamp}-b@${TEST_DOMAINS[0]}`, password: `Senha!${stamp}B` };

/** Cadastra tentando outros dominios quando o Supabase recusa o e-mail de teste. */
async function signUpWithFallback(client, user, fullName) {
  let last = null;
  for (const domain of TEST_DOMAINS) {
    user.email = user.email.replace(/@.*$/, `@${domain}`);
    const { data, error } = await client.auth.signUp({
      email: user.email,
      password: user.password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${SITE}/auth/confirmar` },
    });
    if (!error) return { data, error: null };
    last = error;
    if (error.code !== 'email_address_invalid') break;
  }
  return { data: null, error: last };
}
const slugA = `qa-empresa-a-${stamp}`;
const slugB = `qa-empresa-b-${stamp}`;

let businessA = null;
let businessB = null;
let clientA = null;
let clientB = null;
let sessionA = null;

try {
  // ------------------------------------------------------- 1. conectividade
  section('1. Conexao e schema');
  {
    const res = await fetch(`${URL_}/auth/v1/health`, { headers: { apikey: KEY } });
    check('API de autenticacao respondendo', res.ok, `HTTP ${res.status}`);
    if (!res.ok) {
      stop('nao consegui falar com a API do Supabase.', 'Confira NEXT_PUBLIC_SUPABASE_URL e a anon key.');
    }
  }

  {
    const supabase = anonClient(URL_, KEY);
    for (const table of ['businesses', 'profiles', 'business_members']) {
      const { error } = await supabase.from(table).select('id').limit(1);
      const missing = error?.code === 'PGRST205' || error?.code === '42P01';
      check(`tabela public.${table} existe`, !missing, missing ? error.message : '');
      if (missing) {
        stop(
          `a tabela ${table} nao existe no projeto.`,
          'Rode supabase/migrations/20260101000000_init_multitenant.sql no SQL Editor do Supabase.',
        );
      }
    }

    const { error: bucketError } = await supabase.storage.from('business-assets').list('', { limit: 1 });
    const missingBucket = /not.?found/i.test(bucketError?.message ?? '');
    check('bucket business-assets criado', !missingBucket, missingBucket ? bucketError.message : '');
  }

  // ------------------------------------------------------------ 2. cadastro
  section('2. Cadastro e login');
  clientA = anonClient(URL_, KEY);
  {
    const { data, error } = await signUpWithFallback(clientA, userA, 'QA Owner A');
    check('cadastro do usuario A', !error, error?.message ?? userA.email);
    if (error) stop('o cadastro falhou.', signUpHint(error));

    if (!data.session) {
      console.log('\n\x1b[33mConfirmacao de e-mail esta ATIVA neste projeto.\x1b[0m');
      stop(
        'sem sessao apos o cadastro, o script nao consegue continuar automaticamente.',
        'Para rodar a validacao completa, desative temporariamente "Confirm email" em ' +
          'Authentication > Sign In / Providers > Email, rode este script e reative depois. ' +
          'O fluxo de confirmacao por e-mail deve ser testado manualmente com o seu e-mail real.',
      );
    }
  }

  {
    await clientA.auth.signOut();
    const { data, error } = await clientA.auth.signInWithPassword(userA);
    check('login do usuario A', !error && !!data.session, error?.message ?? '');
    sessionA = data?.session ?? null;
  }

  {
    const { data } = await clientA.auth.getUser();
    check('perfil criado pelo trigger handle_new_user', !!data.user, data.user?.email ?? '');
    const { data: profile, error } = await clientA
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', data.user.id)
      .maybeSingle();
    check('linha em public.profiles', !error && !!profile, profile?.full_name ?? error?.message ?? '');
  }

  {
    // Cliente separado: uma tentativa falha nunca pode afetar a sessao do usuario A.
    const probe = anonClient(URL_, KEY);
    const { error } = await probe.auth.signInWithPassword({ ...userA, password: 'senha-errada-123' });
    check('login com senha errada e rejeitado', !!error, error?.code ?? '');
  }

  // ------------------------------------------------------------- 3. empresa
  section('3. Empresa (multitenant)');
  {
    const { data: sessionCheck } = await clientA.auth.getUser();
    check('sessao ativa antes de criar a empresa', !!sessionCheck.user, sessionCheck.user?.id ?? 'sem sessao');

    // Mesmo padrao do app: INSERT sem RETURNING (a policy de leitura so passa
    // depois que o trigger grava o vinculo de owner), seguido da leitura.
    const { error } = await clientA
      .from('businesses')
      .insert({ name: 'QA Empresa A', slug: slugA, phone: '11999990000' });

    const { data } = error
      ? { data: null }
      : await clientA.from('businesses').select('*').eq('slug', slugA).single();

    check('criacao da empresa A', !error && !!data, error?.message ?? slugA);
    businessA = data;

    if (error) {
      const { data: current } = await clientA.auth.getSession();
      stop('nao consegui criar a empresa A.', insertHint(error, current.session, sessionCheck.user));
    }
  }

  if (businessA) {
    const { data, error } = await clientA
      .from('business_members')
      .select('role, user_id')
      .eq('business_id', businessA.id);
    const isOwner = !error && data?.length === 1 && data[0].role === 'owner';
    check('criador virou owner automaticamente (trigger)', isOwner, data?.[0]?.role ?? error?.message ?? '');
  }

  {
    const { data, error } = await clientA
      .from('businesses')
      .update({ name: 'QA Empresa A - editada', description: 'Editado pela validacao', address: 'Rua QA, 1' })
      .eq('id', businessA.id)
      .select('name, description')
      .single();
    check('owner edita as configuracoes da empresa', !error && data?.name === 'QA Empresa A - editada', error?.message ?? '');
  }

  {
    const { error } = await clientA
      .from('businesses')
      .insert({ name: 'QA Slug Duplicado', slug: slugA });
    check('slug duplicado e bloqueado', error?.code === '23505', error?.code ?? 'sem erro');
  }

  {
    const file = new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' });
    const path = `${businessA.id}/logo-${stamp}.png`;
    const { error } = await clientA.storage.from('business-assets').upload(path, file, {
      contentType: 'image/png',
      upsert: true,
    });
    check('upload de logo na pasta da propria empresa', !error, error?.message ?? path);
  }

  // ----------------------------------------------------- 4. isolamento RLS
  section('4. Isolamento entre empresas (RLS)');
  clientB = anonClient(URL_, KEY);
  {
    const { data, error } = await signUpWithFallback(clientB, userB, 'QA Owner B');
    check('cadastro do usuario B', !error && !!data?.session, error?.message ?? userB.email);
    if (error || !data?.session) {
      stop(
        'nao consegui criar o segundo usuario para testar o isolamento.',
        error ? signUpHint(error) : 'Desligue "Confirm email" em Authentication > Sign In / Providers > Email.',
      );
    }
  }

  {
    const { error } = await clientB
      .from('businesses')
      .insert({ name: 'QA Empresa B', slug: slugB });

    const { data } = error
      ? { data: null }
      : await clientB.from('businesses').select('*').eq('slug', slugB).single();

    check('criacao da empresa B', !error && !!data, error?.message ?? slugB);
    businessB = data;
  }

  {
    const { data } = await clientB.from('businesses').select('id, slug');
    const onlyOwn = (data ?? []).every((b) => b.id === businessB?.id);
    check('B enxerga apenas a propria empresa', onlyOwn, `${data?.length ?? 0} empresa(s) visivel(is)`);
  }

  {
    const { data } = await clientB.from('businesses').select('id').eq('id', businessA.id);
    check('B nao le a empresa de A', (data?.length ?? 0) === 0, `${data?.length ?? 0} linha(s)`);
  }

  {
    const { data } = await clientB
      .from('businesses')
      .update({ name: 'INVADIDO' })
      .eq('id', businessA.id)
      .select('id');
    check('B nao edita a empresa de A', (data?.length ?? 0) === 0, `${data?.length ?? 0} linha(s) alterada(s)`);
  }

  {
    const { data } = await clientB.from('businesses').delete().eq('id', businessA.id).select('id');
    check('B nao apaga a empresa de A', (data?.length ?? 0) === 0, `${data?.length ?? 0} linha(s) removida(s)`);
  }

  {
    const { data: userData } = await clientB.auth.getUser();
    const { error } = await clientB
      .from('business_members')
      .insert({ business_id: businessA.id, user_id: userData.user.id, role: 'owner' });
    check('B nao se auto-adiciona na empresa de A', !!error, error?.code ?? 'sem erro');
  }

  {
    const { data } = await clientB.from('business_members').select('id').eq('business_id', businessA.id);
    check('B nao lista os membros da empresa de A', (data?.length ?? 0) === 0, `${data?.length ?? 0} linha(s)`);
  }

  {
    const { data: userAData } = await clientA.auth.getUser();
    const { data } = await clientB.from('profiles').select('id').eq('id', userAData.user.id);
    check('B nao le o perfil de A', (data?.length ?? 0) === 0, `${data?.length ?? 0} linha(s)`);
  }

  {
    const file = new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' });
    const { error } = await clientB.storage
      .from('business-assets')
      .upload(`${businessA.id}/invasao-${stamp}.png`, file, { contentType: 'image/png' });
    check('B nao envia arquivo na pasta de A (storage)', !!error, error?.message ?? 'sem erro');
  }

  {
    const { data } = await clientA.from('businesses').select('name').eq('id', businessA.id).maybeSingle();
    check('empresa de A intacta apos as tentativas', data?.name === 'QA Empresa A - editada', data?.name ?? 'sumiu');
  }

  // -------------------------------------------------- 5. recuperacao/logout
  section('5. Recuperacao de senha e logout');
  {
    const { error } = await clientA.auth.resetPasswordForEmail(userA.email, {
      redirectTo: `${SITE}/auth/confirmar?next=%2Fnova-senha`,
    });
    if (!error) {
      check('pedido de recuperacao de senha aceito', true, 'e-mail disparado pelo Supabase');
    } else if (error.code === 'email_address_invalid') {
      skip(
        'pedido de recuperacao de senha',
        'o Supabase nao envia para dominios reservados de teste (example.com) — ' +
          'teste a recuperacao com o seu e-mail real, pela tela /recuperar-senha',
      );
    } else if (error.code === 'over_email_send_rate_limit') {
      skip(
        'pedido de recuperacao de senha',
        'limite de envio do SMTP padrao atingido — o endpoint respondeu, mas o e-mail nao saiu',
      );
    } else {
      check('pedido de recuperacao de senha aceito', false, error.message);
    }
  }

  {
    const { error } = await clientB.auth.signOut();
    const { data } = await clientB.auth.getSession();
    check('logout encerra a sessao', !error && !data.session, error?.message ?? '');
  }

  {
    const anon = anonClient(URL_, KEY);
    const { data } = await anon.from('businesses').select('id');
    check('visitante anonimo nao enxerga empresas', (data?.length ?? 0) === 0, `${data?.length ?? 0} linha(s)`);
  }

  // ------------------------------------------------------- 6. app (SSR/rotas)
  section('6. Aplicacao Next.js (protecao de rotas)');
  const appUp = await fetch('http://localhost:3000/', { redirect: 'manual' })
    .then((r) => r.status < 500)
    .catch(() => false);

  if (!appUp) {
    console.log('  \x1b[90mPULADO: app nao esta rodando. Rode "npm run dev" em outro terminal e repita.\x1b[0m');
  } else {
    const jar = new Map();
    const ssr = createServerClient(URL_, KEY, {
      cookies: {
        getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
        setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
      },
    });
    await ssr.auth.setSession({
      access_token: sessionA.access_token,
      refresh_token: sessionA.refresh_token,
    });
    const cookieHeader = [...jar.entries()].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join('; ');

    const visit = (path, headers = {}) =>
      fetch(`http://localhost:3000${path}`, { redirect: 'manual', headers });

    for (const path of ['/dashboard', '/dashboard/pedidos', '/onboarding']) {
      const res = await visit(path);
      const target = res.headers.get('location') ?? '';
      check(`${path} sem sessao redireciona para /entrar`, res.status === 307 && target.includes('/entrar'), `${res.status} ${target}`);
    }

    {
      const res = await visit('/dashboard', { cookie: cookieHeader });
      const html = await res.text();
      check('dashboard abre com a sessao real', res.status === 200 && html.includes('QA Empresa A'), `HTTP ${res.status}`);
      check('visao geral mostra plano e status', html.includes('Gratuito') && html.includes('Ativo'), '');
      check('visao geral mostra o usuario logado', html.includes(userA.email), '');
    }

    {
      const res = await visit('/entrar', { cookie: cookieHeader });
      const target = res.headers.get('location') ?? '';
      check('usuario logado sai de /entrar', res.status === 307 && target.includes('/dashboard'), `${res.status} ${target}`);
    }

    {
      const res = await visit('/dashboard/configuracoes', { cookie: cookieHeader });
      const html = await res.text();
      check('configuracoes da empresa carregam para o owner', res.status === 200 && html.includes('name="businessId"'), `HTTP ${res.status}`);
    }
  }
} finally {
  // ------------------------------------------------------------- 7. limpeza
  section('7. Limpeza');
  try {
    if (businessA && clientA) {
      await clientA.storage.from('business-assets').remove([`${businessA.id}/logo-${stamp}.png`]);
      const { error } = await clientA.from('businesses').delete().eq('id', businessA.id);
      check('empresa de teste A removida', !error, error?.message ?? '');
    }
    if (businessB && clientB) {
      await clientB.auth.signInWithPassword(userB);
      const { error } = await clientB.from('businesses').delete().eq('id', businessB.id);
      check('empresa de teste B removida', !error, error?.message ?? '');
    }
    await clientA?.auth.signOut();
    await clientB?.auth.signOut();
  } catch (error) {
    check('limpeza', false, error.message);
  }

  const total = results.length - skipped;
  console.log(
    `\n\x1b[1mResultado:\x1b[0m ${results.filter((r) => r.ok).length}/${total} verificacoes OK` +
      (skipped ? `, \x1b[90m${skipped} pulada(s)\x1b[0m` : '') +
      (failures ? `, \x1b[31m${failures} falha(s)\x1b[0m` : ', \x1b[32mnenhuma falha\x1b[0m'),
  );
  if (skipped) {
    console.log(
      '\x1b[90mAs verificacoes puladas dependem de um e-mail real e entram no teste manual ' +
        '(confirmacao de cadastro e recuperacao de senha).\x1b[0m',
    );
  }
  console.log(
    `\x1b[90mOs usuarios de teste (${userA.email} e ${userB.email}) continuam em Authentication > Users; ` +
      `remova manualmente se quiser.\x1b[0m\n`,
  );
  process.exit(failures ? 1 : 0);
}
