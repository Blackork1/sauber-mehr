export async function createDonation(pool, {
  firstName,
  lastName,
  email,
  addressLine1,
  addressLine2 = null,
  postalCode,
  city,
  country,
  locale = 'de',
  amountTotal,
  currency = 'eur'
}) {
  const { rows } = await pool.query(
    `INSERT INTO donations (
      first_name,
      last_name,
      email,
      address_line1,
      address_line2,
      postal_code,
      city,
      country,
      locale,
      currency,
      amount_total
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      firstName,
      lastName,
      email,
      addressLine1,
      addressLine2,
      postalCode,
      city,
      country,
      locale,
      currency,
      amountTotal
    ]
  );
  return rows[0];
}

export async function updateDonationStripeSession(pool, donationId, sessionId) {
  await pool.query(
    `UPDATE donations
     SET stripe_session_id = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [sessionId, donationId]
  );
}

export async function markDonationPaid(pool, donationId, {
  paymentIntentId,
  amountTotal,
  currency = 'eur'
}) {
  await pool.query(
    `UPDATE donations
     SET status = 'paid',
         stripe_payment_intent_id = $1,
         amount_total = COALESCE($2, amount_total),
         currency = COALESCE($3, currency),
         updated_at = NOW()
     WHERE id = $4`,
    [paymentIntentId, amountTotal, currency, donationId]
  );
}

export async function getDonationById(pool, donationId) {
  const { rows } = await pool.query(
    `SELECT *
     FROM donations
     WHERE id = $1`,
    [donationId]
  );
  return rows[0] || null;
}

export async function getDonationsAdminOverview(pool) {
  const { rows } = await pool.query(
    `SELECT *
     FROM donations
     ORDER BY created_at DESC`
  );
  return rows;
}