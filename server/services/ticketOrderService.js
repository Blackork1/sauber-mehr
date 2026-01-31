import { generateReadableCode } from '../util/codeGenerator.js';

export async function createTicketOrder(pool, data) {
  const { rows } = await pool.query(
    `INSERT INTO ticket_orders (
      ticket_type,
      status,
      customer_name,
      customer_email,
      kino_quantity
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
    [
      data.ticketType,
      data.status || 'pending',
      data.customerName,
      data.customerEmail,
      data.kinoQuantity || 0
    ]
  );
  return rows[0];
}

export async function insertTicketAttendees(pool, orderId, attendees = []) {
  if (!orderId || !attendees.length) return [];
  const insertValues = attendees.map((attendee, index) => {
    const baseIndex = index * 2;
    return `($1, $${baseIndex + 2}, $${baseIndex + 3})`;
  });
  const params = [orderId];
  attendees.forEach((attendee) => {
    params.push(attendee.firstName);
    params.push(attendee.lastName);
  });

  const { rows } = await pool.query(
    `INSERT INTO ticket_order_attendees (order_id, first_name, last_name)
     VALUES ${insertValues.join(', ')}
     RETURNING id, first_name, last_name`,
    params
  );
  return rows;
}

export async function updateOrderStripeSession(pool, orderId, sessionId) {
  await pool.query(
    `UPDATE ticket_orders
     SET stripe_session_id = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [sessionId, orderId]
  );
}

export async function markOrderPaid(pool, orderId, { paymentIntentId, amountTotal, currency }) {
  await pool.query(
    `UPDATE ticket_orders
     SET status = 'paid',
         stripe_payment_intent_id = $1,
         amount_total = $2,
         currency = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [paymentIntentId, amountTotal, currency, orderId]
  );
}

export async function getOrderById(pool, orderId) {
  const { rows } = await pool.query(
    `SELECT id,
            ticket_type,
            status,
            customer_name,
            customer_email,
            kino_quantity,
            stripe_session_id,
            stripe_payment_intent_id
     FROM ticket_orders
     WHERE id = $1`,
    [orderId]
  );
  return rows[0] || null;
}

export async function getAttendeesByOrder(pool, orderId) {
  const { rows } = await pool.query(
    `SELECT id,
            first_name,
            last_name,
            ticket_code
     FROM ticket_order_attendees
     WHERE order_id = $1
     ORDER BY id ASC`,
    [orderId]
  );
  return rows;
}

export async function assignTicketCodes(pool, orderId, attendees) {
  const updates = [];
  for (const attendee of attendees) {
    const code = await generateUniqueCode(pool, 'KINO');
    updates.push(pool.query(
      `UPDATE ticket_order_attendees
       SET ticket_code = $1,
           qr_code_data = $2
       WHERE id = $3`,
      [code, code, attendee.id]
    ));
    attendee.ticket_code = code;
  }
  await Promise.all(updates);
  return attendees;
}

export async function createOnlineAccessCode(pool, orderId, email) {
  const code = await generateUniqueCode(pool, 'ONLINE');
  const { rows } = await pool.query(
    `INSERT INTO online_access_codes (order_id, code, email)
     VALUES ($1, $2, $3)
     RETURNING code`,
    [orderId, code, email]
  );
  return rows[0]?.code || code;
}

export async function createOnlineAccessCodeAdmin(pool, { orderId = null, email }) {
  const code = await generateUniqueCode(pool, 'ONLINE');
  const { rows } = await pool.query(
    `INSERT INTO online_access_codes (order_id, code, email)
     VALUES ($1, $2, $3)
     RETURNING id, code`,
    [orderId, code, email]
  );
  return rows[0] || { code };
}

export async function deleteOnlineAccessCode(pool, codeId) {
  await pool.query(
    'DELETE FROM online_access_codes WHERE id = $1',
    [codeId]
  );
}

export async function getOnlineAccessCodes(pool) {
  const { rows } = await pool.query(
    `SELECT online_access_codes.id,
            online_access_codes.order_id,
            online_access_codes.code,
            online_access_codes.email,
            online_access_codes.redeemed_at,
            online_access_codes.redeemed_by_user_id,
            online_access_codes.created_at,
            users.email AS redeemed_by_email,
            users.first_name AS redeemed_by_first_name,
            users.last_name AS redeemed_by_last_name
     FROM online_access_codes
     LEFT JOIN users
       ON users.id = online_access_codes.redeemed_by_user_id
     ORDER BY online_access_codes.created_at DESC, online_access_codes.id DESC`
  );
  return rows;
}

export async function getTicketOrdersAdminOverview(pool) {
  const [ordersResult, attendeesResult, accessCodesResult] = await Promise.all([
    pool.query(
      `SELECT id,
              ticket_type,
              status,
              customer_name,
              customer_email,
              kino_quantity,
              amount_total,
              currency,
              created_at
       FROM ticket_orders
       ORDER BY created_at DESC, id DESC`
    ),
    pool.query(
      `SELECT order_id,
              first_name,
              last_name,
              ticket_code
       FROM ticket_order_attendees
       ORDER BY id ASC`
    ),
    pool.query(
      `SELECT order_id,
              code,
              redeemed_at
       FROM online_access_codes
       ORDER BY created_at DESC, id DESC`
    )
  ]);

  return {
    orders: ordersResult.rows || [],
    attendees: attendeesResult.rows || [],
    accessCodes: accessCodesResult.rows || []
  };
}

async function generateUniqueCode(pool, prefix) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReadableCode(prefix);
    const { rows } = await pool.query(
      'SELECT 1 FROM online_access_codes WHERE code = $1 UNION SELECT 1 FROM ticket_order_attendees WHERE ticket_code = $1',
      [code]
    );
    if (!rows.length) return code;
  }
  return generateReadableCode(prefix);
}

export async function markPdfSent(pool, attendeeIds = []) {
  if (!attendeeIds.length) return;
  await pool.query(
    `UPDATE ticket_order_attendees
     SET pdf_sent = TRUE
     WHERE id = ANY($1::int[])`,
    [attendeeIds]
  );
}

export async function redeemOnlineAccessCode(pool, { code, userId }) {
  const { rows } = await pool.query(
    `UPDATE online_access_codes
     SET redeemed_at = NOW(),
         redeemed_by_user_id = $1
     WHERE code = $2
       AND redeemed_at IS NULL
     RETURNING id`,
    [userId, code]
  );
  return rows[0] || null;
}

export async function setUserOnlineAccess(pool, userId) {
  await pool.query(
    'UPDATE users SET has_online_ticket = TRUE WHERE id = $1',
    [userId]
  );
}