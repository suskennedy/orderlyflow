export interface InvitationEmailData {
  to: string;
  familyName: string;
  inviterName: string;
  invitationUrl: string;
  expiresAt: string;
}

export class EmailService {
  static async sendFamilyInvitation(data: InvitationEmailData) {
    try {
      const { to, familyName, inviterName, invitationUrl, expiresAt } = data;

      // Use Resend API directly with fetch (works in React Native)
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `OrderlyFlow <${process.env.EXPO_PUBLIC_FROM_EMAIL || 'noreply@orderlyflow.com'}>`,
          to: [to],
          subject: `You're invited to join ${familyName} on OrderlyFlow`,
          html: this.createInvitationEmailHTML(data),
          text: this.createInvitationEmailText(data),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Email sending failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private static createInvitationEmailHTML(data: InvitationEmailData) {
    const { familyName, inviterName, invitationUrl, expiresAt } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Join OrderlyFlow</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
          }
          .family-name {
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
            text-align: center;
            margin: 20px 0;
          }
          .content {
            margin-bottom: 30px;
          }
          .benefits {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .benefits h3 {
            margin-top: 0;
            color: #333;
          }
          .benefit-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }
          .checkmark {
            color: #28a745;
            margin-right: 10px;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .cta-button:hover {
            background-color: #0056b3;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .expiry {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏠 OrderlyFlow</div>
            <h1 class="title">You're Invited!</h1>
          </div>

          <div class="content">
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join their family account on OrderlyFlow.</p>
            
            <div class="family-name">${familyName}</div>
            
            <p>OrderlyFlow is a home management app that helps families organize tasks, manage homes, and coordinate with vendors.</p>

            <div class="benefits">
              <h3>What you'll be able to do:</h3>
              <div class="benefit-item">
                <span class="checkmark">✓</span>
                <span>View and manage family tasks</span>
              </div>
              <div class="benefit-item">
                <span class="checkmark">✓</span>
                <span>Access home information and inventory</span>
              </div>
              <div class="benefit-item">
                <span class="checkmark">✓</span>
                <span>Coordinate with family members</span>
              </div>
              <div class="benefit-item">
                <span class="checkmark">✓</span>
                <span>Manage vendor contacts</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${invitationUrl}" class="cta-button">
                Accept Invitation
              </a>
            </div>

            <div class="expiry">
              ⏰ This invitation expires on ${new Date(expiresAt).toLocaleDateString()}
            </div>
          </div>

          <div class="footer">
            <p>If you don't have an OrderlyFlow account, you'll be able to create one when you accept the invitation.</p>
            <p>If you received this email by mistake, you can safely ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static createInvitationEmailText(data: InvitationEmailData) {
    const { familyName, inviterName, invitationUrl, expiresAt } = data;

    return `
You're Invited!

Hi there!

${inviterName} has invited you to join their family account "${familyName}" on OrderlyFlow.

OrderlyFlow is a home management app that helps families organize tasks, manage homes, and coordinate with vendors.

What you'll be able to do:
✓ View and manage family tasks
✓ Access home information and inventory
✓ Coordinate with family members
✓ Manage vendor contacts

Accept your invitation here: ${invitationUrl}

This invitation expires on ${new Date(expiresAt).toLocaleDateString()}.

If you don't have an OrderlyFlow account, you'll be able to create one when you accept the invitation.

If you received this email by mistake, you can safely ignore it.
    `;
  }
} 