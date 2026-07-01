import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@chat-sdk/shared';

interface SocketHookParams {
  token: string | null;
  activeConversationId: string | null;
  onNewMessage?: (msg: any) => void;
  onStatusChanged?: (data: { conversationId: string; status: string; assignedOperatorId?: string }) => void;
  onTypingIndicator?: (data: { conversationId: string; isTyping: boolean; name: string }) => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  sendTyping: (isTyping: boolean, name: string) => void;
}

export function useSocket({
  token,
  activeConversationId,
  onNewMessage,
  onStatusChanged,
  onTypingIndicator,
}: SocketHookParams): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  };

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_operators');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg: any) => {
      if (onNewMessage) {
        onNewMessage(msg);
      }
      if (msg.senderType === 'user' && msg.conversationId !== activeConversationId) {
        playChime();
      }
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_STATUS_CHANGED, (data: any) => {
      if (onStatusChanged) {
        onStatusChanged(data);
      }
      if (data.status === 'handover_requested' || data.status === 'waiting_for_agent') {
        playChime();
      }
    });

    socket.on('typing_indicator', (data: any) => {
      if (onTypingIndicator) {
        onTypingIndicator(data);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, activeConversationId]);

  useEffect(() => {
    if (socketRef.current && connected && activeConversationId) {
      socketRef.current.emit('join_conversation', activeConversationId);
    }
  }, [activeConversationId, connected]);

  const sendTyping = (isTyping: boolean, name: string) => {
    if (socketRef.current && connected && activeConversationId) {
      socketRef.current.emit('typing', {
        conversationId: activeConversationId,
        isTyping,
        name,
      });
    }
  };

  return {
    socket: socketRef.current,
    connected,
    sendTyping,
  };
}
