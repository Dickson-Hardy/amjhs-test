# Email Service Documentation

## Overview

The Journal Application uses **Nodemailer** with **Zoho Mail** for reliable email delivery. The service includes email queueing, retry logic, and comprehensive email templates for all journal operations.

## ✅ Completed Features

### Email Infrastructure
- **Zoho Mail Integration**: Production-ready SMTP configuration
- **Email Queue System**: Reliable delivery with retry logic
- **Email Templates**: Comprehensive templates for all use cases
- **Priority Email Handling**: Immediate delivery for critical emails
- **Email Validation**: Input validation and error handling
- **Retry Logic**: Exponential backoff for failed deliveries

### Supported Email Types
1. **User Verification** - Account activation emails
2. **Password Reset** - Secure password reset links
3. **Submission Confirmation** - Manuscript submission acknowledgments
4. **Reviewer Invitations** - Review request notifications
5. **Editorial Decisions** - Publication decisions and feedback
6. **System Notifications** - Maintenance and announcements
7. **Payment Confirmations** - Transaction receipts

## Configuration

### Zoho Mail Setup

1. **Create Zoho Mail Account**
   - Sign up at [Zoho Mail](https://www.zoho.com/mail/)
   - Set up your domain or use zoho.com subdomain
   - Create email aliases for different purposes

2. **Generate App Password**
   ```
   1. Go to Zoho Account Settings
   2. Navigate to Security > App Passwords
   3. Generate new app password for SMTP
   4. Use this password in SMTP_PASSWORD
   ```

3. **Environment Variables**
   ```env
   # Zoho Mail Configuration
   SMTP_HOST=smtp.zoho.com
   SMTP_PORT=587
   SMTP_USER=your-email@yourdomain.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM=noreply@yourdomain.com
   ```

### Email Aliases Configuration

Set up these aliases in Zoho Mail for better organization:

```env
# Different aliases for different purposes
SMTP_FROM=noreply@yourdomain.com          # General notifications
EDITORIAL_EMAIL=editorial@yourdomain.com   # Editorial communications
SUBMISSIONS_EMAIL=submissions@yourdomain.com # Manuscript submissions
SUPPORT_EMAIL=support@yourdomain.com       # User support
NOTIFICATIONS_EMAIL=notifications@yourdomain.com # System notifications
```

## Usage Examples

### Basic Email Sending

```typescript
import { sendEmail } from '@/lib/email'

// Regular email (queued)
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to AMHSJ',
  html: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
  text: 'Welcome! Thank you for joining us.',
  priority: false
})

// Priority email (immediate)
await sendEmail({
  to: 'user@example.com',
  subject: 'Urgent: Password Reset',
  html: '<h1>Password Reset</h1><p>Click the link to reset...</p>',
  priority: true
})
```

### Template-Based Emails

```typescript
import { 
  sendEmailVerification, 
  sendPasswordReset,
  sendSubmissionReceived 
} from '@/lib/email'

// Email verification
await sendEmailVerification(
  'user@example.com',
  'John Doe',
  'https://yourjournal.com/verify?token=abc123'
)

// Password reset
await sendPasswordReset(
  'user@example.com',
  'John Doe',
  'https://yourjournal.com/reset?token=xyz789'
)

// Submission confirmation
await sendSubmissionReceived(
  'author@example.com',
  'Dr. Jane Smith',
  'Machine Learning in Healthcare',
  'MS2025001'
)
```

### Bulk Email Operations

```typescript
import { sendBulkEmail } from '@/lib/email'
import { emailTemplates } from '@/lib/email-templates'

// Announcement to all users
const recipients = ['user1@example.com', 'user2@example.com']
const template = emailTemplates.systemMaintenance(
  'All Users',
  '2025-06-25 02:00 UTC',
  '2 hours'
)

await sendBulkEmail(recipients, template)
```

## Email Queue Management

### Queue Monitoring

```typescript
import { getEmailQueueStatus } from '@/lib/email'

// Check queue status
const status = getEmailQueueStatus()
console.log(`Queue length: ${status.queueLength}`)
console.log(`Processing: ${status.isProcessing}`)
console.log('Pending emails:', status.pendingEmails)
```

### Queue Management

```typescript
import { clearEmailQueue } from '@/lib/email'

// Clear queue (emergency only)
clearEmailQueue()
```

## Email Templates

All email templates are defined in `lib/email-templates.ts` and include:

### User Authentication
- `emailVerification(name, verificationUrl)`
- `passwordReset(name, resetUrl)`
- `welcomeEmail(userName, userRole)`

### Editorial Workflow
- `submissionReceived(authorName, articleTitle, submissionId)`
- `reviewerAssignment(reviewerName, articleTitle, authorName, deadline, reviewUrl)`
- `reviewSubmitted(authorName, articleTitle, submissionId)`
- `editorialDecision(authorName, articleTitle, decision, comments, submissionId)`

### System Communications
- `paymentConfirmation(userName, amount, transactionId, description)`
- `systemMaintenance(userName, maintenanceDate, duration)`

## Error Handling and Retry Logic

### Retry Mechanism
- **Immediate Retry**: Priority emails retry immediately on failure
- **Queue Retry**: Failed emails are automatically retried up to 3 times
- **Exponential Backoff**: Increasing delays between retries (5s, 10s, 15s)
- **Dead Letter Handling**: Emails failing after 3 retries are logged

### Error Monitoring

```typescript
// Errors are automatically logged
console.error(`Failed to send email to user@example.com after 3 retries`)

// Monitor queue processing
console.log(`Email sent successfully to user@example.com`)
console.log(`Email to user@example.com queued for retry 2/3`)
```

## Testing

### Running Email Tests

```bash
# Run all email tests
npm test __tests__/email.test.ts

# Run specific test suites
npm test -- --grep "Email Configuration"
npm test -- --grep "Email Queue System"
```

### Test Coverage

The email service includes tests for:
- ✅ Zoho Mail configuration
- ✅ Email sending and validation
- ✅ Template rendering
- ✅ Queue system and retry logic
- ✅ Error handling
- ✅ Email aliases

## Security Best Practices

### Email Security
1. **App Passwords**: Use app-specific passwords, not main account password
2. **TLS Encryption**: All emails sent over encrypted connections
3. **Email Validation**: Input validation prevents injection attacks
4. **Rate Limiting**: Built-in protection against email spam

### Environment Security
```env
# Use strong app passwords
SMTP_PASSWORD=your_strong_app_password

# Secure email addresses
SMTP_USER=service-account@yourdomain.com
SMTP_FROM=noreply@yourdomain.com
```

## Monitoring and Maintenance

### Health Checks

```typescript
// Test email connectivity
import { sendEmail } from '@/lib/email'

try {
  await sendEmail({
    to: 'admin@yourdomain.com',
    subject: 'Email Service Health Check',
    html: '<p>Email service is working correctly</p>',
    priority: true
  })
  console.log('Email service healthy')
} catch (error) {
  console.error('Email service error:', error)
}
```

### Performance Monitoring
- Queue length monitoring
- Delivery success rates
- Retry frequency analysis
- Error rate tracking

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```
   Error: Invalid login
   Solution: Check SMTP_USER and SMTP_PASSWORD
   ```

2. **Connection Timeout**
   ```
   Error: Connection timeout
   Solution: Verify SMTP_HOST and SMTP_PORT
   ```

3. **Email Rejected**
   ```
   Error: 550 Rejected
   Solution: Check sender reputation and SPF records
   ```

### Debugging

```typescript
// Enable debug logging
process.env.NODE_ENV = 'development'

// Check queue status
console.log(getEmailQueueStatus())

// Test individual email
await sendEmail({
  to: 'test@yourdomain.com',
  subject: 'Test Email',
  html: '<p>Test</p>',
  priority: true
})
```

## Production Deployment

### Environment Setup
1. Configure Zoho Mail domain
2. Set up SPF, DKIM, and DMARC records
3. Configure environment variables
4. Test email delivery

### Monitoring Setup
1. Monitor queue length
2. Track delivery rates
3. Set up alerts for failures
4. Monitor server resources

## Next Steps

After email service completion, proceed to:
1. **Database Implementation** (Day 5-6)
2. **Testing & Integration** (Day 7)
3. **Workflow System** (Week 2)

---

**Status**: ✅ Email Service Integration Complete  
**Last Updated**: June 20, 2025  
**Next Task**: Database Implementation
