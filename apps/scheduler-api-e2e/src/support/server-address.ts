const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 3000;

export const getServerHost = (): string => process.env['HOST'] ?? DEFAULT_HOST;

export const getServerPort = (): number =>
  process.env['PORT'] ? Number(process.env['PORT']) : DEFAULT_PORT;
