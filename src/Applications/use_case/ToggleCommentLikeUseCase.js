class ToggleCommentLikeUseCase {
  constructor({ threadRepository, commentRepository, commentLikeRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._commentLikeRepository = commentLikeRepository;
  }

  async execute(useCasePayload, threadId, userId) {
    const { commentId } = useCasePayload;

    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentBelongsToThread(commentId, threadId);
    await this._commentLikeRepository.toggleLike(commentId, userId);
  }
}

export default ToggleCommentLikeUseCase;
