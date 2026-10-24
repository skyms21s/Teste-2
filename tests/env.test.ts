import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getSiteUrl } from '../src/lib/env.ts';

const KEYS = ['NEXT_PUBLIC_SITE_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_URL'] as const;
const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

function setEnv(values: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const key of KEYS) delete process.env[key];
  Object.assign(process.env, values);
}

test('getSiteUrl usa localhost quando nada esta configurado', () => {
  setEnv({});
  assert.equal(getSiteUrl(), 'http://localhost:3000');
});

test('getSiteUrl usa o dominio de producao da Vercel, nao o do deploy', () => {
  setEnv({ VERCEL_PROJECT_PRODUCTION_URL: 'cardapio.vercel.app', VERCEL_URL: 'cardapio-abc123.vercel.app' });
  assert.equal(getSiteUrl(), 'https://cardapio.vercel.app');
});

test('NEXT_PUBLIC_SITE_URL (dominio proprio) tem prioridade e perde a barra final', () => {
  setEnv({ NEXT_PUBLIC_SITE_URL: 'https://meucardapio.com.br/', VERCEL_PROJECT_PRODUCTION_URL: 'cardapio.vercel.app' });
  assert.equal(getSiteUrl(), 'https://meucardapio.com.br');
});
