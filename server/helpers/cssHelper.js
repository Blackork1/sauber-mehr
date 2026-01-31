// helpers/cssHelper.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getCssClasses() {
  try {
    const cssPath = join(__dirname, '..', 'public', 'styles.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    const regex = /\.([\w\-\:\\/]+)\s*\{/g;
    const classes = new Set();
    let match;
    while ((match = regex.exec(css)) !== null) {
      classes.add(match[1].replace(/\\/g, ''));
    }
    return Array.from(classes).sort();
  } catch {
    return [];
  }
}

export function getAvailableCssFiles() {
  const cssDir = join(__dirname, '..', 'public');
  try {
    return fs.readdirSync(cssDir).filter(f => f.toLowerCase().endsWith('.css'));
  } catch (error) {
    console.error('Fehler beim Lesen des CSS-Verzeichnisses:', error);
    return [];
  }
}


export function getCssAssetVersion() {
  const publicDir = join(__dirname, '..', 'public');
  const cssDir = join(publicDir, 'css');
  const roots = [publicDir, cssDir];
  let latestMtime = 0;

  roots.forEach((root) => {
    if (!fs.existsSync(root)) return;
    const entries = fs.readdirSync(root, { withFileTypes: true });
    entries.forEach((entry) => {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.css')) return;
      const fullPath = join(root, entry.name);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
        }
      } catch (error) {
        console.warn(`Konnte CSS-Datei nicht lesen: ${fullPath}`, error);
      }
    });
  });

  return latestMtime ? Math.floor(latestMtime).toString() : '';
}