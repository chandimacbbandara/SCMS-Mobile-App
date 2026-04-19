const nodemailer = require('nodemailer');

function getEnvValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function getMailConfig() {
  const host = getEnvValue('SMTP_HOST', 'MAIL_HOST', 'spring.mail.host');
  const portRaw = getEnvValue('SMTP_PORT', 'MAIL_PORT', 'spring.mail.port');
  const port = Number.parseInt(portRaw || '587', 10);

  const username = getEnvValue('SMTP_USER', 'MAIL_USERNAME', 'spring.mail.username');
  const passwordRaw = getEnvValue('SMTP_PASS', 'MAIL_PASSWORD', 'spring.mail.password');
  const password = passwordRaw.replace(/\s+/g, '');

  const smtpAuth = parseBoolean(
    getEnvValue('SMTP_AUTH', 'SPRING_MAIL_SMTP_AUTH', 'spring.mail.properties.mail.smtp.auth'),
    true
  );

  const startTlsEnabled = parseBoolean(
    getEnvValue(
      'SMTP_STARTTLS',
      'SPRING_MAIL_SMTP_STARTTLS_ENABLE',
      'spring.mail.properties.mail.smtp.starttls.enable'
    ),
    port === 587
  );

  const secure = parseBoolean(getEnvValue('SMTP_SECURE', 'MAIL_SECURE'), port === 465);

  const from = getEnvValue('MAIL_FROM', 'APP_MAIL_FROM', 'app.mail.from') || username;

  return {
    host,
    port,
    username,
    password,
    from,
    smtpAuth,
    startTlsEnabled,
    secure,
  };
}

function isMailConfigured(config = getMailConfig()) {
  if (!config.host || Number.isNaN(config.port) || !config.from) {
    return false;
  }

  if (config.smtpAuth && (!config.username || !config.password)) {
    return false;
  }

  return true;
}

let cachedTransporter = null;
let cachedTransportKey = '';

function getTransporter(config) {
  const transportKey = [
    config.host,
    config.port,
    config.username,
    config.smtpAuth,
    config.startTlsEnabled,
    config.secure,
  ].join(':');

  if (!cachedTransporter || cachedTransportKey !== transportKey) {
    const transportOptions = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.startTlsEnabled,
    };

    if (config.smtpAuth) {
      transportOptions.auth = {
        user: config.username,
        pass: config.password,
      };
    }

    cachedTransporter = nodemailer.createTransport(transportOptions);
    cachedTransportKey = transportKey;
  }

  return cachedTransporter;
}

async function sendMail({ to, subject, text, html }) {
  const config = getMailConfig();

  if (!isMailConfigured(config)) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM.');
  }

  const transporter = getTransporter(config);

  return transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  getMailConfig,
  isMailConfigured,
  sendMail,
};
