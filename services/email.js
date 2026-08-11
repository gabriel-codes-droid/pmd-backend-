const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendViaResend(to, subject, text) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Resend error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

async function sendViaConsole(to, subject, text) {
  console.log('EMAIL NOT CONFIGURED - Would send:');
  console.log(`From: ${EMAIL_FROM}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  return { messageId: 'console-log' };
}

async function sendEmail({ to, subject, text }) {
  try {
    if (RESEND_API_KEY) {
      const result = await sendViaResend(to, subject, text);
      console.log(`Email sent to ${to} (id: ${result.id})`);
      return result;
    }
    await sendViaConsole(to, subject, text);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

module.exports = { sendEmail };
