import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export async function generateCinemaTicketPdf({
  festivalName,
  attendeeName,
  ticketCode,
  backgroundImagePath,
  localeText
}) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const headerImage = resolveAsset(backgroundImagePath);
  if (headerImage) {
    doc.image(headerImage, 0, 0, { width: doc.page.width, height: 160 });
  }

  doc.moveDown(6);
  doc.fontSize(22).fillColor('#111111').text(festivalName, { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(16).fillColor('#111111').text(attendeeName);
  doc.moveDown();

  const qrDataUrl = await QRCode.toDataURL(ticketCode);
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  doc.image(qrBuffer, doc.page.width - 180, 220, { width: 120, height: 120 });

  doc.fontSize(12).fillColor('#111111');
  doc.text(`${localeText.codeLabel}: ${ticketCode}`);
  doc.moveDown(0.75);
  doc.text(localeText.notice, { width: 360 });
  doc.moveDown();
  doc.text(localeText.funLine, { width: 360 });
  doc.moveDown(2);
  if (localeText.contactLine) {
    doc.fontSize(10).fillColor('#6b7280').text(localeText.contactLine);
  }

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function resolveAsset(assetPath) {
  if (!assetPath) return null;
  const absolute = assetPath.startsWith('/')
    ? path.join(process.cwd(), assetPath)
    : assetPath;
  if (fs.existsSync(absolute)) return absolute;
  return null;
}