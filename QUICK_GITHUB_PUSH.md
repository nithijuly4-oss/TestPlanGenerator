# Quick GitHub Push - Step by Step

## ⚠️ You Need: GitHub Personal Access Token

### Get Your Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Fill in:
   - Token name: `TestPlanGenerator` 
   - Expiration: `90 days` (or your preference)
4. Check these scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` 
5. Click **"Generate token"**
6. **COPY THE TOKEN** - You won't see it again!

---

## Push Your Code - Command Line

Open PowerShell in your project folder:

```powershell
cd D:\AITester\Chapter4_AIAGent
```

Then run this command and enter your credentials when prompted:

```powershell
git push -u origin main
```

When prompted:
- **Username**: `nithijuly4-oss`
- **Password**: Paste your **Personal Access Token** (not your GitHub password!)

---

## OR: Use an Easier Method - Git Credentials Manager

Run this to store credentials permanently:

```powershell
# Enable credential caching
git config --global credential.helper wincred

# Then push
git push -u origin main

# Enter credentials once, they'll be saved
```

---

## OR: Run the PowerShell Script

I've created an automated script for you:

```powershell
# Run the script
D:\AITester\Chapter4_AIAGent\push_to_github.ps1
```

The script will:
1. Ask for your authentication method
2. Configure git with your token
3. Push to GitHub automatically
4. Show you the results

---

## Verify Push Success

After running the push command, check:

1. **GitHub Repository**: https://github.com/nithijuly4-oss/TestPlanGenerator
2. Should see: Files, commit, and branches
3. Latest commit message: "Initial commit: AI-powered Test Plan Generator..."

---

## Then Deploy to Vercel

Once pushed to GitHub:

### Option 1: One-Click Import (Easiest)

1. Visit: https://vercel.com/new
2. Click "Import Git Repository"
3. Paste: `https://github.com/nithijuly4-oss/TestPlanGenerator`
4. Click "Continue"
5. Before deploying, add **Environment Variables**:

```
GROQ_API_KEY = gsk_wGFCw8lz...
JIRA_EMAIL = venkiikumar@gmail.com
JIRA_API_TOKEN = ATATT3xFfGF0...
JIRA_DOMAIN = venkiikumar
```

6. Click "Deploy"
7. Wait 2-3 minutes for build
8. Get your live URL! 🎉

### Option 2: Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd D:\AITester\Chapter4_AIAGent
vercel

# Follow prompts
```

---

## Environment Variable Values

You already have these from Phase 4 testing:

| Variable | Example | Where to Get |
|---|---|---|
| `GROQ_API_KEY` | `gsk_wGFCw8lz...` | https://console.groq.com/keys |
| `JIRA_EMAIL` | `venkiikumar@gmail.com` | Your Jira email |
| `JIRA_API_TOKEN` | `ATATT3xFfGF0...` | https://id.atlassian.com/manage-profile/security/api-tokens |
| `JIRA_DOMAIN` | `venkiikumar` | From your Jira URL: `https://venkiikumar.atlassian.net` |

---

## Expected Push Output

```
Enumerating objects: 78, done.
Counting objects: 100% (78/78), done.
Delta compression using up to 8 threads
Compressing objects: 100% (68/68), done.
Writing objects: 100% (78/78), 14.67 MiB | 5.00 MiB/s, done.
Total 78 (delta 0), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (0/0), done.
To https://github.com/nithijuly4-oss/TestPlanGenerator.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.

✅ Push successful!
```

---

## Troubleshooting

### "Permission denied" or 403 error

**Solutions:**
1. Make sure token has `repo` scope
2. Token must be FRESH (create a new one if old)
3. Make sure you're pasting the token, not your password
4. Try: `git push -u origin main -v` (verbose mode) to see what's failing

### "Repository not found"

**Solutions:**
1. Verify repository exists: https://github.com/nithijuly4-oss/TestPlanGenerator
2. Make sure the repository is PUBLIC or you have access
3. Try without the `.git` extension: `https://github.com/nithijuly4-oss/TestPlanGenerator`

### "fatal: branch not tracked"

**Solution:**
Just run the command as-is: `git push -u origin main`

The `-u` flag creates the tracking automatically.

---

## Ready to Deploy! 🚀

Once GitHub push is successful:

1. ✅ Code is on GitHub
2. ✅ Deploy to Vercel (one-click or CLI)
3. ✅ Get your live URL
4. ✅ Share with your team

**Status: All set up, just need your GitHub auth! 🎯**
