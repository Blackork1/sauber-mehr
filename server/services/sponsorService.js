export async function getSponsors(pool) {
  const { rows } = await pool.query(
    `SELECT id,
            name,
            image_url,
            link_url,
            description_de,
            description_en,
            description_ku,
            created_at
         FROM sponsors
     ORDER BY created_at DESC, id DESC`
  );
  return rows;
}

export async function createSponsor(pool, data) {
  const { rows } = await pool.query(
    `INSERT INTO sponsors (name, image_url, link_url, description_de, description_en, description_ku)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      data.name,
      data.imageUrl || null,
      data.linkUrl || null,
      data.descriptionDe || null,
      data.descriptionEn || null,
      data.descriptionKu || null
    ]
  );
  return rows[0] || null;
}

export async function updateSponsor(pool, id, data) {
  await pool.query(
    `UPDATE sponsors
     SET name = $1,
         image_url = $2,
         link_url = $3,
         description_de = $4,
         description_en = $5,
         description_ku = $6
     WHERE id = $7`,
    [
      data.name,
      data.imageUrl || null,
      data.linkUrl || null,
      data.descriptionDe || null,
      data.descriptionEn || null,
      data.descriptionKu || null,
      id
    ]
  );
}

export async function deleteSponsor(pool, id) {
  await pool.query(
    'DELETE FROM sponsors WHERE id = $1',
    [id]
  );
}