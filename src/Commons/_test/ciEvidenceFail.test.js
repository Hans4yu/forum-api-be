import { describe, expect, it } from 'vitest';
describe('CI evidence failure', () => {
  it('should fail intentionally for CI evidence', () => {
    expect(true).toBe(false);
  });
});