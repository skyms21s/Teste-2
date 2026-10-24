const INTERNAL_ORIGIN = 'http://internal.invalid';

/**
 * Devolve um caminho interno seguro para redirecionar, ou o fallback.
 *
 * Checar so `startsWith('/')` nao basta: navegadores tratam `/\evil.com` e
 * `/<tab>/evil.com` como `//evil.com`, que leva para outro site (open redirect).
 * Aqui o valor e resolvido como URL de verdade e so passa se continuar na
 * mesma origem.
 */
export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback;

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
