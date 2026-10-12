import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchedulerUiFeatureDashboard } from './scheduler-ui-feature-dashboard';

describe('SchedulerUiFeatureDashboard', () => {
  let component: SchedulerUiFeatureDashboard;
  let fixture: ComponentFixture<SchedulerUiFeatureDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulerUiFeatureDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulerUiFeatureDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
