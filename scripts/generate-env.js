const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const outputDir = path.resolve(__dirname, '..', 'src', 'config');
const outputFile = path.join(outputDir, 'env.ts');

if (!fs.existsSync(envPath)) {
  console.log('[generate-env] .env not found, skipping');
  process.exit(0);
}

const parse = (text) => {
  const lines = text.split(/\r?\n/);
  const result = {};
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  });
  return result;
};

const env = parse(fs.readFileSync(envPath, 'utf8'));

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const banner = `// Auto-generated from .env. Do not edit manually.\n`;
const lines = [
  `export const FIREBASE_API_KEY = ${JSON.stringify(env.FIREBASE_API_KEY || '')};`,
  `export const FIREBASE_PROJECT_ID = ${JSON.stringify(env.FIREBASE_PROJECT_ID || '')};`,
  `export const GOOGLE_WEB_CLIENT_ID = ${JSON.stringify(env.GOOGLE_WEB_CLIENT_ID || '')};`,
  `export const GROQ_API_KEY = ${JSON.stringify(env.GROQ_API_KEY || '')};`,
];
const contents = `${banner}${lines.join('\n')}\n`;

fs.writeFileSync(outputFile, contents, 'utf8');
console.log('[generate-env] wrote', outputFile);
