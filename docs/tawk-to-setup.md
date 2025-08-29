# Tawk.to Live Chat Setup Guide

## Overview
This guide will help you set up Tawk.to live chat support for the AMHSJ journal website. Tawk.to is a free live chat platform that provides 24/7 customer support capabilities.

## Step 1: Create a Tawk.to Account

1. Go to [https://tawk.to](https://tawk.to)
2. Click "Sign up free" to create your account
3. Choose the free plan (no credit card required)
4. Verify your email address

## Step 2: Set up Your Property

1. Login to your Tawk.to dashboard at [https://dashboard.tawk.to](https://dashboard.tawk.to)
2. Create a new property for your journal website
3. Enter your website URL: `https://your-journal-domain.com`
4. Choose your preferred settings:
   - **Chat Widget Position**: Bottom right (recommended)
   - **Online/Offline Message**: Customize for your journal
   - **Team Settings**: Add team members if needed

## Step 3: Get Your Widget Code

1. In the Tawk.to dashboard, go to **Administration** > **Chat Widget**
2. Copy your **Property ID** and **Widget ID** from the JavaScript code
3. The code will look like this:
   ```javascript
   var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
   (function(){
   var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
   s1.async=true;
   s1.src='https://embed.tawk.to/PROPERTY_ID/WIDGET_ID';
   s1.charset='UTF-8';
   s1.setAttribute('crossorigin','*');
   s0.parentNode.insertBefore(s1,s0);
   })();
   ```

## Step 4: Configure Environment Variables

1. Add your Tawk.to credentials to your `.env.local` file:
   ```bash
   # Tawk.to Configuration
   NEXT_PUBLIC_TAWK_TO_PROPERTY_ID=your_property_id_here
   NEXT_PUBLIC_TAWK_TO_WIDGET_ID=your_widget_id_here
   NEXT_PUBLIC_TAWK_TO_ENABLED=true
   ```

2. Replace `your_property_id_here` and `your_widget_id_here` with your actual IDs

## Step 5: Customize Your Chat Widget

### Widget Appearance
1. Go to **Administration** > **Chat Widget** > **Widget Appearance**
2. Customize colors to match your journal's branding:
   - **Primary Color**: #3B82F6 (blue) or your brand color
   - **Button Color**: Match your website theme
   - **Position**: Bottom right recommended for accessibility

### Pre-chat Form
1. Enable pre-chat form to collect visitor information
2. Add relevant fields:
   - Name
   - Email
   - Subject/Topic
   - Message

### Offline Messages
1. Configure offline message form for when agents are unavailable
2. Set up email notifications for offline messages

## Step 6: Set Up Automated Messages

### Welcome Message
Create a welcoming message for visitors:
```
Welcome to AMHSJ Support! 👋

How can we help you today?
• Manuscript submission questions
• Technical support
• Account assistance
• General inquiries

An agent will be with you shortly!
```

### Triggers
Set up automatic triggers:
1. **Time-based**: Show message after 30 seconds
2. **Page-based**: Different messages for different pages
3. **Exit-intent**: Engage users before they leave

## Step 7: Configure Notifications

### Email Notifications
1. Go to **Administration** > **Notifications**
2. Set up email alerts for:
   - New chat messages
   - Offline messages
   - Missed chats
3. Add multiple email addresses for your support team

### Mobile App
1. Download the Tawk.to mobile app
2. Sign in with your account
3. Enable push notifications for real-time alerts

## Step 8: Add Team Members

1. Go to **Administration** > **Agents**
2. Invite team members by email
3. Set appropriate permissions:
   - **Admin**: Full access
   - **Agent**: Chat and view reports
   - **Viewer**: Read-only access

## Step 9: Set Operating Hours

1. Go to **Administration** > **Chat Widget** > **Behavior**
2. Configure your support hours:
   - **24/7**: Always available (recommended for international journal)
   - **Business Hours**: Set specific hours by timezone
3. Customize offline messages for different time zones

## Step 10: Analytics and Reporting

### Available Reports
- Chat volume and response times
- Agent performance metrics
- Visitor insights and behavior
- Customer satisfaction scores

### Setup Monitoring
1. Enable visitor monitoring to see real-time website traffic
2. Set up shortcuts for common responses
3. Create departments for different types of inquiries

## Integration Features

### Knowledge Base Integration
- Link to your help center: `/support`
- Create shortcuts for common questions
- Set up bot responses for FAQ

### User Data Integration
The widget can automatically pass user information if they're logged in to your journal system.

## Best Practices

### Response Time
- Aim for responses within 2-3 minutes during business hours
- Set clear expectations in your welcome message
- Use quick responses/shortcuts for common questions

### Professional Communication
- Use proper grammar and professional tone
- Personalize responses with the visitor's name
- Follow up on resolved issues

### Knowledge Management
- Maintain a database of common questions and answers
- Train agents on journal-specific processes
- Regular team meetings to discuss common issues

## Troubleshooting

### Widget Not Appearing
1. Check that environment variables are set correctly
2. Verify Property ID and Widget ID are correct
3. Ensure `NEXT_PUBLIC_TAWK_TO_ENABLED=true`
4. Check browser console for JavaScript errors

### Chat Not Working
1. Verify your domain is added to the Tawk.to property
2. Check if you're using the correct environment variables
3. Test with incognito/private browsing mode
4. Clear browser cache and cookies

## Support Resources

- **Tawk.to Help Center**: [https://help.tawk.to](https://help.tawk.to)
- **API Documentation**: [https://developer.tawk.to](https://developer.tawk.to)
- **Community Forum**: [https://community.tawk.to](https://community.tawk.to)

## Next Steps

After setup is complete:
1. Test the chat widget thoroughly
2. Train your support team
3. Monitor chat analytics
4. Optimize based on user feedback
5. Consider upgrading to paid features if needed

## Contact Information

For technical support with this integration:
- Email: dev-support@amhsj.org
- Documentation: `/docs/tawk-to-setup.md`
