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
