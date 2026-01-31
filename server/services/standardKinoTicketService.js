function resolveActivePhase(phases = []) {
  if (!phases.length) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const active = phases.find((phase) => {
    const start = phase.start_at ? new Date(phase.start_at) : null;
    const end = phase.end_at ? new Date(phase.end_at) : null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
  });
  return active || phases[phases.length - 1];
}

async function replaceStandardKinoTicketPhases(pool, ticketId, phases = []) {
  await pool.query('DELETE FROM standard_kino_ticket_price_phases WHERE standard_ticket_id = $1', [ticketId]);
  if (!phases.length) return;
  for (const phase of phases) {
    await pool.query(
      `INSERT INTO standard_kino_ticket_price_phases (
        standard_ticket_id,
        phase,
        start_at,
        end_at,
        current_price,
        price_note
      )
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        ticketId,
        phase.phase,
        phase.startAt ? phase.startAt.toISOString().slice(0, 10) : null,
        phase.endAt ? phase.endAt.toISOString().slice(0, 10) : null,
        phase.currentPrice,
        phase.priceNote
      ]
    );
  }
}

export async function getStandardKinoTicket(pool) {
  const { rows } = await pool.query(
    `SELECT id,
            base_price,
            created_at,
            updated_at
     FROM standard_kino_ticket
     ORDER BY id DESC
     LIMIT 1`
  );
  const ticket = rows[0];
  if (!ticket) return null;

  const { rows: phases } = await pool.query(
    `SELECT id,
            standard_ticket_id,
            phase,
            start_at,
            end_at,
            current_price,
            price_note
     FROM standard_kino_ticket_price_phases
     WHERE standard_ticket_id = $1
     ORDER BY start_at ASC NULLS LAST, id ASC`,
    [ticket.id]
  );

  return {
    ...ticket,
    phases,
    pricing: resolveActivePhase(phases)
  };
}

export async function upsertStandardKinoTicket(pool, { basePrice, phases }) {
  const { rows } = await pool.query(
    'SELECT id FROM standard_kino_ticket ORDER BY id DESC LIMIT 1'
  );
  let ticketId = rows[0]?.id;
  if (ticketId) {
    await pool.query(
      `UPDATE standard_kino_ticket
       SET base_price = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [basePrice, ticketId]
    );
  } else {
    const insert = await pool.query(
      `INSERT INTO standard_kino_ticket (base_price)
       VALUES ($1)
       RETURNING id`,
      [basePrice]
    );
    ticketId = insert.rows[0]?.id;
  }

  if (ticketId) {
    await replaceStandardKinoTicketPhases(pool, ticketId, phases);
  }

  return ticketId;
}