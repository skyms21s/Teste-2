import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeRedirectPath } from '../src/lib/utils/safe-redirect.ts';
import { parsePrice, priceToInput, formatPrice } from '../src/lib/utils/currency.ts';
import { slugify, SLUG_PATTERN } from '../src/lib/utils/slug.ts';

const FALLBACK = '/dashboard';

test('safeRedirectPath aceita caminhos internos', () => {
  assert.equal(safeRedirectPath('/dashboard/pedidos', FALLBACK), '/dashboard/pedidos');
  assert.equal(safeRedirectPath('/dashboard?aba=1#topo', FALLBACK), '/dashboard?aba=1#topo');
  assert.equal(safeRedirectPath('/nova-senha', FALLBACK), '/nova-senha');
});

test('safeRedirectPath bloqueia open redirect', () => {
  const ataques = [
    '//evil.com',
    '/\\evil.com',
    '/\\/evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    'evil.com',
    '',
  ];
  for (const ataque of ataques) {
    assert.equal(safeRedirectPath(ataque, FALLBACK), FALLBACK, `deixou passar: ${JSON.stringify(ataque)}`);
  }
});

test('safeRedirectPath ignora valores que nao sao texto', () => {
  assert.equal(safeRedirectPath(null, FALLBACK), FALLBACK);
  assert.equal(safeRedirectPath(undefined, FALLBACK), FALLBACK);
  assert.equal(safeRedirectPath(42, FALLBACK), FALLBACK);
});

test('parsePrice entende os formatos brasileiros', () => {
  assert.equal(parsePrice('24,90'), 24.9);
  assert.equal(parsePrice('24.90'), 24.9);
  assert.equal(parsePrice('R$ 24,90'), 24.9);
  assert.equal(parsePrice('1.234,56'), 1234.56);
  assert.equal(parsePrice('10'), 10);
  assert.equal(parsePrice('0,1'), 0.1);
});

test('parsePrice recusa entradas invalidas', () => {
  assert.equal(parsePrice(''), null);
  assert.equal(parsePrice('abc'), null);
  assert.equal(parsePrice('R$'), null);
});

test('preco vai e volta entre input e exibicao', () => {
  assert.equal(priceToInput(24.9), '24,90');
  assert.equal(parsePrice(priceToInput(24.9)), 24.9);
  assert.match(formatPrice(24.9), /^R\$\s24,90$/);
});

test('slugify gera links validos', () => {
  assert.equal(slugify('Ponto de Encontro'), 'ponto-de-encontro');
  assert.equal(slugify('  Açaí & Cia!!  '), 'acai-cia');
  assert.equal(slugify('Pizzaria São João 2'), 'pizzaria-sao-joao-2');
  for (const nome of ['Ponto de Encontro', 'Açaí & Cia', 'X--Y']) {
    assert.match(slugify(nome), SLUG_PATTERN);
  }
});
