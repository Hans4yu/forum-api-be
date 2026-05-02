import express from 'express';

const createThreadsRouter = (handler, authenticationMiddleware) => {
  const router = express.Router();

  router.post('/', authenticationMiddleware, handler.postThreadHandler);
  router.get('/:threadId', handler.getThreadDetailHandler);
  router.post('/:threadId/comments', authenticationMiddleware, handler.postCommentHandler);
  router.delete('/:threadId/comments/:commentId', authenticationMiddleware, handler.deleteCommentHandler);
  router.post('/:threadId/comments/:commentId/replies', authenticationMiddleware, handler.postReplyHandler);
  router.delete('/:threadId/comments/:commentId/replies/:replyId', authenticationMiddleware, handler.deleteReplyHandler);
  router.put('/:threadId/comments/:commentId/likes', authenticationMiddleware, handler.putCommentLikeHandler);

  return router;
};

export default createThreadsRouter;
