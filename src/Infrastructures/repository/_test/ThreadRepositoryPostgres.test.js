import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import NewThread from '../../../Domains/threads/entities/NewThread.js';
import AddedThread from '../../../Domains/threads/entities/AddedThread.js';
import pool from '../../database/postgres/pool.js';
import ThreadRepositoryPostgres from '../ThreadRepositoryPostgres.js';

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist thread correctly and return added thread correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });

      const newThread = new NewThread({ title: 'judul thread', body: 'isi thread' });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const addedThread = await threadRepositoryPostgres.addThread(newThread, 'user-123');

      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: 'judul thread',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyThreadExists function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.verifyThreadExists('thread-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw when thread exists', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.verifyThreadExists('thread-123'))
        .resolves
        .not.toThrowError(NotFoundError);
    });
  });

  describe('getDetailThreadById function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.getDetailThreadById('thread-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should return thread detail correctly with ordered comments', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        threadId: 'thread-123',
        owner: 'user-456',
        content: 'komentar kedua',
        createdAt: '2026-05-01T00:00:02.000Z',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'komentar pertama',
        createdAt: '2026-05-01T00:00:01.000Z',
      });
      await CommentLikesTableTestHelper.addLike({ id: 'comment-like-123', commentId: 'comment-123', userId: 'user-123' });
      await CommentLikesTableTestHelper.addLike({ id: 'comment-like-456', commentId: 'comment-123', userId: 'user-456' });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      const threadDetail = await threadRepositoryPostgres.getDetailThreadById('thread-123');

      expect(threadDetail).toMatchObject({
        id: 'thread-123',
        title: 'judul thread',
        body: 'isi thread',
        date: expect.any(String),
        username: 'dicoding',
        comments: [
          {
            id: 'comment-123',
            content: 'komentar pertama',
            date: expect.any(String),
            username: 'dicoding',
            'like_count': 2,
          },
          {
            id: 'comment-456',
            content: 'komentar kedua',
            date: expect.any(String),
            username: 'johndoe',
            'like_count': 0,
          },
        ],
      });

      expect(threadDetail.comments[0].id).toBe('comment-123');
      expect(threadDetail.comments[1].id).toBe('comment-456');
    });

    it('should return thread detail with empty comments array when there is no comment', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      const threadDetail = await threadRepositoryPostgres.getDetailThreadById('thread-123');

      expect(threadDetail).toMatchObject({
        id: 'thread-123',
        title: 'judul thread',
        body: 'isi thread',
        date: expect.any(String),
        username: 'dicoding',
        comments: [],
      });
    });
  });
});
