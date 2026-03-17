# Komprimierter Bilder Upload (inkl. Video)

Dieses Paket enthaelt die komplette Logik fuer:

1. lokale Komprimierung beim Nutzer (Browser) vor dem Upload
2. sicheren Backend-Upload
3. erneute serverseitige Normalisierung/Komprimierung
4. Upload der komprimierten Datei zu Cloudinary

## Ordnerinhalt

- `frontend/clientMediaCompression.js`: Browser-Komprimierung fuer Bilder und Videos
- `backend/cloudinaryClient.js`: Cloudinary Konfiguration
- `backend/mediaUploadService.js`: Server-Komprimierung + Cloudinary Upload
- `backend/uploadRouter.js`: Express Route mit `multer`

## Ablauf

1. Nutzer waehlt Datei im Browser.
2. Frontend komprimiert:
   - Bild: Canvas -> WebP
   - Video: FFmpeg WASM -> MP4 (H.264/AAC)
3. Frontend sendet nur die komprimierte Datei an den Server.
4. Backend validiert MIME-Type und Dateigroesse.
5. Backend normalisiert final:
   - Bild: `sharp` -> WebP
   - Video: `ffmpeg` -> MP4
6. Backend laedt die final komprimierte Datei in Cloudinary hoch.
7. API gibt `secure_url`, `public_id` und Dateimetadaten zurueck.

## Frontend Einbindung

```html
<form id="upload-form" action="/api/media/upload" method="post" enctype="multipart/form-data">
  <input type="file" name="media" accept="image/*,video/*" multiple required />
  <button type="submit">Upload</button>
</form>

<script type="module">
  import { buildCompressedFormData } from '/path/to/clientMediaCompression.js';

  const form = document.getElementById('upload-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const { formData } = await buildCompressedFormData(form, {
      onProgress: ({ done, total, fileName }) => {
        console.log(`Komprimierung ${done}/${total}: ${fileName}`);
      }
    });

    const response = await fetch(form.action, {
      method: form.method || 'POST',
      body: formData
    });

    const payload = await response.json();
    console.log(payload);
  });
</script>
```

## Backend Einbindung (Express)

```js
import express from 'express';
import uploadRouter from './anleitungen/komprimierter Bilder upload/backend/uploadRouter.js';

const app = express();
app.use(uploadRouter);
```

## Node Dependencies

```bash
npm install cloudinary multer sharp
```

Fuer Server-Video-Komprimierung muss `ffmpeg` auf dem Server installiert sein.

## Browser Video-Komprimierung (optional, aber empfohlen)

Die Datei `clientMediaCompression.js` nutzt fuer Videos `@ffmpeg/ffmpeg`.

Beispiel Installation fuer ein Web-Bundle:

```bash
npm install @ffmpeg/ffmpeg@0.11.6
```

Wenn kein FFmpeg im Browser verfuegbar ist, faellt der Code auf die Originaldatei zurueck.

## Cloudinary ENV

```env
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
CLOUDINARY_FOLDER_IMAGES=sauber-mehr/images
CLOUDINARY_FOLDER_VIDEOS=sauber-mehr/videos
UPLOAD_TMP_DIR=./data/uploads/tmp
MAX_UPLOAD_BYTES=314572800
MAX_IMAGE_WIDTH=2000
IMAGE_WEBP_QUALITY=80
VIDEO_MAX_WIDTH=1920
VIDEO_MAX_HEIGHT=1080
VIDEO_CRF=28
VIDEO_PRESET=medium
AUDIO_BITRATE=128k
```

## Hinweise fuer Produktion

1. Upload-Limits serverseitig immer aktiv lassen.
2. MIME-Type und Dateiendung strikt validieren.
3. FFmpeg und Sharp Fehler sauber loggen.
4. Temp-Dateien in `finally` immer loeschen.
5. Nur Cloudinary `secure_url` nach aussen geben.
