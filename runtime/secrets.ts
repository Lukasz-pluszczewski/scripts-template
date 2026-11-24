import { createHash } from 'node:crypto';

// Based on src/shared/utilities/secrets.ts from fullstack-template, without the
// value patterns that matched plain URLs ("user:pass"), hostnames and versions ("a.b.c").
// Masking a value that is not a secret costs little, so the heuristics lean towards masking.

const SECRET_KEY_PATTERNS: RegExp[] = [
  /(^|_)(API_?KEY|API_?TOKEN|ACCESS_?TOKEN|REFRESH_?TOKEN|AUTH_?TOKEN|BEARER)(_|$)/,
  /(^|_)(SECRET|TOKEN|PASSWORD|PASSWD|PASS|PIN|CREDENTIALS?|PRIVATE_?KEY|SIGNING_?KEY)(_|$)/,
  /(^|_)(DATABASE_URL|DB_URL|DSN|MONGO(DB)?_URI|REDIS_URL|COOKIE|SESSION)(_|$)/,
  /(^|_)KEY$/,
];

const PUBLIC_KEY_PATTERNS: RegExp[] = [
  /(^|_)(PUBLIC_?KEY|PUBLISHABLE_?KEY|KEY_?ID|CLIENT_?ID|PROJECT_?ID|TENANT_?ID|ORG_?ID)(_|$)/,
];

const SECRET_VALUE_PATTERNS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/, // JWT
  /\b(sk|rk|pk)_(live|test)_[0-9a-zA-Z]{16,}/, // Stripe
  /\bsk-[\w-]{20,}/, // OpenAI, Anthropic, OpenRouter
  /\bgh[pousr]_\w{20,}|\bgithub_pat_\w{20,}/,
  /\bxox[baprs]-[\w-]{10,}/, // Slack
  /\b(AKIA|ASIA)[0-9A-Z]{16}\b/, // AWS
  /\bAIza[\w-]{20,}/, // Google
  /^\s*Bearer\s+\S+$/i,
  /^[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/i, // URL with credentials
];

const normalizeKey = (key: string) =>
  key
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_');

const keyLooksPublic = (key: string) =>
  PUBLIC_KEY_PATTERNS.some(pattern => pattern.test(normalizeKey(key)));

const keyLooksSecret = (key: string) =>
  SECRET_KEY_PATTERNS.some(pattern => pattern.test(normalizeKey(key)));

const isPlainUrlOrPath = (value: string) => {
  if (/^(\/|\.{1,2}\/|~\/)\S*$/.test(value)) return true;
  // URL without credentials and without a query string, which could hold a token
  return /^[a-z][a-z0-9+.-]*:\/\/[^\s@?]+$/i.test(value);
};

const valueLooksSecret = (value: string) => {
  const trimmed = value.trim();
  if (SECRET_VALUE_PATTERNS.some(pattern => pattern.test(trimmed))) return true;
  if (trimmed.length < 20 || /\s/.test(trimmed) || isPlainUrlOrPath(trimmed)) {
    return false;
  }

  // Long token-like string: letters mixed with digits and few repeated characters
  const uniqueCharRatio = new Set(trimmed).size / trimmed.length;
  return (
    uniqueCharRatio >= 0.3 && /\d/.test(trimmed) && /[a-zA-Z]/.test(trimmed)
  );
};

// A key named as public (client ID, public key) is trusted over the value heuristics
export const isSecret = (key: string, value: string) =>
  !keyLooksPublic(key) && (keyLooksSecret(key) || valueLooksSecret(value));

// Shows enough to tell which value is loaded and whether it changed, without revealing it
export const fingerprintSecret = (value: string) => {
  const hash = createHash('sha256').update(value).digest('hex').slice(0, 6);
  const prefix = value.length >= 16 ? value.slice(0, 4) : '';
  return `${prefix}…(${value.length}) #${hash}`;
};

// Values shorter than this are not replaced in output: replacing short strings
// would garble unrelated text. They are still hidden in the env summary.
export const MIN_MASKED_LENGTH = 6;

export const createSecretMasker = (secretValues: string[]) => {
  const replacements = new Map<string, string>();
  for (const value of secretValues) {
    if (value.length < MIN_MASKED_LENGTH) continue;
    const fingerprint = fingerprintSecret(value);
    replacements.set(value, fingerprint);
    replacements.set(encodeURIComponent(value), fingerprint);
    replacements.set(Buffer.from(value).toString('base64'), fingerprint);
  }

  // Longest first, so a secret that contains another secret is replaced whole
  const searchValues = [...replacements.keys()].sort(
    (a, b) => b.length - a.length
  );

  return (text: string) => {
    let maskedText = text;
    for (const searchValue of searchValues) {
      if (maskedText.includes(searchValue)) {
        maskedText = maskedText.replaceAll(
          searchValue,
          replacements.get(searchValue) as string
        );
      }
    }
    return maskedText;
  };
};
