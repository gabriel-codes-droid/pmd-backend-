const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

async function sendViaResend(to, subject, text, html) {
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
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Resend error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

async function sendViaConsole(to, subject, text, html) {
  console.log('EMAIL NOT CONFIGURED - Would send:');
  console.log(`From: ${EMAIL_FROM}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  if (html) console.log(`HTML: ${html}`);
  return { messageId: 'console-log' };
}

async function sendEmail({ to, subject, text, html }) {
  try {
    if (RESEND_API_KEY) {
      const result = await sendViaResend(to, subject, text, html);
      console.log(`Email sent to ${to} (id: ${result.id})`);
      return result;
    }
    await sendViaConsole(to, subject, text, html);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

function generateDigestHTML(notifications, username) {
  const dangerNotifs = notifications.filter(n => n.type === 'danger');
  const warningNotifs = notifications.filter(n => n.type === 'warning');
  const successNotifs = notifications.filter(n => n.type === 'success');
  const infoNotifs = notifications.filter(n => n.type === 'info');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; margin-bottom: 10px; color: #555; }
        .notification { padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid; }
        .danger { background: #fee; border-color: #f44; }
        .warning { background: #ffd; border-color: #fa0; }
        .success { background: #efe; border-color: #4a4; }
        .info { background: #eef; border-color: #44f; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Personal Management Dashboard</h1>
          <p>Daily Digest for ${username}</p>
        </div>
        <div class="content">
          ${dangerNotifs.length > 0 ? `
            <div class="section">
              <div class="section-title">🚨 Urgent Alerts (${dangerNotifs.length})</div>
              ${dangerNotifs.map(n => `
                <div class="notification danger">
                  <strong>${n.icon}</strong> ${n.message}
                  <br><small>${n.timestamp}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${warningNotifs.length > 0 ? `
            <div class="section">
              <div class="section-title">⚠️ Warnings (${warningNotifs.length})</div>
              ${warningNotifs.map(n => `
                <div class="notification warning">
                  <strong>${n.icon}</strong> ${n.message}
                  <br><small>${n.timestamp}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${successNotifs.length > 0 ? `
            <div class="section">
              <div class="section-title">✅ Achievements (${successNotifs.length})</div>
              ${successNotifs.map(n => `
                <div class="notification success">
                  <strong>${n.icon}</strong> ${n.message}
                  <br><small>${n.timestamp}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${infoNotifs.length > 0 ? `
            <div class="section">
              <div class="section-title">ℹ️ Information (${infoNotifs.length})</div>
              ${infoNotifs.map(n => `
                <div class="notification info">
                  <strong>${n.icon}</strong> ${n.message}
                  <br><small>${n.timestamp}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${notifications.length === 0 ? `
            <div class="section">
              <p>No new notifications today. Keep up the great work! 🎉</p>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>You're receiving this because you have email notifications enabled.</p>
          <p>Manage your preferences in your dashboard settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export { sendEmail, generateDigestHTML };
