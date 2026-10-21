import { killPort, waitForPortOpen } from '@nx/node/utils';

import { getServerHost, getServerPort } from './server-address';

export default async function setup() {
  await waitForPortOpen(getServerPort(), { host: getServerHost() });

  return async function teardown() {
    await killPort(getServerPort());
  };
}
