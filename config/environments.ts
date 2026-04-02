// Stale - wspolne dla wszystkich srodowisk
const passwordEndpoint = 'https://password-example.com/api/password';
const tokenEndpoint = 'https://auth-example.com/api/token';

const paths = {
  customerPath: '/api/customer',
  casePath: '/api/case',
  applicationPath: '/api/application/get',
  cleanupPath: '/api/cleanup',
};

export interface EnvironmentConfig {
  baseUrl: string;
  passwordEndpoint: string;
  tokenEndpoint: string;
  customerPath: string;
  casePath: string;
  applicationPath: string;
  cleanupPath: string;
}

const environments: Record<string, EnvironmentConfig> = {
  uat: {
    baseUrl: 'https://uat-example.com',
    passwordEndpoint,
    tokenEndpoint,
    ...paths,
  },
  ef2: {
    baseUrl: 'https://ef2-example.com',
    passwordEndpoint,
    tokenEndpoint,
    ...paths,
  },
};

export function getConfig(): EnvironmentConfig {
  const env = __ENV.TEST_ENV || 'uat';
  const config = environments[env];
  if (!config) {
    throw new Error(`Unknown environment: ${env}. Available: ${Object.keys(environments).join(', ')}`);
  }
  return config;
}

export function url(config: EnvironmentConfig, path: string): string {
  return `${config.baseUrl}${path}`;
}
