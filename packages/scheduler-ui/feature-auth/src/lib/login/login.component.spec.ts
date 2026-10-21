import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LoginComponent } from './login.component';
import { LoginHarness } from './login.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [LoginComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(LoginComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    LoginHarness,
  );

  return { fixture, harness };
}

describe('LoginComponent', () => {
  it('renders content', async () => {
    const { harness } = await setup();

    expect(await harness.getText()).not.toBe('');
  });
});
