class DeleteReplyUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload, threadId, commentId, owner) {
    const { replyId } = useCasePayload;

    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExists(commentId);
    await this._commentRepository.verifyCommentBelongsToThread(commentId, threadId);
    await this._commentRepository.verifyCommentExists(replyId);
    await this._commentRepository.verifyReplyBelongsToComment(replyId, commentId);
    await this._commentRepository.verifyCommentOwner(replyId, owner);
    await this._commentRepository.softDeleteReply(replyId);
  }
}

export default DeleteReplyUseCase;
