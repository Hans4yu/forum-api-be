import { vi } from 'vitest';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import DeleteReplyUseCase from '../DeleteReplyUseCase.js';

describe('DeleteReplyUseCase', () => {
  it('should throw error when reply not found', async () => {
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn().mockImplementation(() => Promise.resolve());

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.verifyCommentExists = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentBelongsToThread = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyReplyBelongsToComment = vi.fn().mockImplementation(() => Promise.reject(new Error('balasan tidak ditemukan')));

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await expect(deleteReplyUseCase.execute({ replyId: 'reply-123' }, 'thread-123', 'comment-123', 'user-123'))
      .rejects
      .toThrowError('balasan tidak ditemukan');
  });

  it('should orchestrate delete reply action correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn().mockImplementation(() => Promise.resolve());

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.verifyCommentExists = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentBelongsToThread = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyReplyBelongsToComment = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.softDeleteReply = vi.fn().mockImplementation(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await deleteReplyUseCase.execute({ replyId: 'reply-123' }, 'thread-123', 'comment-123', 'user-123');

    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith('comment-123');
    expect(mockCommentRepository.verifyCommentBelongsToThread).toBeCalledWith('comment-123', 'thread-123');
    expect(mockCommentRepository.verifyCommentExists).toHaveBeenNthCalledWith(2, 'reply-123');
    expect(mockCommentRepository.verifyReplyBelongsToComment).toBeCalledWith('reply-123', 'comment-123');
    expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith('reply-123', 'user-123');
    expect(mockCommentRepository.softDeleteReply).toBeCalledWith('reply-123');
  });
});
