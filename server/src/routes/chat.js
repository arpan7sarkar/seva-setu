/**
 * chat.js — SevaBot Chat Route
 * Uses @google/genai SDK with gemini-2.5-flash (stable, production-ready)
 * Role-aware prompts provided by chatService.js
 */

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');
const { getSystemPrompt, isJailbreakAttempt } = require('../services/chatService');

const router = express.Router();

// Initialize Google Gen AI client — reads GEMINI_API_KEY from env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model to use — gemini-2.5-flash is the current stable, price-efficient model
const MODEL = 'gemini-2.5-flash';

/**
 * @route   POST /api/chat
 * @desc    SevaBot — role-aware Gemini chatbot for SevaSetu
 * @access  Private (requires JWT auth)
 * 
 * Body:
 *   message  {string}  - The user's current message
 *   history  {Array}   - Prior conversation turns: [{ role: 'user'|'model', text: string }]
 */
router.post('/', auth, async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // ── Guard: message length cap (prevent prompt injection via huge inputs)
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message is too long. Please keep it under 2000 characters.' });
  }

  // ── Guard: pre-flight jailbreak detection (before calling Gemini)
  if (isJailbreakAttempt(message)) {
    console.warn(`[SevaBot] Jailbreak attempt blocked from user ${req.user?.id} (${req.user?.role}): "${message.substring(0, 80)}..."`);
    return res.json({
      reply: "I'm SevaBot, here to help with SevaSetu platform questions and disaster relief assistance. I'm not able to help with that — is there something I can assist you with on the platform?",
      role: req.user.role
    });
  }

  try {
    // Get the role-specific system prompt with few-shot CoT examples
    const systemInstruction = getSystemPrompt(req.user.role);

    // Build the contents array from conversation history + new message
    // Format per latest @google/genai SDK docs:
    // contents: [{ role: 'user', parts: [{ text }] }, { role: 'model', parts: [{ text }] }, ...]
    const contents = [
      ...history
        .filter(h => h.text && h.text.trim()) // skip empty entries
        .map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    // Call Gemini API using the correct new SDK format
    const response = await ai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction,
        temperature: 0.7,
        // gemini-2.5-flash has thinking enabled by default — needs enough budget
        // Setting thinkingBudget: 0 disables extended thinking for fast chat responses
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 2048
      },
      contents
    });

    // Extract text from candidates (handles thinking model response structure)
    const parts = response.candidates?.[0]?.content?.parts;
    const replyText = parts
      ? parts.filter(p => p.text).map(p => p.text).join('')
      : response.text;

    if (!replyText) {
      return res.status(500).json({ error: 'SevaBot received an empty response. Please try again.' });
    }

    res.json({
      reply: replyText,
      role: req.user.role // Return role so frontend can adapt UI if needed
    });

  } catch (err) {
    console.error('[SevaBot] Error:', err.message);

    // Return a user-friendly error
    res.status(500).json({
      error: 'SevaBot is temporarily unavailable. Please try again in a moment.'
    });
  }
});

module.exports = router;
