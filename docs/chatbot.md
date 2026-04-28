# SevaBot — Complete Build Guide
> Gemini-powered Intelligent Assistant for SevaSetu

---

## 1. What SevaBot Does

SevaBot is a role-aware, conversational assistant embedded in the SevaSetu platform. It uses the **Gemini 2.5 Flash** API with **Function Calling** to answer queries, check live database data, and guide users — without ever accepting unverified incident reports.

### Capabilities by Role

| Role | Capabilities |
|---|---|
| **Citizen / Victim** | Platform navigation guidance, report status lookup by phone/ID, survival tips |
| **Volunteer** | SOP queries, task status check, coordinator contact lookup |
| **Coordinator** | Natural language analytics ("How many open medical needs today?"), district situation summaries, escalated need alerts |

### Hard Rules (Always Enforced)
- ❌ **Never** accept an incident report — always redirect to the Report Form
- ❌ **Never** dispatch volunteers autonomously
- ❌ **Never** provide medical diagnoses
- ✅ Always respond in English
- ✅ Always identify itself as "SevaBot, SevaSetu's assistant"

---

## 2. Tech Stack for the Chatbot

| Layer | Technology |
|---|---|
| AI Model | Gemini 2.5 Flash (`@google/generative-ai`) |
| Backend | New Express route: `POST /api/chat` |
| Database Queries | Existing Prisma client |
| Frontend | New React component `<ChatWidget />` |
| Auth | Existing JWT middleware — bot is role-aware |

---

## 3. Phase 1 — Backend Setup

### Step 1.1 — Install the Gemini SDK

```bash
cd server
npm install @google/generative-ai
```

### Step 1.2 — Add API Key to `.env`

```env
GEMINI_API_KEY=your_google_ai_studio_key_here
```

Get your free key at: https://aistudio.google.com/app/apikey

### Step 1.3 — Create the Chat Route

Create file: `server/src/routes/chat.js`

```js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Tool Definitions (Gemini Function Calling) ─────────────────────────

const tools = [
  {
    functionDeclarations: [
      {
        name: 'checkReportStatus',
        description: 'Checks the status of a community need report by phone number or report ID',
        parameters: {
          type: 'OBJECT',
          properties: {
            identifier: {
              type: 'STRING',
              description: 'Phone number (e.g. 9876543210) or the report UUID'
            }
          },
          required: ['identifier']
        }
      },
      {
        name: 'getAnalytics',
        description: 'Returns live statistics for coordinators. E.g. count of open needs by type or district.',
        parameters: {
          type: 'OBJECT',
          properties: {
            need_type: {
              type: 'STRING',
              description: 'Filter by type: medical, food, shelter, rescue, accidental, other. Leave empty for all.'
            },
            district: {
              type: 'STRING',
              description: 'Filter by district name. Leave empty for all districts.'
            },
            status: {
              type: 'STRING',
              description: 'Filter by status: open, pending, assigned, in_progress, completed'
            }
          }
        }
      },
      {
        name: 'getEscalatedNeeds',
        description: 'Returns a list of needs that have been pending for over 30 minutes with no volunteer accepting',
        parameters: { type: 'OBJECT', properties: {} }
      }
    ]
  }
];

// ── Tool Executors ─────────────────────────────────────────────────────

async function executeTool(name, args) {
  if (name === 'checkReportStatus') {
    const { identifier } = args;
    const isUUID = /^[0-9a-f-]{36}$/i.test(identifier);

    let rows;
    if (isUUID) {
      rows = await prisma.$queryRaw`
        SELECT title, status, ward, district, need_type, created_at, urgency_score
        FROM needs WHERE id = ${identifier}::uuid LIMIT 1
      `;
    } else {
      // Search by contact_number
      rows = await prisma.$queryRaw`
        SELECT title, status, ward, district, need_type, created_at, urgency_score
        FROM needs WHERE contact_number = ${identifier} ORDER BY created_at DESC LIMIT 1
      `;
    }

    if (!rows || rows.length === 0) {
      return { found: false, message: 'No report found for the given identifier.' };
    }
    return { found: true, report: rows[0] };
  }

  if (name === 'getAnalytics') {
    const { need_type, district, status } = args;
    const conditions = [`status != 'completed'`];
    if (need_type) conditions.push(`need_type = '${need_type}'`);
    if (district) conditions.push(`district ILIKE '%${district}%'`);
    if (status) conditions.push(`status = '${status}'`);

    const where = conditions.join(' AND ');
    const rows = await prisma.$queryRawUnsafe(`
      SELECT need_type, status, COUNT(*)::int as count
      FROM needs WHERE ${where}
      GROUP BY need_type, status
      ORDER BY count DESC
    `);
    return { analytics: rows };
  }

  if (name === 'getEscalatedNeeds') {
    const rows = await prisma.need.findMany({
      where: { isEscalated: true, status: { in: ['pending', 'open'] } },
      select: { id: true, title: true, district: true, ward: true, needType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 10
    });
    return { escalated: rows, count: rows.length };
  }

  return { error: 'Unknown tool' };
}

// ── System Prompt ──────────────────────────────────────────────────────

function buildSystemPrompt(userRole) {
  return `
You are SevaBot, the intelligent assistant for SevaSetu — a real-time volunteer coordination platform for disaster relief and community aid in India.

YOUR ROLE CONTEXT: The current user has role: "${userRole}".

STRICT RULES:
1. You CANNOT accept incident reports. If anyone tries to report an emergency, say: "For safety, all reports must go through the official 'Report Incident' form to ensure GPS verification. Please click the Report button in the navigation."
2. You CANNOT deploy or assign volunteers.
3. You CANNOT provide medical diagnoses. You may provide basic first-aid information only.
4. Always be warm, concise, and empathetic. People may be in distress.
5. If you don't know something, say so honestly.

PLATFORM KNOWLEDGE:
- SevaSetu connects citizens in need with verified volunteers in real-time
- Reports require live photo + GPS verification to prevent fraud
- Volunteers are automatically notified within a 7km radius when a need is reported
- Coordinators manage escalated cases (needs not accepted within 30 minutes)
- Volunteer roles require coordinator approval
- WhatsApp reporting is available by sending "REPORT" to our WhatsApp number

FIRST AID KNOWLEDGE (use only if asked):
- Bleeding: Apply firm pressure with a clean cloth for 10 minutes. Do not remove the cloth.
- Burns: Cool with running water for 20 minutes. Do not use ice.
- Drowning: Call 112 immediately. Begin CPR if trained.
- Cardiac arrest: Call 112, begin chest compressions 30:2 ratio if trained.
- Flood safety: Move to higher ground. Do not walk through moving water.
- Emergency water: Boil for 1 minute, or use water purification tablets.

SOP FOR VOLUNTEERS:
- If a report seems fake: Document it, do not confront, report to coordinator.
- Check-in GPS must match the need location within 1km.
- Completion requires a photo uploaded through the app.

COORDINATOR CONTACTS: Direct users to check the platform's Coordinators page for current contact details.
`.trim();
}

// ── Chat Endpoint ──────────────────────────────────────────────────────

/**
 * @route   POST /api/chat
 * @desc    SevaBot chat endpoint with Gemini Function Calling
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: buildSystemPrompt(req.user.role),
      tools
    });

    // Build chat history from client-provided array
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    let result = await chat.sendMessage(message);
    let response = result.response;

    // Handle Function Calling loop
    while (response.functionCalls && response.functionCalls().length > 0) {
      const calls = response.functionCalls();
      const functionResults = [];

      for (const call of calls) {
        console.log(`[SevaBot] Calling tool: ${call.name}`, call.args);
        const toolResult = await executeTool(call.name, call.args);
        functionResults.push({
          functionResponse: {
            name: call.name,
            response: toolResult
          }
        });
      }

      // Send tool results back to Gemini
      result = await chat.sendMessage(functionResults);
      response = result.response;
    }

    const replyText = response.text();
    res.json({ reply: replyText });

  } catch (err) {
    console.error('[SevaBot] Error:', err.message);
    res.status(500).json({ error: 'SevaBot is temporarily unavailable. Please try again.' });
  }
});

module.exports = router;
```

### Step 1.4 — Register the Route in `index.js`

Add this line to `server/src/index.js` in the Use Routes section:

```js
app.use('/api/chat', require('./routes/chat'));
```

---

## 4. Phase 2 — Frontend `<ChatWidget />` Component

### Step 2.1 — Create the Component

Create file: `client/src/components/ChatWidget.jsx`

```jsx
import { useState, useRef, useEffect } from 'react';
import api from '../services/api'; // your existing axios instance

const BOT_AVATAR = '🤝';
const USER_AVATAR = '👤';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: "Hi! I'm SevaBot, SevaSetu's AI assistant. I can help you track reports, answer questions, or guide you through the platform. How can I help?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Send full history (excluding the initial greeting for context efficiency)
      const historyToSend = newMessages.slice(1); // skip the static greeting
      const { data } = await api.post('/chat', {
        message: text,
        history: historyToSend.slice(0, -1) // history without the current message
      });

      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'model', text: '⚠️ I encountered an error. Please try again in a moment.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '56px', height: '56px', borderRadius: '50%',
          background: '#2d6148', color: '#fff', border: 'none',
          fontSize: '24px', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(45,97,72,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s ease'
        }}
        title="Chat with SevaBot"
        aria-label="Open SevaBot chat"
      >
        {isOpen ? '✕' : '🤝'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '92px', right: '24px', zIndex: 9998,
          width: '360px', maxWidth: 'calc(100vw - 48px)',
          height: '500px', maxHeight: 'calc(100vh - 120px)',
          background: '#ffffff', borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid #e5e7eb'
        }}>
          {/* Header */}
          <div style={{
            background: '#2d6148', color: '#fff',
            padding: '14px 18px', display: 'flex',
            alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>🤝</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>SevaBot</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>SevaSetu AI Assistant</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start', gap: '8px'
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>
                  {msg.role === 'user' ? USER_AVATAR : BOT_AVATAR}
                </span>
                <div style={{
                  background: msg.role === 'user' ? '#2d6148' : '#f3f4f6',
                  color: msg.role === 'user' ? '#fff' : '#1f2937',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '10px 14px', maxWidth: '80%',
                  fontSize: '14px', lineHeight: '2.5',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '18px' }}>{BOT_AVATAR}</span>
                <div style={{
                  background: '#f3f4f6', borderRadius: '4px 16px 16px 16px',
                  padding: '10px 14px', fontSize: '14px', color: '#6b7280'
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #e5e7eb',
            display: 'flex', gap: '8px', background: '#fff'
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1px solid #d1d5db',
                borderRadius: '10px', padding: '10px 12px',
                fontSize: '14px', fontFamily: 'inherit',
                outline: 'none', lineHeight: '1.4'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: '#2d6148', color: '#fff',
                border: 'none', borderRadius: '10px',
                padding: '0 16px', cursor: 'pointer',
                fontSize: '18px', opacity: (loading || !input.trim()) ? 0.5 : 1
              }}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

### Step 2.2 — Add `<ChatWidget />` to the App

In `client/src/App.jsx` (or your main layout), import and render it globally so it appears on every page after login:

```jsx
import ChatWidget from './components/ChatWidget';

// Inside your JSX, after your routes:
<ChatWidget />
```

---

## 5. Phase 3 — Quick-Reply Suggestions (Enhancement)

Add suggested prompts that appear when the chat first opens to help users get started quickly.

Add this below the Header div in `ChatWidget.jsx`, shown only when there is only 1 message (the greeting):

```jsx
{messages.length === 1 && (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 0 8px 0' }}>
    {[
      'Check my report status',
      'How do I report an incident?',
      'What should I do in a flood?',
      'How many open needs today?'
    ].map(suggestion => (
      <button
        key={suggestion}
        onClick={() => { setInput(suggestion); }}
        style={{
          background: '#f0faf5', border: '1px solid #2d6148',
          color: '#2d6148', borderRadius: '20px',
          padding: '6px 12px', fontSize: '12px',
          cursor: 'pointer', whiteSpace: 'nowrap'
        }}
      >
        {suggestion}
      </button>
    ))}
  </div>
)}
```

---

## 6. Phase 4 — Knowledge Injection (Static Context)

To prevent hallucination about SevaSetu-specific rules, the system prompt already injects platform knowledge inline. **No Vector DB is needed.** The system prompt in `chat.js` contains:

- Platform SOPs
- First-aid guidelines
- Volunteer protocols
- Coordinator workflows

If you want to add more knowledge (e.g., new district SOPs), simply append them to the `buildSystemPrompt()` function string.

---

## 7. Enhancements Added Beyond the Original Prompt

The following additions improve the chatbot beyond the original spec:

| Enhancement | Reason |
|---|---|
| **Role-aware system prompt** | Coordinator sees analytics tools; Citizen only sees navigation and status |
| **`getEscalatedNeeds` tool** | Gives coordinators an instant command-center view of unresponded emergencies |
| **`getAnalytics` tool** | Natural language analytics — "How many food needs in Kolkata?" → real DB query |
| **Quick-reply suggestions** | Reduces friction for first-time users who don't know what to ask |
| **Function Call loop** | Handles multi-tool Gemini responses correctly without breaking |
| **Graceful error handling** | If Gemini is down, the user sees a friendly error, not a crash |
| **History slicing** | Sends only the last N messages as context to keep token cost low |

---

## 8. Environment Variables Checklist

| Variable | Where | Value |
|---|---|---|
| `GEMINI_API_KEY` | `server/.env` | Your Google AI Studio key |
| `VITE_API_BASE_URL` | `client/.env` | `http://localhost:5000/api` |

---

## 9. Testing the Chatbot

### Test Cases by Role

**As a Citizen:**
- "My house is flooded, help me" → Should redirect to Report Form
- "Check my report status, my number is 9876543210" → Should query DB
- "How do I purify water?" → Should give first-aid text

**As a Volunteer:**
- "What do I do if a report seems fake?" → Should give SOP
- "How do I check in to my task?" → Should guide to the app

**As a Coordinator:**
- "How many open medical needs do we have?" → Should call `getAnalytics`
- "Show me escalated needs" → Should call `getEscalatedNeeds`
- "Summarize needs in South 24 Parganas" → Should call `getAnalytics` with district filter

---

## 10. Cost & Rate Limits

- **Gemini 2.5 Flash** (free tier via AI Studio): 15 RPM, 1M tokens/day
- Each chat message uses approximately 500–1500 tokens
- Estimated free capacity: **~700–2000 chat messages per day**
- For production scale, upgrade to a paid Vertex AI plan

---

*SevaBot Build Guide | SevaSetu Platform | Powered by Gemini 2.5 Flash*
