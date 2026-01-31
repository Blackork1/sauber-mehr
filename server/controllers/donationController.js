import { getStripe } from '../services/stripeService.js';
import {
  createDonation,
  updateDonationStripeSession
} from '../services/donationService.js';

function parseAmount(value) {
  const normalized = String(value || '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function sanitizeText(value) {
  return String(value || '').trim();
}

export async function createDonationCheckoutSession(req, res, next) {
  try {
    const pool = req.app.get('db');
    const {
      donation_amount: amountInput,
      first_name: firstNameInput,
      last_name: lastNameInput,
      email: emailInput,
      address_line1: addressLine1Input,
      address_line2: addressLine2Input,
      postal_code: postalCodeInput,
      city: cityInput,
      country: countryInput,
      donation_locale: localeInput
    } = req.body || {};

    const amount = parseAmount(amountInput);
    const firstName = sanitizeText(firstNameInput);
    const lastName = sanitizeText(lastNameInput);
    const email = sanitizeText(emailInput).toLowerCase();
    const addressLine1 = sanitizeText(addressLine1Input);
    const addressLine2 = sanitizeText(addressLine2Input);
    const postalCode = sanitizeText(postalCodeInput);
    const city = sanitizeText(cityInput);
    const country = sanitizeText(countryInput);
    const locale = ['de', 'en', 'ku'].includes(localeInput) ? localeInput : 'de';

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Bitte wähle einen gültigen Spendenbetrag aus.' });
    }
    if (!firstName || !lastName || !email || !addressLine1 || !postalCode || !city || !country) {
      return res.status(400).json({ error: 'Bitte fülle alle Pflichtfelder aus.' });
    }

    const donation = await createDonation(pool, {
      firstName,
      lastName,
      email,
      addressLine1,
      addressLine2: addressLine2 || null,
      postalCode,
      city,
      country,
      locale,
      amountTotal: amount,
      currency: 'eur'
    });

    const stripe = getStripe();
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        buildLineItem('Spende Kurdisches Festival', amount, 1)
      ],
      success_url: `${baseUrl}/donation/success`,
      cancel_url: `${baseUrl}/donation/cancel`,
      metadata: {
        donationId: String(donation.id),
        locale
      }
    });

    await updateDonationStripeSession(pool, donation.id, session.id);

    return res.json({ url: session.url });
  } catch (err) {
    return next(err);
  }
}

export function renderDonationSuccess(req, res) {
  return res.render('pages/donation-success');
}

export function renderDonationCancel(req, res) {
  return res.render('pages/donation-cancel');
}

function buildLineItem(name, price, quantity) {
  const amount = Math.round(Number(price) * 100);
  return {
    price_data: {
      currency: 'eur',
      product_data: { name },
      unit_amount: amount
    },
    quantity
  };
}