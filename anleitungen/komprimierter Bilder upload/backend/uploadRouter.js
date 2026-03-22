import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';

import { processMediaUpload } from './mediaUploadService.js';

const router = Router();

const TMP_ROOT = process.env.UPLOAD_TMP_DIR
  ? path.resolve(process.env.UPLOAD_TMP_DIR)
  : path.resolve(process.cwd(), 'data/uploads/tmp');

fs.mkdirSync(TMP_ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, TMP_ROOT);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path
      .basename(file.originalname || 'upload', ext)
      .replace(/[^a-z0-9-_]/gi, '')
      .toLowerCase();
    const name = `${safeBase || 'upload'}-${Date.now()}${ext}`;
    callback(null, name);
  }
});

const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 300 * 1024 * 1024);

const upload = multer({
  storage,
  limits: {
    files: 20,
    fileSize: maxUploadBytes
  },
  fileFilter: (_req, file, callback) => {
    const mime = String(file.mimetype || '');
    if (mime.startsWith('image/') || mime.startsWith('video/')) {
      callback(null, true);
      return;
    }
    callback(new Error('Nur Bilder und Videos sind erlaubt.'));
  }
});

router.post('/api/media/upload', upload.array('media', 20), async (req, res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({
        ok: false,
        error: 'Keine Datei hochgeladen.'
      });
    }

    const clientCompressed =
      String(req.body?.client_compressed || '').toLowerCase() === 'true';

    const uploaded = [];
    for (const file of files) {
      // Sequenziell: reduziert Last bei parallelen ffmpeg jobs.
      const result = await processMediaUpload({ file, clientCompressed });
      uploaded.push(result);
    }

    return res.status(201).json({
      ok: true,
      count: uploaded.length,
      files: uploaded
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
