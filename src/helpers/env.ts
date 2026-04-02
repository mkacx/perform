let raw = '';
try {
  raw = open('../../.env');
} catch {
  console.warn('.env file not found — using only __ENV variables');
}

const vars: Record<string, string> = {};

raw.split('\n').forEach((line: string) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex !== -1) {
      const key = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();
      vars[key] = value;
    }
  }
});

export default vars;
