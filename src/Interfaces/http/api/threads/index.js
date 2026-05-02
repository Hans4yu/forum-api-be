import ThreadsHandler from './handler.js';
import createThreadsRouter from './routes.js';
import createAuthenticationMiddleware from '../../middlewares/authenticationMiddleware.js';
import AuthenticationTokenManager from '../../../../Applications/security/AuthenticationTokenManager.js';

const createLazyAuthenticationMiddleware = (container) => async (req, res, next) => {
  try {
    const authenticationTokenManager = container.getInstance(AuthenticationTokenManager.name);
    const authenticationMiddleware = createAuthenticationMiddleware(authenticationTokenManager);

    return authenticationMiddleware(req, res, next);
  } catch (error) {
    return next(error);
  }
};

export default (container) => {
  const threadsHandler = new ThreadsHandler(container);
  const authenticationMiddleware = createLazyAuthenticationMiddleware(container);

  return createThreadsRouter(threadsHandler, authenticationMiddleware);
};
