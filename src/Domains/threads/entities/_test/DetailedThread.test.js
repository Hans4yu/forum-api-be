import DetailedThread from '../DetailedThread.js';

describe('DetailedThread entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'title',
      body: 'body',
      date: '2026-05-01T00:00:00.000Z',
      username: 'dicoding',
    };

    // Action & Assert
    expect(() => new DetailedThread(payload)).toThrowError('DETAILED_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'title',
      body: 'body',
      date: '2026-05-01T00:00:00.000Z',
      username: 'dicoding',
      comments: {},
    };

    // Action & Assert
    expect(() => new DetailedThread(payload)).toThrowError('DETAILED_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailedThread entities correctly', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'title',
      body: 'body',
      date: '2026-05-01T00:00:00.000Z',
      username: 'dicoding',
      comments: [],
    };

    // Action
    const detailedThread = new DetailedThread(payload);

    // Assert
    expect(detailedThread).toBeInstanceOf(DetailedThread);
    expect(detailedThread.id).toEqual(payload.id);
    expect(detailedThread.title).toEqual(payload.title);
    expect(detailedThread.body).toEqual(payload.body);
    expect(detailedThread.date).toEqual(payload.date);
    expect(detailedThread.username).toEqual(payload.username);
    expect(detailedThread.comments).toStrictEqual(payload.comments);
  });
});
