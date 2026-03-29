# ✅ Deployment Guide - GitHub Push & Vercel Deployment

## Current Status
- ✅ Code is ready to push
- ✅ Git repository initialized locally
- ✅ All files committed and ready
- ⏳ Needs GitHub authentication for push
- ⏳ Vercel deployment pending

---

## Step 1: Push to GitHub (Two Options)

### Option A: Using Personal Access Token (Recommended)

**Step 1.1: Create GitHub Personal Access Token**

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: `TestPlanGenerator-Push`
4. Select scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (update GitHub Actions)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

**Step 1.2: Push Code to GitHub**

Open PowerShell and run:

```powershell
cd D:\AITester\Chapter4_AIAGent

# Set the remote (if not done already)
git remote add origin https://github.com/nithijuly4-oss/TestPlanGenerator.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

When prompted for username:
- Username: `nithijuly4-oss` (or your GitHub username)

When prompted for password:
- **Paste your Personal Access Token** (not your password!)

**Expected output:**
```
Enumerating objects: 78, done.
...
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
✅ Successfully pushed!
```

---

### Option B: Using SSH (Advanced)

Skip this if Option A works. For SSH setup, see GitHub documentation on SSH keys.

---

## Step 2: Verify GitHub Push

After successful push:

1. Visit: https://github.com/nithijuly4-oss/TestPlanGenerator
2. Verify all files are there:
   - ✅ `server.js` (backend)
   - ✅ `frontend/` (React app)
   - ✅ `tools/` (Python scripts)
   - ✅ `package.json`
   - ✅ `vercel.json` (deployment config)
3. Check commit message appears

**You should see:**
```
TestPlanGenerator > Code > Initial commit: AI-powered Test Plan Generator...
```

---

## Step 3: Deploy to Vercel (Two Options)

### Option A: One-Click Deploy (Easy)

**Step 3.1: Visit Vercel**

Go to: https://vercel.com/new

**Step 3.2: Import GitHub Project**

1. Click "Import Project"
2. Enter GitHub URL: `https://github.com/nithijuly4-oss/TestPlanGenerator`
3. Click "Continue"
4. Click "Continue" on the configuration page

**Step 3.3: Set Environment Variables**

Before clicking "Deploy", add these variables:

| Variable Name | Value | Description |
|---|---|---|
| `GROQ_API_KEY` | `gsk_wGFCw8lz...` | Your GROQ API key |
| `JIRA_EMAIL` | `venkiikumar@gmail.com` | Your Jira email |
| `JIRA_API_TOKEN` | `ATATT3xFfGF0...` | Your Jira API token |
| `JIRA_DOMAIN` | `venkiikumar` | Your Jira domain |

**Step 3.4: Deploy**

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. You'll get a URL like: `https://test-plan-generator-xxx.vercel.app`

✅ **Deployment complete!**

---

### Option B: Deploy via Vercel CLI

**Step 3.1: Install Vercel CLI**

```powershell
npm install -g vercel
```

**Step 3.2: Login to Vercel**

```powershell
vercel login
```

Follow the prompts to authenticate.

**Step 3.3: Deploy**

```powershell
cd D:\AITester\Chapter4_AIAGent
vercel
```

**Step 3.4: Answer Prompts**

```
? Set up and deploy "~/Chapter4_AIAGent"? [Y/n] y
? Which scope do you want to deploy to? [Your Vercel account]
? Link to existing project? [y/N] n
? What's your project's name? test-plan-generator
? In which directory is your code located? ./
? Want to modify these settings? [y/N] n
```

**Step 3.5: Set Environment Variables**

When prompted, enter these environment variables:

```
GROQ_API_KEY=gsk_wGFCw8lz...
JIRA_EMAIL=venkiikumar@gmail.com
JIRA_API_TOKEN=ATATT3xFfGF0...
JIRA_DOMAIN=venkiikumar
```

**Step 3.6: Configure**

When asked if you want to override settings, press `N`.

✅ **Vercel CLI deployment complete!**

---

## Step 4: Find Your Environment Variables

### GROQ_API_KEY
1. Go to: https://console.groq.com/keys
2. Copy your API key
3. Looks like: `gsk_wGFCw8lz...`

### JIRA_EMAIL & JIRA_API_TOKEN
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Create new API token
3. Email: Your Jira email
4. Token: Looks like `ATATT3xFfGF0...`

### JIRA_DOMAIN
From your Jira URL: `https://{JIRA_DOMAIN}.atlassian.net`

Example: If your Jira is `https://venkiikumar.atlassian.net`, then `JIRA_DOMAIN=venkiikumar`

---

## Step 5: Test Vercel Deployment

After deployment:

1. **Visit your Vercel URL**
   - Example: `https://test-plan-generator-xxx.vercel.app`

2. **Test LLM Connection**
   - Click "Test Connection" in LLM section
   - Should show: ✅ Connected

3. **Test Jira Connection**
   - Enter your credentials
   - Click "Test Connection"
   - Should show: ✅ Connected

4. **Generate a Test Plan**
   - Enter an issue key (e.g., `SD-1`)
   - Click "Fetch Issue"
   - Click "Generate Test Plan"
   - Should show complete test plan

5. **Export DOCX**
   - Click "📄 Export DOCX"
   - File should download to your Downloads folder
   - Filename: `{IssueKey}_TestPlan.docx`

✅ **If all tests pass, you're deployed!**

---

## Troubleshooting

### Push to GitHub fails with "Permission denied"

**Solution:**
1. Make sure you're using a **Personal Access Token** (not your password)
2. Token must have `repo` scope
3. Try running: `git config --global credential.helper wincred`

### Vercel deployment fails

**Check these things:**
1. All environment variables are set
2. Node.js version is 18+ (Vercel default)
3. Build folder is `frontend/dist` (configured in `vercel.json`)
4. Check Vercel build logs for specific errors

### Downloads not working in Vercel

**Solution:**
- This should work automatically with the streaming endpoint
- Check that `/api/test-plan/download-docx` endpoint is working
- Try exporting to DOCX in Vercel

### LLM/Jira not connecting in Vercel

**Solution:**
1. Double-check environment variable values are correct
2. Make sure there are no extra spaces in values
3. Verify API keys are still active
4. Check Vercel logs: `vercel logs`

---

## After Deployment

### Get Your Live URL

```powershell
# If using CLI
vercel -p

# If using one-click, check Vercel dashboard at https://vercel.com/dashboard
```

### Monitor Your App

1. Vercel Dashboard: https://vercel.com/dashboard
2. View logs: https://vercel.com/dashboard/test-plan-generator (or your project)
3. Check analytics and deployments

### Update Code Later

To update your app later:

```powershell
cd D:\AITester\Chapter4_AIAGent

# Make changes...

git add .
git commit -m "Your message"
git push origin main

# Vercel automatically redeploys!
```

---

## Project Structure

Your repository now has:

```
TestPlanGenerator/
├── frontend/                    # React UI
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── api.js             # API client
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── tools/                      # Python scripts
│   ├── generate_test_plan.py  # GROQ LLM
│   ├── create_docx_plan.py    # DOCX generation
│   ├── fetch_jira_issue.py    # Jira API
│   └── export_pdf.py
├── server.js                   # Express backend
├── vercel.json                 # Vercel config
├── package.json
├── requirements.txt
└── README.md
```

---

## Features Deployed

✅ **AI-Powered Test Plans**
- Uses GROQ LLM for intelligent test plan generation
- Supports 13+ test plan sections

✅ **Jira Integration**
- Fetches issues from Jira Cloud
- Extracts title, description, acceptance criteria

✅ **Document Generation**
- Creates professional DOCX files
- Watermark-free output
- Searchable content

✅ **Vercel-Ready**
- Serverless deployment
- Direct document streaming to browser
- No persistent storage needed

✅ **Browser Downloads**
- Files download to Downloads folder
- Proper filename: `{IssueKey}_TestPlan.docx`
- Works on all browsers

---

## What's Next?

- Monitor Vercel deployment for any errors
- Share the live URL with your team
- Create test plans for your Jira issues
- Customize the template if needed

---

## Quick Reference

### Commands to Run

```powershell
# GitHub Push
cd D:\AITester\Chapter4_AIAGent
git push -u origin main

# Vercel Deploy (Option B)
vercel

# Check Vercel logs
vercel logs
```

### Key URLs

- **GitHub**: https://github.com/nithijuly4-oss/TestPlanGenerator
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GROQ API**: https://console.groq.com/keys
- **Jira API Tokens**: https://id.atlassian.com/manage-profile/security/api-tokens

---

## Support

For issues:
1. Check Vercel logs: https://vercel.com/dashboard
2. Check GitHub Actions (if available)
3. Verify environment variables in Vercel settings
4. Check network requests in browser DevTools

**Status: Ready for Production Deployment ✅**
