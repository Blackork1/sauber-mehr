export async function getTeamMembers(pool, { onlyDisplayed = true, locale = 'de' } = {}) {
  const filters = [];
  const params = [locale];

  filters.push(`team_member_locales.locale = $1`);
  if (onlyDisplayed) {
    params.push(true);
    filters.push(`team_member_locales.display = $${params.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT team_members.id,
            team_members.name,
            team_member_locales.role,
            team_member_locales.description,
            team_members.image_url,
            team_members.image_alt_text,
            team_member_locales.display,
            team_members.sort_order,
            team_members.created_at
     FROM team_members
      JOIN team_member_locales
      ON team_member_locales.member_id = team_members.id
     ${whereClause}
     ORDER BY team_members.sort_order ASC, team_members.id ASC`,
    params
  );

  return rows;
}

export async function getTeamMembersWithLocales(pool) {
  const { rows } = await pool.query(
    `SELECT team_members.id,
            team_members.name,
            team_members.image_url,
            team_members.image_alt_text,
            team_members.sort_order,
            team_members.created_at,
            team_member_locales.locale,
            team_member_locales.role,
            team_member_locales.description,
            team_member_locales.display
     FROM team_members
     LEFT JOIN team_member_locales
       ON team_member_locales.member_id = team_members.id
     ORDER BY team_members.sort_order ASC, team_members.id ASC`
  );

  const members = new Map();
  rows.forEach((row) => {
    if (!members.has(row.id)) {
      members.set(row.id, {
        id: row.id,
        name: row.name,
        image_url: row.image_url,
        image_alt_text: row.image_alt_text,
        sort_order: row.sort_order,
        created_at: row.created_at,
        locales: {}
      });
    }
    if (row.locale) {
      members.get(row.id).locales[row.locale] = {
        role: row.role,
        description: row.description,
        display: row.display
      };
    }
  });

  return Array.from(members.values());
}

export async function createTeamMember(pool, data) {
  const { rows: sortRows } = await pool.query(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM team_members'
  );
  const sortOrder = Number(sortRows[0]?.next_order || 1);

  const { rows } = await pool.query(
    `INSERT INTO team_members (name, image_url, image_alt_text, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      data.name,
      // data.role || null,
      // data.description || null,
      data.imageUrl || null,
      data.imageAltText || null,
      // data.display !== false,
      sortOrder
    ]
  );

  const member = rows[0] || null;
  if (member?.id && Array.isArray(data.locales)) {
    for (const localeData of data.locales) {
      await upsertTeamMemberLocale(pool, member.id, localeData);
    }
  }

  return member;
}

export async function upsertTeamMemberLocale(pool, memberId, data) {
  await pool.query(
    `INSERT INTO team_member_locales (member_id, locale, role, description, display)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (member_id, locale)
     DO UPDATE SET role = EXCLUDED.role,
                   description = EXCLUDED.description,
                   display = EXCLUDED.display`,
    [
      memberId,
      data.locale,
      data.role || null,
      data.description || null,
      data.display !== false
    ]
  );
}

export async function updateTeamMemberBase(pool, id, data) {
  await pool.query(
    `UPDATE team_members
     SET name = $1,
         image_url = $2,
         image_alt_text = $3
     WHERE id = $4`,
    [
      data.name,
      data.imageUrl || null,
      data.imageAltText || null,
      id
    ]
  );
}

export async function updateTeamMemberLocaleDisplay(pool, id, locale, display) {
  await pool.query(
    `INSERT INTO team_member_locales (member_id, locale, display)
     VALUES ($1, $2, $3)
     ON CONFLICT (member_id, locale)
     DO UPDATE SET display = EXCLUDED.display`,
    [id, locale, display]
  );
}

export async function deleteTeamMember(pool, id) {
  await pool.query(
    'DELETE FROM team_members WHERE id = $1',
    [id]
  );
}