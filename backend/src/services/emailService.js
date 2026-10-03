const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Auto-load .env file from backend or root directory
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend', '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const idx = trimmed.indexOf('=');
            const key = trimmed.substring(0, idx).trim();
            const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (key && !process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      } catch (e) {
        console.error('Error reading .env file:', e.message);
      }
    }
  }
}

loadEnv();

/**
 * Create Nodemailer Transporter based on SMTP configuration
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return null;
}

/**
 * Send HTML Email Helper
 * Dispatches emails via real SMTP if credentials exist in .env, otherwise logs cleanly in simulation mode.
 */
async function sendMail({ to, subject, html, text }) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || (process.env.SMTP_USER ? `"iQue Startup Pods" <${process.env.SMTP_USER}>` : `"iQue Startup Pods" <no-reply@ique.com>`);

  if (transporter) {
    try {
      console.log(`✉️ [SMTP DISPATCH] Sending outbound email via ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587} to: ${to}...`);
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: text || '',
        html: html || ''
      });
      console.log(`✅ [SMTP SUCCESS] Email delivered successfully to ${to}! Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (error) {
      console.error(`❌ [SMTP FAILURE] Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message, simulated: false };
    }
  }

  // Fallback simulation log if SMTP env vars are not set
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SIMULATION LOG - SMTP NOT CONFIGURED IN .ENV]`);
  console.log(`   To: ${to}`);
  console.log(`   From: ${from}`);
  console.log(`   Subject: ${subject}`);
  console.log(`------------------------------------------------------`);
  console.log(text || html);
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
}

/**
 * Send Booking Submission Receipt Email (Sent immediately when any user books a pod)
 */
async function sendBookingSubmissionEmail({ toEmail, hrName, companyName, bookingCode, cabinName, cabinLocation, date, startTime, endTime, purpose, peopleCount, isAutoApproved }) {
  const statusTitle = isAutoApproved ? 'CONFIRMED' : 'PENDING APPROVAL';
  const subject = `📌 ${statusTitle}: Pod Booking ${bookingCode} (${cabinName})`;
  const text = `Hello ${hrName || 'User'},\n\nYour booking request ${bookingCode} for ${companyName} has been received.\n\nPod: ${cabinName} (${cabinLocation || 'Bengaluru Facility'})\nDate: ${date}\nTime Slot: ${startTime} - ${endTime}\nMeeting Purpose: ${purpose}\nStatus: ${statusTitle}\n\nThank you for using iQue Startup Pods!`;

  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
      <div style="background: ${isAutoApproved ? '#2563eb' : '#0f172a'}; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">iQue Startup Pods</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Bengaluru Facility • ${isAutoApproved ? 'Booking Confirmed' : 'Booking Request Received'}</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: ${isAutoApproved ? '#dcfce7' : '#fef3c7'}; border: 1px solid ${isAutoApproved ? '#bbf7d0' : '#fcd34d'}; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; color: ${isAutoApproved ? '#166534' : '#92400e'}; font-weight: 600;">
          ${isAutoApproved ? '✓ Booking Confirmed!' : '⏳ Booking Request Received (Pending Review)'}
        </div>

        <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
          Hello <strong>${hrName || 'User'}</strong> (${companyName}),
        </p>

        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Your pod reservation request <strong>${bookingCode}</strong> has been successfully submitted.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 120px;">Booking Code:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Pod / Cabin:</td>
              <td style="padding: 6px 0; color: #2563eb; font-weight: 600;">${cabinName} (${cabinLocation || 'Bengaluru Facility'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Time Slot:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${startTime} - ${endTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Purpose:</td>
              <td style="padding: 6px 0; color: #0f172a;">${purpose}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          This is an automated notification from iQue Startup Pods (Bengaluru).
        </p>
      </div>
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html, text });
}

/**
 * Send Booking Approval Email
 */
async function sendBookingApprovalEmail({ toEmail, hrName, companyName, bookingCode, cabinName, cabinLocation, date, startTime, endTime, purpose, peopleCount }) {
  const subject = `✅ APPROVED: Pod Booking ${bookingCode} (${cabinName})`;
  const text = `Hello ${hrName || 'HR Admin'},\n\nGreat news! Your booking request ${bookingCode} for ${companyName} has been APPROVED by Central Admin.\n\nPod: ${cabinName} (${cabinLocation || 'Bengaluru Facility'})\nDate: ${date}\nTime Slot: ${startTime} - ${endTime}\nMeeting Title: ${purpose}\n\nThank you for using iQue Startup Pods!`;

  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
      <div style="background: #2563eb; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">iQue Startup Pods</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Bengaluru Facility • Booking Approved</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; color: #166534; font-weight: 600;">
          ✓ Booking Request Approved!
        </div>

        <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
          Hello <strong>${hrName || 'HR Admin'}</strong> (${companyName}),
        </p>

        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Your reservation request <strong>${bookingCode}</strong> has been granted approval by the Central Admin team.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 120px;">Booking Code:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Pod / Cabin:</td>
              <td style="padding: 6px 0; color: #2563eb; font-weight: 600;">${cabinName} (${cabinLocation || 'Bengaluru Facility'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Time Slot:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${startTime} - ${endTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Purpose:</td>
              <td style="padding: 6px 0; color: #0f172a;">${purpose}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          This is an automated notification from iQue Startup Pods (Bengaluru). If you need to cancel or adjust this booking, please log into your account portal.
        </p>
      </div>
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html, text });
}

/**
 * Send Booking Rejection Email
 */
async function sendBookingRejectionEmail({ toEmail, hrName, companyName, bookingCode, cabinName, date, startTime, endTime, rejectionReason }) {
  const subject = `✕ REJECTED: Pod Booking ${bookingCode} (${cabinName})`;
  const text = `Hello ${hrName || 'HR Admin'},\n\nYour booking request ${bookingCode} for ${companyName} (${cabinName} on ${date} from ${startTime} to ${endTime}) could not be approved by Central Admin.\n\nReason for Rejection: ${rejectionReason}\n\nPlease visit your portal to select another time slot or pod.`;

  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
      <div style="background: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">iQue Startup Pods</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8;">Bengaluru Facility • Request Status</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; color: #991b1b; font-weight: 600;">
          ✕ Booking Request Not Approved
        </div>

        <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
          Hello <strong>${hrName || 'HR Admin'}</strong> (${companyName}),
        </p>

        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Regrettably, your reservation request <strong>${bookingCode}</strong> for <strong>${cabinName}</strong> on <strong>${date} (${startTime} - ${endTime})</strong> could not be approved.
        </p>

        <div style="background: #fff5f5; border-left: 4px solid #dc2626; padding: 14px; border-radius: 4px; margin-bottom: 20px;">
          <strong style="color: #991b1b; font-size: 13px; display: block; margin-bottom: 4px;">Rejection Reason:</strong>
          <span style="color: #7f1d1d; font-size: 14px;">${rejectionReason}</span>
        </div>

        <p style="font-size: 14px; color: #475569;">
          You can log into your HR portal anytime to view live availability and request an alternative time slot or pod.
        </p>
      </div>
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html, text });
}

/**
 * Send Company Welcome & HR Account Credentials Email
 */
async function sendCompanyWelcomeEmail({ toEmail, hrName, companyName, password }) {
  const subject = `🎉 Welcome to iQue Startup Pods - HR Account Credentials for ${companyName}`;
  const text = `Welcome ${companyName}!\n\nYour company account and initial HR account (${hrName}) have been created.\n\nLogin Email: ${toEmail}\nPassword: ${password}\n\nLog in to start reserving meeting pods!`;

  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
      <div style="background: #2563eb; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">iQue Startup Pods</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Bengaluru Facility • Welcome Onboarding</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Welcome, ${companyName}!</h2>

        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Your company has been successfully registered on the iQue Startup Pods platform. Your primary Company HR user account is now active.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Your Login Credentials:</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>HR Name:</strong> ${hrName}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Email:</strong> ${toEmail}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; borderRadius: 4px;">${password}</code></p>
        </div>

        <p style="font-size: 14px; color: #475569;">
          Log into your portal to start browsing live pod availability and submitting booking requests.
        </p>
      </div>
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html, text });
}

/**
 * Send User Welcome & Account Credentials Email
 */
async function sendUserWelcomeEmail({ toEmail, userName, companyName, password, role }) {
  const roleDisplay = role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'CENTRAL_ADMIN' ? 'Central Admin' : 'Company HR';
  const subject = `🎉 Welcome to iQue Startup Pods - Account Credentials (${roleDisplay})`;
  const text = `Welcome ${userName}!\n\nYour account on iQue Startup Pods has been created.\n\nRole: ${roleDisplay}\nLogin Email: ${toEmail}\nPassword: ${password}\n\nLog in to access your portal!`;

  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
      <div style="background: #2563eb; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">iQue Startup Pods</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Bengaluru Facility • Account Onboarding</p>
      </div>

      <div style="padding: 24px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Welcome, ${userName}!</h2>

        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Your user account on the iQue Startup Pods platform is now active.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Your Login Credentials:</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Name:</strong> ${userName}</p>
          ${companyName ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Company:</strong> ${companyName}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Role:</strong> ${roleDisplay}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Login Email:</strong> ${toEmail}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; borderRadius: 4px;">${password}</code></p>
        </div>

        <p style="font-size: 14px; color: #475569;">
          Log into your portal to start browsing live pod availability and managing reservations.
        </p>
      </div>
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html, text });
}

/**
 * Send Account Invitation Email with Activation Link
 */
async function sendAccountInvitationEmail({ toEmail, userName, companyName, role, rawToken }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const activationUrl = `${frontendUrl}/activate-account?token=${rawToken}`;
  const roleDisplay = role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'CENTRAL_ADMIN' ? 'Central Admin' : 'Company HR';

  const subject = 'Your Startup Pods Account Has Been Created';
  const text = `Hello ${userName},\n\nYour Startup Pods account has been created by the administrator.\n\nAccount Details:\nEmail: ${toEmail}\nCompany: ${companyName || 'N/A'}\nRole: ${roleDisplay}\n\nClick the link below to activate your account and set your password:\n${activationUrl}\n\nThis activation link will expire in 24 hours.\n\nIf you did not expect this invitation, please contact the Startup Pods administrator.\n\nRegards,\nStartup Pods Administration`;

  const html = `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
      <div style="background: #2563eb; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Startup Pods</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Account Activation Invitation</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
          Hello <strong>${userName}</strong>,
        </p>

        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Your Startup Pods account has been created by the administrator.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Account Details</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Email:</strong> ${toEmail}</p>
          ${companyName ? `<p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Company:</strong> ${companyName}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Role:</strong> ${roleDisplay}</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a
            href="${activationUrl}"
            target="_blank"
            style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 700; font-size: 14px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);"
          >
            ACTIVATE MY ACCOUNT
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; line-height: 1.5;">
          This activation link will expire in 24 hours.<br />
          If you did not expect this invitation, please contact the Startup Pods administrator.
        </p>

        <p style="font-size: 13px; color: #94a3b8; margin-top: 12px;">
          Regards,<br />
          <strong>Startup Pods Administration</strong>
        </p>
      </div>
    </div>
  `;

  return await sendMail({ to: toEmail, subject, html, text });
}

module.exports = {
  sendAccountInvitationEmail,
  sendBookingSubmissionEmail,
  sendBookingApprovalEmail,
  sendBookingRejectionEmail,
  sendCompanyWelcomeEmail,
  sendUserWelcomeEmail
};
