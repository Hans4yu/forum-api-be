import { describe, expect, it, vi } from 'vitest';
import AuthenticationError from '../../../../Commons/exceptions/AuthenticationError.js';
import AuthenticationTokenManager from '../../../../Applications/security/AuthenticationTokenManager.js';
import createAuthenticationMiddleware from '../authenticationMiddleware.js';

describe('authenticationMiddleware', () => {
  it('should call next with AuthenticationError when authorization header is missing', async () => {
    // Arrange
    const authenticationTokenManager = new AuthenticationTokenManager();
    const middleware = createAuthenticationMiddleware(authenticationTokenManager);
    const req = { headers: {} };
    const res = {};
    const next = vi.fn();

    // Action
    await middleware(req, res, next);

    // Assert
    expect(next).toBeCalledWith(expect.any(AuthenticationError));
    expect(next.mock.calls[0][0].message).toEqual('Missing authentication');
  });

  it('should call next with AuthenticationError when authorization header is malformed', async () => {
    // Arrange
    const authenticationTokenManager = new AuthenticationTokenManager();
    const middleware = createAuthenticationMiddleware(authenticationTokenManager);
    const req = { headers: { authorization: 'Token token' } };
    const res = {};
    const next = vi.fn();

    // Action
    await middleware(req, res, next);

    // Assert
    expect(next).toBeCalledWith(expect.any(AuthenticationError));
    expect(next.mock.calls[0][0].message).toEqual('Missing authentication');
  });

  it('should set req.auth and call next when bearer token is valid', async () => {
    // Arrange
    const authenticationTokenManager = new AuthenticationTokenManager();
    authenticationTokenManager.verifyAccessToken = vi.fn();
    authenticationTokenManager.decodePayload = vi.fn().mockResolvedValue({
      id: 'user-123',
      username: 'dicoding',
    });
    const middleware = createAuthenticationMiddleware(authenticationTokenManager);
    const req = { headers: { authorization: 'Bearer access-token' } };
    const res = {};
    const next = vi.fn();

    // Action
    await middleware(req, res, next);

    // Assert
    expect(authenticationTokenManager.verifyAccessToken).toBeCalledWith('access-token');
    expect(authenticationTokenManager.decodePayload).toBeCalledWith('access-token');
    expect(req.auth).toEqual({
      id: 'user-123',
      username: 'dicoding',
    });
    expect(next).toBeCalledWith();
  });
});
