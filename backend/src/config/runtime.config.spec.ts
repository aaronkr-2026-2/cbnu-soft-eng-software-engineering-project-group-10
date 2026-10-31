import { runtimeConfig } from './runtime.config.js';
describe('runtime binding and proxy settings', () => {
  it('does not trust forwarded headers by default', () => {
    expect(runtimeConfig({})).toEqual({ host: '127.0.0.1', proxies: [] });
  });
  it('accepts explicit deployment addresses', () => {
    expect(
      runtimeConfig({ HOST: '0.0.0.0', TRUST_PROXY: '127.0.0.1,172.30.0.0/24' })
        .proxies,
    ).toHaveLength(2);
  });
  it.each(['true', '*', '0.0.0.0/0', '127.0.0.1/99', '', ',', 'https://proxy'])(
    'rejects unsafe proxy value %s',
    (TRUST_PROXY) => {
      expect(() => runtimeConfig({ TRUST_PROXY })).toThrow();
    },
  );
  it('rejects invalid host', () => {
    expect(() => runtimeConfig({ HOST: 'example.com' })).toThrow();
  });
});
