import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { getConfig, url } from '../../config/environments.ts';
import { fetchPassword, generateToken, getBasicAuthHeader } from '../helpers/auth.ts';
import { generateTestPerson, replacePlaceholders } from '../helpers/data.ts';

// --- Init phase: load templates and config ---

const config = getConfig();
const customerTemplate = open('../../templates/create-customer.json');
const caseTemplate = open('../../templates/create-case.xml');

// --- Custom metrics ---

const offerCreationTime = new Trend('offer_creation_time', true);
const offerSuccess = new Counter('offer_success');
const offerFailure = new Counter('offer_failure');

// --- Options ---

export const options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    offer_creation: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 1,
      maxDuration: '5m',
    },
  },
  thresholds: {
    offer_creation_time: ['p(95)<120000'], // 95% of offers created within 2 minutes
  },
};

// --- Setup: fetch token once for all VUs ---

interface SetupData {
  token: string;
}

export function setup(): SetupData {
  console.log(`Running against environment: ${__ENV.TEST_ENV || 'uat'}`);

  const password = fetchPassword(config);
  console.log('Password fetched successfully');

  const token = generateToken(config, password);
  console.log('Token generated successfully');

  return { token };
}

// --- VU code: create customer, create case, poll for offer ---

export default function (data: SetupData) {
  const person = generateTestPerson();
  const basicAuth = getBasicAuthHeader();

  // Step 1: Create customer
  const customerBody = replacePlaceholders(customerTemplate, person);

  const customerRes = http.post(url(config, config.customerPath), customerBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': basicAuth,
    },
    tags: { name: 'create_customer' },
  });

  const customerOk = check(customerRes, {
    'customer created (status 200)': (r) => r.status === 200,
    'customer result OK': (r) => {
      try {
        const body = r.json() as { Result: { Status: number; Message: string } };
        return body.Result.Status === 0;
      } catch {
        return false;
      }
    },
  });

  if (!customerOk) {
    console.error(`VU ${__VU}: Failed to create customer. Status: ${customerRes.status}, Body: ${customerRes.body}`);
    offerFailure.add(1);
    return;
  }

  console.log(`VU ${__VU}: Customer created with SSN ${person.ssn}`);

  // Step 2: Create case (SOAP)
  const caseBody = replacePlaceholders(caseTemplate, person);

  const caseRes = http.post(url(config, config.casePath), caseBody, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Authorization': basicAuth,
    },
    tags: { name: 'create_case' },
  });

  const caseCreated = check(caseRes, {
    'case created (status 200)': (r) => r.status === 200,
  });

  if (!caseCreated) {
    console.error(`VU ${__VU}: Failed to create case. Status: ${caseRes.status}, Body: ${caseRes.body}`);
    offerFailure.add(1);
    return;
  }

  // Extract RefApplicationID from SOAP response
  const refAppIdMatch = caseRes.body?.toString().match(/<RefApplicationID>(\d+)<\/RefApplicationID>/);
  if (!refAppIdMatch) {
    console.error(`VU ${__VU}: Could not extract RefApplicationID from response`);
    offerFailure.add(1);
    return;
  }

  const refApplicationId = refAppIdMatch[1];
  console.log(`VU ${__VU}: Case created with RefApplicationID ${refApplicationId}`);

  // Step 3: Poll for offer creation
  const startTime = Date.now();
  const maxPolls = 60;
  const pollInterval = 5; // seconds

  for (let i = 0; i < maxPolls; i++) {
    const appRes = http.get(
      `${url(config, config.applicationPath)}?applicationId=${refApplicationId}`,
      {
        headers: { sdcToken: data.token },
        tags: { name: 'poll_offer' },
      },
    );

    check(appRes, {
      'poll status 200': (r) => r.status === 200,
    });

    let status = '';
    try {
      const body = appRes.json() as { status: string };
      status = body.status;
    } catch {
      console.error(`VU ${__VU}: Failed to parse poll response`);
      offerFailure.add(1);
      return;
    }

    if (status === 'CREATED_OFFER') {
      const duration = Date.now() - startTime;
      offerCreationTime.add(duration);
      offerSuccess.add(1);
      console.log(`VU ${__VU}: Offer created in ${duration}ms`);
      return;
    }

    if (status !== 'PROCESSING') {
      console.error(`VU ${__VU}: Unexpected status: ${status}. Stopping.`);
      offerFailure.add(1);
      return;
    }

    sleep(pollInterval);
  }

  // Timeout - offer not created within polling window
  console.error(`VU ${__VU}: Timeout waiting for offer (${maxPolls * pollInterval}s)`);
  offerFailure.add(1);
}

// --- Teardown: cleanup (disabled - to be implemented later) ---

export function teardown(_data: SetupData) {
  // TODO: Cleanup created customers/cases
  // Endpoint and body are not yet known.
  // When ready, uncomment and fill in:
  //
  // const cleanupRes = http.post(config.cleanupEndpoint, JSON.stringify({
  //   // cleanup body here
  // }), {
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': getBasicAuthHeader(),
  //   },
  // });
  //
  // check(cleanupRes, {
  //   'cleanup successful': (r) => r.status === 200,
  // });

  console.log('Teardown complete (cleanup disabled)');
}
