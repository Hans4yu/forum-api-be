import AuthorizationError from '../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import AddedComment from '../../Domains/comments/entities/AddedComment.js';
import AddedReply from '../../Domains/comments/entities/AddedReply.js';
import CommentRepository from '../../Domains/comments/CommentRepository.js';

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment, threadId, owner) {
    const id = `comment-${this._idGenerator()}`;
    const { content } = newComment;

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6, DEFAULT, DEFAULT) RETURNING id, content, owner',
      values: [id, threadId, owner, content, null, false],
    };

    const result = await this._pool.query(query);

    return new AddedComment(result.rows[0]);
  }

  async addReply(newReply, threadId, commentId, owner) {
    const id = `reply-${this._idGenerator()}`;
    const { content } = newReply;

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6, DEFAULT, DEFAULT) RETURNING id, content, owner',
      values: [id, threadId, owner, content, commentId, false],
    };

    const result = await this._pool.query(query);

    return new AddedReply(result.rows[0]);
  }

  async verifyCommentExists(commentId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: 'SELECT owner FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }

    if (result.rows[0].owner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengakses resource ini');
    }
  }

  async verifyCommentBelongsToThread(commentId, threadId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1 AND thread_id = $2 AND parent_comment_id IS NULL',
      values: [commentId, threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
  }

  async verifyReplyBelongsToComment(replyId, commentId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1 AND parent_comment_id = $2',
      values: [replyId, commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('balasan tidak ditemukan');
    }
  }

  async softDeleteComment(commentId) {
    const query = {
      text: 'UPDATE comments SET is_deleted = true, deleted_at = current_timestamp WHERE id = $1 RETURNING id',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
  }

  async softDeleteReply(replyId) {
    await this.softDeleteComment(replyId);
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `
        SELECT comments.id, comments.content, comments.created_at AS date, users.username, comments.parent_comment_id, comments.is_deleted, comments.deleted_at, COALESCE(comment_likes.like_count, 0) AS like_count
        FROM comments
        LEFT JOIN users ON comments.owner = users.id
        LEFT JOIN (
          SELECT comment_id, COUNT(*)::int AS like_count
          FROM comment_likes
          GROUP BY comment_id
        ) comment_likes ON comments.id = comment_likes.comment_id
        WHERE comments.thread_id = $1
        ORDER BY comments.created_at ASC
      `,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows.map((comment) => ({
      ...comment,
      date: comment.date.toISOString(),
    }));
  }
}

export default CommentRepositoryPostgres;
