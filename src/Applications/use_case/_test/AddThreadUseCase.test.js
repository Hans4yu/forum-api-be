import { vi } from 'vitest';
import NewThread from '../../../Domains/threads/entities/NewThread.js';
import AddedThread from '../../../Domains/threads/entities/AddedThread.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import AddThreadUseCase from '../AddThreadUseCase.js';

describe('AddThreadUseCase', () => {
  it('should throw error when payload not contain needed property', async () => {
    const addThreadUseCase = new AddThreadUseCase({ threadRepository: {} });

    await expect(addThreadUseCase.execute({ title: 'title' }, 'user-123'))
      .rejects
      .toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', async () => {
    const addThreadUseCase = new AddThreadUseCase({ threadRepository: {} });

    await expect(addThreadUseCase.execute({ title: 123, body: 'body' }, 'user-123'))
      .rejects
      .toThrowError('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate add thread action correctly', async () => {
    const useCasePayload = {
      title: 'judul thread',
      body: 'isi thread',
    };

    const mockAddedThread = new AddedThread({
      id: 'thread-123',
      title: useCasePayload.title,
      owner: 'user-123',
    });

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.addThread = vi.fn()
      .mockImplementation(() => Promise.resolve(mockAddedThread));

    const addThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    const addedThread = await addThreadUseCase.execute(useCasePayload, 'user-123');

    expect(addedThread).toStrictEqual(mockAddedThread);
    expect(mockThreadRepository.addThread).toBeCalledWith(new NewThread(useCasePayload), 'user-123');
  });
});
