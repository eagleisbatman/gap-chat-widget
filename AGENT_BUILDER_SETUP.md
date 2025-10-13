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
2. Rename to: **"Extract Category"**
3. Click to configure
4. **Transform Code:**
```javascript
// Extract category keyword from classifier output
const message = input.messages[input.messages.length - 1].content;
const text = message.toUpperCase().trim();

let category = 'GENERAL'; // default

if (text.includes('WEATHER')) {
  category = 'WEATHER';
} else if (text.includes('RESOURCE')) {
  category = 'RESOURCE';
}

return { category: category };
```
5. Connect Classifier → Extract Category

### Step 4: Add If/Else Logic Node

1. Drag **"If/Else"** node to canvas
2. Rename to: **"Route by Category"**
3. Click to configure
4. **Condition 1:**
   - Name: "Is Weather Query"
   - Condition: `state.category == "WEATHER"`
5. **Condition 2:**
   - Name: "Is Resource Query"
   - Condition: `state.category == "RESOURCE"`
6. **Else:** Default to General Agent
7. Connect Extract Category → Route by Category

### Step 5: Add Weather Agent Node

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
