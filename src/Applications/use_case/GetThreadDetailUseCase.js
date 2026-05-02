import DetailedThread from '../../Domains/threads/entities/DetailedThread.js';

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId) {
    await this._threadRepository.verifyThreadExists(threadId);

    const threadDetail = await this._threadRepository.getDetailThreadById(threadId);
    const comments = this._commentRepository
      ? await this._commentRepository.getCommentsByThreadId(threadId)
      : threadDetail.comments;

    return new DetailedThread({
      ...threadDetail,
      comments,
    });
  }
}

export default GetThreadDetailUseCase;
