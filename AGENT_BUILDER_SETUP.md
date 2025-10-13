# Agent Builder Multi-Agent Routing Setup

This guide walks through setting up the classification-based routing system in OpenAI Agent Builder.

## Workflow Overview

```
User Query → Classifier → If/Else → [Weather | Resource | General] Agent → Response
```

## Step-by-Step Setup

### Step 1: Create New Workflow

1. Go to **platform.openai.com/agent-builder**
2. Click **"Create new workflow"**
3. Name: **"FarmerChat Multi-Agent Router"**
4. Description: **"Agricultural assistant with classification-based routing"**

### Step 2: Add Classifier Agent Node

1. Drag **"Agent"** node from left panel to canvas
2. Rename to: **"Classifier"**
3. Click to configure
4. **System Instructions:** Copy from `CLASSIFIER_PROMPT.md` (see below)
5. **Tools:** None (no tools needed)
6. **Model:** gpt-4o (or gpt-4o-mini for cost savings)
7. **Settings:**
   - Approval: Never require approval
   - Reasoning effort: Low
8. Connect START → Classifier

### Step 3: Add Transform Node

1. Drag **"Transform"** node to canvas
2. Rename to: **"Extract Categories"**
3. Click to configure
4. **Transform Code:**
```javascript
// Extract category keyword(s) from classifier output
const message = input.messages[input.messages.length - 1].content;
const text = message.toUpperCase().trim();

let categories = [];
let isComposite = false;

// Check for composite queries
if (text.includes('+')) {
  isComposite = true;
  const parts = text.split('+');
  categories = parts.map(p => p.trim());
} else {
  // Single category
  if (text.includes('WEATHER')) {
    categories = ['WEATHER'];
  } else if (text.includes('RESOURCE')) {
    categories = ['RESOURCE'];
  } else {
    categories = ['GENERAL'];
  }
}

return {
  categories: categories,
  isComposite: isComposite,
  primaryCategory: categories[0] || 'GENERAL'
};
```
5. Connect Classifier → Extract Categories

### Step 4: Add First If/Else Logic Node (Check for Composite)

1. Drag **"If/Else"** node to canvas
2. Rename to: **"Check Composite"**
3. Click to configure
4. **Condition:**
   - Name: "Is Composite Query"
   - Condition: `state.isComposite == true`
5. **Then branch:** Route to Composite Handler
6. **Else branch:** Route to Single Category Router
7. Connect Extract Categories → Check Composite

### Step 5: Add Single Category Router (If/Else Node)

1. Drag **"If/Else"** node to canvas
2. Rename to: **"Route Single Category"**
3. Click to configure
4. **Condition 1:**
   - Name: "Is Weather Query"
   - Condition: `state.primaryCategory == "WEATHER"`
5. **Condition 2:**
   - Name: "Is Resource Query"
   - Condition: `state.primaryCategory == "RESOURCE"`
6. **Else:** Default to General Agent
7. Connect Check Composite (ELSE branch) → Route Single Category

### Step 5A: Add Composite Query Handler (For Multi-Agent Calls)

**Option 1: Sequential Agent Calls (Simpler)**

1. Drag **"If/Else"** node to canvas (for WEATHER+RESOURCE)
2. Rename to: **"Composite Router"**
3. **Condition:** `state.categories.includes("WEATHER") && state.categories.includes("RESOURCE")`
4. **Then branch:**
   - a. Call Weather Agent → Store response in `state.weatherResponse`
   - b. Set State node → Store weather response
   - c. Call Resource Agent → Store response in `state.resourceResponse`
   - d. Set State node → Store resource response
   - e. Transform node → Combine responses:
   ```javascript
   const combined = `${state.weatherResponse}\n\n---\n\n${state.resourceResponse}`;
   return { finalResponse: combined };
   ```
   - f. → END
5. Connect Check Composite (THEN branch) → Composite Router

**Option 2: Parallel Agent Calls (Advanced)**

Use Agent Builder's parallel execution if available:
- Fork into parallel branches
- Call Weather Agent and Resource Agent simultaneously
- Join results with Transform node
- Combine responses

### Step 6: Add Weather Agent Node

1. Drag **"Agent"** node to canvas
2. Rename to: **"Weather Agent"**
3. Click to configure
4. **System Instructions:** Copy from `WEATHER_AGENT_PROMPT.md` (see below)
5. **Tools:**
   - ✅ Enable MCP connection (gap-agriculture-mcp)
   - ✅ get_weather_forecast
   - ✅ get_planting_recommendation
   - ✅ get_irrigation_advisory
   - ✅ get_farming_advisory
   - ❌ Disable Web Search
6. **Model:** gpt-4o
7. **Settings:**
   - Approval: Never require approval
   - Reasoning effort: Low
8. Connect Route by Category (WEATHER branch) → Weather Agent

### Step 6: Add Resource Agent Node

1. Drag **"Agent"** node to canvas
2. Rename to: **"Resource Agent"**
3. Click to configure
4. **System Instructions:** Copy from `RESOURCE_AGENT_PROMPT.md` (see below)
5. **Tools:**
   - ✅ Enable Web Search
   - ❌ Disable all MCP tools
6. **Model:** gpt-4o
7. **Settings:**
   - Approval: Never require approval
   - Reasoning effort: Low
8. Connect Route by Category (RESOURCE branch) → Resource Agent

### Step 7: Add General Agent Node

1. Drag **"Agent"** node to canvas
2. Rename to: **"General Agent"**
3. Click to configure
4. **System Instructions:** Copy from `GENERAL_AGENT_PROMPT.md` (see below)
5. **Tools:** None (all disabled)
6. **Model:** gpt-4o
7. **Settings:**
   - Approval: Never require approval
   - Reasoning effort: Low
8. Connect Route by Category (ELSE branch) → General Agent

### Step 8: Add End Node

1. Drag **"End"** node to canvas
2. Connect all three agents → End

### Step 9: Configure MCP Connection

1. In workflow settings, go to **"Integrations"**
2. Click **"Add MCP Server"**
3. **URL:** `https://gap-agriculture-mcp-server.up.railway.app/mcp`
4. **Name:** `gap-agriculture-mcp`
5. **Test Connection** (should show 4 tools)
6. Save

### Step 10: Test the Workflow

1. Click **"Test"** or **"Playground"**
2. Test queries:
   - "Will it rain tomorrow?" → Should route to Weather Agent
   - "Where can I buy seeds?" → Should route to Resource Agent
   - "Hello" → Should route to General Agent
3. Check routing in execution logs
4. Verify responses are correct

### Step 11: Deploy

1. Click **"Publish"**
2. Copy the **Workflow ID** (starts with `wf_`)
3. Update `.env` in gap-chat-widget:
   ```bash
   WORKFLOW_ID=wf_xxxxxxxxxx
   ```
4. Restart session server: `npm start`

## Testing Checklist

- [ ] Classifier outputs single keyword: WEATHER, RESOURCE, or GENERAL
- [ ] Transform extracts category correctly
- [ ] If/Else routes to correct agent
- [ ] Weather agent uses MCP tools (not Web Search)
- [ ] Resource agent uses Web Search (not MCP tools)
- [ ] General agent uses no tools
- [ ] All agents have "Reasoning effort: Low"
- [ ] No verbose reasoning shown to user
- [ ] Responses are concise and farmer-friendly

## Troubleshooting

**Issue: Classifier outputs explanation instead of keyword**
- Fix: Update Classifier prompt to emphasize "Output EXACTLY ONE WORD"
- Set temperature to 0.1 for deterministic output

**Issue: If/Else not routing correctly**
- Fix: Check Transform node extracts category to state variable
- Verify If/Else conditions reference correct variable name

**Issue: Agents still showing verbose reasoning**
- Fix: Set Reasoning effort to "Low" or "None" for each agent
- Check system prompts don't include "think step by step"

**Issue: Weather agent using Web Search**
- Fix: Disable Web Search tool in Weather Agent node
- Verify only MCP tools are enabled

**Issue: MCP tools not available**
- Fix: Verify MCP server is deployed and healthy
- Check MCP connection in workflow integrations
- Test MCP endpoint directly

## Visual Workflow Diagram

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ↓
┌──────────────────┐
│   Classifier     │ ← "Will it rain tomorrow?"
│   Agent          │
└────┬─────────────┘
     │ Output: "WEATHER"
     ↓
┌──────────────────┐
│   Transform      │
│   Extract Cat.   │
└────┬─────────────┘
     │ category = "WEATHER"
     ↓
┌──────────────────┐
│   If/Else        │
│   Route          │
└─┬─────┬────────┬─┘
  │     │        │
  │     │        └─→ [General Agent] → END
  │     │
  │     └─→ [Resource Agent] → END
  │
  └─→ [Weather Agent] → END
       (MCP tools)
```

## Files Reference

- `CLASSIFIER_PROMPT.md` - Classifier agent system prompt
- `WEATHER_AGENT_PROMPT.md` - Weather agent system prompt
- `RESOURCE_AGENT_PROMPT.md` - Resource agent system prompt
- `GENERAL_AGENT_PROMPT.md` - General agent system prompt

Copy these prompts exactly into Agent Builder when configuring each node.

---

**Last Updated:** 2025-10-13
**Workflow Type:** Multi-Agent Router with Classification
**Agents:** 4 (Classifier + Weather + Resource + General)
