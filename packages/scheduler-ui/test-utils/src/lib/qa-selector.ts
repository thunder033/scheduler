/** Prefix of the attributes templates use to mark elements for tests; the rest is a semantic identifier */
export const QA_ATTRIBUTE_PREFIX = 'qa-';

/** Selects elements marked with the `qa-<id>` attribute */
export function qaSelector(id: string): string {
  return `[${QA_ATTRIBUTE_PREFIX}${id}]`;
}
