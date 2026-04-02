import { generateFullSsnNumber } from './ssn.ts';

const FIRST_NAMES = [
  'Erik', 'Lars', 'Anna', 'Maria', 'Johan', 'Karin',
  'Anders', 'Eva', 'Per', 'Sara', 'Olof', 'Linnea',
];

const LAST_NAMES = [
  'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson',
  'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson',
];

const STREETS = [
  'Storgatan 1', 'Kungsgatan 15', 'Drottninggatan 8',
  'Vasagatan 22', 'Nygatan 5', 'Parkgatan 10',
];

const POSTAL_CODES = ['21137', '11453', '41301', '75236', '60221']; 

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface TestPerson {
  ssn: string;
  firstName: string;
  lastName: string;
  streetAddress: string;
  postalCode: string;
}

export function generateTestPerson(): TestPerson {
  return {
    ssn: generateFullSsnNumber(),
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    streetAddress: pick(STREETS),
    postalCode: pick(POSTAL_CODES),
  };
}

export function replacePlaceholders(template: string, person: TestPerson): string {
  return template
    .replace(/\{\{SSN\}\}/g, person.ssn)
    .replace(/\{\{firstName\}\}/g, person.firstName)
    .replace(/\{\{lastName\}\}/g, person.lastName)
    .replace(/\{\{streetAddress\}\}/g, person.streetAddress)
    .replace(/\{\{postalCode\}\}/g, person.postalCode);
}
