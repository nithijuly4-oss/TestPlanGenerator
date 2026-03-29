$gitHubUsername = "nithijuly4-oss"
$gitHubRepo = "TestPlanGenerator"
$githubUrl = "https://github.com/$gitHubUsername/$gitHubRepo.git"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "GitHub Push Automation Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will push your code to GitHub." -ForegroundColor Yellow
Write-Host "You will need to provide authentication." -ForegroundColor Yellow
Write-Host ""

Write-Host "Repository: $githubUrl" -ForegroundColor Green
Write-Host ""

# Check if git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git found" -ForegroundColor Green
Write-Host ""

# Navigate to project
$projectPath = "D:\AITester\Chapter4_AIAGent"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Project path not found: $projectPath" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "✅ Changed to project directory: $projectPath" -ForegroundColor Green
Write-Host ""

# Check if git repo exists
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git repository not initialized" -ForegroundColor Red
    Write-Host "Run: git init" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git repository detected" -ForegroundColor Green
Write-Host ""

# Check git status
Write-Host "Current git status:" -ForegroundColor Cyan
$gitStatus = git status
Write-Host $gitStatus
Write-Host ""

# Ask for authentication method
Write-Host "Authentication Method:" -ForegroundColor Yellow
Write-Host "1. Personal Access Token (Recommended)" -ForegroundColor Green
Write-Host "2. GitHub Username + Password" -ForegroundColor White
Write-Host "3. Exit" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Select option (1, 2, or 3)"

if ($choice -eq "3") {
    Write-Host "Exiting..." -ForegroundColor Yellow
    exit 0
}

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "🔐 Using Personal Access Token" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Get your token from: https://github.com/settings/tokens" -ForegroundColor Yellow
    Write-Host "Required scopes: repo, workflow" -ForegroundColor Yellow
    Write-Host ""
    
    $token = Read-Host "Paste your Personal Access Token (input will be hidden)" -AsSecureString
    $tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($token))
    
    # Configure git to use the token
    $authUrl = "https://${gitHubUsername}:${tokenPlain}@github.com/${gitHubUsername}/${gitHubRepo}.git"
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "🔐 Using Username + Password" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Username (usually your GitHub login):" -ForegroundColor Yellow
    $username = Read-Host
    
    Write-Host "GitHub Password or Token:" -ForegroundColor Yellow
    $password = Read-Host -AsSecureString
    $passwordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))
    
    $authUrl = "https://${username}:${passwordPlain}@github.com/${gitHubUsername}/${gitHubRepo}.git"
} else {
    Write-Host "Invalid option" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting remote..." -ForegroundColor Cyan

# Remove existing remote if it exists
git remote remove origin 2>$null

# Add remote with authentication
git remote add origin $authUrl 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote configured" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure remote" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Verifying branch..." -ForegroundColor Cyan

# Rename branch to main
git branch -M main 2>&1
Write-Host "✅ Branch is main" -ForegroundColor Green

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "This may take a minute..." -ForegroundColor Yellow
Write-Host ""

# Push to GitHub
git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: https://github.com/$gitHubUsername/$gitHubRepo" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Visit your repository to verify all files are there" -ForegroundColor Yellow
    Write-Host "2. Deploy to Vercel: https://vercel.com/new" -ForegroundColor Yellow
    Write-Host "3. Set environment variables in Vercel:" -ForegroundColor Yellow
    Write-Host "   - GROQ_API_KEY" -ForegroundColor White
    Write-Host "   - JIRA_EMAIL" -ForegroundColor White
    Write-Host "   - JIRA_API_TOKEN" -ForegroundColor White
    Write-Host "   - JIRA_DOMAIN" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "❌ Push failed" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "1. Token/password is incorrect" -ForegroundColor Yellow
    Write-Host "2. Repository doesn't exist on GitHub" -ForegroundColor Yellow
    Write-Host "3. You don't have push access to this repository" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Green
    Write-Host "1. Verify your token has 'repo' scope: https://github.com/settings/tokens" -ForegroundColor Green
    Write-Host "2. Make sure repository exists: https://github.com/$gitHubUsername/$gitHubRepo" -ForegroundColor Green
    Write-Host "3. Use 'git push -u origin main -v' for verbose output" -ForegroundColor Green
    exit 1
}
