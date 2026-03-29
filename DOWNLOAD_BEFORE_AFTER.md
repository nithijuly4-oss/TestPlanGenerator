# Before vs After Comparison

## 🔴 BEFORE: Files Saved to .tmp Folder

```
Export DOCX button clicked
         ↓
Backend endpoint: /api/test-plan/download-docx
         ↓
Generate DOCX file
         ↓
Save to: .tmp/{UUID}.docx
         ↓
Use res.download(filepath) to serve file
         ↓
Browser downloads file
         ↓
Problem in Vercel: .tmp doesn't persist between requests!
         ↓
User frustrated: Can't find file in Downloads folder
Users had to manually go into .tmp folder: ❌ Not ideal
```

## 🟢 AFTER: Files Stream Direct to Browser

```
Export DOCX button clicked
         ↓
Backend endpoint: /api/test-plan/download-docx
         ↓
Generate DOCX file
         ↓
Save temporarily to: /tmp (ephemeral)
         ↓
Read file as buffer
         ↓
Send blob directly with proper headers:
   - Content-Type: application/vnd.openxmlformats...
   - Content-Disposition: attachment; filename=...
         ↓
Browser receives blob stream
         ↓
Browser shows native "Save As" dialog
         ↓
User saves to Downloads folder automatically ✅
         ↓
Temp file cleaned up
         ↓
Works perfectly in Vercel (no storage issues)
         ↓
Works perfectly locally (clean downloads folder)
```

## Code Diff: Key Changes

### BEFORE (Old endpoint - NOT used anymore)
```javascript
// Old approach using res.download()
const filePath = result.file_path;
res.download(filePath, fileName, (err) => {
  // cleanup after download
  fs.unlinkSync(filePath);
});
```

Problem: `res.download()` streams from disk, assumes file persists

### AFTER (New endpoint - USED NOW)
```javascript
// New approach using buffer streaming
const filePath = result.file_path;
const fileBuffer = fs.readFileSync(filePath);

res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
res.setHeader('Content-Length', fileBuffer.length);

res.send(fileBuffer);

// Cleanup
fs.unlinkSync(filePath);
```

Benefits:
- Sends complete buffered response
- Works in serverless (Vercel)
- Browser handles download properly
- File appears in Downloads folder
- No dependency on persistent storage

## Environment Comparison

### Local Development (Before Fix)
```
User clicks Export
   ↓
File saved to: d:\AITester\Chapter4_AIAGent\.tmp\{uuid}.docx
   ↓
User has to navigate to .tmp folder
   ↓
OR manually drag from .tmp to Downloads ❌
```

### Local Development (After Fix)
```
User clicks Export
   ↓
Browser shows Save As dialog
   ↓
Default location: C:\Users\{User}\Downloads
   ↓
File: SD-1_TestPlan.docx
   ↓
User clicks Save ✅
```

### Vercel Before Fix (Would NOT Work)
```
User clicks Export on Vercel
   ↓
Tries to save to /tmp folder
   ↓
Tries to serve from /tmp
   ↓
Error: File ephemeral, doesn't persist ❌
```

### Vercel After Fix (Works!)
```
User clicks Export on Vercel
   ↓
Generates DOCX in /tmp
   ↓
Streams blob directly to browser
   ↓
Browser downloads to Downloads folder ✅
   ↓
Perfect! Works in serverless
```

## User Journey

### Scenario: Download Test Plan for Issue SD-1

#### LOCAL DEV
1. Visit http://localhost:5173
2. Connect GROQ and Jira
3. Fetch issue SD-1
4. Generate test plan
5. Click "📄 Export DOCX"
6. Browser shows: "Save SD-1_TestPlan.docx?"
7. Click Save
8. File appears in Downloads folder ✅

#### VERCEL DEPLOYMENT
1. Visit https://yourapp.vercel.app
2. Connect GROQ and Jira (via env vars)
3. Fetch issue SD-1
4. Generate test plan
5. Click "📄 Export DOCX"
6. Browser shows: "Save SD-1_TestPlan.docx?"
7. Click Save
8. File appears in Downloads folder ✅

## Technical Details

### Headers Sent by Server
```
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="SD-1_TestPlan.docx"
Content-Length: 156234
```

### What Browser Does
1. Sees Content-Disposition: attachment
2. Recognizes it's a file download
3. Looks at Content-Type (DOCX format)
4. Extracts filename from Content-Disposition
5. Shows "Save As" dialog with default location = Downloads
6. User confirms save
7. File saved to Downloads folder

### Why This Works in Vercel
- No dependency on `/tmp` persistence
- File streaming completes before response ends
- Vercel's ephemeral filesystem automatically cleaned
- Browser has already downloaded the complete file
- No background jobs needed

## Testing Checklist

- [x] Direct download endpoint receives blob
- [x] Frontend receives blob and creates ObjectURL
- [x] Browser shows Save As dialog
- [x] File downloads with correct filename
- [x] File downloads to Downloads folder (not .tmp)
- [x] Temporary files cleaned up immediately
- [x] No files accumulate in .tmp folder
- [x] Works with GROQ + Jira integration
- [x] Generated DOCX files are valid
- [x] Watermarks are removed (Phase 1 feature)
- [x] Works in local development
- [x] Ready for Vercel deployment

## Troubleshooting

If file doesn't appear in Downloads:
1. Check browser settings (download location)
2. Check if browser blocked the download (popup blocker)
3. Look at browser download history (Ctrl+J)
4. Check browser console for errors (F12)

If you see an error during export:
1. Verify GROQ_API_KEY is set and valid
2. Verify Jira credentials are correct
3. Check backend console for error logs
4. Try refreshing the page and retry
