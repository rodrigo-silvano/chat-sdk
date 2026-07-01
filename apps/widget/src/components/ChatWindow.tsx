import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { MessageBubble } from './MessageBubble.js';
import { InputBar } from './InputBar.js';
import { QuickReplies } from './QuickReplies.js';
import { TypingIndicator } from './TypingIndicator.js';
import { getSessionId } from '../services/session.js';
import { sendMessageStream } from '../services/api.js';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'operator';
  content: string;
  senderType: 'user' | 'bot' | 'human';
  createdAt: Date;
}

interface ChatWindowProps {
  agentId: string;
  baseUrl: string;
  title?: string;
  welcomeMessage?: string;
  quickReplies?: string[];
}

export function ChatWindow({
  agentId,
  baseUrl,
  title = 'Suporte Chat',
  welcomeMessage = 'Olá! Como posso ajudar hoje?',
  quickReplies = ['Como funciona?', 'Falar com suporte', 'Preços'],
}: ChatWindowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<string>('active_bot');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = getSessionId();
  const storageKey = `chat-sdk:messages:${sessionId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, createdAt: new Date(m.createdAt) })));
      } catch {
        initializeWelcomeMessage();
      }
    } else {
      initializeWelcomeMessage();
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const initializeWelcomeMessage = () => {
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
        senderType: 'bot',
        createdAt: new Date(),
      },
    ]);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMsg: Message = {
      role: 'user',
      content,
      senderType: 'user',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    let streamMsg: Message = {
      role: 'assistant',
      content: '',
      senderType: 'bot',
      createdAt: new Date(),
    };

    try {
      let isFirstChunk = true;
      await sendMessageStream({
        baseUrl,
        agentId,
        sessionId,
        content,
        onEvent: (event) => {
          if (event.type === 'text_delta') {
            setIsTyping(false);
            if (isFirstChunk) {
              setMessages((prev) => [...prev, streamMsg]);
              isFirstChunk = false;
            }
            streamMsg.content += event.content;
            setMessages((prev) => [...prev.slice(0, -1), { ...streamMsg }]);
          } else if (event.type === 'status') {
            setStatus(event.status);
            if (event.status === 'handover_requested') {
              const systemMsg: Message = {
                role: 'system',
                content: 'A transferir a conversa para um operador humano...',
                senderType: 'bot',
                createdAt: new Date(),
              };
              setMessages((prev) => [...prev, systemMsg]);
            }
          } else if (event.type === 'finish') {
            setIsTyping(false);
          } else if (event.type === 'error') {
            setIsTyping(false);
            const errorMsg: Message = {
              role: 'system',
              content: `Erro: ${event.message}`,
              senderType: 'bot',
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
          }
        },
      });
    } catch (err: any) {
      setIsTyping(false);
      const errorMsg: Message = {
        role: 'system',
        content: `Falha ao ligar ao servidor: ${err.message || 'Erro desconhecido'}`,
        senderType: 'bot',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div class="chat-widget-container">
      <div class={`chat-window ${isOpen ? '' : 'hidden'}`}>
        <div class="chat-header">
          <div class="chat-header-info">
            <span class="chat-header-title">{title}</span>
            <span class="chat-header-status">
              <span class="chat-status-dot" style={{ backgroundColor: status.startsWith('active_human') || status === 'waiting_for_agent' ? '#f59e0b' : '#10b981' }} />
              {status === 'active_human' ? 'Operador Humano' : 'Assistente Virtual'}
            </span>
          </div>
          <button type="button" class="chat-header-close" onClick={() => setIsOpen(false)}>
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div class="chat-messages">
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              role={msg.role}
              content={msg.content}
              senderType={msg.senderType}
              createdAt={msg.createdAt}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && !isTyping && (
          <QuickReplies replies={quickReplies} onReplyClick={handleSendMessage} />
        )}

        <InputBar onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>

      <button type="button" class="chat-launcher" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
