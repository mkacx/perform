import http from 'k6/http';
import encoding from 'k6/encoding';
import { check } from 'k6';
import { EnvironmentConfig } from '../../config/environments.ts';
import env from './env.ts';

export function fetchPassword(config: EnvironmentConfig): string {
  const res = http.get(config.passwordEndpoint);

  if (!check(res, { 'password endpoint status 200': (r) => r.status === 200 })) {
    throw new Error(`Failed to fetch password. Status: ${res.status}, Body: ${res.body}`);
  }

  const body = res.json() as { password: string };
  return body.password;
}

export function generateToken(config: EnvironmentConfig, password: string): string {
  const payload = JSON.stringify({
    hreg: env.TOKEN_HREG,
    user: env.TOKEN_USER,
    password: password,
  });

  const res = http.post(config.tokenEndpoint, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!check(res, { 'token endpoint status 200': (r) => r.status === 200 })) {
    throw new Error(`Failed to generate token. Status: ${res.status}, Body: ${res.body}`);
  }

  const body = res.json() as { token: string };
  return body.token;
}

export function getBasicAuthHeader(): string {
  const user = env.BASIC_AUTH_USER || '';
  const pass = env.BASIC_AUTH_PASS || '';
  return `Basic ${encoding.b64encode(`${user}:${pass}`)}`;
}
