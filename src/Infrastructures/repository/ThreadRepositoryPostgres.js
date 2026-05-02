import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import AddedThread from '../../Domains/threads/entities/AddedThread.js';
import ThreadRepository from '../../Domains/threads/ThreadRepository.js';

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(newThread, owner) {
    const id = `thread-${this._idGenerator()}`;
    const { title, body } = newThread;

    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4, DEFAULT) RETURNING id, title, owner',
      values: [id, title, body, owner],
    };

    const result = await this._pool.query(query);

    return new AddedThread(result.rows[0]);
  }

  async verifyThreadExists(threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }
  }

  async getDetailThreadById(threadId) {
    const threadQuery = {
      text: `
        SELECT threads.id, threads.title, threads.body, threads.created_at AS date, users.username
        FROM threads
        LEFT JOIN users ON threads.owner = users.id
        WHERE threads.id = $1
      `,
      values: [threadId],
    };

    const threadResult = await this._pool.query(threadQuery);

    if (!threadResult.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }

    const commentsQuery = {
      text: `
        SELECT comments.id, comments.content, comments.created_at AS date, users.username, COALESCE(comment_likes.like_count, 0) AS like_count
        FROM comments
        LEFT JOIN users ON comments.owner = users.id
        LEFT JOIN (
          SELECT comment_id, COUNT(*)::int AS like_count
          FROM comment_likes
          GROUP BY comment_id
        ) comment_likes ON comments.id = comment_likes.comment_id
        WHERE comments.thread_id = $1 AND comments.parent_comment_id IS NULL
        ORDER BY comments.created_at ASC
      `,
      values: [threadId],
    };

    const commentsResult = await this._pool.query(commentsQuery);

    return {
      ...threadResult.rows[0],
      date: threadResult.rows[0].date.toISOString(),
      comments: commentsResult.rows.map((comment) => ({
        ...comment,
        date: comment.date.toISOString(),
      })),
    };
  }
}

export default ThreadRepositoryPostgres;
