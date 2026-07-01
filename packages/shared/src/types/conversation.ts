export const ConversationStatus = {
  ACTIVE_BOT: 'active_bot',
  HANDOVER_REQUESTED: 'handover_requested',
  WAITING_FOR_AGENT: 'waiting_for_agent',
  ACTIVE_HUMAN: 'active_human',
  RESOLVED: 'resolved',
} as const;

export type ConversationStatus = typeof ConversationStatus[keyof typeof ConversationStatus];

export interface Conversation {
  id: string;
  agentId: string;
  sessionId: string;
  status: ConversationStatus;
  assignedOperatorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
