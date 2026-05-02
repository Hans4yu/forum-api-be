import { vi } from 'vitest';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import pool from '../../database/postgres/pool.js';
import CommentLikeRepositoryPostgres from '../CommentLikeRepositoryPostgres.js';

describe('CommentLikeRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('toggleLike function', () => {
    it('should add like when like does not exist', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      await commentLikeRepositoryPostgres.toggleLike('comment-123', 'user-123');

      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndUserId('comment-123', 'user-123');

      expect(likes).toHaveLength(1);
      expect(likes[0]).toMatchObject({
        id: 'comment-like-123',
        'comment_id': 'comment-123',
        'user_id': 'user-123',
      });
    });

    it('should delete like when like already exists', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await CommentLikesTableTestHelper.addLike({ id: 'comment-like-123', commentId: 'comment-123', userId: 'user-123' });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      await commentLikeRepositoryPostgres.toggleLike('comment-123', 'user-123');

      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndUserId('comment-123', 'user-123');

      expect(likes).toHaveLength(0);
    });
  });

  describe('countLikeByCommentId function', () => {
    it('should return numeric like count', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await CommentLikesTableTestHelper.addLike({ id: 'comment-like-123', commentId: 'comment-123', userId: 'user-123' });
      await CommentLikesTableTestHelper.addLike({ id: 'comment-like-456', commentId: 'comment-123', userId: 'user-456' });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      await expect(commentLikeRepositoryPostgres.countLikeByCommentId('comment-123'))
        .resolves
        .toBe(2);
    });
  });

  describe('query helper functions', () => {
    it('should add like with generated id', async () => {
      const query = vi.fn().mockResolvedValue({
        rows: [{
          id: 'comment-like-123',
          'comment_id': 'comment-123',
          'user_id': 'user-123',
        }],
      });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres({ query }, () => '123');

      const like = await commentLikeRepositoryPostgres.addLike('comment-123', 'user-123');

      expect(like).toEqual({
        id: 'comment-like-123',
        'comment_id': 'comment-123',
        'user_id': 'user-123',
      });
      expect(query).toBeCalledWith({
        text: 'INSERT INTO comment_likes VALUES($1, $2, $3, DEFAULT) RETURNING id, comment_id, user_id',
        values: ['comment-like-123', 'comment-123', 'user-123'],
      });
    });

    it('should throw NotFoundError when like does not exist', async () => {
      const query = vi.fn().mockResolvedValue({ rowCount: 0, rows: [] });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres({ query }, () => '123');

      await expect(commentLikeRepositoryPostgres.verifyLikeExists('comment-123', 'user-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should return like row when like exists', async () => {
      const query = vi.fn().mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 'comment-like-123' }],
      });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres({ query }, () => '123');

      await expect(commentLikeRepositoryPostgres.verifyLikeExists('comment-123', 'user-123'))
        .resolves
        .toEqual({ id: 'comment-like-123' });
    });

    it('should delete like with comment and user identifiers', async () => {
      const query = vi.fn().mockResolvedValue({});
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres({ query }, () => '123');

      await expect(commentLikeRepositoryPostgres.deleteLike('comment-123', 'user-123'))
        .resolves
        .toBeUndefined();

      expect(query).toBeCalledWith({
        text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        values: ['comment-123', 'user-123'],
      });
    });

    it('should rollback and release client when toggle like fails', async () => {
      const release = vi.fn();
      const client = {
        query: vi.fn()
          .mockResolvedValueOnce()
          .mockResolvedValueOnce()
          .mockRejectedValueOnce(new Error('boom'))
          .mockResolvedValueOnce(),
        release,
      };
      const poolMock = {
        connect: vi.fn().mockResolvedValue(client),
      };

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(poolMock, () => '123');

      await expect(commentLikeRepositoryPostgres.toggleLike('comment-123', 'user-123'))
        .rejects
        .toThrow('boom');

      expect(client.query).toBeCalledWith('ROLLBACK');
      expect(release).toBeCalled();
    });
  });
});
