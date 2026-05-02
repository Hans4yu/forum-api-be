import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';

describe('threads routes', () => {
  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  const createAuthenticatedRequest = async (username = 'dicodingthreadflow') => {
    const app = await createServer(container);

    await request(app).post('/users').send({
      username,
      password: 'secret',
      fullname: 'Dicoding Indonesia',
    });

    const loginResponse = await request(app).post('/authentications').send({
      username,
      password: 'secret',
    });

    return {
      app,
      accessToken: loginResponse.body.data.accessToken,
    };
  };

  const assertMissingAuthentication = async (app, method, path, payload = {}) => {
    const response = await request(app)[method](path).send(payload);

    expect(response.status).toEqual(401);
    expect(response.body).toEqual({
      status: 'fail',
      message: 'Missing authentication',
    });
  };

  it('should reject protected routes when auth header is missing', async () => {
    const { app } = await createAuthenticatedRequest();

    await assertMissingAuthentication(app, 'post', '/threads', {
      title: 'judul thread',
      body: 'isi thread',
    });

    await assertMissingAuthentication(app, 'post', '/threads/thread-123/comments', {
      content: 'isi komentar',
    });

    await assertMissingAuthentication(app, 'put', '/threads/thread-123/comments/comment-123/likes');
  });

  it('should handle full thread flow with comments, replies, likes, and deleted placeholders', async () => {
    const { app, accessToken } = await createAuthenticatedRequest('dicodingthreadlike');

    const addThreadResponse = await request(app)
      .post('/threads')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'judul thread',
        body: 'isi thread',
      });

    expect(addThreadResponse.status).toEqual(201);
    expect(addThreadResponse.body).toEqual({
      status: 'success',
      data: {
        addedThread: {
          id: expect.any(String),
          title: 'judul thread',
          owner: expect.any(String),
        },
      },
    });

    const { id: threadId } = addThreadResponse.body.data.addedThread;

    const addCommentResponse = await request(app)
      .post(`/threads/${threadId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'isi komentar' });

    expect(addCommentResponse.status).toEqual(201);
    expect(addCommentResponse.body).toEqual({
      status: 'success',
      data: {
        addedComment: {
          id: expect.any(String),
          content: 'isi komentar',
          owner: expect.any(String),
        },
      },
    });

    const { id: commentId } = addCommentResponse.body.data.addedComment;

    const addReplyResponse = await request(app)
      .post(`/threads/${threadId}/comments/${commentId}/replies`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'isi balasan' });

    expect(addReplyResponse.status).toEqual(201);
    expect(addReplyResponse.body).toEqual({
      status: 'success',
      data: {
        addedReply: {
          id: expect.any(String),
          content: 'isi balasan',
          owner: expect.any(String),
        },
      },
    });

    const { id: replyId } = addReplyResponse.body.data.addedReply;

    const likeResponse = await request(app)
      .put(`/threads/${threadId}/comments/${commentId}/likes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(likeResponse.status).toEqual(200);
    expect(likeResponse.body).toEqual({
      status: 'success',
    });

    const likedThreadDetailResponse = await request(app).get(`/threads/${threadId}`);

    expect(likedThreadDetailResponse.status).toEqual(200);
    expect(likedThreadDetailResponse.body.data.thread.comments[0].likeCount).toEqual(1);

    const unlikeResponse = await request(app)
      .put(`/threads/${threadId}/comments/${commentId}/likes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(unlikeResponse.status).toEqual(200);
    expect(unlikeResponse.body).toEqual({
      status: 'success',
    });

    const unlikedThreadDetailResponse = await request(app).get(`/threads/${threadId}`);

    expect(unlikedThreadDetailResponse.status).toEqual(200);
    expect(unlikedThreadDetailResponse.body.data.thread.comments[0].likeCount).toEqual(0);

    const deleteReplyResponse = await request(app)
      .delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(deleteReplyResponse.status).toEqual(200);
    expect(deleteReplyResponse.body).toEqual({
      status: 'success',
    });

    const deleteCommentResponse = await request(app)
      .delete(`/threads/${threadId}/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(deleteCommentResponse.status).toEqual(200);
    expect(deleteCommentResponse.body).toEqual({
      status: 'success',
    });

    const threadDetailResponse = await request(app).get(`/threads/${threadId}`);

    expect(threadDetailResponse.status).toEqual(200);
    expect(threadDetailResponse.body).toEqual({
      status: 'success',
      data: {
        thread: {
          id: threadId,
          title: 'judul thread',
          body: 'isi thread',
          date: expect.any(String),
          username: 'dicodingthreadlike',
          comments: [
            {
              id: commentId,
              username: 'dicodingthreadlike',
              date: expect.any(String),
              content: '**komentar telah dihapus**',
              likeCount: 0,
              replies: [
                {
                  id: replyId,
                  username: 'dicodingthreadlike',
                  date: expect.any(String),
                  content: '**balasan telah dihapus**',
                },
              ],
            },
          ],
        },
      },
    });
  });

  it('should return not found for invalid thread, comment, and reply ids', async () => {
    const { app, accessToken } = await createAuthenticatedRequest('dicodingthreadinvalidid');

    const threadResponse = await request(app).get('/threads/thread-invalid-id');

    expect(threadResponse.status).toEqual(404);
    expect(threadResponse.body).toEqual({
      status: 'fail',
      message: 'thread tidak ditemukan',
    });

    const addCommentResponse = await request(app)
      .post('/threads/thread-invalid-id/comments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'isi komentar' });

    expect(addCommentResponse.status).toEqual(404);
    expect(addCommentResponse.body).toEqual({
      status: 'fail',
      message: 'thread tidak ditemukan',
    });

    const addThreadResponse = await request(app)
      .post('/threads')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'judul thread',
        body: 'isi thread',
      });

    const { id: threadId } = addThreadResponse.body.data.addedThread;

    const addValidCommentResponse = await request(app)
      .post(`/threads/${threadId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'isi komentar valid' });

    const { id: commentId } = addValidCommentResponse.body.data.addedComment;

    const deleteCommentResponse = await request(app)
      .delete(`/threads/${threadId}/comments/comment-invalid-id`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(deleteCommentResponse.status).toEqual(404);
    expect(deleteCommentResponse.body).toEqual({
      status: 'fail',
      message: 'komentar tidak ditemukan',
    });

    const addReplyResponse = await request(app)
      .post(`/threads/${threadId}/comments/comment-invalid-id/replies`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'isi balasan' });

    expect(addReplyResponse.status).toEqual(404);
    expect(addReplyResponse.body).toEqual({
      status: 'fail',
      message: 'komentar tidak ditemukan',
    });

    const likeResponse = await request(app)
      .put(`/threads/${threadId}/comments/comment-invalid-id/likes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(likeResponse.status).toEqual(404);
    expect(likeResponse.body).toEqual({
      status: 'fail',
      message: 'komentar tidak ditemukan',
    });

    const deleteReplyResponse = await request(app)
      .delete(`/threads/${threadId}/comments/${commentId}/replies/reply-invalid-id`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(deleteReplyResponse.status).toEqual(404);
    expect(deleteReplyResponse.body).toEqual({
      status: 'fail',
      message: 'komentar tidak ditemukan',
    });
  });
});
