# Tool Selection Decision Tree - FarmerChat

This document explains how FarmerChat decides which tool to use for different user queries.

## 🎯 The Three Categories

### Category A: Weather & Farming Data
**USE MCP TOOLS ONLY**

**Examples:**
- "What's the weather forecast?"
- "Will it rain tomorrow?"
- "Should I plant maize now?"
- "Do I need to irrigate this week?"
- "Give me farming advice for coffee"

**Tools Used:**
- `get_weather_forecast` - Weather forecasts (1-14 days)
- `get_planting_recommendation` - YES/NO planting decisions
- `get_irrigation_advisory` - 7-day irrigation schedule
- `get_farming_advisory` - Comprehensive farming guidance

**Why:** These tools fetch real-time satellite weather data from TomorrowNow GAP Platform and analyze it for agricultural decisions.

---

### Category B: Agricultural Resources & Services
**USE WEB SEARCH ONLY**

**Examples:**
- "Where can I buy fertilizer near Nairobi?"
- "Find agro-dealers selling seeds"
- "What's the price of maize in Mombasa?"
- "Where can I get veterinary services?"
- "Show me pest management techniques"

**Tools Used:**
- Web Search - To find suppliers, services, prices, locations

**Why:** This information is not weather-related and requires searching the internet for current suppliers, prices, and locations.

---

### Category C: General Conversation
**NO TOOLS NEEDED**

**Examples:**
- "Hello"
- "Thank you"
- "What crops can you help with?"
- "How does irrigation work?" (general knowledge)

**Tools Used:**
- None - Respond directly with knowledge

**Why:** Simple questions that don't require external data.

---

## 🔧 How the Agent Decides

```
User asks question
    ↓
Agent classifies: Is this about weather/farming data, resources, or general?
    ↓
┌─────────────┬──────────────────┬─────────────────┐
│ Category A  │   Category B     │   Category C    │
│ Weather/    │   Resources/     │   General       │
│ Farming     │   Services       │   Conversation  │
└─────────────┴──────────────────┴─────────────────┘
    ↓               ↓                  ↓
MCP Tool        Web Search         Direct Response
    ↓               ↓                  ↓
Present         Present            Present
Results         Results            Answer
```

## ✅ Correct Examples

### Example 1: Irrigation Query
```
User: "Do I need to irrigate this week?"
Classification: Category A (irrigation schedule)
Tool: get_irrigation_advisory
Result: 7-day irrigation schedule with real weather data
```

### Example 2: Fertilizer Search
```
User: "Where can I buy fertilizer?"
Classification: Category B (finding suppliers)
Tool: Web Search
Result: List of agro-dealers with contact info
```

### Example 3: Planting + Supplier (Mixed Query)
```
User: "Should I plant beans and where can I buy seeds?"
Classification: Category A + Category B (two questions)
Tools:
  1. get_planting_recommendation (for planting decision)
  2. Web Search (for seed suppliers)
Result: Planting advice + List of seed suppliers
```

## ❌ Wrong Examples (What NOT to Do)

### Example 1: Using Web Search for Weather
```
User: "What's the weather tomorrow?"
❌ WRONG: Use Web Search
✅ CORRECT: Use get_weather_forecast
```

### Example 2: Using MCP Tools for Suppliers
```
User: "Find fertilizer dealers"
❌ WRONG: Use get_farming_advisory
✅ CORRECT: Use Web Search
```

## 🚀 Benefits of This Approach

1. **Accurate Weather Data**: Weather/farming queries always use real-time satellite data
2. **Current Information**: Supplier/price queries get fresh web results
3. **Efficient**: No unnecessary tool calls
4. **User-Friendly**: Seamless experience regardless of query type

## 📝 Implementation Notes

**In Agent Builder:**
- Both MCP tools AND Web Search are enabled
- System prompt contains clear decision tree
- Agent follows the prompt to select correct tool
- Reasoning effort set to "low" to reduce verbose output

**In System Prompt:**
- Explicit STEP 1 and STEP 2 decision process
- Category definitions with examples
- Forbidden rules for each category
- Concrete examples of correct/wrong behavior

## 🔄 Workflow Integration

This decision tree is implemented in `SYSTEM_PROMPT_WEATHER_ONLY.md` which should be:
1. Copied into OpenAI Agent Builder → System Instructions
2. Used alongside both MCP connection and Web Search tool
3. Updated whenever new tool categories are added

---

**Last Updated:** 2025-10-13
**MCP Server:** gap-agriculture-mcp
**Tools:** 4 MCP tools + Web Search
