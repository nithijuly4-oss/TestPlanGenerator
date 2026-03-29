import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Error handling for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON Parse Error:', err.message);
    console.error('Body:', req.body);
    return res.status(400).json({
      error: 'Invalid JSON',
      message: err.message,
      details: 'The request body contains invalid JSON. Please check the data being sent.'
    });
  }
  next();
});

// Session-like storage for connections (in-memory, replace with Redis in production)
const connectionStates = {};

// ============================================
// Helper: Run Python Tool
// ============================================
function runPythonTool(toolPath, args = []) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [toolPath, ...args], {
      cwd: __dirname
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          // Extract JSON from output
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            reject(new Error(`No JSON found in output: ${stdout}`));
            return;
          }
          const result = JSON.parse(jsonMatch[0]);
          resolve(result);
        } catch (e) {
          console.error('JSON parse error:', e.message);
          console.error('stdout:', stdout);
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      } else {
        reject(new Error(`Python tool failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Test Planner Agent API'
  });
});

// Test LLM Connection
app.post('/api/connections/test-llm', async (req, res) => {
  try {
    console.log('🔍 Testing LLM connection...');
    const result = await runPythonTool(path.join(__dirname, 'tools', 'test_groq_connection.py'));
    
    if (result.status === 'connected') {
      connectionStates.llm = {
        status: 'connected',
        model: result.model,
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000 // 30 minutes
      };
      console.log('✅ LLM Connected');
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Test Jira Connection
app.post('/api/connections/test-jira', async (req, res) => {
  try {
    console.log('🔍 Testing Jira connection...');
    const result = await runPythonTool(path.join(__dirname, 'tools', 'test_jira_connection.py'));
    
    if (result.status === 'connected') {
      connectionStates.jira = {
        status: 'connected',
        user_email: result.user_email,
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000 // 30 minutes
      };
      console.log('✅ Jira Connected');
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get Connection Status
app.get('/api/connections/status', (req, res) => {
  const status = {
    llm: connectionStates.llm?.status === 'connected' ? 'connected' : 'disconnected',
    jira: connectionStates.jira?.status === 'connected' ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  };
  res.json(status);
});

// Fetch Jira Issue
app.get('/api/jira/issue/:issueKey', async (req, res) => {
  try {
    if (!connectionStates.jira || connectionStates.jira.status !== 'connected') {
      return res.status(400).json({
        error: 'Jira not connected',
        message: 'Please test Jira connection first'
      });
    }

    console.log(`📋 Fetching Jira issue: ${req.params.issueKey}`);
    const result = await runPythonTool(
      path.join(__dirname, 'tools', 'fetch_jira_issue.py'),
      [req.params.issueKey]
    );

    console.log('Jira issue fetch result:', result); // Log the response

    res.json(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Generate Test Plan
app.post('/api/test-plan/generate', async (req, res) => {
  try {
    if (!connectionStates.llm || connectionStates.llm.status !== 'connected') {
      return res.status(400).json({
        error: 'LLM not connected',
        message: 'Please test LLM connection first'
      });
    }

    const { issueTitle, issueDescription, acceptanceCriteria } = req.body;

    if (!issueTitle) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'issueTitle is required'
      });
    }

    console.log(`🧠 Generating test plan for: ${issueTitle}`);
    
    const args = [issueTitle, issueDescription || 'No description'];
    if (acceptanceCriteria && Array.isArray(acceptanceCriteria)) {
      args.push(...acceptanceCriteria);
    }

    const result = await runPythonTool(
      path.join(__dirname, 'tools', 'generate_test_plan.py'),
      args
    );
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Create DOCX from Test Plan
app.post('/api/test-plan/create-docx', async (req, res) => {
  try {
    const { issueKey, issueTitle, testPlanSections } = req.body;

    console.log(`📄 Creating DOCX for: ${issueKey}`);
    console.log(`   Title: ${issueTitle}`);
    console.log(`   Sections type: ${typeof testPlanSections}`);
    console.log(`   Sections keys: ${Object.keys(testPlanSections || {}).join(', ')}`);

    if (!issueKey || !issueTitle || !testPlanSections) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'issueKey, issueTitle, and testPlanSections are required'
      });
    }

    // Save test plan sections to temp JSON file
    const tempJsonPath = path.join(__dirname, '.tmp', `temp_plan_${Date.now()}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(testPlanSections, null, 2), 'utf-8');

    const result = await runPythonTool(
      path.join(__dirname, 'tools', 'create_docx_plan.py'),
      [issueKey, issueTitle, tempJsonPath]
    );

    // Clean up temp JSON
    try {
      fs.unlinkSync(tempJsonPath);
    } catch (e) {
      console.warn('Could not delete temp JSON file:', e.message);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Export to PDF
app.post('/api/test-plan/export-pdf', async (req, res) => {
  try {
    const { docxFilePath } = req.body;

    if (!docxFilePath) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'docxFilePath is required'
      });
    }

    console.log(`📄 Exporting to PDF: ${docxFilePath}`);

    const result = await runPythonTool(
      path.join(__dirname, 'tools', 'export_pdf.py'),
      [docxFilePath]
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Download file
app.get('/api/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  const { format } = req.query;
  
  const filePath = format === 'pdf' 
    ? path.join(__dirname, '.tmp', `${fileId}.pdf`)
    : path.join(__dirname, '.tmp', `${fileId}.docx`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'File not found',
      message: `The file ${fileId}.${format || 'docx'} was not found`
    });
  }
  
  const fileName = `TestPlan_${fileId}.${format || 'docx'}`;
  const mimeType = format === 'pdf' 
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Download error:', err);
    }
  });
});

// Direct download endpoint - generates and streams document (Vercel-friendly)
app.post('/api/test-plan/download-docx', async (req, res) => {
  try {
    const { issueKey, issueTitle, testPlanSections } = req.body;

    if (!issueKey || !issueTitle || !testPlanSections) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'issueKey, issueTitle, and testPlanSections are required'
      });
    }

    console.log(`📥 Direct download DOCX for: ${issueKey}`);

    // Save test plan sections to temp JSON file
    const tempJsonPath = path.join(__dirname, '.tmp', `temp_plan_${Date.now()}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(testPlanSections, null, 2), 'utf-8');

    // Generate DOCX
    const result = await runPythonTool(
      path.join(__dirname, 'tools', 'create_docx_plan.py'),
      [issueKey, issueTitle, tempJsonPath]
    );

    // Clean up temp JSON
    try {
      fs.unlinkSync(tempJsonPath);
    } catch (e) {
      console.warn('Could not delete temp JSON file:', e.message);
    }

    if (result.status !== 'success' || !result.file_path) {
      throw new Error(result.message || 'Failed to generate document');
    }

    // Read the file as buffer and stream directly (Vercel-compatible, no persistent storage)
    const filePath = result.file_path;
    if (!fs.existsSync(filePath)) {
      throw new Error('Generated file not found');
    }

    const fileName = `${issueKey}_TestPlan.docx`;
    const fileBuffer = fs.readFileSync(filePath);
    
    // Set headers for browser download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    // Send file buffer directly
    res.send(fileBuffer);
    
    // Clean up temp file after response is sent
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Could not delete generated file:', e.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Download File (Legacy support)
app.get('/api/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { format } = req.query;

    // Convert fileId to actual file path (security: validate this)
    const fileName = fileId + (format === 'pdf' ? '.pdf' : '.docx');
    const filePath = path.join(__dirname, '.tmp', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: `File ${fileName} not found`
      });
    }

    console.log(`📥 Downloading: ${fileName}`);
    res.download(filePath);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================
// Error Handling
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Test Planner Agent API Server Running`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50) + '\n');
});
