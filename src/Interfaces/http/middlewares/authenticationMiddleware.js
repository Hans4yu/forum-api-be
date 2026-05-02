import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';

const createAuthenticationMiddleware = (authenticationTokenManager) => async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw new AuthenticationError('Missing authentication');
    }

    const match = authorization.match(/^Bearer ([^\s]+)$/);

    if (!match) {
      throw new AuthenticationError('Missing authentication');
    }

    const accessToken = match[1];

    await authenticationTokenManager.verifyAccessToken(accessToken);

    const payload = await authenticationTokenManager.decodePayload(accessToken);

    req.auth = {
      id: payload.id,
      username: payload.username,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default createAuthenticationMiddleware;
