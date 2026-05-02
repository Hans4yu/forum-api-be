import NewThread from '../NewThread.js';

describe('NewThread entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      title: 'title',
    };

    // Action & Assert
    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      title: 'title',
      body: 1234,
    };

    // Action & Assert
    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when title exceeds character limit', () => {
    // Arrange
    const payload = {
      title: 'a'.repeat(1001),
      body: 'body',
    };

    // Action & Assert
    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.TITLE_LIMIT_CHAR');
  });

  it('should throw error when body exceeds character limit', () => {
    // Arrange
    const payload = {
      title: 'title',
      body: 'a'.repeat(1001),
    };

    // Action & Assert
    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.BODY_LIMIT_CHAR');
  });

  it('should create NewThread entities correctly', () => {
    // Arrange
    const payload = {
      title: 'title',
      body: 'body',
    };

    // Action
    const newThread = new NewThread(payload);

    // Assert
    expect(newThread).toBeInstanceOf(NewThread);
    expect(newThread.title).toEqual(payload.title);
    expect(newThread.body).toEqual(payload.body);
  });
});
