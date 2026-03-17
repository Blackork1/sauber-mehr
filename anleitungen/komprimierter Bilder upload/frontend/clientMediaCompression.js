const DEFAULT_IMAGE_OPTIONS = {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 0.82,
  format: 'image/webp'
};

const DEFAULT_VIDEO_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1080,
  crf: 28,
  preset: 'medium',
  audioBitrate: '128k'
};

const DEFAULT_OPTIONS = {
  image: DEFAULT_IMAGE_OPTIONS,
  video: DEFAULT_VIDEO_OPTIONS,
  maxParallel: 2,
  onProgress: null
};

const IMAGE_TYPE_DENYLIST = new Set(['image/gif', 'image/svg+xml']);

const getMimeType = (file) => String(file?.type || '').toLowerCase();

const isImageFile = (file) => {
  const type = getMimeType(file);
  return type.startsWith('image/') && !IMAGE_TYPE_DENYLIST.has(type);
};

const isVideoFile = (file) => getMimeType(file).startsWith('video/');

const buildWebpName = (name) => {
  const raw = String(name || 'upload').trim();
  const base = raw.replace(/\.[^/.]+$/, '') || 'upload';
  return `${base}.webp`;
};

const buildMp4Name = (name) => {
  const raw = String(name || 'upload').trim();
  const base = raw.replace(/\.[^/.]+$/, '') || 'upload';
  return `${base}.mp4`;
};

const scaleToBounds = ({ width, height, maxWidth, maxHeight }) => {
  if (!width || !height) return { width, height };
  const ratio = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
};

const imageFromFile = async (file) => {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const compressImageFile = async (file, customOptions = {}) => {
  if (!isImageFile(file)) return file;

  const options = {
    ...DEFAULT_IMAGE_OPTIONS,
    ...customOptions
  };

  const image = await imageFromFile(file);
  const sourceWidth = Number(image.naturalWidth || image.width || 0);
  const sourceHeight = Number(image.naturalHeight || image.height || 0);
  if (!sourceWidth || !sourceHeight) return file;

  const size = scaleToBounds({
    width: sourceWidth,
    height: sourceHeight,
    maxWidth: Number(options.maxWidth) || DEFAULT_IMAGE_OPTIONS.maxWidth,
    maxHeight: Number(options.maxHeight) || DEFAULT_IMAGE_OPTIONS.maxHeight
  });

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return file;
  context.drawImage(image, 0, 0, size.width, size.height);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, options.format, options.quality);
  });

  if (!blob) return file;

  if (blob.size >= file.size && getMimeType(file) === options.format) {
    return file;
  }

  return new File([blob], buildWebpName(file.name), {
    type: options.format,
    lastModified: Date.now()
  });
};

let ffmpegPromise = null;

const loadFfmpeg = async () => {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const mod = await import('@ffmpeg/ffmpeg');
      if (!mod?.createFFmpeg || !mod?.fetchFile) {
        throw new Error('FFmpeg API konnte nicht geladen werden.');
      }
      const ffmpeg = mod.createFFmpeg({ log: false });
      await ffmpeg.load();
      return { ffmpeg, fetchFile: mod.fetchFile };
    })();
  }
  return ffmpegPromise;
};

const runVideoCompression = async (file, options) => {
  const { ffmpeg, fetchFile } = await loadFfmpeg();
  const inName = `input-${Date.now()}-${Math.random().toString(16).slice(2)}.bin`;
  const outName = `output-${Date.now()}.mp4`;

  const maxWidth = Number(options.maxWidth) || DEFAULT_VIDEO_OPTIONS.maxWidth;
  const maxHeight = Number(options.maxHeight) || DEFAULT_VIDEO_OPTIONS.maxHeight;
  const crf = Number(options.crf) || DEFAULT_VIDEO_OPTIONS.crf;
  const preset = String(options.preset || DEFAULT_VIDEO_OPTIONS.preset);
  const audioBitrate = String(options.audioBitrate || DEFAULT_VIDEO_OPTIONS.audioBitrate);

  const scaleFilter =
    `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`;

  try {
    ffmpeg.FS('writeFile', inName, await fetchFile(file));
    await ffmpeg.run(
      '-i',
      inName,
      '-vf',
      scaleFilter,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      preset,
      '-crf',
      String(crf),
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      audioBitrate,
      outName
    );
    const data = ffmpeg.FS('readFile', outName);
    return new Blob([data.buffer], { type: 'video/mp4' });
  } finally {
    try {
      ffmpeg.FS('unlink', inName);
    } catch (_) {
      // ignore
    }
    try {
      ffmpeg.FS('unlink', outName);
    } catch (_) {
      // ignore
    }
  }
};

export const compressVideoFile = async (file, customOptions = {}) => {
  if (!isVideoFile(file)) return file;
  const options = {
    ...DEFAULT_VIDEO_OPTIONS,
    ...customOptions
  };

  try {
    const blob = await runVideoCompression(file, options);
    if (!blob || blob.size <= 0) return file;
    if (blob.size >= file.size) return file;
    return new File([blob], buildMp4Name(file.name), {
      type: 'video/mp4',
      lastModified: Date.now()
    });
  } catch (_) {
    return file;
  }
};

export const compressMediaFile = async (file, options = {}) => {
  if (isImageFile(file)) return compressImageFile(file, options.image);
  if (isVideoFile(file)) return compressVideoFile(file, options.video);
  return file;
};

const flattenFileInputs = (form) => {
  const inputs = Array.from(form.querySelectorAll('input[type="file"][name]'));
  const entries = [];
  inputs.forEach((input) => {
    const name = String(input.name || '').trim();
    if (!name) return;
    Array.from(input.files || []).forEach((file, index) => {
      entries.push({ name, file, index });
    });
  });
  return entries;
};

const mapWithConcurrency = async (items, maxParallel, worker) => {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [];

  const results = new Array(list.length);
  const safeParallel = Math.max(1, Math.min(list.length, Number(maxParallel) || 1));
  let cursor = 0;

  const workers = Array.from({ length: safeParallel }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= list.length) return;
      results[index] = await worker(list[index], index);
    }
  });

  await Promise.all(workers);
  return results;
};

export const buildCompressedFormData = async (form, customOptions = {}) => {
  const options = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
    image: { ...DEFAULT_IMAGE_OPTIONS, ...(customOptions.image || {}) },
    video: { ...DEFAULT_VIDEO_OPTIONS, ...(customOptions.video || {}) }
  };

  const baseFormData = new FormData(form);
  const files = flattenFileInputs(form);
  const total = files.length;
  let done = 0;

  if (!total) {
    baseFormData.set('client_compressed', 'true');
    return {
      formData: baseFormData,
      summary: {
        total: 0,
        compressed: 0,
        beforeBytes: 0,
        afterBytes: 0
      }
    };
  }

  const prepared = await mapWithConcurrency(
    files,
    options.maxParallel,
    async (entry) => {
      const preparedFile = await compressMediaFile(entry.file, options);
      done += 1;
      if (typeof options.onProgress === 'function') {
        options.onProgress({
          done,
          total,
          fileName: entry.file.name
        });
      }
      return {
        ...entry,
        preparedFile
      };
    }
  );

  const grouped = new Map();
  prepared.forEach((entry) => {
    if (!grouped.has(entry.name)) grouped.set(entry.name, []);
    grouped.get(entry.name).push(entry);
  });

  grouped.forEach((entries, fieldName) => {
    baseFormData.delete(fieldName);
    entries
      .sort((a, b) => a.index - b.index)
      .forEach((entry) => {
        baseFormData.append(fieldName, entry.preparedFile, entry.preparedFile.name);
      });
  });

  baseFormData.set('client_compressed', 'true');

  const beforeBytes = files.reduce((sum, entry) => sum + (entry.file.size || 0), 0);
  const afterBytes = prepared.reduce((sum, entry) => sum + (entry.preparedFile.size || 0), 0);
  const compressed = prepared.filter((entry) => entry.preparedFile !== entry.file).length;

  return {
    formData: baseFormData,
    summary: {
      total,
      compressed,
      beforeBytes,
      afterBytes
    }
  };
};
