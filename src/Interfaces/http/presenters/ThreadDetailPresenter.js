class ThreadDetailPresenter {
  static present(detailedThread) {
    return {
      id: detailedThread.id,
      title: detailedThread.title,
      body: detailedThread.body,
      date: detailedThread.date,
      username: detailedThread.username,
      comments: this._mapTopLevelComments(detailedThread.comments ?? []),
    };
  }

  static _mapTopLevelComments(comments) {
    return comments
      .filter((comment) => this._getParentCommentId(comment) === null)
      .map((comment) => ({
        id: comment.id,
        username: comment.username,
        date: comment.date,
        content: this._getCommentContent(comment, false),
        likeCount: this._getLikeCount(comment),
        replies: this._mapReplies(comment, comments),
      }));
  }

  static _mapReplies(comment, comments) {
    const replies = Array.isArray(comment.replies)
      ? comment.replies
      : comments.filter((reply) => this._getParentCommentId(reply) === comment.id);

    return replies.map((reply) => ({
      id: reply.id,
      username: reply.username,
      date: reply.date,
      content: this._getCommentContent(reply, true),
    }));
  }

  static _getCommentContent(comment, isReply) {
    const isDeleted = comment.isDeleted ?? comment.is_deleted ?? false;

    if (isDeleted) {
      return isReply ? '**balasan telah dihapus**' : '**komentar telah dihapus**';
    }

    return comment.content;
  }

  static _getParentCommentId(comment) {
    return comment.parentCommentId ?? comment.parent_comment_id ?? null;
  }

  static _getLikeCount(comment) {
    return comment.likeCount ?? comment.like_count ?? 0;
  }
}

export default ThreadDetailPresenter;
