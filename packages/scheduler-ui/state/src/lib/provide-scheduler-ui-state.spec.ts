import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store } from '@ngxs/store';
import { provideSchedulerUiState } from './provide-scheduler-ui-state';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideSchedulerUiState()],
  });

  return { store: TestBed.inject(Store) };
}

describe('provideSchedulerUiState', () => {
  it('should make the NGXS store available for injection', () => {
    const { store } = setup();

    expect(store.snapshot()).toBeDefined();
  });
});
