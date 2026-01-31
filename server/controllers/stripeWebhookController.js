import path from 'path';
import { fileURLToPath } from 'url';
import { getStripe } from '../services/stripeService.js';
import {
  getDonationById,
  markDonationPaid
} from '../services/donationService.js';
import {
  getOrderById,
  getAttendeesByOrder,
  assignTicketCodes,
  createOnlineAccessCode,
  markOrderPaid,
  markPdfSent
} from '../services/ticketOrderService.js';
import { generateCinemaTicketPdf } from '../services/ticketPdfService.js';
import { generateDonationReceiptPdf } from '../services/donationReceiptService.js';
import { sendDonationMail, sendTicketPurchaseMail } from '../services/mailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ticketBackground = path.join(__dirname, '..', 'public', 'images', 'background.png');

export async function handleStripeWebhook(req, res) {
  const stripe = getStripe();
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'checkout.session.completed') {
    return res.json({ received: true });
  }

  const session = event.data.object;
  if (session.payment_status && session.payment_status !== 'paid') {
    return res.json({ received: true });
  }


  const donationId = Number(session.metadata?.donationId);
  if (Number.isFinite(donationId)) {
    const pool = req.app.get('db');
    const donation = await getDonationById(pool, donationId);
    if (!donation || donation.status === 'paid') {
      return res.json({ received: true });
    }

    const amountTotal = session.amount_total ? session.amount_total / 100 : null;
    await markDonationPaid(pool, donationId, {
      paymentIntentId: session.payment_intent,
      amountTotal,
      currency: session.currency || 'eur'
    });

    const receiptDonation = {
      ...donation,
      amount_total: amountTotal ?? donation.amount_total
    };

    const receiptPdf = await generateDonationReceiptPdf({
      donation: receiptDonation,
      locale: donation.locale || session.metadata?.locale || 'de'
    });

    await sendDonationMail({
      to: donation.email,
      firstName: donation.first_name,
      locale: donation.locale || session.metadata?.locale || 'de',
      receiptPdf
    });

    return res.json({ received: true });
  }

  const orderId = Number(session.metadata?.orderId);
  if (!Number.isFinite(orderId)) {
    return res.json({ received: true });
  }

  const pool = req.app.get('db');
  const order = await getOrderById(pool, orderId);
  if (!order || order.status === 'paid') {
    return res.json({ received: true });
  }

  await markOrderPaid(pool, orderId, {
    paymentIntentId: session.payment_intent,
    amountTotal: session.amount_total ? session.amount_total / 100 : null,
    currency: session.currency || 'eur'
  });

  const attendees = await getAttendeesByOrder(pool, orderId);
  const updatedAttendees = await assignTicketCodes(pool, orderId, attendees);

  let onlineCode = null;
  if (['online', 'combo'].includes(order.ticket_type)) {
    onlineCode = await createOnlineAccessCode(pool, orderId, order.customer_email);
  }

  const localeText = {
    codeLabel: 'Ticket-Code',
    notice: 'Das Ticket ist an die oben genannte Person gebunden. Für den Eintritt muss ein Ausweis vorgezeigt werden. Bei Problemen kontaktieren sie uns per Mail info@mitosfilm.com',
    contactLine: '',
    funLine: 'Viel Spaß im Kino Babylon Berlin'
  };

  const cinemaTickets = [];
  for (const attendee of updatedAttendees) {
    const pdfBuffer = await generateCinemaTicketPdf({
      festivalName: 'Kurdisches Festival 2026',
      attendeeName: `${attendee.first_name} ${attendee.last_name}`,
      ticketCode: attendee.ticket_code,
      backgroundImagePath: ticketBackground,
      localeText
    });
    cinemaTickets.push({
      filename: `kino-ticket-${attendee.ticket_code}.pdf`,
      pdfBuffer
    });
  }

  if (cinemaTickets.length) {
    await markPdfSent(pool, updatedAttendees.map((attendee) => attendee.id));
  }

  await sendTicketPurchaseMail({
    to: order.customer_email,
    buyerName: order.customer_name,
    ticketType: order.ticket_type,
    onlineCode,
    cinemaTickets
  });

  return res.json({ received: true });
}