export interface ConversationParticipant {
  id: string;
  name: string;
  role: 'governor' | 'admin' | 'investor';
  email?: string;
  joinedAt: Date;
  lastSeen?: Date;
}

export interface ConversationAuditEntry {
  id: string;
  action: 'created' | 'participant_added' | 'participant_removed' | 'escalated' | 'resolved' | 'archived' | 'status_changed' | 'priority_changed';
  performedBy: string;
  performedByName: string;
  performedByRole: 'governor' | 'admin' | 'investor';
  timestamp: Date;
  details: string;
}

export interface MessageReadStatus {
  userId: string;
  userName: string;
  readAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  base64?: string;
  isImage?: boolean;
}

export interface EnhancedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'governor' | 'admin' | 'investor';
  content: string;
  timestamp: Date;
  replyTo?: string;
  attachments?: Attachment[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read';
  department?: string;
  isEscalation?: boolean;
  escalationReason?: string;
  readBy: MessageReadStatus[];
  editedAt?: Date;
  editedBy?: string;
  originalContent?: string;
  messageType: 'text' | 'system' | 'escalation' | 'resolution';
  metadata?: Record<string, any>;
}

export interface ConversationMetadata {
  id: string;
  type: 'admin_investor' | 'admin_governor' | 'investor_governor' | 'group';
  title: string;
  description?: string;
  participants: ConversationParticipant[];
  participantUids: string[]; // Array of participant UIDs for Firestore queries
  participantNames: string[];
  participantRoles: string[];
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
  lastMessage: string;
  lastMessageSender: string;
  isEscalated: boolean;
  escalatedAt?: Date;
  escalatedBy?: string;
  escalationReason?: string;
  status: 'active' | 'archived' | 'escalated' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  department?: string;
  auditTrail: ConversationAuditEntry[];
}

// Legacy interfaces for backward compatibility
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'investor' | 'admin' | 'governor';
  content: string;
  attachments?: Attachment[];
  createdAt: Date;
  readAt?: Date;
}

export interface ParticipantDetail {
  id: string;
  name: string;
  role: 'investor' | 'admin' | 'governor';
  avatar?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantUids?: string[]; // Optional for backward compatibility
  participantDetails: ParticipantDetail[];
  lastMessage?: Message;
  updatedAt: Date;
  createdAt: Date;
  title?: string;
  isActive: boolean;
  department?: string;
  urgency?: string;
  recipientType?: string;
}