import {
  getMediaTicketById,
  getPrimaryTicketByType
} from '../services/mediaService.js';
import { getStripe } from '../services/stripeService.js';
import {
  createTicketOrder,
  insertTicketAttendees,
  updateOrderStripeSession
} from '../services/ticketOrderService.js';

import { getStandardKinoTicket } from '../services/standardKinoTicketService.js';

function parseTicketType(value) {
  const allowed = ['online', 'kino', 'combo'];
  return allowed.includes(value) ? value : null;
}

function parseQuantity(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function validateAttendees(attendees, kinoQuantity) {
  if (kinoQuantity <= 0) return [];
  if (!Array.isArray(attendees) || attendees.length !== kinoQuantity) {
    return null;
  }
  const cleaned = attendees.map((attendee) => ({
    firstName: String(attendee?.firstName || '').trim(),
    lastName: String(attendee?.lastName || '').trim()
  }));
  if (cleaned.some((attendee) => !attendee.firstName || !attendee.lastName)) {
    return null;
  }
  return cleaned;
}

export async function renderCheckoutPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const ticketId = Number(req.query?.ticketId);
    const ticket = Number.isFinite(ticketId)
      ? await getMediaTicketById(pool, ticketId)
      : null;
    const ticketType = parseTicketType(req.query?.type || ticket?.ticket_type || 'kino') || 'kino';
    const kinoTicket = await getPrimaryTicketByType(pool, 'kino', ticket?.language);
    const standardKinoTicket = await getStandardKinoTicket(pool);

    return res.render('pages/checkout', {
      ticket,
      ticketType,
      kinoTicket,
      standardKinoTicket
    });
  } catch (err) {
    return next(err);
  }
}

export async function createCheckoutSession(req, res, next) {
  try {
    const pool = req.app.get('db');
    const {
      ticketId,
      ticketType,
      buyerName,
      buyerEmail,
      kinoQuantity,
      attendees
    } = req.body || {};

    const normalizedType = parseTicketType(ticketType);
    const name = String(buyerName || '').trim();
    const email = String(buyerEmail || '').trim().toLowerCase();
    const quantity = parseQuantity(kinoQuantity, normalizedType === 'online' ? 0 : 1);

    if (!normalizedType || !name || !email) {
      return res.status(400).json({ error: 'Bitte alle Pflichtfelder ausfüllen.' });
    }

    const ticket = await getMediaTicketById(pool, Number(ticketId));
    if (!ticket || ticket.ticket_type !== normalizedType) {
      return res.status(404).json({ error: 'Ticket nicht gefunden.' });
    }

    if (normalizedType !== 'online' && (quantity < 1 || quantity > 10)) {
      return res.status(400).json({ error: 'Bitte 1 bis 10 Kinotickets auswählen.' });
    }
    if (normalizedType === 'online' && quantity !== 0) {
      return res.status(400).json({ error: 'Online-Tickets benötigen keine Kinotickets.' });
    }

    const attendeeList = validateAttendees(attendees, normalizedType === 'online' ? 0 : quantity);
    if (attendeeList === null) {
      return res.status(400).json({ error: 'Bitte alle Namen der Kinotickets angeben.' });
    }

    const order = await createTicketOrder(pool, {
      ticketType: normalizedType,
      customerName: name,
      customerEmail: email,
      kinoQuantity: normalizedType === 'online' ? 0 : quantity
    });

    if (attendeeList.length) {
      await insertTicketAttendees(pool, order.id, attendeeList);
    }

    const stripe = getStripe();
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const lineItems = [];
    const ticketPrice = Number(ticket.pricing?.current_price ?? ticket.event_price);
    const standardKinoTicket = await getStandardKinoTicket(pool);
    const standardKinoPrice = Number(
      standardKinoTicket?.pricing?.current_price ?? standardKinoTicket?.base_price
    );
    const extraTicketPriceFallback = Number.isFinite(standardKinoPrice) ? standardKinoPrice : ticketPrice;
    if (!Number.isFinite(ticketPrice)) {
      return res.status(400).json({ error: 'Ticketpreis ist ungültig.' });
    }

    if (normalizedType === 'online') {
      lineItems.push(buildLineItem(ticket.title, ticketPrice, 1));
    }

    if (normalizedType === 'kino') {
      lineItems.push(buildLineItem(ticket.title, ticketPrice, 1));
      const extraTickets = Math.max(quantity - 1, 0);
      if (extraTickets > 0) {
        lineItems.push(buildLineItem('Standard-Kinoticket', extraTicketPriceFallback, extraTickets));
      }
    }

    if (normalizedType === 'combo') {
      const kinoTicket = await getPrimaryTicketByType(pool, 'kino', ticket.language);
      const kinoTitle = kinoTicket?.title || ticket.title;
      let kinoPrice = Number(kinoTicket?.pricing?.current_price ?? kinoTicket?.event_price);
      if (Number.isFinite(standardKinoPrice)) {
        kinoPrice = standardKinoPrice;
      }
      lineItems.push(buildLineItem(ticket.title, ticketPrice, 1));
      const extraTickets = Math.max(quantity - 1, 0);
      if (extraTickets > 0) {
        if (!Number.isFinite(kinoPrice)) {
          kinoPrice = ticketPrice;
        }
        if (!Number.isFinite(kinoPrice)) {
          return res.status(400).json({ error: 'Preis für zusätzliche Kinotickets fehlt.' });
        }
        lineItems.push(buildLineItem(kinoTitle, kinoPrice, extraTickets));
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: {
        orderId: String(order.id),
        ticketType: normalizedType
      }
    });

    await updateOrderStripeSession(pool, order.id, session.id);

    return res.json({ url: session.url });
  } catch (err) {
    return next(err);
  }
}

export async function renderCheckoutSuccess(req, res) {
  return res.render('pages/checkout-success');
}

export async function renderCheckoutCancel(req, res) {
  return res.render('pages/checkout-cancel');
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