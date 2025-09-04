# Email System in Editorial Workflow - Complete Analysis

## 📧 Email System Configuration Status

### ✅ **CONFIGURED SERVICES**
- **Zoho SMTP**: `smtppro.zoho.com` - For editorial communications
  - Host: `smtppro.zoho.com`
  - Port: `587`
  - User: `tcharry@amhsj.org`
  - From: `editorial@amhsj.org`
  - **Status**: ✅ Fully configured

### ⚠️ **NEEDS ATTENTION**
- **Resend API**: For user notifications
  - **Status**: ❌ API key is placeholder (`re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
  - **Impact**: User emails (verification, welcome, submissions) won't work
  - **Fix**: Replace with real Resend API key

## 🔄 **Email Touchpoints in Your Workflow**

### 1. **User Registration & Authentication**
- **Emails**: Welcome email, Email verification
- **Recipients**: New users (authors, reviewers)
- **Service**: Resend API
- **Status**: ⚠️ Needs valid API key

### 2. **Manuscript Submission**
- **Emails**: Submission confirmation
- **Recipients**: Authors
- **Service**: Resend API (user notification)
- **Status**: ⚠️ Needs valid API key

### 3. **Editorial Assistant Screening** ✅
- **Emails**: 
  - Screening passed notification → Authors
  - Screening failed/revision required → Authors
- **Recipients**: Authors
- **Service**: Zoho SMTP
- **Code Location**: `lib/workflow.ts` lines 1675, 1756
- **Status**: ✅ Implemented and configured

### 4. **Associate Editor Assignment** ✅
- **Emails**: Assignment notification
- **Recipients**: Associate Editor (Dr. Elizabeth Williams)
- **Service**: Zoho SMTP
- **Code Location**: `lib/workflow.ts` (createSystemNotification)
- **Status**: ✅ Implemented and configured

### 5. **Reviewer Assignment** ✅
- **Emails**: Review invitation, Review reminders
- **Recipients**: Reviewers
- **Service**: Zoho SMTP
- **Code Location**: `lib/workflow.ts` (sendReviewInvitation)
- **Status**: ✅ Implemented and configured

### 6. **Review Submission** ✅
- **Emails**: 
  - Review submitted confirmation → Reviewers
  - Editor notification → Associate Editor
- **Recipients**: Reviewers, Associate Editor
- **Service**: Zoho SMTP
- **Status**: ✅ Implemented and configured

### 7. **Editorial Decision** ✅
- **Emails**: Accept/Reject/Revision decision
- **Recipients**: Authors, Reviewers
- **Service**: Zoho SMTP
- **Status**: ✅ Implemented and configured

### 8. **System Notifications**
- **Emails**: Deadline reminders, System maintenance
- **Recipients**: All users
- **Service**: Mixed (Resend + Zoho)
- **Status**: 🔧 Partial implementation

## 👥 **Current Email Recipients in Database**

| Role | Count | Sample Emails |
|------|-------|---------------|
| **Authors** | 3 | emily.rodriguez@hospital.com, john.smith@university.edu, lisa.anderson@healthcenter.org |
| **Editors** | 3 | associate1@amhsj.org, production@amhsj.org, michael.chen@research.org |
| **Reviewers** | 3 | reviewer1@amhsj.org, david.wilson@academy.edu, robert.taylor@meduni.edu |
| **Associate Editors** | 2 | guest.ai@amhsj.org, cardiology.editor@amhsj.org |
| **Admin** | 1 | admin@amhsj.org |
| **Editorial Assistant** | 1 | editorial.assistant@amhsj.org |

## 🔧 **Email Testing Infrastructure**

### **Available Test Endpoint**
- **URL**: `/api/email/test`
- **Method**: POST
- **Access**: Admin only
- **Test Types**:
  - `verification` - Email verification (Resend)
  - `welcome` - Welcome email (Resend)
  - `submission` - Submission received (Resend)
  - `reviewer-assignment` - Reviewer invitation (Zoho)
  - `editorial-decision` - Editorial decision (Zoho)
  - `health-check` - Service health check

### **Email Logging**
- **Table**: `email_logs`
- **Tracking**: Delivery status, timestamps, error messages
- **Current Status**: 📭 No recent email activity

## 🚨 **Critical Action Items**

### **1. Fix Resend API Key (High Priority)**
```bash
# In .env.local, replace:
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# With your actual Resend API key:
RESEND_API_KEY=re_YOUR_ACTUAL_API_KEY_HERE
```

### **2. Test Email System**
```bash
# Run comprehensive email test
node test-email-system.cjs

# Test actual email sending (requires valid API keys)
node test-actual-emails.cjs
```

### **3. Verify Email Templates**
- Check `lib/email-templates.ts` for proper templates
- Ensure templates match your journal branding
- Test template rendering with real data

## 📋 **Email Workflow Testing Checklist**

### **Before Going Live:**
- [ ] Fix Resend API key
- [ ] Test user registration emails
- [ ] Test submission confirmation emails
- [ ] Test screening notification emails
- [ ] Test associate editor assignment emails
- [ ] Test reviewer invitation emails
- [ ] Test editorial decision emails
- [ ] Verify email delivery to all recipient types
- [ ] Check spam folder handling
- [ ] Test email unsubscribe functionality

### **Ongoing Monitoring:**
- [ ] Monitor `email_logs` table for failures
- [ ] Set up email delivery alerts
- [ ] Track email open/click rates
- [ ] Monitor spam complaints
- [ ] Regular health checks of both services

## 🔍 **Workflow Email Flow Summary**

```
Author Submits → Submission Confirmation Email (Resend)
     ↓
Editorial Assistant Screens → Screening Result Email (Zoho)
     ↓
Auto-assign to Associate Editor → Assignment Email (Zoho)
     ↓
Associate Editor Assigns Reviewers → Invitation Emails (Zoho)
     ↓
Reviewers Submit Reviews → Confirmation Emails (Zoho)
     ↓
Associate Editor Makes Decision → Decision Email (Zoho)
```

## 💡 **Recommendations**

1. **Immediate**: Get valid Resend API key for user emails
2. **Testing**: Run email tests with real addresses before production
3. **Monitoring**: Set up alerts for email delivery failures
4. **Templates**: Customize email templates with journal branding
5. **Compliance**: Ensure emails comply with anti-spam regulations
6. **Backup**: Consider backup email service for reliability

## 📞 **Support Contacts**
- **Resend Support**: For user email issues
- **Zoho Support**: For editorial email issues
- **Email Configuration**: Check `.env.local` file
- **Code Issues**: Check `lib/email-hybrid.ts` and `lib/workflow.ts`