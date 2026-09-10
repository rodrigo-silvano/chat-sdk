export const ConversationStatus = {
  ACTIVE_BOT: 'active_bot',
  HANDOVER_REQUESTED: 'handover_requested',
  WAITING_FOR_AGENT: 'waiting_for_agent',
  ACTIVE_HUMAN: 'active_human',
  RESOLVED: 'resolved',
} as const;

export type ConversationStatus = typeof ConversationStatus[keyof typeof ConversationStatus];

export type ConversationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ConversationTag = 'support' | 'sales' | 'technical' | 'general' | 'urgent' | 'feedback' | 'bug' | 'feature_request';

export interface Conversation {
  id: string;
  agentId: string;
  sessionId: string;
  status: ConversationStatus;
  assignedOperatorId: string | null;
  metadata: Record<string, unknown>;
  tags: ConversationTag[];
  priority: ConversationPriority;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
