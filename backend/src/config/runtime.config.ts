import { isIP } from 'node:net';
export function runtimeConfig(env: NodeJS.ProcessEnv = process.env) {
  const host = env.HOST ?? '127.0.0.1';
  if (!['127.0.0.1', '0.0.0.0', '::1', '::'].includes(host))
    throw new Error('HOST must be a bind IP');
  const proxies =
    env.TRUST_PROXY === undefined
      ? []
      : env.TRUST_PROXY.split(',').map((v) => v.trim());
  for (const proxy of proxies) {
    const parts = proxy.split('/'),
      version = isIP(parts[0]);
    if (
      !version ||
      parts.length > 2 ||
      (parts.length === 2 &&
        (!/^\d+$/.test(parts[1]) ||
          Number(parts[1]) < (version === 4 ? 8 : 32) ||
          Number(parts[1]) > (version === 4 ? 32 : 128)))
    )
      throw new Error(
        'TRUST_PROXY must list specific proxy IPs or restricted CIDRs',
      );
  }
  return { host, proxies };
}
