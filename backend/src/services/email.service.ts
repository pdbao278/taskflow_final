/**
 * Email service using Brevo (Sendinblue) API.
 * Requires BREVO_API_KEY and BREVO_SENDER_EMAIL env variables.
 */

interface SendInviteEmailParams {
  recipientEmail: string;
  inviterName: string;
  workspaceName: string;
  role: 'Manager' | 'Member';
  inviteLink: string;
}

const ROLE_LABEL: Record<string, string> = {
  Manager: 'Quản lý',
  Member: 'Thành viên',
};

export async function sendInviteEmail(params: SendInviteEmailParams): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (!apiKey || !senderEmail) {
    console.warn('[Email] BREVO_API_KEY or BREVO_SENDER_EMAIL not configured. Skipping email send.');
    return;
  }

  const roleLabel = ROLE_LABEL[params.role] ?? params.role;
  const subject = `${params.inviterName} đã mời bạn tham gia workspace "${params.workspaceName}" trên TaskFlow`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #3b5bdb;">Bạn được mời tham gia TaskFlow</h2>
      <p><strong>${params.inviterName}</strong> đã mời bạn tham gia workspace <strong>${params.workspaceName}</strong> với vai trò <strong>${roleLabel}</strong>.</p>
      <div style="margin: 24px 0;">
        <a href="${params.inviteLink}"
           style="display: inline-block; padding: 12px 24px; background: #3b5bdb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Chấp nhận lời mời
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Link có hiệu lực trong 48 giờ. Nếu bạn không muốn tham gia, hãy bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">TaskFlow — Quản lý công việc nhóm hiệu quả</p>
    </div>
  `;

  const body = {
    sender: { email: senderEmail, name: 'TaskFlow' },
    to: [{ email: params.recipientEmail }],
    subject,
    htmlContent,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Email] Brevo send failed:', response.status, errorText);
    throw new Error(`Email send failed: ${response.status}`);
  }
}
