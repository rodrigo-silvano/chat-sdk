export const SOCKET_EVENTS = {
  NEW_MESSAGE: 'new_message',
  CONVERSATION_STATUS_CHANGED: 'conversation:status_changed',
  TYPING_INDICATOR: 'typing_indicator',
  AGENT_ASSIGNED: 'agent:assigned',
  AGENT_UNASSIGNED: 'agent:unassigned',
  CONVERSATION_READ: 'conversation:read',
} as const;
