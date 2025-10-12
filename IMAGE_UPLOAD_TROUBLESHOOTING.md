# Image Upload Troubleshooting Guide

## Problem: "Unable to upload" error when trying to attach images in ChatKit

This guide helps you configure both ChatKit and Agent Builder to properly handle image uploads for plant diagnosis.

---

## ✅ STEP 1: Agent Builder Workflow Configuration

### 1.1 Go to Agent Builder
1. Visit `https://platform.openai.com/agent-builder`
2. Open your FarmerChat workflow: `wf_68e9243fb2d8819096f40007348b673a071b12eea47ebea9`

### 1.2 Check Model Configuration
**Location:** Workflow Settings → Model

**Required:** Use a vision-capable model
- ✅ **GPT-4o** (recommended)
- ✅ GPT-4 Turbo with Vision
- ✅ GPT-4o Mini (if budget-conscious)
- ❌ GPT-4 (non-vision) - does NOT support images
- ❌ GPT-3.5 - does NOT support images

**Action:** If using non-vision model, switch to GPT-4o

### 1.3 Enable File Attachments
**Location:** Workflow Settings → Capabilities or Features

**Required Settings:**
- ✅ Enable "File attachments" or "Allow file uploads"
- ✅ Enable "Vision" capabilities
- ✅ Set allowed file types: `image/jpeg, image/png, image/webp`
- ✅ Set max file size: 10MB (or 5MB if preferred)

**Note:** This setting might be under different names:
- "File uploads"
- "Attachments"
- "Media upload"
- "Vision inputs"

### 1.4 Add MCP Tool Connection
**Location:** Workflow Settings → Tools or MCP Connections

If you haven't added the Plant Health Diagnosis MCP server:

1. Click "Add MCP Server" or "Add Tool"
2. Select "StreamableHTTP" transport
3. **Name:** Plant Health Diagnosis
4. **URL:** `https://your-railway-app.up.railway.app/mcp`
5. **Description:** Plant disease, pest, and health diagnosis
6. Click "Save" or "Add"

### 1.5 Update System Prompt
Make sure your system prompt includes the `diagnose_plant_disease` tool instructions.

Copy the updated content from `SYSTEM_PROMPT.md` into Agent Builder → System Instructions.

Key section to include:
```markdown
e) `diagnose_plant_disease`:
   - What it does: Analyzes plant images using AI vision
   - Use for: Plant health problems, disease ID, pest detection
   - Parameters: image (base64), crop (optional)
   - Returns: Diagnostic data (crop ID, health status, issues)
   - CRITICAL: Tool returns diagnosis only - YOU generate treatment advice
```

---

## ✅ STEP 2: ChatKit Configuration (Already Done)

The following is already configured in `chatkit.js`:

```javascript
composer: {
    placeholder: CHATKIT_CONFIG.placeholder,
    attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10 * 1024 * 1024, // 10MB
        accept: 'image/*' // Accept all image types
    }
}
```

---

## ✅ STEP 3: Test the Upload Flow

### 3.1 Deploy Updates
If you made changes to `chatkit.js`:

```bash
# Commit changes
git add chatkit.js IMAGE_UPLOAD_TROUBLESHOOTING.md
git commit -m "Add image upload troubleshooting and accept parameter"
git push

# Deploy to Vercel/Netlify (if connected)
# Or restart local server:
npm start
```

### 3.2 Test in Browser
1. Open `http://localhost:3002/index.html` (or your deployed URL)
2. Click chat widget to open
3. Look for 📎 attachment button next to text input
4. Click attachment button
5. Select an image file (JPEG, PNG, or WebP)
6. Image should upload successfully
7. Send message with image

### 3.3 Check Browser Console
Open DevTools (F12) → Console

**Look for:**
- ✅ `[ChatKit] Session created successfully`
- ✅ File upload progress
- ✅ Message sent with attachment

**Watch for errors:**
- ❌ `Unable to upload`
- ❌ `File type not allowed`
- ❌ `File too large`
- ❌ `403 Forbidden`
- ❌ `401 Unauthorized`

---

## 🔍 Common Issues and Solutions

### Issue 1: "Unable to upload" - 403 Forbidden
**Cause:** Agent Builder workflow not configured to accept file uploads

**Solution:**
1. Go to Agent Builder workflow settings
2. Enable file attachments/uploads
3. Enable vision capabilities
4. Save workflow
5. Try upload again

### Issue 2: "File type not allowed"
**Cause:** Workflow has restricted file types

**Solution:**
1. Go to Agent Builder workflow settings
2. Check allowed file types
3. Add: `image/jpeg, image/png, image/webp`
4. Save workflow

### Issue 3: "File too large"
**Cause:** File exceeds size limit

**Solution:**
Option A - Increase limit in Agent Builder:
1. Go to workflow settings
2. Increase max file size to 10MB
3. Save workflow

Option B - Compress image before upload:
- Use image compression tool
- Reduce image resolution
- Convert to JPEG (smaller than PNG)

### Issue 4: Attachment button (📎) doesn't appear
**Cause:** ChatKit attachments not properly configured

**Solution:**
1. Check `chatkit.js` has `attachments: { enabled: true }`
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for errors

### Issue 5: Image uploads but no diagnosis
**Cause:** MCP tool not configured or not being called

**Solution:**
1. Check MCP server is running (Railway health endpoint)
2. Verify MCP connection in Agent Builder
3. Check system prompt instructs LLM to call `diagnose_plant_disease`
4. Test MCP tool directly in Agent Builder playground

### Issue 6: Vision model not selected
**Cause:** Using non-vision model (GPT-4, GPT-3.5)

**Solution:**
1. Go to Agent Builder workflow settings → Model
2. Select GPT-4o or GPT-4 Turbo with Vision
3. Save workflow
4. Try upload again

---

## 🧪 Testing Checklist

After configuration, test these scenarios:

- [ ] Upload JPEG image (< 5MB)
- [ ] Upload PNG image (< 5MB)
- [ ] Upload WebP image (< 5MB)
- [ ] Try to upload non-image file (should fail gracefully)
- [ ] Try to upload large image (> 10MB, should fail with clear message)
- [ ] Upload image and ask for diagnosis
- [ ] Verify Agent Builder calls `diagnose_plant_disease` tool
- [ ] Verify diagnostic data is returned
- [ ] Verify Agent Builder generates region-specific treatment advice
- [ ] Test in both English and Swahili
- [ ] Test on mobile device
- [ ] Test in different browsers (Chrome, Safari, Firefox)

---

## 📋 Agent Builder Workflow Checklist

Copy this checklist and verify each item in Agent Builder:

**Model & Capabilities:**
- [ ] Model is GPT-4o or vision-capable variant
- [ ] Vision capabilities enabled
- [ ] File attachments/uploads enabled
- [ ] Max file size: 10MB or higher
- [ ] Allowed file types include images (jpeg, png, webp)

**MCP Tools:**
- [ ] Plant Health Diagnosis MCP server added
- [ ] MCP connection type: StreamableHTTP
- [ ] MCP endpoint URL correct: `https://[your-app].up.railway.app/mcp`
- [ ] MCP server is running (test health endpoint)
- [ ] Test MCP tool in Agent Builder playground

**System Prompt:**
- [ ] System prompt includes `diagnose_plant_disease` tool documentation
- [ ] Instructions explain tool returns diagnostic data only
- [ ] Instructions tell agent to generate treatment advice
- [ ] Instructions emphasize Kenya/East Africa context

**Testing:**
- [ ] Test in Agent Builder playground with sample image
- [ ] Verify tool is called when image is uploaded
- [ ] Verify diagnostic data is returned
- [ ] Verify agent generates treatment recommendations

---

## 🆘 Still Having Issues?

### Debug Steps:

1. **Test Agent Builder Playground First**
   - Go to Agent Builder → Test/Playground
   - Upload an image directly in playground
   - Ask: "What's wrong with this plant?"
   - If this works, issue is in ChatKit
   - If this fails, issue is in Agent Builder config

2. **Check MCP Server Logs**
   ```bash
   # If deployed to Railway:
   railway logs --tail

   # Look for:
   # - MCP tool called
   # - Image received and analyzed
   # - Errors or failures
   ```

3. **Check Browser Network Tab**
   - Open DevTools → Network
   - Try to upload image
   - Look for failed requests
   - Check response bodies for error messages

4. **Test MCP Server Directly**
   ```bash
   node test-diagnosis.js /path/to/image.jpg
   ```
   This tests if MCP server works independently

5. **Contact Support**
   If all else fails:
   - OpenAI Platform Support: support.openai.com
   - Include: workflow ID, error messages, screenshots
   - Mention you're using ChatKit + Agent Builder + MCP

---

## 📚 Related Documentation

- Agent Builder: https://platform.openai.com/docs/guides/agent-builder
- ChatKit: https://openai.github.io/chatkit-js/
- MCP Protocol: https://modelcontextprotocol.io/
- Plant Health Diagnosis MCP: ../gap-plant-diagnosis-mcp/CLAUDE.md
- System Prompt: SYSTEM_PROMPT.md

---

**Last Updated:** 2025-10-11
