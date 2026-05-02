import { vi } from 'vitest';
import DetailedThread from '../../../Domains/threads/entities/DetailedThread.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import GetThreadDetailUseCase from '../GetThreadDetailUseCase.js';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrate get thread detail action correctly', async () => {
    const threadId = 'thread-123';
    const threadDetail = {
      id: threadId,
      title: 'judul thread',
      body: 'isi thread',
      date: '2026-05-01T00:00:00.000Z',
      username: 'dicoding',
      comments: [],
    };

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadRepository.getDetailThreadById = vi.fn()
      .mockImplementation(() => Promise.resolve(threadDetail));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    const detailedThread = await getThreadDetailUseCase.execute(threadId);

    expect(detailedThread).toStrictEqual(new DetailedThread(threadDetail));
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
    expect(mockThreadRepository.getDetailThreadById).toBeCalledWith(threadId);
  });

  it('should propagate not found error from repository', async () => {
    const threadId = 'thread-123';
    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.reject(new NotFoundError('thread tidak ditemukan')));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    await expect(getThreadDetailUseCase.execute(threadId))
      .rejects
      .toThrowError(NotFoundError);
  });
});
