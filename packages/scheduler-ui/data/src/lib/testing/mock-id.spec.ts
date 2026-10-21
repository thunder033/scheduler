import { MockEntityName, nextMockId, resetMockIds } from './mock-id';

const ENTITY_A: MockEntityName = 'user';
const ENTITY_B: MockEntityName = 'timeslot';

function setup() {
  resetMockIds();
  return { nextMockId, resetMockIds };
}

describe('nextMockId', () => {
  it('includes the entity name in the id', () => {
    const { nextMockId } = setup();

    expect(nextMockId(ENTITY_A)).toContain(ENTITY_A);
  });

  it('gives each id of an entity a distinct index', () => {
    const { nextMockId } = setup();

    const ids = [
      nextMockId(ENTITY_A),
      nextMockId(ENTITY_A),
      nextMockId(ENTITY_A),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('indexes each entity independently', () => {
    const { nextMockId } = setup();

    const first = nextMockId(ENTITY_A);
    nextMockId(ENTITY_A);
    nextMockId(ENTITY_B);
    const firstOfOther = nextMockId(ENTITY_B);

    expect(firstOfOther.replace(ENTITY_B, '')).not.toBe(
      first.replace(ENTITY_A, ''),
    );
    expect(firstOfOther).toContain(ENTITY_B);
  });

  it('restarts the indexes after a reset', () => {
    const { nextMockId, resetMockIds } = setup();
    const first = nextMockId(ENTITY_A);
    nextMockId(ENTITY_A);

    resetMockIds();

    expect(nextMockId(ENTITY_A)).toBe(first);
  });
});
