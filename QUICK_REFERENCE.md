# 📋 Quick Reference - GitHub & Vercel Deployment

## 🟢 Ready to Deploy!

Your code is committed and ready. Just follow these 5 steps.

---

## Step 1️⃣: GitHub Token (2 min)

```
https://github.com/settings/tokens
  ↓
"Generate new token (classic)"
  ↓
Name: TestPlanGenerator
Scope: repo, workflow
  ↓
Generate → COPY the token
```

**Save this token safely! You'll need it next.**

---

## Step 2️⃣: Push to GitHub (5 min)

```powershell
cd D:\AITester\Chapter4_AIAGent
git push -u origin main
```

**When prompted:**
- Username: `nithijuly4-oss`
- Password: **Paste your token** (from Step 1)

**Expected output:**
```
Branch 'main' set up to track remote branch 'main' from 'origin'
✅ Success!
```

---

## Step 3️⃣: Verify Push (1 min)

```
https://github.com/nithijuly4-oss/TestPlanGenerator
```

✅ Should see files, commit, and main branch

---

## Step 4️⃣: Deploy to Vercel (10 min)

```
https://vercel.com/new
  ↓
"Import Git Repository"
  ↓
Paste: https://github.com/nithijuly4-oss/TestPlanGenerator
  ↓
"Continue"
```

**Add Environment Variables:**
```
GROQ_API_KEY = gsk_wGFCw8lz...
JIRA_EMAIL = venkiikumar@gmail.com
JIRA_API_TOKEN = ATATT3xFfGF0...
JIRA_DOMAIN = venkiikumar
```

**Then: "Deploy"**

⏳ Wait 2-3 min for build...

✅ You'll get a live URL!

---

## Step 5️⃣: Test It (5 min)

1. Visit your Vercel URL
2. Test LLM: Click test connection → ✅ Should show "Connected"
3. Test Jira: Click test connection → ✅ Should show "Connected"
4. Fetch issue: `SD-1` → ✅ Should show issue
5. Generate plan → ✅ Should show test plan
6. Export DOCX → ✅ Should download file

---

## ✅ Done!

Your app is now live and deployed!

**New URL**: `https://test-plan-generator-xxx.vercel.app`

**Auto-redeploys on every GitHub push!**

---

## Values Reference

Find these for environment variables:

| Variable | Where to Get | Example |
|----------|---|---|
| GROQ_API_KEY | https://console.groq.com/keys | gsk_wGFCw8lz... |
| JIRA_EMAIL | Your email | venkiikumar@gmail.com |
| JIRA_API_TOKEN | https://id.atlassian.com/manage-profile/security/api-tokens | ATATT3xFfGF0... |
| JIRA_DOMAIN | Your Jira URL | venkiikumar |

---

## If Something Goes Wrong

**Push fails:**
- Make sure you used your **Personal Access Token**
- Not your GitHub password!
- Token must have `repo` scope

**Vercel deploy fails:**
- Check build logs in Vercel dashboard
- Make sure environment variables are set
- Check for typos

**App not connecting to APIs:**
- Verify all 4 environment variables in Vercel
- Check values don't have extra spaces
- Verify API keys are still valid

---

## Time Total

| Step | Time |
|------|------|
| 1. Token | 2 |
| 2. Push | 5 |
| 3. Verify | 1 |
| 4. Deploy | 13 |
| 5. Test | 5 |
| **TOTAL** | **~30 min** |

---

## Links

- **GitHub Repo**: https://github.com/nithijuly4-oss/TestPlanGenerator
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Live App**: (provided after Step 4)

---

**Ready? Start at Step 1️⃣ above! 🚀**
