import { Router } from 'express';
import path from 'path';
import { getContact, postContact } from '../controllers/contactController.js';

const router = Router();
router.get('/', getContact);

function splitMultipart(buffer, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = buffer.indexOf(boundaryBuffer);
  while (start !== -1) {
    start += boundaryBuffer.length;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1) break;
    const part = buffer.slice(start, end - 2);
    if (part.length) parts.push(part);
    start = end;
  }
  return parts;
}

function parseMultipart() {
  return (req, _res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) return next();
    const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
    if (!boundaryMatch) return next();

    const boundary = boundaryMatch[1];
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const parts = splitMultipart(buffer, boundary);
      req.body = req.body || {};
      req.files = req.files || {};
      for (const part of parts) {
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd === -1) continue;
        const header = part.slice(0, headerEnd).toString('utf8');
        let body = part.slice(headerEnd + 4);
        if (body.length >= 2 && body.slice(-2).toString() === '\r\n') {
          body = body.slice(0, -2);
        }
        const nameMatch = header.match(/name="([^"]+)"/i);
        if (!nameMatch) continue;
        const field = nameMatch[1];
        const filenameMatch = header.match(/filename="([^"]*)"/i);
        if (filenameMatch) {
          const originalName = filenameMatch[1];
          if (!originalName) continue;
          const ext = path.extname(originalName).toLowerCase();
          const baseName = path.basename(originalName, ext).replace(/[^a-z0-9-_]/gi, '');
          const safeName = baseName || 'kontakt-upload';
          const storedName = `${safeName}-${Date.now()}${ext}`;
          const mimeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
          const mimetype = mimeMatch ? mimeMatch[1] : '';
          if (!String(mimetype).toLowerCase().startsWith('image/')) {
            req.fileValidationErrors = req.fileValidationErrors || [];
            req.fileValidationErrors.push({
              field,
              originalName
            });
            continue;
          }
          const fileEntry = {
            filename: storedName,
            mimetype,
            originalname: originalName,
            size: body.length,
            buffer: body
          };
          if (req.files[field]) {
            if (Array.isArray(req.files[field])) {
              req.files[field].push(fileEntry);
            } else {
              req.files[field] = [req.files[field], fileEntry];
            }
          } else {
            req.files[field] = fileEntry;
          }
        } else {
          const value = body.toString('utf8');
          if (req.body[field] === undefined) {
            req.body[field] = value;
          } else if (Array.isArray(req.body[field])) {
            req.body[field].push(value);
          } else {
            req.body[field] = [req.body[field], value];
          }
        }
      }
      next();
    });
    req.on('error', next);
  };
}

router.post('/', parseMultipart(), postContact);
export default router;
