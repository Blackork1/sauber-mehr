import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(relativePath) {
  const filePath = path.join(__dirname, '..', relativePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

export function loadCookieBannerCopy() {
  return readJson('content/banner-copy.json');
}

export function loadCookieBannerHeroCopy() {
  return readJson('content/hero-copy.json');
}