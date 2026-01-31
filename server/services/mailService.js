import nodemailer from "nodemailer";
import { generateICS } from "./icsService.js";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { generateToken } from "../util/bookingToken.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

export async function sendBookingMail({ to, name, appointment, type, bookingId = null }) {
  const pretty = format(new Date(appointment.start_time), "EEEE, dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de });

  const subject = {
    pending: `Terminanfrage für ${pretty} ist eingegangen`,
    confirmed: `Termin bestätigt: ${pretty}`,
    cancelled: `Termin abgesagt: ${pretty}`
  }[type];

  let actionHtml = "";
  if (type === "confirmed" && bookingId) {
    const token = generateToken(bookingId);
    const base = process.env.BASE_URL || "";
    const cancelUrl = `${base}/booking/${bookingId}/cancel/${token}`;
    const rescheduleUrl = `${base}/booking/${bookingId}/reschedule/${token}`;
    actionHtml = `<p><a href="${cancelUrl}">Termin stornieren</a> oder <a href="${rescheduleUrl}">neuen Termin anfragen</a></p>`;
  }

  const html = `
    <p>Hallo ${name}</p>
    <p>${type === "pending"
      ? `vielen Dank für Ihre Terminanfrage. Wir prüfen den Termin und melden uns in spätestens 24 Stunden zurück.`
      : type === "confirmed"
        ? `Der Termin wurde bestätigt. Ich freuen mich auf unser Gespräch! Ich werde mich zum Termin telefonisch melden.`
        : `Leider mussten wir den Termin stornieren. Bitte buchen Sie einen neuen Termin über unsere Website.`
    }</p>
    <p><strong>Termin:</strong> ${pretty}</p>
    ${actionHtml}
    <p>Beste Grüße<br>Komplettwebdesign</p>
  `;

  const mail = {
    from: '"KomplettWebdesign" <kontakt@komplettwebdesign.de>',
    to,
    subject,
    html,
    attachments: []
  };

  if (type !== "cancelled") {
    mail.attachments.push({
      filename: `Beratungstermin.ics`,
      content: generateICS(appointment, type),
      contentType: 'text/calendar; charset=utf-8; method=REQUEST'
    });
  }

  return transporter.sendMail(mail)
}

export async function sendRequestMail({ to, name }) {
  const subject = 'Deine Anfrage ist eingegangen';
  const html = `
    <p>Hallo ${name}</p>
    <p>vielen Dank für die Anfrage. Wir melden uns in Kürze bei dir.</p>
    <p>Beste Grüße<br>Komplettwebdesign</p>
  `;
  const mail = {
    from: '"KomplettWebdesign" <kontakt@komplettwebdesign.de>',
    to,
    subject,
    html
  };
  return transporter.sendMail(mail);
}


function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkifyText(value = '') {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return value.replace(urlRegex, (match) => {
    const safeUrl = escapeHtml(match);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
  });
}

function formatNewsletterSection(text = '') {
  const trimmed = String(text || '').trim();
  if (!trimmed) return '';
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (hasHtml) return trimmed;
  const escaped = escapeHtml(trimmed);
  const withLinks = linkifyText(escaped);
  const paragraphs = withLinks
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return paragraphs;
}

function resolveAbsoluteUrl(url = '') {
  const baseUrl = process.env.BASE_URL || '';
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/') && baseUrl) return `${baseUrl}${url}`;
  return url;
}

function buildNewsletterHtml({ title, content, footerHtml, footerLogoUrl, footerLogoAlt }) {
  const formattedContent = formatNewsletterSection(content);
  const formattedFooter = formatNewsletterSection(footerHtml);
  const resolvedLogo = resolveAbsoluteUrl(footerLogoUrl);
  const safeTitle = escapeHtml(title || '');
  const logoMarkup = resolvedLogo
    ? `<img src="${resolvedLogo}" alt="${escapeHtml(footerLogoAlt || 'Newsletter Logo')}" class="footer-logo">`
    : '';

  return `
    <!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { margin: 0; padding: 0; background: #f4f5f7; font-family: "Helvetica Neue", Arial, sans-serif; color: #111827; }
          .wrapper { padding: 32px 12px; }
          .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08); }
          .title { font-size: 24px; margin: 0 0 18px; color: #111827; }
          .content { font-size: 16px; line-height: 1.7; color: #1f2937; }
          .content p { margin: 0 0 16px; }
          .content a { color: #d13e3e; text-decoration: none; font-weight: 600; }
          .content a:hover { text-decoration: underline; }
          .footer { margin-top: 28px; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; text-align: center; }
          .footer-logo { max-width: 140px; margin: 0 auto 12px; display: block; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            ${safeTitle ? `<h1 class="title">${safeTitle}</h1>` : ''}
            <div class="content">${formattedContent}</div>
            ${(formattedFooter || logoMarkup) ? `
            <div class="footer">
              ${logoMarkup}
              ${formattedFooter}
            </div>
            ` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendNewsletterMail({
  to,
  subject,
  title,
  content,
  footerHtml = '',
  footerLogoUrl = '',
  footerLogoAlt = ''
}) {
  const fromAddress = process.env.NEWSLETTER_FROM
    || process.env.SMTP_FROM
    || '"Kurdisches Filmfestival" <info@mitosfilm.com>';
  const html = buildNewsletterHtml({ title, content, footerHtml, footerLogoUrl, footerLogoAlt });
  const mail = {
    from: fromAddress,
    to,
    subject: subject || title,
    html
  };
  return transporter.sendMail(mail);
}

function getNewsletterConfirmationSummary({ wantsNews, wantsVideo }) {
  if (wantsNews && wantsVideo) {
    return 'Anmeldung für Video und News erfolgreich.';
  }
  if (wantsVideo) {
    return 'Anmeldung für Video-News erfolgreich.';
  }
  return 'Anmeldung für News erfolgreich.';
}

function buildNewsletterConfirmationHtml({
  wantsNews,
  wantsVideo,
  unsubscribeUrl,
  unsubscribeCode
}) {
  const summary = getNewsletterConfirmationSummary({ wantsNews, wantsVideo });
  const safeCode = escapeHtml(unsubscribeCode || '');
  const actionRow = unsubscribeUrl
    ? `<p><a href="${escapeHtml(unsubscribeUrl)}" class="button">Jetzt abmelden</a></p>`
    : '';

  return `
    <!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { margin: 0; padding: 0; background: #f4f5f7; font-family: "Helvetica Neue", Arial, sans-serif; color: #111827; }
          .wrapper { padding: 32px 12px; }
          .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08); }
          .title { font-size: 24px; margin: 0 0 18px; color: #111827; }
          .content { font-size: 16px; line-height: 1.7; color: #1f2937; }
          .content p { margin: 0 0 16px; }
          .button { display: inline-block; padding: 10px 18px; border-radius: 999px; background: #d13e3e; color: #ffffff; text-decoration: none; font-weight: 600; }
          .code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; background: #f1f5f9; padding: 6px 10px; border-radius: 8px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <h1 class="title">Danke für deine Anmeldung!</h1>
            <div class="content">
              <p>${summary}</p>
              <p>Wir freuen uns, dich im Newsletter begrüßen zu dürfen.</p>
              <p>Dein Abmeldecode: <span class="code">${safeCode}</span></p>
              ${actionRow}
              <p>Wenn du keine News mehr erhalten möchtest, kannst du dich jederzeit mit dem Abmeldecode abmelden.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendNewsletterConfirmationMail({
  to,
  wantsNews,
  wantsVideo,
  unsubscribeUrl,
  unsubscribeCode
}) {
  const fromAddress = process.env.NEWSLETTER_FROM
    || process.env.SMTP_FROM
    || '"Kurdisches Filmfestival" <info@mitosfilm.com>';
  const subject = 'Newsletter-Anmeldung bestätigt';
  const html = buildNewsletterConfirmationHtml({
    wantsNews,
    wantsVideo,
    unsubscribeUrl,
    unsubscribeCode
  });
  return transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html
  });
}

export async function sendTicketPurchaseMail({
  to,
  buyerName,
  ticketType,
  onlineCode,
  cinemaTickets = []
}) {
  const fromAddress = process.env.SMTP_FROM
    || '"Kurdisches Filmfestival" <info@mitosfilm.com>';
  const intro = buyerName ? `Hallo ${buyerName},` : 'Hallo,';
  const onlineSection = onlineCode
    ? `<p><strong>Online-Zugangscode:</strong> ${onlineCode}</p>
       <p>Logge dich auf der Website ein und gib den Code unter <a href="${process.env.BASE_URL || ''}/online-access">Online-Zugang freischalten</a> ein.</p>`
    : '';
  const cinemaSection = cinemaTickets.length
    ? `<p>Im Anhang findest du deine Kino-Tickets als PDF.</p>`
    : '';

  const html = `
    <p>${intro}</p>
    <p>vielen Dank für deinen Kauf des ${ticketType === 'combo' ? 'Kombi-Tickets' : ticketType === 'kino' ? 'Kino-Tickets' : 'Online-Tickets'}.</p>
    ${onlineSection}
    ${cinemaSection}
    <p>Bei Fragen erreichst du uns jederzeit unter info@mitosfilm.com.</p>
  `;

  const attachments = cinemaTickets.map((ticket) => ({
    filename: ticket.filename,
    content: ticket.pdfBuffer,
    contentType: 'application/pdf'
  }));

  return transporter.sendMail({
    from: fromAddress,
    to,
    subject: 'Deine Tickets – Kurdisches Festival 2026',
    html,
    attachments
  });
}

export async function sendDonationMail({
  to,
  firstName,
  locale = 'de',
  receiptPdf
}) {
  const fromAddress = process.env.SMTP_FROM
    || '"Kurdisches Filmfestival" <info@mitosfilm.com>';

  const copyByLocale = {
    de: {
      subject: 'Vielen Dank für deine Spende',
      greeting: `Hallo ${firstName || 'liebe*r Unterstützer*in'},`,
      body: 'vielen Dank für deine Spende und dafür, dass du unser Kurdisches Festival unterstützt hast. Damit können wir auch zukünftige Festivals realisieren, neue Dinge schaffen und unser Programm weiterentwickeln.',
      closing: 'Im Anhang findest du deine Spendenquittung als PDF.'
    },
    en: {
      subject: 'Thank you for your donation',
      greeting: `Hello ${firstName || 'dear supporter'},`,
      body: 'thank you for your donation and for supporting our Kurdish Festival. With your help we can realize future festivals, create new projects and continue to grow our program.',
      closing: 'Attached you will find your donation receipt as a PDF.'
    },
    ku: {
      subject: 'Spas ji bo bexşê te',
      greeting: `Silav ${firstName || 'hevalê me'},`,
      body: 'spas ji bo bexşê te û ji bo piştgiriya Festîvala Kurdî. Bi alîkariya te em dikarin festîvalên paşerojê bi pêk bînin, tiştên nû çêkin û bernameya xwe pêş bikin.',
      closing: 'Di pêvekirinê de tu wê bexşên xwe ya PDF bistînî.'
    }
  };

  const copy = copyByLocale[locale] || copyByLocale.de;
  const html = `
    <p>${copy.greeting}</p>
    <p>${copy.body}</p>
    <p>${copy.closing}</p>
  `;

  return transporter.sendMail({
    from: fromAddress,
    to,
    subject: copy.subject,
    html,
    attachments: receiptPdf
      ? [
        {
          filename: 'spendenquittung.pdf',
          content: receiptPdf,
          contentType: 'application/pdf'
        }
      ]
      : []
  });
}