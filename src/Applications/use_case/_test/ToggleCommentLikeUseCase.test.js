import { vi } from 'vitest';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import ToggleCommentLikeUseCase from '../ToggleCommentLikeUseCase.js';

describe('ToggleCommentLikeUseCase', () => {
  it('should orchestrate toggle comment like action correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn().mockResolvedValue();

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.verifyCommentBelongsToThread = vi.fn().mockResolvedValue();

    const mockCommentLikeRepository = {
      toggleLike: vi.fn().mockResolvedValue(),
    };

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      commentLikeRepository: mockCommentLikeRepository,
    });

    await toggleCommentLikeUseCase.execute({ commentId: 'comment-123' }, 'thread-123', 'user-123');

    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentBelongsToThread).toBeCalledWith('comment-123', 'thread-123');
    expect(mockCommentLikeRepository.toggleLike).toBeCalledWith('comment-123', 'user-123');
  });
});
