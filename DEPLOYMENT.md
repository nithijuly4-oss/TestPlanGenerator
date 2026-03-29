# 🚀 Deployment Guide

This guide shows you exactly how to push your Test Plan Agent to GitHub and deploy to Vercel.

## 📦 Step 1: Prepare for GitHub

Before pushing, ensure your `.env` file is NOT committed (it's in `.gitignore`).

**Create `.env.example` for reference:**

```env
# GROQ LLM Configuration
GROQ_API_KEY=your_groq_api_key_here

# Jira Configuration
JIRA_EMAIL=your_email@company.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_DOMAIN=your-domain.atlassian.net

# Server Configuration
APP_PORT=3000
```

Save this as `.env.example` in the root directory.

## 🐙 Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `test-plan-agent`
   - **Description**: `AI-Powered test plan generator from Jira issues`
   - **Public/Private**: Choose your preference
   - **Add .gitignore**: Select Node
   - **Add License**: MIT
3. Click **Create repository**

## 📤 Step 3: Push Code to GitHub

### Configure Git (First Time Only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Initialize and Push

```powershell
cd d:\AITester\Chapter4_AIAGent

# Initialize git repository
git init

# Add all files (excluding .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: AI-powered test plan generator with Jira integration"

# Rename branch to main (if needed)
git branch -M main

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/test-plan-agent.git

# Push to GitHub
git push -u origin main
```

### After First Push

For subsequent updates:

```powershell
git add .
git commit -m "Your commit message here"
git push origin main
```

## ☁️ Step 4: Deploy to Vercel

### Option A: One-Click Deploy (Recommended)

1. Visit: https://vercel.com/new
2. Select **Other/Git Repository**
3. Paste: `https://github.com/YOUR_USERNAME/test-plan-agent`
4. Click **Continue**
5. Configure:
   - **Project Name**: `test-plan-agent`
   - **Framework**: Node.js
   - **Build Command**: Auto-detected (should be fine)
6. Set **Environment Variables**:
   ```
   GROQ_API_KEY = your_groq_api_key
   JIRA_EMAIL = your_email@company.com
   JIRA_API_TOKEN = your_jira_api_token
   JIRA_DOMAIN = your-domain.atlassian.net
   ```
7. Click **Deploy**
8. ✅ Your app is live!

### Option B: Deploy via CLI

1. Install Vercel CLI:
   ```powershell
   npm install -g vercel
   ```

2. Deploy:
   ```powershell
   cd d:\AITester\Chapter4_AIAGent
   vercel
   ```

3. Follow prompts:
   - Link to GitHub account
   - Select your repository
   - Set environment variables
   - Deploy

## 🌐 Access Your Deployment

After deployment, Vercel provides:

- **Frontend URL**: `https://test-plan-agent.vercel.app/`
- **API URL**: `https://test-plan-agent.vercel.app/api/`
- **Health Check**: `https://test-plan-agent.vercel.app/api/health`

Update your frontend API base URL if needed:

```javascript
// frontend/src/api.js
const API_BASE = process.env.REACT_APP_API_URL || 'https://test-plan-agent.vercel.app/api'
```

## 📋 Document Download Location in Vercel

### Current Implementation (Recommended)

**Direct Streaming** - Documents are generated in-memory and streamed directly to users:

- Endpoint: `POST /api/test-plan/download-docx`
- How it works:
  1. Frontend sends test plan data
  2. Backend generates DOCX in memory
  3. Streamed directly as download
  4. No disk storage needed
  5. No persistent files

**Advantages:**
- ✅ Works on serverless (Vercel, AWS Lambda, etc.)
- ✅ No storage costs
- ✅ No cleanup needed
- ✅ Instant download
- ✅ Better privacy (no files left behind)

### How Users Download Documents

When user clicks "📄 Export DOCX":

1. Frontend sends test plan to `/api/test-plan/download-docx`
2. Backend generates professional DOCX
3. File automatically downloads to browser's **Downloads** folder
4. Document appears with name: `{IssueKey}_TestPlan.docx`
   - Example: `SD-1_TestPlan.docx`

### Vercel Function Limits

If you need persistent storage later:

**Option 1: AWS S3**
```javascript
// Backend: Upload to S3 instead of disk
const s3 = new AWS.S3();
await s3.upload({
  Bucket: 'test-plans-bucket',
  Key: `${issueKey}_${Date.now()}.docx`,
  Body: docxBuffer
}).promise();
```

**Option 2: Vercel KV (Redis)**
```javascript
// Store in Vercel KV
import { kv } from '@vercel/kv';
await kv.setex(fileId, 86400, docxBuffer); // 24 hour expiry
```

**Option 3: Firebase Storage**
```javascript
// Cloud-agnostic solution
const bucket = admin.storage().bucket();
await bucket.file(`${issueKey}.docx`).save(docxBuffer);
```

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```powershell
# Make changes
git add .
git commit -m "Add feature X"
git push origin main

# Vercel automatically:
# 1. Detects the push
# 2. Builds the project
# 3. Deploys to production
# ✅ Live in seconds
```

## 🛠️ Vercel Environment Variables

Set in Vercel Dashboard under **Settings** → **Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `GROQ_API_KEY` | Your GROQ API key | ✅ Yes |
| `JIRA_EMAIL` | Your Jira email | ✅ Yes |
| `JIRA_API_TOKEN` | Your Jira API token | ✅ Yes |
| `JIRA_DOMAIN` | company.atlassian.net | ✅ Yes |
| `APP_PORT` | 3000 | ❌ No (auto-set) |

## 🧪 Test Deployment

After deploying to Vercel:

1. Visit your Vercel URL
2. Test connections:
   - Click "⚙️ Connections"
   - Test GROQ API
   - Test Jira connection
3. Generate a test plan:
   - Enter issue key: `SD-1`
   - Generate test plan
   - Download DOCX
4. ✅ Verify document downloads correctly

## 📊 Monitor Deployment

**Vercel Dashboard:**
- View logs: dashboard.vercel.com → Your project → Deployments
- Check function performance
- Review environment variables
- Manage custom domains

## 🐛 Troubleshooting

### Deployment fails with "Python not found"

Vercel doesn't include Python by default. Use:

**Option 1: Use Node-based alternative** (Recommended)
- Rewrite DOCX generation in Node.js

**Option 2: Use Docker**
```dockerfile
FROM node:18
RUN apt-get install -y python3 python3-pip
COPY . .
RUN pip install -r requirements.txt
```

### Environment variables not working

1. Ensure variables are set in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names match exactly

### DOCX download fails

1. Check backend logs in Vercel
2. Ensure all Python dependencies installed
3. Verify GROQ API is returning valid sections

### Document format is wrong

1. Check template exists and loads
2. Verify all sections are strings (not lists)
3. Review Python tool error logs

## 📞 Getting Help

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Issues**: Create issue in your repository
- **GROQ Docs**: https://console.groq.com/docs
- **Jira API**: https://developer.atlassian.com/cloud/jira/rest/v2/

## ✅ Deployment Checklist

- [ ] `.env` file created with all variables
- [ ] `.env.example` created for reference
- [ ] `.gitignore` properly configured
- [ ] `vercel.json` properly configured
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set in Vercel
- [ ] Initial deployment successful
- [ ] Test connections working
- [ ] Document generation working
- [ ] Downloads working correctly
- [ ] Custom domain configured (optional)

---

**Deployment complete! 🎉**

Your AI Test Plan Agent is now live on Vercel and ready to generate test plans from Jira issues!
