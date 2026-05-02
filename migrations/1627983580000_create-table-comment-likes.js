
export const up = (pgm) => {
  pgm.createTable('comment_likes', {
    'id': {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    'comment_id': {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"comments"(id)',
    },
    'user_id': {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"users"(id)',
    },
    'created_at': {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('comment_likes', 'unique_comment_likes_comment_id_user_id', {
    unique: ['comment_id', 'user_id'],
  });
  pgm.createIndex('comment_likes', ['comment_id']);
  pgm.createIndex('comment_likes', ['user_id']);
};

export const down = (pgm) => {
  pgm.dropTable('comment_likes');
};
