export type MockEntityName = 'user' | 'timeslot' | 'appointment';

const counters = new Map<MockEntityName, number>();

/** IDs are the entity name with a per-entity index, e.g. `user-1`, `user-2`, `timeslot-1` */
export function nextMockId(entity: MockEntityName): string {
  const index = (counters.get(entity) ?? 0) + 1;
  counters.set(entity, index);
  return `${entity}-${index}`;
}

/** Restarts every entity's index, so a scenario gets predictable IDs regardless of earlier ones */
export function resetMockIds(): void {
  counters.clear();
}
