import { httpConfig } from './http.config.js';

describe('HTTP configuration', () => {
  it('defaults to local development settings', () => {
    expect(httpConfig({})).toEqual({
      port: 3001,
      cors: { origin: ['http://localhost:3000'] },
    });
  });
  it('accepts a custom port and trims and deduplicates origins', () => {
    expect(
      httpConfig({
        PORT: '4000',
        CORS_ORIGINS:
          'https://campus.example, http://localhost:3000,https://campus.example',
      }),
    ).toEqual({
      port: 4000,
      cors: { origin: ['https://campus.example', 'http://localhost:3000'] },
    });
  });
  it.each(['', '0', '65536', '3.5', 'abc', '-1'])(
    'rejects invalid port %s',
    (PORT) => {
      expect(() => httpConfig({ PORT })).toThrow('PORT');
    },
  );
  it.each([
    '',
    '*',
    'null',
    'ftp://example.com',
    'https://example.com/path',
    'https://user:pass@example.com',
    'https://example.com,',
  ])('rejects invalid origins %s', (CORS_ORIGINS) => {
    expect(() => httpConfig({ CORS_ORIGINS })).toThrow('CORS_ORIGINS');
  });
});
