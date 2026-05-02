import NewReply from '../../Domains/comments/entities/NewReply.js';

class AddReplyUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload, threadId, commentId, owner) {
    const newReply = new NewReply(useCasePayload);

    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExists(commentId);
    await this._commentRepository.verifyCommentBelongsToThread(commentId, threadId);

    return this._commentRepository.addReply(newReply, threadId, commentId, owner);
  }
}

export default AddReplyUseCase;
