import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import sharp from 'sharp';

import cloudinary from './cloudinaryClient.js';

const TMP_ROOT = process.env.UPLOAD_TMP_DIR
  ? path.resolve(process.env.UPLOAD_TMP_DIR)
  : path.resolve(process.cwd(), 'data/uploads/tmp');

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 300 * 1024 * 1024);
const MAX_IMAGE_WIDTH = Number(process.env.MAX_IMAGE_WIDTH || 2000);
const IMAGE_WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY || 80);
const VIDEO_MAX_WIDTH = Number(process.env.VIDEO_MAX_WIDTH || 1920);
const VIDEO_MAX_HEIGHT = Number(process.env.VIDEO_MAX_HEIGHT || 1080);
const VIDEO_CRF = String(process.env.VIDEO_CRF || '28');
const VIDEO_PRESET = String(process.env.VIDEO_PRESET || 'medium');
const AUDIO_BITRATE = String(process.env.AUDIO_BITRATE || '128k');

const CLOUDINARY_FOLDER_IMAGES = process.env.CLOUDINARY_FOLDER_IMAGES || 'sauber-mehr/images';
const CLOUDINARY_FOLDER_VIDEOS = process.env.CLOUDINARY_FOLDER_VIDEOS || 'sauber-mehr/videos';

const ensureDir = (targetDir) => {
  fs.mkdirSync(targetDir, { recursive: true });
};

const rmQuiet = async (target) => {
  if (!target) return;
  try {
    await fs.promises.unlink(target);
  } catch (_) {
    // ignore
  }
};

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

const yyyyMm = () => {
  const now = new Date();
  return {
    yyyy: String(now.getFullYear()),
    mm: String(now.getMonth() + 1).padStart(2, '0')
  };
};

const assertUploadIsValid = (file) => {
  if (!file) {
    throw new Error('Keine Datei empfangen.');
  }
  if (Number(file.size) > MAX_UPLOAD_BYTES) {
    throw new Error(`Datei zu gross. Maximal erlaubt: ${MAX_UPLOAD_BYTES} Bytes.`);
  }
};

const isImage = (file) => String(file?.mimetype || '').startsWith('image/');
const isVideo = (file) => String(file?.mimetype || '').startsWith('video/');

const transcodeImageToWebp = async (inputPath, outputPath) => {
  const info = await sharp(inputPath)
    .rotate()
    .resize({
      width: MAX_IMAGE_WIDTH,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality: IMAGE_WEBP_QUALITY,
      effort: 4
    })
    .toFile(outputPath);

  return info;
};

const transcodeVideoToMp4 = async (inputPath, outputPath) => new Promise((resolve, reject) => {
  const scaleFilter =
    `scale='min(${VIDEO_MAX_WIDTH},iw)':'min(${VIDEO_MAX_HEIGHT},ih)':force_original_aspect_ratio=decrease`;
  const args = [
    '-y',
    '-i',
    inputPath,
    '-vf',
    scaleFilter,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    VIDEO_PRESET,
    '-crf',
    VIDEO_CRF,
    '-movflags',
    '+faststart',
    '-c:a',
    'aac',
    '-b:a',
    AUDIO_BITRATE,
    outputPath
  ];

  const ffmpeg = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  ffmpeg.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  ffmpeg.on('error', (error) => {
    reject(new Error(`ffmpeg nicht verfuegbar: ${error.message}`));
  });
  ffmpeg.on('close', (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-1200)}`));
  });
});

const uploadToCloudinary = async (filePath, { mediaType, publicId }) => {
  const stat = await fs.promises.stat(filePath);
  const useLargeUpload = mediaType === 'video' && stat.size > 90 * 1024 * 1024;
  const folder = mediaType === 'image' ? CLOUDINARY_FOLDER_IMAGES : CLOUDINARY_FOLDER_VIDEOS;
  const options = {
    resource_type: mediaType,
    folder,
    public_id: publicId,
    overwrite: false
  };

  if (!useLargeUpload) {
    return cloudinary.uploader.upload(filePath, options);
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      filePath,
      {
        ...options,
        chunk_size: 6 * 1024 * 1024
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
  });
};

const safeBaseName = (value) => {
  const base = String(value || '')
    .trim()
    .replace(/\.[^/.]+$/, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || uid();
};

export const processMediaUpload = async ({ file, clientCompressed = false }) => {
  assertUploadIsValid(file);

  if (!isImage(file) && !isVideo(file)) {
    throw new Error('Nur Bild- und Video-Dateien sind erlaubt.');
  }

  ensureDir(TMP_ROOT);

  const { yyyy, mm } = yyyyMm();
  const baseName = safeBaseName(file.originalname || file.filename);
  const publicId = `${yyyy}/${mm}/${baseName}-${uid()}`;
  const outputType = isImage(file) ? 'image' : 'video';
  const outputExt = outputType === 'image' ? '.webp' : '.mp4';
  const outputAbs = path.join(TMP_ROOT, `${publicId.replace(/\//g, '-')}${outputExt}`);

  try {
    let width = null;
    let height = null;

    if (outputType === 'image') {
      const info = await transcodeImageToWebp(file.path, outputAbs);
      width = Number.isFinite(info?.width) ? info.width : null;
      height = Number.isFinite(info?.height) ? info.height : null;
    } else {
      await transcodeVideoToMp4(file.path, outputAbs);
    }

    const cloud = await uploadToCloudinary(outputAbs, {
      mediaType: outputType,
      publicId
    });

    const finalStat = await fs.promises.stat(outputAbs);

    return {
      mediaType: outputType,
      originalName: file.originalname,
      uploadedBytes: file.size,
      finalBytes: finalStat.size,
      width,
      height,
      clientCompressed: Boolean(clientCompressed),
      cloudinary: {
        url: cloud.secure_url,
        publicId: cloud.public_id,
        resourceType: cloud.resource_type,
        bytes: cloud.bytes
      }
    };
  } finally {
    await rmQuiet(file.path);
    await rmQuiet(outputAbs);
  }
};
