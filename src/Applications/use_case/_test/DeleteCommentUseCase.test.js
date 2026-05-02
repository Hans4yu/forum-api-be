import { vi } from 'vitest';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import DeleteCommentUseCase from '../DeleteCommentUseCase.js';

describe('DeleteCommentUseCase', () => {
  it('should throw error when comment not found', async () => {
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn().mockImplementation(() => Promise.resolve());

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.verifyCommentExists = vi.fn().mockImplementation(() => Promise.reject(new Error('komentar tidak ditemukan')));

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await expect(deleteCommentUseCase.execute({ commentId: 'comment-123' }, 'thread-123', 'user-123'))
      .rejects
      .toThrowError('komentar tidak ditemukan');
  });

  it('should orchestrate delete comment action correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn().mockImplementation(() => Promise.resolve());

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.verifyCommentExists = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentBelongsToThread = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.softDeleteComment = vi.fn().mockImplementation(() => Promise.resolve());

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await deleteCommentUseCase.execute({ commentId: 'comment-123' }, 'thread-123', 'user-123');

    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith('comment-123');
    expect(mockCommentRepository.verifyCommentBelongsToThread).toBeCalledWith('comment-123', 'thread-123');
    expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith('comment-123', 'user-123');
    expect(mockCommentRepository.softDeleteComment).toBeCalledWith('comment-123');
  });

  it('should reject when target is a reply instead of top-level comment', async () => {
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn().mockImplementation(() => Promise.resolve());

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.verifyCommentExists = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentBelongsToThread = vi.fn().mockImplementation(() => Promise.reject(new NotFoundError('komentar tidak ditemukan')));

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await expect(deleteCommentUseCase.execute({ commentId: 'reply-123' }, 'thread-123', 'user-123'))
      .rejects
      .toThrowError(NotFoundError);
  });
});
