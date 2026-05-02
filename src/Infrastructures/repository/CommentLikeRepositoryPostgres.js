import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import CommentLikeRepository from '../../Domains/comment_likes/CommentLikeRepository.js';

class CommentLikeRepositoryPostgres extends CommentLikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addLike(commentId, userId, client = this._pool) {
    const query = {
      text: 'INSERT INTO comment_likes VALUES($1, $2, $3, DEFAULT) RETURNING id, comment_id, user_id',
      values: [`comment-like-${this._idGenerator()}`, commentId, userId],
    };

    const result = await client.query(query);

    return result.rows[0];
  }

  async verifyLikeExists(commentId, userId, client = this._pool) {
    const query = {
      text: 'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await client.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('like tidak ditemukan');
    }

    return result.rows[0];
  }

  async deleteLike(commentId, userId, client = this._pool) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    await client.query(query);
  }

  async toggleLike(commentId, userId) {
    const client = await this._pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [commentId, userId]);

      const like = await client.query({
        text: 'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        values: [commentId, userId],
      });

      if (like.rowCount) {
        await this.deleteLike(commentId, userId, client);
      } else {
        await this.addLike(commentId, userId, client);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async countLikeByCommentId(commentId) {
    const query = {
      text: 'SELECT COUNT(*)::int AS count FROM comment_likes WHERE comment_id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    return result.rows[0].count;
  }
}

export default CommentLikeRepositoryPostgres;
