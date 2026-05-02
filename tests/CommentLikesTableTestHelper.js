/* istanbul ignore file */
import pool from '../src/Infrastructures/database/postgres/pool.js';

const CommentLikesTableTestHelper = {
  async addLike({
    id = 'comment-like-123', commentId = 'comment-123', userId = 'user-123', createdAt = '2026-01-01T00:00:00.000Z',
  }) {
    const query = {
      text: 'INSERT INTO comment_likes VALUES($1, $2, $3, $4)',
      values: [id, commentId, userId, createdAt],
    };

    await pool.query(query);
  },

  async findLikeByCommentIdAndUserId(commentId, userId) {
    const query = {
      text: 'SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async findLikesByCommentId(commentId) {
    const query = {
      text: 'SELECT * FROM comment_likes WHERE comment_id = $1',
      values: [commentId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comment_likes WHERE 1=1');
  },
};

export default CommentLikesTableTestHelper;
