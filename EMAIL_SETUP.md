# Email Setup for Family Invitations

## Overview
The family invitation system uses email to send invitations to potential family members. You have several options for setting up email delivery.

## Option 1: Resend (Recommended)

### Setup Steps:
1. **Sign up for Resend**: Go to [resend.com](https://resend.com) and create an account
2. **Get API Key**: In your Resend dashboard, go to API Keys and create a new key
3. **Verify Domain**: Add and verify your domain for better deliverability
4. **Set Environment Variables**: Add these to your Supabase Edge Function environment:

```bash
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

### Benefits:
- ✅ High deliverability
- ✅ Easy setup
- ✅ Good free tier
- ✅ Professional email templates

## Option 2: Supabase SMTP (Advanced)

### Setup Steps:
1. **Configure SMTP in Supabase**: Go to your Supabase dashboard
2. **Authentication > Email Templates**: Configure SMTP settings
3. **Add SMTP credentials**: Enter your SMTP server details
4. **Test email sending**: Verify the configuration works

### Required SMTP Settings:
- SMTP Host (e.g., smtp.gmail.com)
- SMTP Port (usually 587 or 465)
- Username (your email)
- Password (app password for Gmail)
- From Email Address

## Option 3: Other Email Services

You can modify the `sendEmail` function in `supabase/functions/send-family-invitation/index.ts` to use any email service:

### Examples:
- **SendGrid**: Popular email service with good deliverability
- **Mailgun**: Developer-friendly email API
- **AWS SES**: Amazon's email service
- **Postmark**: Transactional email specialist

## Environment Variables

Add these to your Supabase Edge Function environment:

```bash
# Required for Resend
RESEND_API_KEY=your_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Optional: App URL for invitation links
EXPO_PUBLIC_APP_URL=https://your-app-url.com
```

## Testing

1. **Deploy the Edge Function**: Use Supabase CLI to deploy
2. **Test Invitation**: Try sending an invitation from the family management screen
3. **Check Logs**: Monitor Edge Function logs for any errors
4. **Verify Email**: Check that emails are delivered correctly

## Troubleshooting

### Common Issues:

1. **"Email service not configured"**
   - Solution: Set up RESEND_API_KEY or configure Supabase SMTP

2. **"Edge Function returned non-2xx status"**
   - Check Edge Function logs in Supabase dashboard
   - Verify environment variables are set correctly

3. **Emails not delivered**
   - Check spam folder
   - Verify domain authentication
   - Test with a different email address

4. **Invalid API key**
   - Regenerate your Resend API key
   - Ensure the key has proper permissions

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor email sending logs for abuse

## Cost Considerations

- **Resend**: Free tier includes 3,000 emails/month
- **Supabase SMTP**: Depends on your SMTP provider
- **Other services**: Varies by provider and volume

Choose the option that best fits your needs and budget! 