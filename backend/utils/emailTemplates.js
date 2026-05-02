const fs = require('fs');
const path = require('path');

const DEFAULT_IMAGE_PATH = path.join(__dirname, '..', '..', 'frontend', 'images', 'img3.jpeg');
let cachedImageDataUri = null;

function getInlineImageDataUri() {
  if (cachedImageDataUri !== null) {
    return cachedImageDataUri;
  }

  try {
    const imageBuffer = fs.readFileSync(DEFAULT_IMAGE_PATH);
    const base64 = imageBuffer.toString('base64');
    cachedImageDataUri = `data:image/jpeg;base64,${base64}`;
    return cachedImageDataUri;
  } catch (error) {
    cachedImageDataUri = '';
    return cachedImageDataUri;
  }
}

function buildTextEmail({ greetingName, title, lines, highlightLabel, highlightValue, footer }) {
  const safeName = String(greetingName || '').trim() || 'Student';
  const textLines = [
    `Hello ${safeName},`,
    '',
    title,
    '',
    ...(Array.isArray(lines) ? lines : []),
  ];

  if (highlightLabel && highlightValue) {
    textLines.push('', `${highlightLabel}: ${highlightValue}`);
  }

  textLines.push('', footer || 'SCMS Team');

  return textLines.join('\n');
}

function buildHtmlEmail({ greetingName, title, subtitle, lines, highlightLabel, highlightValue, footer }) {
  const safeName = String(greetingName || '').trim() || 'Student';
  const imageData = getInlineImageDataUri();

  const linesHtml = (Array.isArray(lines) ? lines : []).map((line) => `<p style="margin:0 0 10px;">${line}</p>`).join('');
  const highlightHtml = highlightLabel && highlightValue
    ? `
      <div style="margin:16px 0;padding:14px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;font-weight:700;">${highlightLabel}</div>
        <div style="font-size:22px;letter-spacing:2px;font-weight:800;color:#0f172a;margin-top:6px;">${highlightValue}</div>
      </div>
    `
    : '';

  return `
    <div style="background:#f1f5f9;padding:24px 0;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        ${imageData ? `<img src="${imageData}" alt="SCMS" style="width:100%;height:auto;display:block;" />` : ''}
        <div style="padding:24px;">
          <p style="margin:0 0 12px;color:#0f172a;font-size:16px;font-weight:600;">Hello ${safeName},</p>
          <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:800;">${title}</h2>
          ${subtitle ? `<p style="margin:0 0 16px;color:#475569;font-size:14px;">${subtitle}</p>` : ''}
          ${linesHtml}
          ${highlightHtml}
          <p style="margin:16px 0 0;color:#64748b;font-size:12px;">${footer || 'SCMS Team'}</p>
        </div>
      </div>
    </div>
  `;
}

function buildBrandedEmail({
  greetingName,
  title,
  subtitle,
  lines,
  highlightLabel,
  highlightValue,
  footer,
}) {
  return {
    text: buildTextEmail({ greetingName, title, lines, highlightLabel, highlightValue, footer }),
    html: buildHtmlEmail({ greetingName, title, subtitle, lines, highlightLabel, highlightValue, footer }),
  };
}

module.exports = {
  buildBrandedEmail,
};
