// client/src/modules/chat/ChatWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, RotateCcw, Bot } from 'lucide-react';
import './chat.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'Hello! I am Civic Assistant. I can help you understand how to report municipal issues, check complaint statuses, or view active alerts in your ward.'
};

const QUICK_REPLIES = [
  'How do I report an issue?',
  'Check my complaint status',
  'Any alerts in my area?'
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('cs_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [INITIAL_MESSAGE];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const launcherRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('cs_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Escape key closes modal and returns focus to launcher
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    const wardId = localStorage.getItem('cs_ward') || undefined;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          wardId
        })
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        'The assistant is unavailable right now. You can still report an issue or track a complaint from the menu.';

      setMessages((prev) => [...prev, { role: 'assistant', content: replyText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'The assistant is unavailable right now. You can still report an issue or track a complaint from the menu.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    sessionStorage.removeItem('cs_chat_history');
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        ref={launcherRef}
        type="button"
        className="cs-chat-launcher"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Civic Assistant"
        title="Open Civic Assistant"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="cs-chat-panel" role="dialog" aria-modal="true" aria-label="Civic Assistant Dialog">
          {/* Header */}
          <div className="cs-chat-header">
            <div className="cs-chat-header-title">
              <Bot size={18} />
              <span>Civic Assistant</span>
            </div>
            <div className="cs-chat-header-actions">
              <button
                type="button"
                className="cs-chat-icon-btn"
                onClick={handleResetChat}
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="cs-chat-icon-btn"
                onClick={() => {
                  setIsOpen(false);
                  launcherRef.current?.focus();
                }}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="cs-chat-messages">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    className={`cs-chat-bubble ${
                      isAssistant ? 'cs-chat-bubble-assistant' : 'cs-chat-bubble-user'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Show quick-reply chips after initial welcome message */}
                  {index === 0 && messages.length === 1 && (
                    <div className="cs-chat-chips-container">
                      {QUICK_REPLIES.map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          type="button"
                          className="cs-chat-chip"
                          onClick={() => handleSendMessage(chip)}
                        >
                          {chip} &rarr;
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="cs-chat-typing">
                <span className="cs-chat-dot" />
                <span className="cs-chat-dot" />
                <span className="cs-chat-dot" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="cs-chat-input-area">
            <textarea
              ref={textareaRef}
              rows={1}
              className="cs-chat-textarea"
              placeholder="Type your question here... (Enter to send)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              className="cs-chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              title="Send message"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
