import PDFDocument from 'pdfkit';
import { SITE } from '../config/siteConfig.js';

const DEFAULT_EXEMPTION_TEXT = 'Wir sind wegen Förderung von Kunst und Kultur nach dem letzten uns zugegangenen Freistellungsbescheid gemäß § 5 Abs. 1 Nr. 9 KStG von der Körperschaftsteuer befreit.';

const LOCALE_LABELS = {
  de: {
    title: 'Spendenquittung (Zuwendungsbestätigung)',
    subtitle: 'Bestätigung über Geldzuwendung',
    receiptLabel: 'Belegnummer',
    dateLabel: 'Datum der Spende',
    donorTitle: 'Spender/in',
    recipientTitle: 'Empfänger',
    amountLabel: 'Betrag der Zuwendung',
    currencySuffix: 'EUR',
    purposeLabel: 'Zweck der Zuwendung',
    purposeText: 'Unterstützung des Kurdischen Festivals',
    benefitLine: 'Es wurde keine Gegenleistung für die Zuwendung erbracht.',
    taxOfficeLabel: 'Finanzamt',
    taxIdLabel: 'Steuernummer',
    exemptLabel: 'Gemeinnützigkeit',
    signatureLabel: 'Ort, Datum und Unterschrift',
    footerLine: 'Diese Bescheinigung ist zur Vorlage beim Finanzamt bestimmt.'
  },
  en: {
    title: 'Donation receipt',
    subtitle: 'Confirmation of monetary donation',
    receiptLabel: 'Receipt number',
    dateLabel: 'Donation date',
    donorTitle: 'Donor',
    recipientTitle: 'Recipient',
    amountLabel: 'Donation amount',
    currencySuffix: 'EUR',
    purposeLabel: 'Purpose',
    purposeText: 'Support for the Kurdish Festival',
    benefitLine: 'No goods or services were provided in return for this donation.',
    taxOfficeLabel: 'Tax office',
    taxIdLabel: 'Tax number',
    exemptLabel: 'Non-profit status',
    signatureLabel: 'Place, date and signature',
    footerLine: 'This receipt is intended to be submitted to the tax office.'
  },
  ku: {
    title: 'Biheqîna bexşînê',
    subtitle: 'Pêşniyarê bexşîna pereyî',
    receiptLabel: 'Hejmara belgeyê',
    dateLabel: 'Dîroka bexşê',
    donorTitle: 'Bexşker',
    recipientTitle: 'Wergir',
    amountLabel: 'Mîqdara bexşê',
    currencySuffix: 'EUR',
    purposeLabel: 'Armanc',
    purposeText: 'Piştgiriya Festîvala Kurdî',
    benefitLine: 'Ji bo vê bexşê ti tiştên vegerî nehatin dayîn.',
    taxOfficeLabel: 'Daireya bacê',
    taxIdLabel: 'Hejmara bacê',
    exemptLabel: 'Rewşa xêrxwaziyê',
    signatureLabel: 'Cih, dîrok û îmze',
    footerLine: 'Ev belge ji bo pêşkêşkirinê li daireya bacê ye.'
  }
};

function resolveIssuer() {
  const org = SITE.organization || {};
  const address = org.address || {};
  return {
    name: process.env.DONATION_ORG_NAME || org.name || 'Kurdisches Filmfestival',
    street: process.env.DONATION_ORG_STREET || address.streetAddress || '',
    postalCode: process.env.DONATION_ORG_POSTAL_CODE || address.postalCode || '',
    city: process.env.DONATION_ORG_CITY || address.addressLocality || '',
    country: process.env.DONATION_ORG_COUNTRY || address.addressCountry || '',
    taxId: process.env.DONATION_TAX_ID || '',
    taxOffice: process.env.DONATION_TAX_OFFICE || '',
    exemptionText: process.env.DONATION_EXEMPTION_TEXT || DEFAULT_EXEMPTION_TEXT,
    signatureName: process.env.DONATION_SIGNATURE_NAME || org.name || 'Kurdisches Filmfestival'
  };
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function buildReceiptNumber(donation) {
  const year = new Date(donation.created_at || Date.now()).getFullYear();
  return `SP-${year}-${String(donation.id).padStart(5, '0')}`;
}

export async function generateDonationReceiptPdf({ donation, locale = 'de' }) {
  const labels = LOCALE_LABELS[locale] || LOCALE_LABELS.de;
  const issuer = resolveIssuer();
  const doc = new PDFDocument({ size: 'A4', margin: 54 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const receiptNumber = buildReceiptNumber(donation);
  const amountText = donation.amount_total
    ? `${Number(donation.amount_total).toFixed(2)} ${labels.currencySuffix}`
    : '';

  doc.fontSize(20).fillColor('#111111').text(labels.title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#374151').text(labels.subtitle, { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor('#111111');
  doc.text(`${labels.receiptLabel}: ${receiptNumber}`);
  doc.text(`${labels.dateLabel}: ${formatDate(donation.created_at)}`);
  doc.moveDown();

  doc.fontSize(12).text(labels.recipientTitle, { underline: true });
  doc.fontSize(11).text(issuer.name);
  doc.text(`${issuer.street}`);
  doc.text(`${issuer.postalCode} ${issuer.city}`);
  if (issuer.country) doc.text(issuer.country);
  doc.moveDown(0.75);

  doc.fontSize(12).text(labels.donorTitle, { underline: true });
  doc.fontSize(11).text(`${donation.first_name} ${donation.last_name}`);
  doc.text(donation.address_line1);
  if (donation.address_line2) doc.text(donation.address_line2);
  doc.text(`${donation.postal_code} ${donation.city}`);
  doc.text(donation.country);
  doc.moveDown(0.75);

  doc.fontSize(12).text(labels.amountLabel, { underline: true });
  doc.fontSize(11).text(amountText);
  doc.moveDown(0.5);

  doc.fontSize(12).text(labels.purposeLabel, { underline: true });
  doc.fontSize(11).text(labels.purposeText);
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor('#111111').text(labels.benefitLine);
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor('#111111');
  doc.text(`${labels.taxOfficeLabel}: ${issuer.taxOffice || '—'}`);
  doc.text(`${labels.taxIdLabel}: ${issuer.taxId || '—'}`);
  doc.moveDown(0.25);
  doc.text(`${labels.exemptLabel}: ${issuer.exemptionText}`);
  doc.moveDown(1.5);

  doc.fontSize(10).fillColor('#111111');
  doc.text(labels.signatureLabel);
  doc.moveDown(0.5);
  doc.text(issuer.signatureName);
  doc.moveDown(1.5);

  doc.fontSize(9).fillColor('#6b7280').text(labels.footerLine, { align: 'center' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}