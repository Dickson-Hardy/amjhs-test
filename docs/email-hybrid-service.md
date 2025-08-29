# Email Service Configuration

The journal application uses a hybrid email service that intelligently routes emails based on their purpose:

## Email Providers

### Resend (for user-facing emails)
- **Authentication emails**: Email verification, password reset, welcome emails
- **User notifications**: Payment reminders, submission confirmations, publication notifications
- **Success messages**: Account creation, successful submissions

### Zoho Mail (for editorial communications)
- **Editorial emails**: Reviewer assignments, editorial decisions, revision requests
- **System emails**: Admin alerts, system notifications
- **Verified domain communications**: Internal communications between editorial staff

## Environment Variables

### Resend Configuration
```env
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=AMHSJ <noreply@yourjournal.com>
REPLY_TO_EMAIL=editorial@yourjournal.com
```

### Zoho Mail Configuration (existing)
```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=your-alias@yourdomain.com
SMTP_PASSWORD=your_zoho_password_or_app_password
SMTP_FROM=editorial@yourjournal.com
```

## Email Routing Logic

The system automatically determines which provider to use based on:

1. **Email Category**: Each email template is categorized as:
   - `authentication` → Resend
   - `user_notification` → Resend  
   - `editorial` → Zoho
   - `system` → Zoho

2. **Recipient Domain**: Emails to verified domains (yourjournal.com, editorial.yourjournal.com) always use Zoho

3. **Priority**: High-priority emails are sent immediately, others are queued

## Usage Examples

```typescript
import { 
  sendEmailVerification,
  sendReviewerAssignment,
  sendPaymentReminder 
} from '@/lib/email-hybrid'

// Authentication email (via Resend)
await sendEmailVerification(
  'user@gmail.com',
  'John Doe',
  'https://yourjournal.com/verify?token=abc123'
)

// Editorial email (via Zoho)
await sendReviewerAssignment(
  'reviewer@university.edu',
  'Dr. Smith',
  'AI in Healthcare',
  'Dr. Johnson',
  '2025-09-01',
  'https://yourjournal.com/review/123'
)

// Payment reminder (via Resend)
await sendPaymentReminder(
  'author@institution.edu',
  'Dr. Brown',
  'Machine Learning Study',
  '$150',
  '2025-08-15',
  'https://yourjournal.com/payment/456'
)
```

## Benefits of Hybrid Approach

1. **Better Deliverability**: Resend for user emails, Zoho for professional communications
2. **Cost Optimization**: Use appropriate service for each email type
3. **Reliability**: Fallback and retry mechanisms for both providers
4. **Professional Image**: Editorial emails from verified domain via Zoho
5. **Developer Experience**: Simple API with Resend for transactional emails

## Monitoring

The service includes health checks and queue monitoring:

```typescript
import { checkEmailServiceHealth, getEmailQueueStatus } from '@/lib/email-hybrid'

// Check both services
const health = await checkEmailServiceHealth()
console.log('Resend:', health.resend)
console.log('Zoho:', health.zoho)

// Monitor email queue
const queueStatus = getEmailQueueStatus()
console.log('Queue length:', queueStatus.queueLength)
```
