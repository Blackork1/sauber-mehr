import Stripe from 'stripe';

let stripeClient = null;

export function getStripe() {
  if (!stripeClient) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error('STRIPE_SECRET_KEY fehlt.');
    }
    stripeClient = new Stripe(secret, { apiVersion: '2024-06-20' });
  }
  return stripeClient;
}