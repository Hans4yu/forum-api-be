import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }

  Object.assign(process.env, originalEnv);
};

describe('config', () => {
  afterEach(() => {
    restoreEnv();
    vi.resetModules();
    vi.unmock('dotenv');
  });

  it('should load .test.env with override when NODE_ENV is test', async () => {
    const dotenvConfig = vi.fn();

    vi.doMock('dotenv', () => ({
      default: {
        config: dotenvConfig,
      },
    }));

    Object.assign(process.env, {
      NODE_ENV: 'test',
      PORT: '5000',
      PGHOST: 'localhost',
      PGPORT: '5432',
      PGUSER: 'forum_user',
      PGPASSWORD: 'forum_password',
      PGDATABASE: 'forum_test_db',
      ACCESS_TOKEN_KEY: 'access-token-key',
      REFRESH_TOKEN_KEY: 'refresh-token-key',
      ACCESS_TOKEN_AGE: '1200',
    });

    const { default: config } = await import('../config.js');

    expect(dotenvConfig).toBeCalledWith(expect.objectContaining({
      path: expect.stringContaining('.test.env'),
      override: true,
    }));
    expect(config.database).toEqual({
      host: 'localhost',
      port: '5432',
      user: 'forum_user',
      password: 'forum_password',
      database: 'forum_test_db',
    });
  });

  it('should load default dotenv config outside test environment', async () => {
    const dotenvConfig = vi.fn();

    vi.doMock('dotenv', () => ({
      default: {
        config: dotenvConfig,
      },
    }));

    Object.assign(process.env, {
      NODE_ENV: 'development',
      PORT: '5000',
      PGHOST: 'localhost',
      PGPORT: '5432',
      PGUSER: 'forum_user',
      PGPASSWORD: 'forum_password',
      PGDATABASE: 'forum_dev_db',
      ACCESS_TOKEN_KEY: 'access-token-key',
      REFRESH_TOKEN_KEY: 'refresh-token-key',
      ACCESS_TOKEN_AGE: '1200',
    });

    const { default: config } = await import('../config.js');

    expect(dotenvConfig).toBeCalledWith();
    expect(config.app.host).toBe('localhost');
    expect(config.auth.jwtStrategy).toBe('forumapi');
  });

  it('should use 0.0.0.0 host in production', async () => {
    const dotenvConfig = vi.fn();

    vi.doMock('dotenv', () => ({
      default: {
        config: dotenvConfig,
      },
    }));

    Object.assign(process.env, {
      NODE_ENV: 'production',
      PORT: '5000',
      PGHOST: 'localhost',
      PGPORT: '5432',
      PGUSER: 'forum_user',
      PGPASSWORD: 'forum_password',
      PGDATABASE: 'forum_prod_db',
      ACCESS_TOKEN_KEY: 'access-token-key',
      REFRESH_TOKEN_KEY: 'refresh-token-key',
      ACCESS_TOKEN_AGE: '1200',
    });

    const { default: config } = await import('../config.js');

    expect(dotenvConfig).toBeCalledWith();
    expect(config.app.host).toBe('0.0.0.0');
  });
});
