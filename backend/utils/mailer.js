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

function isGmailConfig(config) {
  const host = String(config.host || '').toLowerCase();
  const username = String(config.username || '').toLowerCase();
  return host.includes('gmail.com') || username.endsWith('@gmail.com');
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
let cachedVerifiedTransportKey = '';

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
    const gmailConfig = isGmailConfig(config);

    const transportOptions = {
      secure: config.secure,
      requireTLS: config.startTlsEnabled,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      tls: {
        minVersion: 'TLSv1.2',
      },
    };

    if (gmailConfig) {
      transportOptions.service = 'gmail';
    } else {
      transportOptions.host = config.host;
      transportOptions.port = config.port;
    }

    if (config.smtpAuth) {
      transportOptions.auth = {
        user: config.username,
        pass: config.password,
      };
    }

    cachedTransporter = nodemailer.createTransport(transportOptions);
    cachedTransportKey = transportKey;
    cachedVerifiedTransportKey = '';
  }

  return cachedTransporter;
}

async function getVerifiedTransporter(config) {
  const transporter = getTransporter(config);
  if (cachedVerifiedTransportKey !== cachedTransportKey) {
    await transporter.verify();
    cachedVerifiedTransportKey = cachedTransportKey;
  }

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const config = getMailConfig();

  if (!isMailConfigured(config)) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM.');
  }

  const transporter = await getVerifiedTransporter(config);

  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html,
  });

  if (!Array.isArray(info.accepted) || info.accepted.length === 0) {
    throw new Error('SMTP did not accept recipient address.');
  }

  if (Array.isArray(info.rejected) && info.rejected.length > 0) {
    throw new Error(`SMTP rejected recipient(s): ${info.rejected.join(', ')}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[MAIL] delivered messageId=${info.messageId || 'n/a'} to=${info.accepted.join(', ')}`);
  }

  return info;
}

module.exports = {
  getMailConfig,
  isMailConfigured,
  sendMail,
};
