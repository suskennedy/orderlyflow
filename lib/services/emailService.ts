export interface InvitationEmailData {
  to: string;
  familyName: string;
  inviterName: string;
  invitationUrl: string;
  fallbackUrl: string;
  expiresAt: string;
  userExists: boolean;
}

export class EmailService {
  static async sendFamilyInvitation(data: InvitationEmailData) {
    try {
      const { to, familyName } = data;

      console.log('EmailService: Starting to send invitation email');
      console.log('EmailService: API Key exists:', !!process.env.EXPO_PUBLIC_RESEND_API_KEY);
      console.log('EmailService: From email:', process.env.EXPO_PUBLIC_FROM_EMAIL);
      console.log('EmailService: All env vars:', {
        RESEND_API_KEY: process.env.EXPO_PUBLIC_RESEND_API_KEY ? 'Present' : 'Missing',
        FROM_EMAIL: process.env.EXPO_PUBLIC_FROM_EMAIL,
        APP_URL: process.env.EXPO_PUBLIC_APP_URL
      });
      console.log('EmailService: To email:', to);

      // Use Resend API directly with fetch
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `OrderlyFlow <${process.env.EXPO_PUBLIC_FROM_EMAIL}>`,
          to: [to],
          subject: `You're invited to join ${familyName} on OrderlyFlow`,
          html: this.createInvitationEmailHTML(data),
          text: this.createInvitationEmailText(data),
        }),
      });

      console.log('EmailService: Response status:', response.status);
      console.log('EmailService: Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('EmailService: Error response data:', errorData);
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

  // Test function to verify Resend API key
  static async testResendConnection() {
    try {
      console.log('Testing Resend connection...');
      console.log('API Key:', process.env.EXPO_PUBLIC_RESEND_API_KEY ? 'Present' : 'Missing');
      console.log('From Email:', process.env.EXPO_PUBLIC_FROM_EMAIL);
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + (process.env.EXPO_PUBLIC_RESEND_API_KEY || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EXPO_PUBLIC_FROM_EMAIL,
          to: ['test@example.com'],
          subject: 'API Test',
          html: '<p>Test</p>',
        }),
      });

      

      console.log('Test response status:', response.status);
      
      if (response.status === 400) {
        console.log('Resend API key appears valid (400 validation expected)');
        return true;
      }
      if (response.status === 401) {
        const error = await response.json().catch(() => ({}));
        console.error('Resend API key is invalid:', error);
        return false;
      }
      if (response.status === 403) {
        // Domain not verified or restricted testing; treat as connected for our purposes
        const error = await response.json().catch(() => ({}));
        console.log('Resend returned 403 (likely domain restriction):', error);
        return true;
      }
      if (response.ok) {
        console.log('Resend connection successful');
        return true;
      }
      const error = await response.json().catch(() => ({}));
      console.error('Resend connection failed:', error);
      return false;
    } catch (error) {
      console.error('Resend test error:', error);
      return false;
    }
  }

  // Simple test email function
  static async sendTestEmail(toEmail: string) {
    try {
      console.log('Sending test email to:', toEmail);
      console.log('From email:', process.env.EXPO_PUBLIC_FROM_EMAIL);
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + (process.env.EXPO_PUBLIC_RESEND_API_KEY || ''),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EXPO_PUBLIC_FROM_EMAIL,
          to: [toEmail],
          subject: 'Test Email from OrderlyFlow',
          html: '<h1>Test Email</h1><p>This is a test email to verify Resend is working.</p>',
          text: 'Test Email\n\nThis is a test email to verify Resend is working.',
        }),
      });

      console.log('Test email response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Test email error:', errorData);
        throw new Error(`Test email failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Test email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Test email error:', error);
      throw error;
    }
  }

  private static createInvitationEmailHTML(data: InvitationEmailData) {
    const { familyName, inviterName, invitationUrl, fallbackUrl, expiresAt, userExists } = data;

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
          .account-notice {
            background-color: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            color: #1976d2;
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
              <p style="margin: 10px 0; color: #666;">or</p>
              <a href="${fallbackUrl}" class="cta-button" style="background-color: #28a745;">
                Open in OrderlyFlow App
              </a>
            </div>

            ${userExists ? 
              '<div class="account-notice">You already have an OrderlyFlow account. Simply sign in to accept this invitation.</div>' :
              '<div class="account-notice">Don\'t have an OrderlyFlow account? No problem! You can create one when you accept this invitation.</div>'
            }

            <div class="expiry">
              ⏰ This invitation expires on ${new Date(expiresAt).toLocaleDateString()}
            </div>
          </div>

          <div class="footer">
            <p>If you received this email by mistake, you can safely ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static createInvitationEmailText(data: InvitationEmailData) {
    const { familyName, inviterName, invitationUrl, fallbackUrl, expiresAt, userExists } = data;

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

If the above link doesn't work, try this: ${fallbackUrl}

${userExists ? 
  'You already have an OrderlyFlow account. Simply sign in to accept this invitation.' :
  'Don\'t have an OrderlyFlow account? No problem! You can create one when you accept this invitation.'
}

This invitation expires on ${new Date(expiresAt).toLocaleDateString()}.

If you received this email by mistake, you can safely ignore it.
    `;
  }
} 