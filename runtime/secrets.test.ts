import { describe, expect, it } from 'vitest';
import { readScriptDescription } from './help';
import { createSecretMasker, fingerprintSecret, isSecret } from './secrets';

describe('isSecret', () => {
  it.each([
    ['OPENAI_API_KEY', 'anything'],
    ['DB_PASSWORD', 'hunter2pass'],
    ['SLACK_WEBHOOK_SECRET_URL', 'https://hooks.slack.com/services/T0/B0/X'],
    ['SOME_VALUE', 'sk-proj-abcdefghijklmnopqrstuvwxyz123456'],
    ['PROXY', 'http://user:p4ssw0rd@127.0.0.1:8080'],
    ['RANDOM', 'q8Zk2mWx9LpR4tYv7NcB3hJd'],
  ])('flags %s', (key, value) => {
    expect(isSecret(key, value)).toBe(true);
  });

  it.each([
    ['OPENROUTER_URL', 'https://openrouter.ai/api/v1'],
    ['SMTP_HOST', 'smtp.gmail.com'],
    ['APP_VERSION', '1.2.3'],
    ['DATA_DIR', '/Users/someone/data/cache2024'],
    ['MODEL', 'openai/gpt-5.1-mini'],
    ['GOOGLE_CLIENT_ID', 'abc123def456ghi789jkl012mno345'],
    ['DEBUG', 'true'],
    ['PWD', '/Users/someone/projects/scripts-collection'],
  ])('does not flag %s', (key, value) => {
    expect(isSecret(key, value)).toBe(false);
  });
});

describe('fingerprintSecret', () => {
  it('shows a prefix only for long values', () => {
    expect(fingerprintSecret('sk-proj-abcdefghijklmnop')).toMatch(
      /^sk-p…\(24\) #[0-9a-f]{6}$/
    );
    expect(fingerprintSecret('hunter2pass')).toMatch(/^…\(11\) #[0-9a-f]{6}$/);
  });
});

describe('createSecretMasker', () => {
  const secret = 'sk-proj-abc/def+ghi=jkl';
  const mask = createSecretMasker([secret, 'abc']);

  it('replaces raw, URL-encoded and base64 forms of a secret', () => {
    const text = [
      `token ${secret}`,
      `url ?key=${encodeURIComponent(secret)}`,
      `basic ${Buffer.from(secret).toString('base64')}`,
    ].join('\n');

    const masked = mask(text);

    expect(masked).not.toContain(secret);
    expect(masked).not.toContain(encodeURIComponent(secret));
    expect(masked).not.toContain(Buffer.from(secret).toString('base64'));
    expect(masked.split(fingerprintSecret(secret)).length).toBe(4);
  });

  it('leaves values shorter than the minimum length alone', () => {
    expect(mask('abc')).toBe('abc');
  });
});

describe('readScriptDescription', () => {
  it('reads the leading doc comment', () => {
    expect(
      readScriptDescription('/**\n * Converts TSV\n * to JSON\n */\nimport x;')
    ).toBe('Converts TSV to JSON');
    expect(readScriptDescription('/** One line */\n')).toBe('One line');
  });

  it('ignores files without a leading doc comment', () => {
    expect(readScriptDescription("import x from 'x';\n/** Later */")).toBe(
      null
    );
  });
});
