import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';

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
// Helper: Run Python Tool (with timeout)
// ============================================
function runPythonTool(toolPath, args = []) {
  return new Promise((resolve, reject) => {
    let python;
    let timeout;

    python = spawn('python', [toolPath, ...args], {
      cwd: __dirname
    });

    timeout = setTimeout(() => {
      python.kill('SIGTERM');
      reject(new Error('Python tool timeout - attempting direct API call instead'));
    }, 10000); // 10 second timeout

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      clearTimeout(timeout);
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

    python.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

// ============================================
// Helper: Test GROQ Connection (Direct API)
// ============================================
async function testGroqConnectionDirect(apiKey) {
  try {
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Say "Connection successful" in exactly 3 words.'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    if (response.data.choices && response.data.choices[0]) {
      return {
        status: 'connected',
        provider: 'groq',
        model: model,
        message: 'GROQ API connection successful',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    throw error;
  }
}

// ============================================
// Helper: Create DOCX with python-docx (Direct Node.js)
// ============================================
async function createDocxDirect(issueKey, issueTitle, testPlanSections) {
  try {
    // For Vercel, we'll rely on the Python tool via fallback
    // This is a placeholder for potential pure-JS implementation
    // Currently, we need Python for DOCX creation, so we return a marker
    throw new Error('Direct DOCX creation not implemented - using Python fallback');
  } catch (error) {
    throw error;
  }
}

// ============================================
// Helper: Generate Test Plan with GROQ (Direct API)
// ============================================
async function generateTestPlanDirect(issueTitle, issueDescription, acceptanceCriteria, apiKey) {
  try {
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    
    const prompt = `You are an expert QA engineer. Create a comprehensive test plan for the following issue:

Title: ${issueTitle}
Description: ${issueDescription}
${acceptanceCriteria && acceptanceCriteria.length > 0 ? `Acceptance Criteria:\n${acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

Generate test plan with these sections (use JSON format):
{
  "test_scenarios": ["scenario 1", "scenario 2", ...],
  "test_cases": [
    {
      "id": "TC-001",
      "title": "Test case title",
      "steps": ["step 1", "step 2", ...],
      "expected_result": "what should happen"
    }
  ],
  "edge_cases": ["edge case 1", ...],
  "automation_notes": "Automation recommendations"
}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data.choices && response.data.choices[0]) {
      const content = response.data.choices[0].message.content;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const testPlan = JSON.parse(jsonMatch[0]);
        return {
          status: 'success',
          test_plan: testPlan,
          message: 'Test plan generated successfully'
        };
      }
      return {
        status: 'success',
        test_plan: {
          description: content
        },
        message: 'Test plan generated (unstructured format)'
      };
    }
  } catch (error) {
    throw error;
  }
}

// ============================================
// Helper: Test Jira Connection (Direct API)
// ============================================
async function testJiraConnectionDirect(email, apiToken, jiraDomain) {
  try {
    // Trim credentials
    email = email?.trim();
    apiToken = apiToken?.trim();
    jiraDomain = jiraDomain?.trim();

    const baseUrl = jiraDomain.startsWith('http') 
      ? jiraDomain 
      : `https://${jiraDomain}.atlassian.net`;
    
    // Create basic auth header manually (more reliable than axios auth object on Vercel)
    const authString = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    const response = await axios.get(
      `${baseUrl}/rest/api/3/myself`,
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'TestPlanAgent/1.0'
        },
        timeout: 8000
      }
    );

    const user = response.data;
    
    return {
      status: 'connected',
      provider: 'jira',
      user: user.emailAddress || user.email || email,
      displayName: user.displayName || 'Unknown',
      message: 'Jira API connection successful',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw error;
  }
}

// ============================================
// Helper: Fetch Jira Issue (Direct API)
// ============================================
async function fetchJiraIssueDirect(issueKey, email, apiToken, jiraDomain) {
  try {
    // Trim credentials
    email = email?.trim();
    apiToken = apiToken?.trim();
    jiraDomain = jiraDomain?.trim();

    const baseUrl = jiraDomain.startsWith('http') 
      ? jiraDomain 
      : `https://${jiraDomain}.atlassian.net`;
    
    const url = `${baseUrl}/rest/api/3/issues/${issueKey}`;
    console.log(`📋 Making Jira Issue Request:`);
    console.log(`   Full URL: ${url}`);
    console.log(`   Method: GET`);
    console.log(`   Auth: Basic (${email})`);
    
    // Create basic auth header manually (more reliable than axios auth object on Vercel)
    const authString = Buffer.from(`${email}:${apiToken}`).toString('base64');
    
    const response = await axios.get(
      url,
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'TestPlanAgent/1.0'
        },
        timeout: 8000
      }
    );

    const issue = response.data;
    console.log(`✅ Jira API returned issue: ${issue.key}`);
    
    return {
      status: 'found',
      issueKey: issue.key,
      title: issue.fields.summary,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || 
                   issue.fields.description || 
                   'No description provided',
      acceptanceCriteria: issue.fields.customfield_10028 || [],
      priority: issue.fields.priority?.name || 'Medium',
      status: issue.fields.status?.name || 'To Do',
      assignee: issue.fields.assignee?.displayName || 'Unassigned'
    };
  } catch (error) {
    console.error('❌ fetchJiraIssueDirect FULL ERROR:');
    console.error(`   Status: ${error.response?.status} ${error.response?.statusText}`);
    console.error(`   Jira Error Messages:`, error.response?.data?.errorMessages);
    console.error(`   Jira Errors:`, error.response?.data?.errors);
    console.error(`   Full Response:`, JSON.stringify(error.response?.data));
    console.error(`   Message: ${error.message}`);
    throw error;
  }
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

// Debug: Check environment variables (for troubleshooting only)
app.get('/api/debug/env', (req, res) => {
  // Only allow in development or with a secret key
  const secretKey = req.query.secret;
  if (process.env.NODE_ENV === 'production' && secretKey !== process.env.DEBUG_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  res.json({
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    jira: {
      JIRA_EMAIL: process.env.JIRA_EMAIL ? '✅ SET' : '❌ NOT SET',
      JIRA_API_TOKEN: process.env.JIRA_API_TOKEN ? '✅ SET (length: ' + process.env.JIRA_API_TOKEN.length + ')' : '❌ NOT SET',
      JIRA_DOMAIN: process.env.JIRA_DOMAIN ? '✅ SET: ' + process.env.JIRA_DOMAIN : '❌ NOT SET',
      JIRA_CLOUD_URL: process.env.JIRA_CLOUD_URL ? '✅ SET: ' + process.env.JIRA_CLOUD_URL : '❌ NOT SET'
    },
    groq: {
      GROQ_API_KEY: process.env.GROQ_API_KEY ? '✅ SET' : '❌ NOT SET'
    },
    resolved_jira_domain: process.env.JIRA_DOMAIN || process.env.JIRA_CLOUD_URL || 'NOT FOUND'
  });
});

// Test LLM Connection
app.post('/api/connections/test-llm', async (req, res) => {
  try {
    console.log('🔍 Testing LLM connection...');
    
    const apiKey = req.body.apiKey || process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        status: 'error',
        message: 'GROQ API key not provided or configured'
      });
    }

    // Try direct API call first (works on Vercel)
    try {
      const result = await testGroqConnectionDirect(apiKey);
      connectionStates.llm = {
        status: 'connected',
        model: result.model,
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000
      };
      console.log('✅ LLM Connected');
      return res.json(result);
    } catch (directError) {
      console.log('Direct API call failed, trying Python tool...');
      // Fallback to Python tool
      const result = await runPythonTool(path.join(__dirname, 'tools', 'test_groq_connection.py'));
      
      if (result.status === 'connected') {
        connectionStates.llm = {
          status: 'connected',
          model: result.model,
          timestamp: Date.now(),
          ttl: 30 * 60 * 1000
        };
        console.log('✅ LLM Connected');
      }
      
      return res.json(result);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to test LLM connection'
    });
  }
});

// Test Jira Connection
app.post('/api/connections/test-jira', async (req, res) => {
  try {
    console.log('🔍 Testing Jira connection...');
    
    let email = req.body.email || process.env.JIRA_EMAIL;
    let apiToken = req.body.apiToken || process.env.JIRA_API_TOKEN;
    let jiraDomain = req.body.jiraDomain || process.env.JIRA_DOMAIN || process.env.JIRA_CLOUD_URL;
    
    // Trim whitespace from credentials (critical for Vercel)
    if (email) email = email.trim();
    if (apiToken) apiToken = apiToken.trim();
    if (jiraDomain) jiraDomain = jiraDomain.trim();
    
    if (!email || !apiToken || !jiraDomain) {
      return res.status(400).json({
        status: 'error',
        message: 'Jira credentials not provided or configured'
      });
    }

    // Try direct API call first (works on Vercel)
    try {
      const result = await testJiraConnectionDirect(email, apiToken, jiraDomain);
      connectionStates.jira = {
        status: 'connected',
        user_email: result.user,
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000
      };
      console.log('✅ Jira Connected');
      return res.json(result);
    } catch (directError) {
      console.log('Direct API call failed:', directError.message);
      
      // On Vercel, don't try Python fallback
      if (process.env.VERCEL) {
        return res.status(500).json({
          status: 'error',
          message: directError.response?.data?.errorMessages?.[0] || 
                   directError.message ||
                   'Failed to connect to Jira. Please verify your credentials and domain.'
        });
      }
      
      // Fallback to Python tool for local environments
      try {
        const result = await runPythonTool(path.join(__dirname, 'tools', 'test_jira_connection.py'));
        
        if (result.status === 'connected') {
          connectionStates.jira = {
            status: 'connected',
            user_email: result.user_email,
            timestamp: Date.now(),
            ttl: 30 * 60 * 1000
          };
          console.log('✅ Jira Connected via Python');
        }
        
        return res.json(result);
      } catch (pythonError) {
        throw directError; // Throw the original error if both fail
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to test Jira connection'
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
    let email = process.env.JIRA_EMAIL;
    let apiToken = process.env.JIRA_API_TOKEN;
    let jiraDomain = process.env.JIRA_DOMAIN || process.env.JIRA_CLOUD_URL;

    // Trim whitespace from credentials (critical for Vercel)
    if (email) email = email.trim();
    if (apiToken) apiToken = apiToken.trim();
    if (jiraDomain) jiraDomain = jiraDomain.trim();

    if (!email || !apiToken || !jiraDomain) {
      console.error('❌ Jira credentials missing:', {
        email: !!email,
        apiToken: !!apiToken,
        jiraDomain: !!jiraDomain,
        JIRA_EMAIL: !!process.env.JIRA_EMAIL,
        JIRA_API_TOKEN: !!process.env.JIRA_API_TOKEN,
        JIRA_DOMAIN: !!process.env.JIRA_DOMAIN,
        JIRA_CLOUD_URL: !!process.env.JIRA_CLOUD_URL
      });
      return res.status(400).json({
        error: 'Jira not configured',
        message: 'Jira credentials not found in environment variables'
      });
    }

    console.log(`📋 Fetching Jira issue: ${req.params.issueKey}`);
    console.log(`   Domain (trimmed): ${jiraDomain}`);
    console.log(`   Email (trimmed): ${email}`);

    // Try direct API call first (works on Vercel)
    try {
      const result = await fetchJiraIssueDirect(req.params.issueKey, email, apiToken, jiraDomain);
      console.log('✅ Jira issue fetched via direct API');
      return res.json(result);
    } catch (directError) {
      console.error('Direct API error details:', {
        status: directError.response?.status,
        statusText: directError.response?.statusText,
        errorMessages: directError.response?.data?.errorMessages,
        errors: directError.response?.data?.errors
      });

      // Handle specific Jira API errors
      if (directError.response?.status === 404) {
        console.log(`⚠️ Jira returned 404 for issue: ${req.params.issueKey}`);
        console.log(`   Response: ${JSON.stringify(directError.response.data)}`);
        return res.status(404).json({
          status: 'error',
          message: `Issue ${req.params.issueKey} not found in Jira. Verify the issue exists and check your Jira domain configuration.`,
          jiraResponse: directError.response.data
        });
      }
      
      if (directError.response?.status === 401) {
        console.log('❌ Jira authentication failed - Invalid credentials');
        return res.status(401).json({
          status: 'error',
          message: 'Jira authentication failed. Invalid email or API token.'
        });
      }

      if (directError.response?.status === 403) {
        console.log('❌ Jira access forbidden');
        return res.status(403).json({
          status: 'error',
          message: 'Jira access forbidden. Your account may not have permission to access this issue.'
        });
      }
      
      console.log('Direct API call failed, trying Python tool...');
      // Fallback to Python tool
      try {
        const result = await runPythonTool(
          path.join(__dirname, 'tools', 'fetch_jira_issue.py'),
          [req.params.issueKey]
        );
        console.log('✅ Jira issue fetched via Python tool');
        return res.json(result);
      } catch (pythonError) {
        throw directError; // Throw the direct error if both fail
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({
      status: 'error',
      message: error.message || 'Failed to fetch Jira issue'
    });
  }
});

// Generate Test Plan
app.post('/api/test-plan/generate', async (req, res) => {
  try {
    const { issueTitle, issueDescription, acceptanceCriteria } = req.body;

    if (!issueTitle) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'issueTitle is required'
      });
    }

    console.log(`🧠 Generating test plan for: ${issueTitle}`);
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'GROQ not configured',
        message: 'GROQ_API_KEY not found in environment'
      });
    }

    // Try direct API call first (works on Vercel)
    try {
      const result = await generateTestPlanDirect(
        issueTitle,
        issueDescription || 'No description',
        acceptanceCriteria,
        apiKey
      );
      console.log('✅ Test plan generated via direct API');
      return res.json(result);
    } catch (directError) {
      console.log('Direct API call failed, trying Python tool...');
      // Fallback to Python tool
      try {
        const args = [issueTitle, issueDescription || 'No description'];
        if (acceptanceCriteria && Array.isArray(acceptanceCriteria)) {
          args.push(...acceptanceCriteria);
        }

        const result = await runPythonTool(
          path.join(__dirname, 'tools', 'generate_test_plan.py'),
          args
        );
        console.log('✅ Test plan generated via Python tool');
        return res.json(result);
      } catch (pythonError) {
        throw directError; // Throw the direct error if both fail
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate test plan'
    });
  }
});

// Create DOCX from Test Plan
app.post('/api/test-plan/create-docx', async (req, res) => {
  try {
    const { issueKey, issueTitle, testPlanSections } = req.body;

    console.log(`📄 Creating DOCX for: ${issueKey}`);
    console.log(`   Title: ${issueTitle}`);

    if (!issueKey || !issueTitle || !testPlanSections) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'issueKey, issueTitle, and testPlanSections are required'
      });
    }

    // Save test plan sections to temp JSON file
    const tempJsonPath = path.join(__dirname, '.tmp', `temp_plan_${Date.now()}.json`);
    fs.mkdirSync(path.dirname(tempJsonPath), { recursive: true });
    fs.writeFileSync(tempJsonPath, JSON.stringify(testPlanSections, null, 2), 'utf-8');

    try {
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
    } catch (pythonError) {
      // Clean up temp JSON on error
      try {
        fs.unlinkSync(tempJsonPath);
      } catch (e) {
        console.warn('Could not delete temp JSON file:', e.message);
      }

      // On Vercel, Python isn't available - this is expected
      if (process.env.VERCEL) {
        console.log('⚠️ Running on Vercel - DOCX generation requires local Python');
        return res.status(503).json({
          status: 'error',
          message: 'DOCX generation is not available on serverless environment. Please use download-docx endpoint for streaming.',
          alternative: 'Use POST /api/test-plan/download-docx for immediate download'
        });
      }
      throw pythonError;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create DOCX'
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
    fs.mkdirSync(path.dirname(tempJsonPath), { recursive: true });
    fs.writeFileSync(tempJsonPath, JSON.stringify(testPlanSections, null, 2), 'utf-8');

    try {
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
    } catch (pythonError) {
      // Clean up temp JSON on error
      try {
        fs.unlinkSync(tempJsonPath);
      } catch (e) {
        console.warn('Could not delete temp JSON file:', e.message);
      }

      // On Vercel, Python isn't available
      if (process.env.VERCEL) {
        console.log('⚠️ Running on Vercel - DOCX generation requires local Python');
        return res.status(503).json({
          status: 'error',
          message: 'DOCX generation is not available on serverless environment. Python is required.',
          suggestion: 'Deploy on a platform with Python support or run locally'
        });
      }
      throw pythonError;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to download DOCX'
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
// Serve Frontend (Static Files & SPA Routing)
// ============================================
const frontendDistPath = path.join(__dirname, 'frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// SPA - Serve index.html for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'frontend/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Run: npm run build');
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
