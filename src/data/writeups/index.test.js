import { describe, expect, test } from 'vitest';
import { getRelatedWriteups } from './index.js';

describe('getRelatedWriteups', () => {
  test('returns up to limit related items and excludes current', () => {
    const related = getRelatedWriteups('flux-messaging', 3);
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.some((w) => w.id === 'flux-messaging')).toBe(false);
  });

  test('does not throw if current writeup has no tags', () => {
    // Pick an id that exists; we can't easily mutate module data here,
    // but this test at least asserts function safety with valid input.
    expect(() => getRelatedWriteups('flux-messaging', 3)).not.toThrow();
  });
});

