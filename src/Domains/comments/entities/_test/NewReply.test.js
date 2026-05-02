import NewReply from '../NewReply.js';

describe('NewReply entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {};

    // Action & Assert
    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 1234,
    };

    // Action & Assert
    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when content exceeds character limit', () => {
    // Arrange
    const payload = {
      content: 'a'.repeat(1001),
    };

    // Action & Assert
    expect(() => new NewReply(payload)).toThrowError('NEW_REPLY.CONTENT_LIMIT_CHAR');
  });

  it('should create NewReply entities correctly', () => {
    // Arrange
    const payload = {
      content: 'reply content',
    };

    // Action
    const newReply = new NewReply(payload);

    // Assert
    expect(newReply).toBeInstanceOf(NewReply);
    expect(newReply.content).toEqual(payload.content);
  });
});
