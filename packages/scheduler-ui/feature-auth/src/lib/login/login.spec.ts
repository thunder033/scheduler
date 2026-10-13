import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Login } from './login';
import { LoginHarness } from './login.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [Login],
  }).compileComponents();

  const fixture = TestBed.createComponent(Login);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    LoginHarness,
  );

  return { fixture, harness };
}

describe('Login', () => {
  it('should render content', async () => {
    const { harness } = await setup();

    expect(await harness.getText()).not.toBe('');
  });
});
