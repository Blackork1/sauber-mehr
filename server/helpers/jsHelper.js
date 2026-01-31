// helpers/jsHelper.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getJsAssetVersion() {
  const publicDir = join(__dirname, '..', 'public');
  const jsDir = join(publicDir, 'js');
  const roots = [publicDir, jsDir];
  let latestMtime = 0;

  roots.forEach((root) => {
    if (!fs.existsSync(root)) return;
    const entries = fs.readdirSync(root, { withFileTypes: true });
    entries.forEach((entry) => {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.js')) return;
      const fullPath = join(root, entry.name);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
        }
      } catch (error) {
        console.warn(`Konnte JS-Datei nicht lesen: ${fullPath}`, error);
      }
    });
  });

  return latestMtime ? Math.floor(latestMtime).toString() : '';
}