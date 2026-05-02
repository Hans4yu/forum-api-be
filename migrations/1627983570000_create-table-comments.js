
export const up = (pgm) => {
  pgm.createTable('comments', {
    'id': {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    'thread_id': {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"threads"(id)',
    },
    'owner': {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"users"(id)',
    },
    'content': {
      type: 'TEXT',
      notNull: true,
    },
    'parent_comment_id': {
      type: 'VARCHAR(50)',
      references: '"comments"(id)',
    },
    'is_deleted': {
      type: 'BOOLEAN',
      notNull: true,
      default: false,
    },
    'created_at': {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    'deleted_at': {
      type: 'TIMESTAMP',
    },
  });

  pgm.createIndex('comments', ['thread_id', 'parent_comment_id', 'created_at']);
  pgm.createIndex('comments', ['parent_comment_id']);
};

export const down = (pgm) => {
  pgm.dropTable('comments');
};
