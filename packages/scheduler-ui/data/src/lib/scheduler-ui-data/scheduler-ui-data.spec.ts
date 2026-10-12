import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchedulerUiData } from './scheduler-ui-data';

describe('SchedulerUiData', () => {
  let component: SchedulerUiData;
  let fixture: ComponentFixture<SchedulerUiData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulerUiData],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulerUiData);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
