# 🚀 Test Plan Agent - AI-Powered Test Planning Tool

Intelligent test plan generation from Jira issues using advanced AI (GROQ LLM). Automatically generates comprehensive test plans in DOCX format with watermark-free templates.

## ✨ Features

- **🤖 AI-Powered**: Uses GROQ API for intelligent test plan generation from Jira issues
- **📋 Jira Integration**: Fetch issues directly from your Jira Cloud instance
- **📄 Professional Documents**: Generate clean, professional DOCX test plans
- **🗑️ Watermark-Free**: All template watermarks automatically removed
- **⚡ Fast Generation**: Complete test plans generated in seconds
- **🔒 Secure**: Your Jira credentials and API keys are encrypted
- **☁️ Cloud Ready**: Deploy to Vercel with one click

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │──(React + Vite)
│  Localhost  │
│   :5173     │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────────────┐
│     Backend (Node.js/Express)   │
│      Localhost :3000            │
└──────┬──────────────────────────┘
       │
       ├─→ 🤖 GROQ LLM API (Test Plan Generation)
       ├─→ 📋 Jira Cloud API (Issue Fetching)
       └─→ 🐍 Python Tools (DOCX Generation)
           ├─ create_docx_plan.py
           ├─ generate_test_plan.py
           └─ export_pdf.py
```

## 📋 Supported Sections

Test plans automatically include:
- **Objective** - Testing goals and scope
- **Scope** - What's included/excluded from testing
- **Inclusions** - Specific areas to test
- **Test Environments** - Browser/OS configurations
- **Defect Reporting** - How bugs are tracked
- **Test Strategy** - Testing approach
- **Test Schedule** - Timeline and phases
- **Test Deliverables** - Artifacts produced
- **Entry/Exit Criteria** - Start/end conditions
- **Risks** - Potential issues and mitigation
- **Tools** - Testing tools needed
- **Test Cases** - Detailed steps and expected results

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Jira Cloud account with API token
- GROQ API key (free tier available)

### Installation

1. **Clone repository**
```bash
git clone https://github.com/yourusername/test-plan-agent.git
cd test-plan-agent
```

2. **Install dependencies**
```bash
npm install
cd frontend && npm install && cd ..
pip install -r requirements.txt
```

3. **Configure environment**
Create `.env` file in root:
```env
GROQ_API_KEY=your_groq_api_key_here
JIRA_EMAIL=your_email@company.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_DOMAIN=your-domain.atlassian.net
APP_PORT=3000
```

4. **Start development servers**

Terminal 1 - Backend:
```bash
node server.js
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

5. **Access application**
- Frontend: http://localhost:5173/
- API Health: http://localhost:3000/api/health

## 📖 Usage

1. **Test Connections**
   - Click "⚙️ Connections"
   - Test LLM connection with GROQ API
   - Test Jira connection with your credentials

2. **Generate Test Plan**
   - Click "⚙️ Generate Plan"
   - Enter Jira issue key (e.g., "SD-1")
   - Click "Fetch Issue"
   - Click "Generate Test Plan"
   - Review generated sections

3. **Export Document**
   - Click "📄 Export DOCX"
   - Document downloads with:
     - All sections properly formatted
     - Test cases in table format
     - No watermarks or template artifacts
     - Professional styling

## 🌐 Deployment to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Ftest-plan-agent)

### Option 2: Manual Deployment

1. **Push to GitHub first** (see section below)

2. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Set environment variables in Vercel Dashboard**
   - `GROQ_API_KEY`
   - `JIRA_EMAIL`
   - `JIRA_API_TOKEN`
   - `JIRA_DOMAIN`

4. **Deploy**
   ```bash
   vercel --prod
   ```

## 📤 Push to GitHub

### First Time Setup

1. **Create repository on GitHub**
   - Go to https://github.com/new
   - Name: `test-plan-agent`
   - Description: "AI-Powered test plan generator from Jira issues"
   - Add README (skip, we have one)
   - Create repository

2. **Initialize git and push**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   
   git init
   git add .
   git commit -m "Initial commit: AI-powered test plan generator"
   git branch -M main
   git remote add origin https://github.com/yourusername/test-plan-agent.git
   git push -u origin main
   ```

3. **Create personal access token** (for HTTPS push)
   - Go to GitHub Settings → Personal access tokens → Generate new token
   - Give it `repo` access
   - Use token as password when prompted

### Subsequent Updates

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## 📁 Document Storage

### Local Development
- Documents saved to `.tmp/` folder
- File naming: `{UUID}.docx`
- Automatically cleaned up after download

### Vercel Production
- **Option 1 (Recommended)**: Direct streaming - documents generated in-memory and streamed directly to client
  - No persistent storage needed
  - Use endpoint: `/api/test-plan/download-docx` (POST)
  - Document deletes after user downloads

- **Option 2**: Cloud Storage (for persistence)
  - Use AWS S3, Google Cloud Storage, or Azure Blob Storage
  - Store documents with expiration (7 days)
  - Modify `create_docx_plan.py` to upload to cloud

- **Option 3**: Vercel KV or External Database
  - Store document metadata and blob
  - Retrieve by ID later

### Current Implementation
By default, the system uses **direct streaming** (Option 1) which is ideal for Vercel's serverless architecture.

## 🔧 API Endpoints

### Health Check
```
GET /api/health
```

### Jira Operations
```
POST /api/connections/test-jira
GET /api/jira/issue/{issueKey}
```

### LLM Operations
```
POST /api/connections/test-llm
POST /api/test-plan/generate
```

### Document Operations
```
POST /api/test-plan/create-docx
POST /api/test-plan/download-docx (Vercel-optimized)
POST /api/test-plan/export-pdf
GET /api/download/{fileId}
```

## 🐍 Python Tools

### `generate_test_plan.py`
- Generates test plan JSON using GROQ LLM
- Input: Issue title, description, acceptance criteria
- Output: JSON with all test plan sections

### `create_docx_plan.py`
- Converts JSON to professional DOCX document
- Removes all watermarks and template artifacts
- Handles string and list content types
- Adds test cases in table format

### `export_pdf.py`
- Converts DOCX to PDF (requires LibreOffice)
- Optional - PDF conversion not required for Vercel

## 📊 Environment Variables

```env
# GROQ LLM Configuration
GROQ_API_KEY=xxx                    # Your GROQ API key
GROQ_MODEL=openai/gpt-oss-120b      # LLM model (optional)

# Jira Configuration
JIRA_EMAIL=user@company.com         # Your Jira email
JIRA_API_TOKEN=xxx                  # Your Jira API token
JIRA_DOMAIN=company.atlassian.net   # Your Jira domain

# Server Configuration
APP_PORT=3000                       # Backend port (optional)
```

## 🗂️ Project Structure

```
test-plan-agent/
├── backend/
│   ├── server.js                  # Express backend
│   ├── tools/
│   │   ├── generate_test_plan.py  # LLM test plan generation
│   │   ├── create_docx_plan.py    # DOCX creation
│   │   ├── export_pdf.py          # PDF export
│   │   └── fetch_jira_issue.py    # Jira integration
│   └── requirements.txt           # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GeneratePlan.jsx   # Main generation UI
│   │   │   └── ConnectionTest.jsx # Connection testing UI
│   │   ├── api.js                 # API client
│   │   └── App.jsx                # Main app
│   ├── package.json
│   └── vite.config.js
├── vercel.json                    # Vercel deployment config
├── .gitignore
├── .env.example
└── README.md
```

## 🐛 Troubleshooting

### "Failed to create document" error
- Check Python version (3.8+)
- Install python-docx: `pip install python-docx`
- Check temporary file permissions

### Jira connection fails
- Verify API token (not password)
- Ensure email is correct
- Check Jira domain format

### GROQ connection fails
- Verify API key
- Check internet connection
- Confirm GROQ account has credits

### PDF export doesn't work
- LibreOffice not installed (optional on Vercel)
- DOCX export works fine without PDF

## 📝 License

MIT License - see LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/test-plan-agent/issues
- Email: your.email@company.com

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Custom document templates
- [ ] Batch processing multiple issues
- [ ] Document history and versioning
- [ ] Team collaboration features
- [ ] API rate limiting and analytics
