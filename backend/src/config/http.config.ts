export function httpConfig(env: NodeJS.ProcessEnv = process.env) {
  const rawPort = env.PORT ?? '3001';
  if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535)
    throw new Error('PORT must be an integer between 1 and 65535');

  const origins = (env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim());
  for (const origin of origins) {
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error(
        'CORS_ORIGINS must contain comma-separated HTTP(S) origins',
      );
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin)
      throw new Error(
        'CORS_ORIGINS must contain origins without paths, credentials or wildcards',
      );
  }
  return { port: Number(rawPort), cors: { origin: [...new Set(origins)] } };
}
