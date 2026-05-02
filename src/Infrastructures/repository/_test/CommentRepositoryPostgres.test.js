import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import NewReply from '../../../Domains/comments/entities/NewReply.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import AddedReply from '../../../Domains/comments/entities/AddedReply.js';
import pool from '../../database/postgres/pool.js';
import CommentRepositoryPostgres from '../CommentRepositoryPostgres.js';

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist comment correctly and return added comment correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      const newComment = new NewComment({ content: 'isi komentar' });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedComment = await commentRepositoryPostgres.addComment(newComment, 'thread-123', 'user-123');

      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'isi komentar',
        owner: 'user-123',
      }));
    });
  });

  describe('addReply function', () => {
    it('should persist reply correctly and return added reply correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const newReply = new NewReply({ content: 'isi balasan' });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedReply = await commentRepositoryPostgres.addReply(newReply, 'thread-123', 'comment-123', 'user-123');

      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'isi balasan',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyCommentExists function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentExists('comment-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw when comment exists', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentExists('comment-123'))
        .resolves
        .not.toThrowError(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when owner mismatch', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-456'))
        .rejects
        .toThrowError(AuthorizationError);
    });

    it('should not throw when owner match', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-123'))
        .resolves
        .not.toThrowError(AuthorizationError);
    });
  });

  describe('verifyCommentBelongsToThread function', () => {
    it('should throw NotFoundError when comment does not belong to thread', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentBelongsToThread('comment-123', 'thread-456'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when comment is actually a reply', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'reply-123', threadId: 'thread-123', owner: 'user-123', parentCommentId: 'comment-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentBelongsToThread('reply-123', 'thread-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw when comment belongs to thread', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentBelongsToThread('comment-123', 'thread-123'))
        .resolves
        .not.toThrowError(NotFoundError);
    });
  });

  describe('verifyReplyBelongsToComment function', () => {
    it('should throw NotFoundError when reply not found on comment', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'reply-123', threadId: 'thread-123', owner: 'user-123', parentCommentId: 'comment-456' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyReplyBelongsToComment('reply-123', 'comment-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw when reply belongs to comment', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'reply-123', threadId: 'thread-123', owner: 'user-123', parentCommentId: 'comment-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyReplyBelongsToComment('reply-123', 'comment-123'))
        .resolves
        .not.toThrowError(NotFoundError);
    });
  });

  describe('softDeleteComment function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.softDeleteComment('comment-123'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should soft delete comment correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await commentRepositoryPostgres.softDeleteComment('comment-123');

      const comment = await CommentsTableTestHelper.findCommentById('comment-123');

      expect(comment[0].is_deleted).toBe(true);
      expect(comment[0].deleted_at).not.toBeNull();
    });
  });

  describe('softDeleteReply function', () => {
    it('should soft delete reply correctly', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'reply-123', threadId: 'thread-123', owner: 'user-123', parentCommentId: 'comment-123' });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await commentRepositoryPostgres.softDeleteReply('reply-123');

      const comment = await CommentsTableTestHelper.findCommentById('reply-123');

      expect(comment[0].is_deleted).toBe(true);
      expect(comment[0].deleted_at).not.toBeNull();
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return top-level comment and reply in created order', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        owner: 'user-123',
        content: 'komentar utama',
        createdAt: '2026-05-01T00:00:01.000Z',
      });
      await CommentLikesTableTestHelper.addLike({ id: 'comment-like-123', commentId: 'comment-123', userId: 'user-123' });
      await CommentsTableTestHelper.addComment({
        id: 'reply-123',
        threadId: 'thread-123',
        owner: 'user-456',
        content: 'balasan komentar',
        parentCommentId: 'comment-123',
        createdAt: '2026-05-01T00:00:02.000Z',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      expect(comments).toHaveLength(2);
      expect(comments).toStrictEqual([
        {
          id: 'comment-123',
          content: 'komentar utama',
          date: expect.any(String),
          username: 'dicoding',
          'like_count': 1,
          'parent_comment_id': null,
          'is_deleted': false,
          'deleted_at': null,
        },
        {
          id: 'reply-123',
          content: 'balasan komentar',
          date: expect.any(String),
          username: 'johndoe',
          'like_count': 0,
          'parent_comment_id': 'comment-123',
          'is_deleted': false,
          'deleted_at': null,
        },
      ]);

      expect(comments[0].date).not.toEqual(comments[1].date);
    });
  });
});
