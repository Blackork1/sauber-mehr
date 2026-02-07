import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

import cloudinary from '../util/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? path.resolve(process.env.UPLOAD_ROOT)
  : path.join(__dirname, '..', '..', 'data', 'uploads');

const MAX_IMAGE_WIDTH = Number(process.env.MAX_IMAGE_WIDTH || 2000);
const IMAGE_WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY || 80);

const VIDEO_TRANSCODE = String(process.env.VIDEO_TRANSCODE || 'true') === 'true';
const VIDEO_MAX_WIDTH = Number(process.env.VIDEO_MAX_WIDTH || 1920);
const VIDEO_MAX_HEIGHT = Number(process.env.VIDEO_MAX_HEIGHT || 1080);
const VIDEO_CRF = String(process.env.VIDEO_CRF || '28');
const VIDEO_PRESET = String(process.env.VIDEO_PRESET || 'medium');
const AUDIO_BITRATE = String(process.env.AUDIO_BITRATE || '128k');

const CLOUDINARY_FOLDER_IMAGES = process.env.CLOUDINARY_FOLDER_IMAGES || 'sauber-mehr/images';
const CLOUDINARY_FOLDER_VIDEOS = process.env.CLOUDINARY_FOLDER_VIDEOS || 'sauber-mehr/videos';

export const uploadDirs = {
  images: path.join(UPLOAD_ROOT, 'images'),
  videos: path.join(UPLOAD_ROOT, 'videos'),
  tmp: path.join(UPLOAD_ROOT, 'tmp')
};

const ensureDir = (target) => {
  fs.mkdirSync(target, { recursive: true });
};

const yyyyMm = () => {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return { yyyy, mm };
};

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

const rmQuiet = async (target) => {
  try {
    await fs.promises.unlink(target);
  } catch (_) {
    // ignore
  }
};

const uploadToCloudinary = async (filePath, { resourceType, folder, publicId }) => {
  const stat = await fs.promises.stat(filePath);
  const isLarge = resourceType === 'video' && stat.size > 90 * 1024 * 1024;

  const opts = {
    resource_type: resourceType,
    folder,
    public_id: publicId,
    overwrite: false
  };

  if (!isLarge) {
    return cloudinary.uploader.upload(filePath, opts);
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      filePath,
      { ...opts, chunk_size: 6 * 1024 * 1024 },
      (err, result) => (err ? reject(err) : resolve(result))
    );
  });
};

const transcodeImageToWebp = async (inputPath, outputPath) => new Promise((resolve, reject) => {
  const scaleFilter = `scale='min(${MAX_IMAGE_WIDTH},iw)':-2:force_original_aspect_ratio=decrease`;
  const args = [
    '-y',
    '-i', inputPath,
    '-vf', scaleFilter,
    '-vcodec', 'libwebp',
    '-q:v', String(IMAGE_WEBP_QUALITY),
    outputPath
  ];
  const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  ff.stderr.on('data', (d) => { stderr += d.toString(); });
  ff.on('error', (err) => reject(new Error(`ffmpeg nicht verfügbar: ${err.message}`)));
  ff.on('close', (code) => {
    if (code === 0) return resolve();
    return reject(new Error(`ffmpeg exit ${code}. ${stderr.slice(-1500)}`));
  });
});

const transcodeVideoToMp4 = async (inputPath, outputPath) => new Promise((resolve, reject) => {
  const scaleFilter =
    `scale='min(${VIDEO_MAX_WIDTH},iw)':'min(${VIDEO_MAX_HEIGHT},ih)':force_original_aspect_ratio=decrease`;
  const args = [
    '-y',
    '-i', inputPath,
    '-vf', scaleFilter,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', VIDEO_PRESET,
    '-crf', VIDEO_CRF,
    '-movflags', '+faststart',
    '-c:a', 'aac',
    '-b:a', AUDIO_BITRATE,
    outputPath
  ];
  const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  ff.stderr.on('data', (d) => { stderr += d.toString(); });
  ff.on('error', (err) => reject(new Error(`ffmpeg nicht verfügbar: ${err.message}`)));
  ff.on('close', (code) => {
    if (code === 0) return resolve();
    return reject(new Error(`ffmpeg exit ${code}. ${stderr.slice(-1500)}`));
  });
});

const buildLocalPath = (type, relPath) => `/uploads/${type}/${relPath.replace(/\\/g, '/')}`;

const normalizeBaseName = (value) => String(value || '')
  .trim()
  .replace(/ä/gi, 'ae')
  .replace(/ö/gi, 'oe')
  .replace(/ü/gi, 'ue')
  .replace(/ß/g, 'ss');

const slugify = (value) => normalizeBaseName(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const ensureUniqueFilename = async ({ dir, baseName, ext }) => {
  const safeBase = slugify(baseName) || uid();
  let candidate = `${safeBase}${ext}`;
  let attempt = 0;
  while (true) {
    const absolute = path.join(dir, candidate);
    try {
      await fs.promises.access(absolute);
      attempt += 1;
      const suffix = attempt === 1 ? 'alternative' : `alternative-${attempt}`;
      candidate = `${safeBase}-${suffix}${ext}`;
    } catch {
      return candidate;
    }
  }
};

const stripFileExtension = (value) => {
  if (!value) return '';
  return String(value).replace(/\.[^/.]+$/, '');
};

export const processGalleryImageUpload = async (file, { baseName } = {}) => {
  if (!file?.mimetype?.startsWith('image/')) {
    throw new Error('Nur Bilder erlaubt.');
  }
  if (file.mimetype === 'image/gif') {
    throw new Error('GIF Upload deaktiviert (animiert). Bitte JPG/PNG/WebP.');
  }
  const { yyyy, mm } = yyyyMm();
  const relDir = path.join(yyyy, mm);
  const outDir = path.join(uploadDirs.images, relDir);
  ensureDir(outDir);
  const derivedBaseName = baseName || stripFileExtension(file.originalname || '');
  const filename = await ensureUniqueFilename({ dir: outDir, baseName: derivedBaseName, ext: '.webp' });
  const outAbs = path.join(outDir, filename);

  await transcodeImageToWebp(file.path, outAbs);
  await rmQuiet(file.path);

  const relPath = path.join(relDir, filename);
  const id = path.basename(filename, '.webp');
  const cloud = await uploadToCloudinary(outAbs, {
    resourceType: 'image',
    folder: CLOUDINARY_FOLDER_IMAGES,
    publicId: `${yyyy}/${mm}/${id}`
  });
  const stat = await fs.promises.stat(outAbs);

  return {
    filename,
    originalName: file.originalname,
    localPath: buildLocalPath('images', relPath),
    sizeBytes: stat.size,
    width: null,
    height: null,
    cloudinaryUrl: cloud.secure_url,
    cloudinaryPublicId: cloud.public_id
  };
};

export const processGalleryVideoUpload = async (file) => {
  if (!file?.mimetype?.startsWith('video/')) {
    throw new Error('Nur Videos erlaubt.');
  }
  const { yyyy, mm } = yyyyMm();
  const id = uid();
  const relDir = path.join(yyyy, mm);
  const outDir = path.join(uploadDirs.videos, relDir);
  ensureDir(outDir);

  let filename = '';
  let outAbs = '';

  if (VIDEO_TRANSCODE) {
    filename = `${id}.mp4`;
    outAbs = path.join(outDir, filename);
    await transcodeVideoToMp4(file.path, outAbs);
    await rmQuiet(file.path);
  } else {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
    filename = `${id}${ext}`;
    outAbs = path.join(outDir, filename);
    await fs.promises.rename(file.path, outAbs);
  }

  const relPath = path.join(relDir, filename);
  const cloud = await uploadToCloudinary(outAbs, {
    resourceType: 'video',
    folder: CLOUDINARY_FOLDER_VIDEOS,
    publicId: `${yyyy}/${mm}/${id}`
  });
  const stat = await fs.promises.stat(outAbs);

  return {
    filename,
    originalName: file.originalname,
    localPath: buildLocalPath('videos', relPath),
    sizeBytes: stat.size,
    width: null,
    height: null,
    cloudinaryUrl: cloud.secure_url,
    cloudinaryPublicId: cloud.public_id
  };
};