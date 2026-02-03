export async function getGalleryImages(pool) {
  const { rows } = await pool.query(
    `SELECT id, filename, original_name, local_path, cloudinary_url, cloudinary_public_id,
            width, height, size_bytes, alt_de, alt_en, show_in_gallery, gallery_category, sort_order, created_at
            FROM gallery_images
     ORDER BY show_in_gallery DESC, sort_order ASC NULLS LAST, created_at DESC, id DESC`
  );
  return rows;
}

export async function getGalleryVideos(pool) {
  const { rows } = await pool.query(
    `SELECT id, filename, original_name, local_path, cloudinary_url, cloudinary_public_id,
            width, height, size_bytes, alt_de, alt_en, show_in_gallery, gallery_category, sort_order, created_at
     FROM gallery_videos
     ORDER BY show_in_gallery DESC, sort_order ASC NULLS LAST, created_at DESC, id DESC`
  );
  return rows;
}

export async function getPublicGalleryImages(pool) {
  const { rows } = await pool.query(
    `SELECT id, filename, original_name, local_path, cloudinary_url,
            width, height, size_bytes, alt_de, alt_en, gallery_category
     FROM gallery_images
     WHERE show_in_gallery = true
     ORDER BY sort_order ASC NULLS LAST, created_at DESC, id DESC`
  );
  return rows;
}

export async function getPublicGalleryVideos(pool) {
  const { rows } = await pool.query(
    `SELECT id, filename, original_name, local_path, cloudinary_url,
            width, height, size_bytes, alt_de, alt_en, gallery_category
     FROM gallery_videos
     WHERE show_in_gallery = true
     ORDER BY created_at DESC, id DESC`
  );
  return rows;
}

export async function updateGalleryImageSortOrder(pool, orderedIds = []) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
  const values = orderedIds
    .map((id, index) => `(${Number(id)}, ${index + 1})`)
    .join(', ');
  await pool.query(
    `UPDATE gallery_images
     SET sort_order = updated.sort_order
     FROM (VALUES ${values}) AS updated(id, sort_order)
     WHERE gallery_images.id = updated.id`
  );
}

export async function updateGalleryVideoSortOrder(pool, orderedIds = []) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
  const values = orderedIds
    .map((id, index) => `(${Number(id)}, ${index + 1})`)
    .join(', ');
  await pool.query(
    `UPDATE gallery_videos
     SET sort_order = updated.sort_order
     FROM (VALUES ${values}) AS updated(id, sort_order)
     WHERE gallery_videos.id = updated.id`
  );
}

export async function createGalleryImage(pool, data) {
  const { rows } = await pool.query(
    `INSERT INTO gallery_images
      (filename, original_name, local_path, cloudinary_url, cloudinary_public_id, width, height, size_bytes, alt_de, alt_en, show_in_gallery, gallery_category, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, 'moments'),
      COALESCE((SELECT MAX(sort_order) FROM gallery_images), 0) + 1)
     RETURNING *`,
    [
      data.filename,
      data.originalName,
      data.localPath,
      data.cloudinaryUrl,
      data.cloudinaryPublicId,
      data.width,
      data.height,
      data.sizeBytes,
      data.altDe,
      data.altEn,
      data.showInGallery ?? true,
      data.galleryCategory ?? null
    ]
  );
  return rows[0];
}

export async function createGalleryVideo(pool, data) {
  const { rows } = await pool.query(
    `INSERT INTO gallery_videos
      (filename, original_name, local_path, cloudinary_url, cloudinary_public_id, width, height, size_bytes, alt_de, alt_en, show_in_gallery, gallery_category, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, 'moments'),
      COALESCE((SELECT MAX(sort_order) FROM gallery_videos), 0) + 1)
     RETURNING *`,
    [
      data.filename,
      data.originalName,
      data.localPath,
      data.cloudinaryUrl,
      data.cloudinaryPublicId,
      data.width,
      data.height,
      data.sizeBytes,
      data.altDe,
      data.altEn,
      data.showInGallery ?? true,
      data.galleryCategory ?? null
    ]
  );
  return rows[0];
}

export async function getGalleryImageById(pool, id) {
  const { rows } = await pool.query(
    `SELECT id, filename, local_path, cloudinary_url, cloudinary_public_id
     FROM gallery_images
     WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function getGalleryVideoById(pool, id) {
  const { rows } = await pool.query(
    `SELECT id, filename, local_path, cloudinary_url, cloudinary_public_id
     FROM gallery_videos
     WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function findGalleryImageByName(pool, name) {
  if (!name) return null;
  const normalizedName = String(name).trim().toLowerCase();
  if (!normalizedName) return null;
  const { rows } = await pool.query(
    `SELECT id, filename, original_name, local_path, cloudinary_url
     FROM gallery_images
     WHERE LOWER(filename) = $1 OR LOWER(original_name) = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [normalizedName]
  );
  return rows[0] || null;
}

export async function findGalleryVideoByName(pool, name) {
  if (!name) return null;
  const normalizedName = String(name).trim().toLowerCase();
  if (!normalizedName) return null;
  const { rows } = await pool.query(
    `SELECT id, filename, original_name, local_path, cloudinary_url
     FROM gallery_videos
     WHERE LOWER(filename) = $1 OR LOWER(original_name) = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [normalizedName]
  );
  return rows[0] || null;
}

export async function deleteGalleryImage(pool, id) {
  await pool.query('DELETE FROM gallery_images WHERE id = $1', [id]);
}

export async function deleteGalleryVideo(pool, id) {
  await pool.query('DELETE FROM gallery_videos WHERE id = $1', [id]);
}

export async function updateGalleryImageVisibility(pool, id, showInGallery) {
  const { rows } = await pool.query(
    `UPDATE gallery_images
     SET show_in_gallery = $1
     WHERE id = $2
     RETURNING id`,
    [showInGallery, id]
  );
  return rows[0];
}

export async function updateGalleryVideoVisibility(pool, id, showInGallery) {
  const { rows } = await pool.query(
    `UPDATE gallery_videos
     SET show_in_gallery = $1
     WHERE id = $2
     RETURNING id`,
    [showInGallery, id]
  );
  return rows[0];
}

export async function updateGalleryImageCategory(pool, id, galleryCategory) {
  const { rows } = await pool.query(
    `UPDATE gallery_images
     SET gallery_category = $1
     WHERE id = $2
     RETURNING id`,
    [galleryCategory, id]
  );
  return rows[0];
}

export async function updateGalleryVideoCategory(pool, id, galleryCategory) {
  const { rows } = await pool.query(
    `UPDATE gallery_videos
     SET gallery_category = $1
     WHERE id = $2
     RETURNING id`,
    [galleryCategory, id]
  );
  return rows[0];
}