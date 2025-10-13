# Composite Query Handling Flow

This document explains how the multi-agent system handles composite queries that require multiple agents.

## Problem Statement

**Simple queries** are straightforward:
- "Will it rain?" → Weather Agent only
- "Where to buy seeds?" → Resource Agent only

**Composite queries** need multiple agents:
- "Should I plant maize and where can I buy seeds?" → Weather + Resource
- "What's the weather and market prices?" → Weather + Resource
- "Do I irrigate and find equipment?" → Weather + Resource

## Solution: Multi-Agent Sequential Execution

### Complete Workflow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ START: User Query                                            │
│ "Should I plant maize and where can I buy seeds?"           │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ [Agent] Classifier                                           │
│ Analyzes query for keywords and intent                      │
│ Output: "WEATHER+RESOURCE"                                   │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ [Transform] Extract Categories                               │
│ Parses classifier output                                     │
│ Returns:                                                     │
│   - categories: ["WEATHER", "RESOURCE"]                     │
│   - isComposite: true                                       │
│   - primaryCategory: "WEATHER"                              │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ [If/Else] Check if Composite                                 │
│ Condition: isComposite == true                               │
└────────┬────────────────────────────────────┬────────────────┘
         │ TRUE                                │ FALSE
         ↓                                     ↓
┌────────────────────────┐     ┌──────────────────────────────┐
│ COMPOSITE PATH         │     │ SINGLE CATEGORY PATH         │
│ (Multiple agents)      │     │ (One agent only)             │
└────────┬───────────────┘     └────────┬─────────────────────┘
         ↓                               ↓
         │                      ┌──────────────────────┐
         │                      │ [If/Else] Route      │
         │                      │ Single Category      │
         │                      └─┬──────┬──────┬──────┘
         │                        │      │      │
         │                   WEATHER RESOURCE GENERAL
         │                        │      │      │
         │                        ↓      ↓      ↓
         │                   [Weather] [Resource] [General]
         │                        │      │      │
         │                        └──────┴──────┴─→ END
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│ COMPOSITE HANDLER                                            │
│ Sequential execution of multiple agents                      │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
         ┌───────────────┴────────────────┐
         │                                 │
    Contains WEATHER?              Contains RESOURCE?
         │                                 │
         ↓                                 ↓
┌────────────────────┐           ┌────────────────────┐
│ [Agent] Weather    │           │ [Agent] Resource   │
│ Calls MCP tools    │           │ Uses Web Search    │
│ Returns response   │           │ Returns response   │
└────────┬───────────┘           └────────┬───────────┘
         │                                 │
         ↓                                 ↓
┌────────────────────┐           ┌────────────────────┐
│ [Set State]        │           │ [Set State]        │
│ weatherResponse    │           │ resourceResponse   │
└────────┬───────────┘           └────────┬───────────┘
         │                                 │
         └──────────────┬──────────────────┘
                        ↓
         ┌──────────────────────────────────┐
         │ [Transform] Combine Responses    │
         │ Format:                          │
         │ {Weather answer}                 │
         │                                  │
         │ ---                              │
         │                                  │
         │ {Resource answer}                │
         └──────────────┬───────────────────┘
                        ↓
         ┌──────────────────────────────────┐
         │ END: Return Combined Response    │
         └──────────────────────────────────┘
```

## Example Execution Trace

### Composite Query Example:

**User Input:**
```
"Should I plant maize and where can I buy seeds near Nairobi?"
```

**Step 1: Classifier**
```
Input: "Should I plant maize and where can I buy seeds near Nairobi?"
Analysis:
  - Detected "should I plant" → WEATHER category
  - Detected "where can I buy" → RESOURCE category
  - This is a composite query
Output: "WEATHER+RESOURCE"
```

**Step 2: Transform (Extract Categories)**
```
Input: "WEATHER+RESOURCE"
Processing:
  - Split by '+' → ["WEATHER", "RESOURCE"]
  - isComposite = true
  - primaryCategory = "WEATHER"
Output: {
  categories: ["WEATHER", "RESOURCE"],
  isComposite: true,
  primaryCategory: "WEATHER"
}
```

**Step 3: If/Else (Check Composite)**
```
Condition: isComposite == true
Result: TRUE
Action: Route to Composite Handler
```

**Step 4: Composite Handler**

**4a. Check for WEATHER in categories**
```
Condition: categories.includes("WEATHER")
Result: TRUE
Action: Call Weather Agent
```

**Weather Agent Execution:**
```
Tool: get_planting_recommendation(latitude: -1.2864, longitude: 36.8172, crop: "maize")
Response: "✅ YES - Good time to plant maize! Temperature is 22°C (ideal range)
and 35mm rain expected this week. Prepare your field and plant within 2 days."
```

**Set State:**
```
state.weatherResponse = "✅ YES - Good time to plant maize! Temperature is 22°C..."
```

**4b. Check for RESOURCE in categories**
```
Condition: categories.includes("RESOURCE")
Result: TRUE
Action: Call Resource Agent
```

**Resource Agent Execution:**
```
Tool: Web Search("maize seed suppliers Nairobi Kenya")
Response: "Here are maize seed suppliers in Nairobi:
1. Kenya Seed Company - CBD, +254 20 273 5420, KSh 500-1,200/kg
2. East African Seed Co. - Industrial Area, +254 722 789 456, KSh 600-1,000/kg
3. Simlaw Seeds - Westlands, +254 20 444 6688, drought-resistant varieties"
```

**Set State:**
```
state.resourceResponse = "Here are maize seed suppliers in Nairobi:..."
```

**Step 5: Transform (Combine Responses)**
```
Input:
  - weatherResponse: "✅ YES - Good time to plant maize!..."
  - resourceResponse: "Here are maize seed suppliers in Nairobi:..."

Processing:
  combined = weatherResponse + "\n\n---\n\n" + resourceResponse

Output: {
  finalResponse: "✅ YES - Good time to plant maize! Temperature is 22°C
  (ideal range) and 35mm rain expected this week. Prepare your field and
  plant within 2 days.

  ---

  Here are maize seed suppliers in Nairobi:
  1. Kenya Seed Company - CBD, +254 20 273 5420, KSh 500-1,200/kg
  2. East African Seed Co. - Industrial Area, +254 722 789 456, KSh 600-1,000/kg
  3. Simlaw Seeds - Westlands, +254 20 444 6688, drought-resistant varieties"
}
```

**Step 6: END**
```
Return finalResponse to user via ChatKit widget
```

---

## Implementation Details

### Transform Node for Combining Responses

```javascript
// Combine multiple agent responses
const weatherResp = state.weatherResponse || '';
const resourceResp = state.resourceResponse || '';
const generalResp = state.generalResponse || '';

let combined = '';
let parts = [];

// Add non-empty responses
if (weatherResp) parts.push(weatherResp);
if (resourceResp) parts.push(resourceResp);
if (generalResp) parts.push(generalResp);

// Join with separator
combined = parts.join('\n\n---\n\n');

return {
  finalResponse: combined
};
```

### Set State Nodes Configuration

**After Weather Agent:**
```javascript
{
  weatherResponse: input.messages[input.messages.length - 1].content
}
```

**After Resource Agent:**
```javascript
{
  resourceResponse: input.messages[input.messages.length - 1].content
}
```

---

## Supported Composite Query Types

### WEATHER + RESOURCE
**Example:** "Should I plant beans and where to buy fertilizer?"
**Execution:**
1. Weather Agent → Planting recommendation
2. Resource Agent → Fertilizer suppliers
3. Combine responses

### WEATHER + GENERAL
**Example:** "What's the weather and what is crop rotation?"
**Execution:**
1. Weather Agent → Weather forecast
2. General Agent → Crop rotation explanation
3. Combine responses

### RESOURCE + GENERAL
**Example:** "Where to buy seeds and what are hybrid seeds?"
**Execution:**
1. Resource Agent → Seed suppliers
2. General Agent → Hybrid seed explanation
3. Combine responses

---

## Advantages of This Approach

### ✅ **Handles Complex Queries**
Users don't need to ask multiple separate questions. One query gets complete answer.

### ✅ **No Confusion**
Each agent still has clear, focused responsibility. No tool overlap.

### ✅ **Better User Experience**
Response addresses all parts of the query in one message.

### ✅ **Scalable**
Easy to add more composite combinations (e.g., WEATHER+RESOURCE+GENERAL).

### ✅ **Clear Responses**
Separator (`---`) visually distinguishes different parts of answer.

---

## Alternative: Coordinator Agent Approach

Instead of sequential execution, use a **coordinator agent** that:
1. Breaks down composite query into sub-queries
2. Delegates each sub-query to appropriate agent
3. Synthesizes all responses into cohesive answer

**Pros:**
- More natural language responses (no separator)
- Can handle query refinement
- Better context awareness

**Cons:**
- More complex to implement
- Adds another LLM call (coordinator synthesis)
- Higher latency
- Higher cost

**Recommended:** Start with sequential approach, upgrade to coordinator if needed.

---

## Testing Composite Queries

### Test Cases:

1. **WEATHER + RESOURCE:**
   - Input: "Should I plant maize and where to buy seeds?"
   - Expected: Planting decision + Seed suppliers list

2. **WEATHER + RESOURCE (Different order):**
   - Input: "Where can I buy fertilizer and will it rain tomorrow?"
   - Expected: Fertilizer suppliers + Weather forecast

3. **Triple Composite (if supported):**
   - Input: "Weather forecast, where to buy seeds, and what is irrigation?"
   - Expected: Weather + Suppliers + Irrigation explanation

4. **Ambiguous Composite:**
   - Input: "Tell me about maize farming and suppliers"
   - Expected: Classifier should output WEATHER+RESOURCE

---

## Edge Cases

### Query mentions category but doesn't need that agent:
- Input: "Where to buy weather equipment?"
- Contains "weather" but is actually RESOURCE only
- Classifier should be smart enough → Output: "RESOURCE"

### Query needs same agent twice:
- Input: "Should I plant maize and will it rain?"
- Both parts are WEATHER
- Classifier should output: "WEATHER" (single, not composite)

### Query is too vague:
- Input: "Tell me everything about farming"
- Classifier defaults to "GENERAL"
- General Agent redirects: "I can help with weather, planting, and finding resources. What specifically would you like to know?"

---

**Last Updated:** 2025-10-13
**Workflow Type:** Multi-Agent with Composite Query Support
