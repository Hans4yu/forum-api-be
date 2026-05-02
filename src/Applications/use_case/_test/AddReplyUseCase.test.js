import { vi } from 'vitest';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AddedReply from '../../../Domains/comments/entities/AddedReply.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import AddReplyUseCase from '../AddReplyUseCase.js';

describe('AddReplyUseCase', () => {
  it('should throw error when payload not contain needed property', async () => {
    const addReplyUseCase = new AddReplyUseCase({ threadRepository: {}, commentRepository: {} });

    await expect(addReplyUseCase.execute({}, 'thread-123', 'comment-123', 'user-123'))
      .rejects
      .toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should orchestrate add reply action correctly', async () => {
    const useCasePayload = {
      content: 'isi balasan',
    };

    const mockAddedReply = new AddedReply({
      id: 'reply-123',
      content: useCasePayload.content,
      owner: 'user-123',
    });

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn().mockImplementation(() => Promise.resolve());

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.verifyCommentExists = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentBelongsToThread = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.addReply = vi.fn().mockImplementation(() => Promise.resolve(mockAddedReply));

    const addReplyUseCase = new AddReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    const addedReply = await addReplyUseCase.execute(useCasePayload, 'thread-123', 'comment-123', 'user-123');

    expect(addedReply).toStrictEqual(mockAddedReply);
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith('comment-123');
    expect(mockCommentRepository.verifyCommentBelongsToThread).toBeCalledWith('comment-123', 'thread-123');
    expect(mockCommentRepository.addReply).toBeCalledWith(expect.any(Object), 'thread-123', 'comment-123', 'user-123');
  });

  it('should reject when parent comment is not a top-level comment', async () => {
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn().mockImplementation(() => Promise.resolve());

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.verifyCommentExists = vi.fn().mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentBelongsToThread = vi.fn().mockImplementation(() => Promise.reject(new NotFoundError('komentar tidak ditemukan')));

    const addReplyUseCase = new AddReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await expect(addReplyUseCase.execute({ content: 'isi balasan' }, 'thread-123', 'reply-123', 'user-123'))
      .rejects
      .toThrowError(NotFoundError);
  });
});
