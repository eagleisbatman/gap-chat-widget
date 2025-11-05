# Agent Builder Configuration Guide - Multi-MCP Setup

This guide explains how to configure OpenAI Agent Builder with multiple MCP servers for GAP, SSFR, and AccuWeather.

## MCP Servers Overview

You have **3 MCP servers** available:

1. **GAP Agriculture MCP Server** (`gap-agriculture-mcp-server`)
   - URL: `https://gap-agriculture-mcp-server.up.railway.app/mcp`
   - Tools: `get_gap_weather_forecast`
   - Coverage: Kenya and East Africa

2. **SSFR MCP Server** (`ssfr-mcp-server`)
   - URL: `https://ssfr-mcp-server.up.railway.app/mcp`
   - Tools: `get_fertilizer_recommendation`
   - Coverage: Ethiopia only (wheat and maize)

3. **AccuWeather MCP Server** (`accuweather-mcp-server`)
   - URL: `https://accuweather-mcp-server.up.railway.app/mcp` (when deployed)
   - Tools: `get_accuweather_weather_forecast`, `get_accuweather_current_conditions`
   - Coverage: Global (including Ethiopia)

## Step 1: Configure All MCP Servers in Agent Builder

1. Go to **platform.openai.com/agent-builder**
2. Open your workflow
3. Go to **"Integrations"** → **"MCP Servers"**

### Add GAP MCP Server:
- **Name:** `gap-agriculture-mcp`
- **URL:** `https://gap-agriculture-mcp-server.up.railway.app/mcp`
- **Test Connection** (should show 1 tool: `get_gap_weather_forecast`)

### Add SSFR MCP Server:
- **Name:** `ssfr-mcp`
- **URL:** `https://ssfr-mcp-server.up.railway.app/mcp`
- **Test Connection** (should show 1 tool: `get_fertilizer_recommendation`)

### Add AccuWeather MCP Server (optional):
- **Name:** `accuweather-mcp`
- **URL:** `https://accuweather-mcp-server.up.railway.app/mcp`
- **Test Connection** (should show 2 tools: `get_accuweather_weather_forecast`, `get_accuweather_current_conditions`)

## Step 2: Configure Agent with All Tools

In your Agent node settings:

1. **Enable all MCP tools:**
   - ✅ `get_gap_weather_forecast` (from gap-agriculture-mcp)
   - ✅ `get_accuweather_weather_forecast` (from accuweather-mcp) - if configured
   - ✅ `get_accuweather_current_conditions` (from accuweather-mcp) - if configured
   - ✅ `get_fertilizer_recommendation` (from ssfr-mcp)

2. **System Prompt:** Copy from `SYSTEM_PROMPT_GAP_SSFR.md`

The system prompt will guide the AI to:
- Use GAP `get_gap_weather_forecast` for Kenya/East Africa locations ONLY
- Use AccuWeather `get_accuweather_weather_forecast` for Ethiopia locations (NEVER use GAP for Ethiopia)
- Use SSFR `get_fertilizer_recommendation` for Ethiopia fertilizer queries (wheat/maize)
- Use BOTH AccuWeather AND SSFR for composite queries in Ethiopia (weather + fertilizer)

## Step 3: How Location Detection Works

The chat widget server (`server.js`) sends location headers:
- `X-Farm-Latitude`: User's latitude
- `X-Farm-Longitude`: User's longitude
- `X-Location-Type`: "ethiopia" or "east-africa"

**The system prompt guides the AI to:**
1. Check location from headers or user query
2. Determine if coordinates are in Ethiopia (3.0-15.0°N, 32.0-48.0°E)
3. Use appropriate MCP tools based on location and query type

## Tool Selection Logic (Handled by System Prompt)

### For Weather Queries:
- **Kenya/East Africa location:** Use GAP `get_gap_weather_forecast` ONLY
- **Ethiopia location:** Use AccuWeather `get_accuweather_weather_forecast` (NEVER use GAP for Ethiopia)
- **Other locations:** Use AccuWeather `get_accuweather_weather_forecast` (if available)

### For Fertilizer Queries:
- **Ethiopia + wheat/maize:** Use SSFR `get_fertilizer_recommendation`
- **Other locations:** Inform user that SSFR is Ethiopia-only

### For Composite Queries (Ethiopia):
- **Planting advice + fertilizer for wheat/maize:** Use BOTH tools:
  - First: AccuWeather `get_accuweather_weather_forecast` (weather context)
  - Second: SSFR `get_fertilizer_recommendation` (fertilizer recommendations)
- **General farming advice in Ethiopia:** Use AccuWeather first, add SSFR if crop is wheat/maize

### For Planting/Irrigation Queries:
- **Kenya/East Africa:** Use GAP `get_gap_weather_forecast` only
- **Ethiopia:** Use AccuWeather `get_accuweather_weather_forecast`
- **Ethiopia + wheat/maize:** Use both AccuWeather (weather) AND SSFR (fertilizer)

## Important Notes

1. **MCP servers are configured in Agent Builder**, not in the chat widget code
2. **The chat widget server** (`server.js`) only:
   - Creates ChatKit sessions
   - Passes location headers to OpenAI
   - Does NOT route to MCP servers

3. **The system prompt** guides the AI to select the right tool based on:
   - User location (from headers)
   - Query type (weather vs fertilizer)
   - Available tools

4. **Tool names may conflict:**
   - ~~Both GAP and AccuWeather have `get_weather_forecast`~~ ✅ **FIXED:** Tools now have unique names:
     - GAP: `get_gap_weather_forecast`
     - AccuWeather: `get_accuweather_weather_forecast`, `get_accuweather_current_conditions`
   - Agent Builder will differentiate by MCP server name
   - System prompt guides which one to use

## Testing

After configuration, test with:

1. **Kenya/East Africa location (e.g., Nairobi):**
   - "What's the weather?" → Should use GAP `get_gap_weather_forecast`
   - "What fertilizer for wheat?" → Should say Ethiopia-only

2. **Ethiopia location (e.g., Addis Ababa):**
   - "What's the weather?" → Should use AccuWeather `get_accuweather_weather_forecast` (NOT GAP)
   - "What fertilizer for wheat?" → Should use SSFR `get_fertilizer_recommendation`
   - "Should I plant wheat now? What fertilizer?" → Should use BOTH AccuWeather AND SSFR
   - "What fertilizer for maize?" → Should use SSFR `get_fertilizer_recommendation`

3. **Check execution logs** in Agent Builder to verify correct tool selection:
   - Kenya queries should only show GAP tool calls
   - Ethiopia weather queries should show AccuWeather tool calls (NOT GAP)
   - Ethiopia fertilizer queries should show SSFR tool calls
   - Ethiopia composite queries should show BOTH AccuWeather AND SSFR tool calls

## Troubleshooting

**Issue: Wrong tool selected**
- Check system prompt has correct location detection logic
- Verify MCP servers are properly configured
- Check location headers are being passed correctly

**Issue: Tool not available**
- Verify MCP server is deployed and healthy
- Check MCP connection in Agent Builder integrations
- Test MCP endpoint directly with curl

**Issue: Location detection fails**
- Verify coordinates are passed in headers
- Check system prompt logic for location detection
- Ensure Ethiopia bounds are correctly defined (3.0-15.0°N, 32.0-48.0°E)

