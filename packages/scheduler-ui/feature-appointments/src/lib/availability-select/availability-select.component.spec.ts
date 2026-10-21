import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { form, FormField } from '@angular/forms/signals';
import { AvailabilityStatus } from '@org/models';
import { AVAILABILITY_STATUS_LABELS } from '../availability-status/availability-status.component';
import {
  AVAILABILITY_LABEL,
  AvailabilitySelectComponent,
} from './availability-select.component';
import { AvailabilitySelectHarness } from './availability-select.harness';

const STATUSES = Object.values(AvailabilityStatus);
const PLACEHOLDER = 'Choose one';

/** Binds the select to a signal form, as the components that use it do */
@Component({
  selector: 'lib-test-form',
  imports: [AvailabilitySelectComponent, FormField],
  template: `<lib-availability-select
    [formField]="availabilityForm.status"
    [placeholder]="placeholder"
  />`,
})
class TestFormComponent {
  readonly availability = signal<{ status: AvailabilityStatus | null }>({
    status: AvailabilityStatus.Available,
  });
  readonly availabilityForm = form(this.availability);
  readonly placeholder = PLACEHOLDER;
}

async function setup({
  status = AvailabilityStatus.Available,
}: { status?: AvailabilityStatus | null } = {}) {
  await TestBed.configureTestingModule({
    imports: [TestFormComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(TestFormComponent);
  fixture.componentInstance.availability.set({ status });
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    AvailabilitySelectHarness,
  );

  return {
    harness,
    getFormStatus: () => fixture.componentInstance.availability().status,
    setFormStatus: (next: AvailabilityStatus | null) =>
      fixture.componentInstance.availability.set({ status: next }),
  };
}

describe('AvailabilitySelectComponent', () => {
  it('labels the field as the availability of the user', async () => {
    const { harness } = await setup();

    expect(await harness.getLabel()).toBe(AVAILABILITY_LABEL);
  });

  it('offers every availability status as an option', async () => {
    const { harness } = await setup();

    expect(await harness.getOptions()).toEqual(
      STATUSES.map((status) => AVAILABILITY_STATUS_LABELS[status]),
    );
  });

  it('shows a dot for the status of each option', async () => {
    const { harness } = await setup();

    expect(await harness.getOptionStatuses()).toEqual(STATUSES);
  });

  it.each(STATUSES)(
    'shows the %s status when it is the value',
    async (status) => {
      const { harness } = await setup({ status });

      expect(await harness.getSelectedStatus()).toBe(status);
      expect(await harness.getPlaceholder()).toBeNull();
    },
  );

  it('shows the placeholder, and no status, when there is no value', async () => {
    const { harness } = await setup({ status: null });

    expect(await harness.getPlaceholder()).toBe(PLACEHOLDER);
    expect(await harness.getSelectedStatus()).toBeNull();
  });

  it('shows the status the form changes to', async () => {
    const { harness, setFormStatus } = await setup({
      status: AvailabilityStatus.Available,
    });

    setFormStatus(AvailabilityStatus.IfNeeded);

    expect(await harness.getSelectedStatus()).toBe(AvailabilityStatus.IfNeeded);
  });

  it('shows the placeholder again when the form clears the value', async () => {
    const { harness, setFormStatus } = await setup({
      status: AvailabilityStatus.Available,
    });

    setFormStatus(null);

    expect(await harness.getPlaceholder()).toBe(PLACEHOLDER);
  });

  it('changes the value of the form to the status that is chosen', async () => {
    const { harness, getFormStatus } = await setup({
      status: AvailabilityStatus.Available,
    });

    await harness.selectOption(
      AVAILABILITY_STATUS_LABELS[AvailabilityStatus.IfNeeded],
    );

    expect(getFormStatus()).toBe(AvailabilityStatus.IfNeeded);
    expect(await harness.getSelectedStatus()).toBe(AvailabilityStatus.IfNeeded);
  });

  it('lets a status be chosen when there was none', async () => {
    const { harness, getFormStatus } = await setup({ status: null });

    await harness.selectOption(
      AVAILABILITY_STATUS_LABELS[AvailabilityStatus.Unavailable],
    );

    expect(getFormStatus()).toBe(AvailabilityStatus.Unavailable);
  });
});
