function sumDigits(num: number): number {
  return num
    .toString()
    .split('')
    .map(Number)
    .reduce((sum, digit) => sum + digit, 0);
}

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateYear(): number {
  return generateRandomNumber(50, 99);
}

function generateMonth(): string {
  return generateRandomNumber(1, 12).toString().padStart(2, '0');
}

function generateDay(): string {
  return generateRandomNumber(1, 28).toString().padStart(2, '0');
}

function generateSerialNumber(): string {
  return generateRandomNumber(0, 999).toString().padStart(3, '0');
}

function calculateChecksum(num: string): number {
  const digits = num.split('').map(Number);

  const transformedDigits = digits.map((digit, index) => {
    const value = index % 2 === 0 ? digit * 2 : digit;
    return value > 9 ? sumDigits(value) : value;
  });

  const totalSum = transformedDigits.reduce((sum, digit) => sum + digit, 0);
  return (10 - (totalSum % 10)) % 10;
}

function generateUnvalidatedNumber(): string {
  const year = generateYear().toString();
  const month = generateMonth();
  const day = generateDay();
  const serial = generateSerialNumber();

  return `${year}${month}${day}${serial}`;
}

export function generateFullSsnNumber(): string {
  const unvalidatedNumber = generateUnvalidatedNumber();
  const yearValue = parseInt(unvalidatedNumber.substring(0, 2), 10);
  const century = yearValue >= 50 ? '19' : '20';
  const checksum = calculateChecksum(unvalidatedNumber);

  return `${century}${unvalidatedNumber}${checksum}`;
}
