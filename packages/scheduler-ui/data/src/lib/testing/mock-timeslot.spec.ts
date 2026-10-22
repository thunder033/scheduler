import { Timeslot } from '@scheduler/models';
import { resetMockIds } from './mock-id';
import { mockTimeslot } from './mock-timeslot';

function setup(overrides: Partial<Timeslot> = {}) {
  resetMockIds();
  return { timeslot: mockTimeslot(overrides) };
}

describe('mockTimeslot', () => {
  it('creates a timeslot that ends after it starts', () => {
    const { timeslot } = setup();

    expect(timeslot.timeslotId).toBeTruthy();
    expect(timeslot.end > timeslot.start).toBe(true);
  });

  it('applies the overrides over the defaults', () => {
    const overrides: Partial<Timeslot> = {
      start: '18:00',
      end: '19:30',
      dayOfWeek: 3,
    };

    const { timeslot } = setup(overrides);

    expect(timeslot).toMatchObject(overrides);
  });

  it('gives each timeslot a distinct id', () => {
    const { timeslot } = setup();

    expect(mockTimeslot().timeslotId).not.toBe(timeslot.timeslotId);
  });

  it('keeps an overridden id', () => {
    const { timeslot } = setup({ timeslotId: 'custom-id' });

    expect(timeslot.timeslotId).toBe('custom-id');
  });

  describe('seeded timeslots', () => {
    const seeded: Timeslot[] = Object.values(mockTimeslot);

    it('gives every seeded timeslot its own id', () => {
      const ids = seeded.map(({ timeslotId }) => timeslotId);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('seeds timeslots that end after they start', () => {
      for (const { start, end } of seeded) {
        expect(end > start).toBe(true);
      }
    });
  });
});
