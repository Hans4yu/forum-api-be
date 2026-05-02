import { describe, expect, it } from 'vitest';
import ThreadDetailPresenter from '../ThreadDetailPresenter.js';

describe('ThreadDetailPresenter', () => {
  it('should present empty comments when thread has no comments array', () => {
    // Arrange
    const detailedThread = {
      id: 'thread-123',
      title: 'Thread title',
      body: 'Thread body',
      date: '2026-05-01T00:00:00.000Z',
      username: 'dicoding',
    };

    // Action
    const result = ThreadDetailPresenter.present(detailedThread);

    // Assert
    expect(result).toEqual({
      id: 'thread-123',
      title: 'Thread title',
      body: 'Thread body',
      date: '2026-05-01T00:00:00.000Z',
      username: 'dicoding',
      comments: [],
    });
  });

  it('should map thread detail with nested replies and deleted placeholders', () => {
    // Arrange
    const detailedThread = {
      id: 'thread-123',
      title: 'Thread title',
      body: 'Thread body',
      date: '2026-05-01T00:00:00.000Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-1',
          username: 'alice',
          date: '2026-05-01T01:00:00.000Z',
          content: 'first comment',
          'like_count': 2,
          parentCommentId: null,
          isDeleted: false,
        },
        {
          id: 'reply-1',
          username: 'bob',
          date: '2026-05-01T02:00:00.000Z',
          content: 'first reply',
          parentCommentId: 'comment-1',
          isDeleted: false,
        },
        {
          id: 'comment-2',
          username: 'carol',
          date: '2026-05-01T03:00:00.000Z',
          content: 'second comment',
          'like_count': 0,
          parentCommentId: null,
          isDeleted: true,
        },
        {
          id: 'reply-2',
          username: 'dan',
          date: '2026-05-01T04:00:00.000Z',
          content: 'second reply',
          parentCommentId: 'comment-1',
          isDeleted: true,
        },
      ],
    };

    // Action
    const result = ThreadDetailPresenter.present(detailedThread);

    // Assert
    expect(result).toEqual({
      id: 'thread-123',
      title: 'Thread title',
      body: 'Thread body',
      date: '2026-05-01T00:00:00.000Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-1',
          username: 'alice',
          date: '2026-05-01T01:00:00.000Z',
          content: 'first comment',
          likeCount: 2,
          replies: [
            {
              id: 'reply-1',
              username: 'bob',
              date: '2026-05-01T02:00:00.000Z',
              content: 'first reply',
            },
            {
              id: 'reply-2',
              username: 'dan',
              date: '2026-05-01T04:00:00.000Z',
              content: '**balasan telah dihapus**',
            },
          ],
        },
        {
          id: 'comment-2',
          username: 'carol',
          date: '2026-05-01T03:00:00.000Z',
          content: '**komentar telah dihapus**',
          likeCount: 0,
          replies: [],
        },
      ],
    });
  });

  it('should map replies from nested arrays and snake_case fields', () => {
    // Arrange
    const detailedThread = {
      id: 'thread-456',
      title: 'Another Thread',
      body: 'Another body',
      date: '2026-05-01T05:00:00.000Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-3',
          username: 'alice',
          date: '2026-05-01T06:00:00.000Z',
          content: 'top comment',
          'parent_comment_id': null,
          replies: [
            {
              id: 'reply-3',
              username: 'bob',
              date: '2026-05-01T07:00:00.000Z',
              content: 'nested reply',
              'parent_comment_id': 'comment-3',
              'is_deleted': true,
            },
          ],
        },
        {
          id: 'comment-4',
          username: 'carol',
          date: '2026-05-01T08:00:00.000Z',
          content: 'second top comment',
          'parent_comment_id': null,
        },
      ],
    };

    // Action
    const result = ThreadDetailPresenter.present(detailedThread);

    // Assert
    expect(result.comments).toEqual([
      {
        id: 'comment-3',
        username: 'alice',
        date: '2026-05-01T06:00:00.000Z',
        content: 'top comment',
        likeCount: 0,
        replies: [
          {
            id: 'reply-3',
            username: 'bob',
            date: '2026-05-01T07:00:00.000Z',
            content: '**balasan telah dihapus**',
          },
        ],
      },
      {
        id: 'comment-4',
        username: 'carol',
        date: '2026-05-01T08:00:00.000Z',
        content: 'second top comment',
        likeCount: 0,
        replies: [],
      },
    ]);
  });
});
