import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  Timestamp,
  arrayUnion,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Message, Conversation, Attachment } from '../types/message';
import { generateId } from '../lib/utils';
import { ConversationMetadata, ConversationParticipant, ConversationAuditEntry } from '../types/message';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper function to check if file is an image
const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

// Service to get users by role
const getUsersByRole = async (role: 'admin' | 'governor'): Promise<Array<{id: string, name: string, role: string}>> => {
  try {
    // Special case for governor - return Sam Hivanek
    if (role === 'governor') {
      return [{
        id: '2cSQTHfSSPUXAVaSKGl8zdO9hiC3',
        name: 'Sam Hivanek',
        role: 'governor'
      }];
    }
    
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', role)
    );
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim() || doc.data().email || 'Unknown User',
      role: doc.data().role || role
    }));
  } catch (error) {
    console.error(`Failed to fetch ${role} users:`, error);
    // Fallback for governor even if query fails
    if (role === 'governor') {
      return [{
        id: '2cSQTHfSSPUXAVaSKGl8zdO9hiC3',
        name: 'Sam Hivanek',
        role: 'governor'
      }];
    }
    return [];
  }
};

export const messageService = {
  async getAdminUsers(): Promise<Array<{id: string, name: string, role: string}>> {
    return getUsersByRole('admin');
  },

  async getGovernorUsers(): Promise<Array<{id: string, name: string, role: string}>> {
    return getUsersByRole('governor');
  },

  // Enhanced conversation creation following the new schema
  async createEnhancedConversation(
    investorId: string,
    investorName: string,
    investorEmail: string,
    recipientId: string,
    recipientName: string,
    recipientRole: 'admin' | 'governor',
    title?: string,
    description?: string,
    department?: string,
    urgency: string = 'medium',
    tags: string[] = []
  ): Promise<string | null> {
    try {
      const now = new Date();
      const conversationId = generateId();
      
      // Determine conversation type based on participant roles
      const conversationType = recipientRole === 'governor' ? 'investor_governor' : 'admin_investor';
      
      // Create participant objects
      const participants: ConversationParticipant[] = [
        {
          id: investorId,
          name: investorName,
          role: 'investor',
          email: investorEmail,
          joinedAt: now,
        },
        {
          id: recipientId,
          name: recipientName,
          role: recipientRole,
          joinedAt: now,
        }
      ];
      
      // Create initial audit entry
      const initialAuditEntry: ConversationAuditEntry = {
        id: generateId(),
        action: 'created',
        performedBy: investorId,
        performedByName: investorName,
        performedByRole: 'investor',
        timestamp: now,
        details: `Conversation created with ${recipientRole}: ${recipientName}`,
      };
      
      // Generate title if not provided
      const conversationTitle = title || 
        `Communication with ${recipientRole === 'governor' ? 'Management' : 'Support Team'}${department ? ` - ${department}` : ''}`;
      
      const conversationMetadata: Omit<ConversationMetadata, 'id'> = {
        type: conversationType,
        title: conversationTitle,
        description: description || `${department || 'General'} inquiry with ${urgency} priority`,
        participants,
        participantUids: [investorId, recipientId],
        participantNames: [investorName, recipientName],
        participantRoles: ['investor', recipientRole],
        createdBy: investorId,
        createdAt: now,
        lastActivity: now,
        lastMessage: '',
        lastMessageSender: '',
        isEscalated: false,
        status: 'active',
        priority: urgency as 'low' | 'medium' | 'high' | 'urgent',
        ...(department && { department }),
        tags: department ? [department, ...tags] : tags,
        auditTrail: [initialAuditEntry],
      };

      const docRef = await addDoc(collection(db, 'conversations'), {
        ...conversationMetadata,
        createdAt: Timestamp.now(),
        lastActivity: Timestamp.now(),
        participantUids: [investorId, recipientId], // Ensure this is stored as a simple array
        participants: conversationMetadata.participants.map(participant => ({
          ...participant,
          joinedAt: Timestamp.now(),
        })),
        auditTrail: conversationMetadata.auditTrail.map(entry => ({
          ...entry,
          timestamp: Timestamp.now(),
        })),
      });

      console.log('Enhanced conversation created with ID:', docRef.id);

      // Create initial message in affiliateMessages collection
      const initialMessageContent = description || `New conversation started: ${conversationTitle}`;
      const initialMessage = {
        conversationId: docRef.id,
        senderId: investorId,
        senderName: investorName,
        senderRole: 'investor',
        content: initialMessageContent,
        timestamp: Timestamp.now(),
        priority: urgency as 'low' | 'medium' | 'high' | 'urgent',
        status: 'sent',
        isEscalation: false,
        readBy: [],
        messageType: 'text',
        ...(department && { department }),
      };

      await addDoc(collection(db, 'affiliateMessages'), initialMessage);
      console.log('Initial message created in affiliateMessages collection');

      // Update conversation with the initial message
      await updateDoc(docRef, {
        lastMessage: initialMessageContent,
        lastMessageSender: investorName,
      });

      // Debug: Immediately fetch the created conversation to verify structure
      try {
        const createdDoc = await getDoc(docRef);
        if (createdDoc.exists()) {
          console.log('=== CREATED CONVERSATION STRUCTURE ===');
          console.log('Document ID:', createdDoc.id);
          console.log('Document data:', JSON.stringify(createdDoc.data(), null, 2));
          console.log('participantUids field:', createdDoc.data().participantUids);
          console.log('participants field:', createdDoc.data().participants);
          console.log('=== END CONVERSATION STRUCTURE ===');
        }
      } catch (debugError) {
        console.error('Failed to fetch created conversation for debugging:', debugError);
      }

      return docRef.id;
    } catch (error) {
      console.error('Failed to create enhanced conversation:', error);
      return null;
    }
  },

  // Legacy conversation creation (kept for backward compatibility)
  async createConversation(
    investorId: string,
    investorName: string,
    recipientId: string,
    recipientName: string,
    recipientRole: 'admin' | 'governor',
    title?: string,
    department?: string,
    urgency: string = 'medium'
  ): Promise<string | null> {
    try {
      console.log('Creating legacy conversation with data:', {
        investorId,
        investorName,
        recipientId,
        recipientName,
        recipientRole,
        title,
        department,
        urgency
      });

      const conversation: Omit<Conversation, 'id'> = {
        participants: [investorId, recipientId],
        participantDetails: [
          { id: investorId, name: investorName, role: 'investor' },
          { id: recipientId, name: recipientName, role: recipientRole },
        ],
        title: title || `${department} - ${urgency.charAt(0).toUpperCase() + urgency.slice(1)} Priority`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        department: department || 'General Inquiry',
        urgency: urgency,
        recipientType: recipientRole,
      };

      console.log('Conversation object to be saved:', conversation);

      const docRef = await addDoc(collection(db, 'conversations'), {
        ...conversation,
        participants: [investorId, recipientId], // Ensure participants array is stored
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('Legacy conversation created with ID:', docRef.id);

      // Create initial message in affiliateMessages collection
      const initialMessageContent = `New conversation started: ${conversation.title}`;
      const initialMessage = {
        conversationId: docRef.id,
        senderId: investorId,
        senderName: investorName,
        senderRole: 'investor',
        content: initialMessageContent,
        createdAt: Timestamp.now(),
        attachments: [],
      };

      await addDoc(collection(db, 'affiliateMessages'), initialMessage);
      console.log('Initial message created in affiliateMessages collection');

      return docRef.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'investor' | 'admin' | 'governor',
    content: string,
    attachments?: File[]
  ): Promise<boolean> {
    try {
      const uploadedAttachments: Attachment[] = [];

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const attachmentId = generateId();
          const storageRef = ref(storage, `messages/${conversationId}/${attachmentId}-${file.name}`);
          
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          
          uploadedAttachments.push({
            id: attachmentId,
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
          });
        }
      }

      // Create the message document
      const messageData = {
        conversationId,
        senderId,
        senderName,
        senderRole,
        content,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : [],
        createdAt: Timestamp.now(),
      };

      // Save message to affiliateMessages collection
      const docRef = await addDoc(collection(db, 'affiliateMessages'), messageData);

      // Update the conversation with the last message info
      await updateDoc(doc(db, 'conversations', conversationId), {
        updatedAt: Timestamp.now(),
        lastMessage: {
          id: docRef.id,
          content,
          senderId,
          senderName,
          senderRole,
          createdAt: Timestamp.now(),
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : [],
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  },

  // Enhanced message sending following the new schema
  async sendEnhancedMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'investor' | 'admin' | 'governor',
    content: string,
    attachments?: File[],
    options?: {
      replyTo?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      department?: string;
      isEscalation?: boolean;
      escalationReason?: string;
      messageType?: 'text' | 'system' | 'escalation' | 'resolution';
      metadata?: Record<string, any>;
    }
  ): Promise<string | null> {
    try {
      console.log('=== SENDING ENHANCED MESSAGE ===');
      console.log('Conversation ID:', conversationId);
      console.log('Sender:', { senderId, senderName, senderRole });
      console.log('Content:', content);
      console.log('Options:', options);

      const uploadedAttachments: Attachment[] = [];

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        console.log('Uploading', attachments.length, 'attachments');
        for (const file of attachments) {
          const attachmentId = generateId();
          
          // Convert file to base64
          const base64Data = await fileToBase64(file);
          
          // Also upload to storage for backup/download purposes
          const storageRef = ref(storage, `messages/${conversationId}/${attachmentId}-${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          
          uploadedAttachments.push({
            id: attachmentId,
            name: file.name,
            url: downloadURL,
            type: file.type,
            size: file.size,
            base64: base64Data,
            isImage: isImageFile(file),
          });
        }
        console.log('Uploaded attachments:', uploadedAttachments);
      }

      const now = new Date();
      const messageId = generateId();

      // Create enhanced message following the schema
      const enhancedMessage: any = {
        conversationId,
        senderId,
        senderName,
        senderRole: senderRole as 'governor' | 'admin' | 'investor',
        content,
        timestamp: now,
        priority: options?.priority || 'medium',
        status: 'sent',
        isEscalation: options?.isEscalation || false,
        readBy: [], // Initially empty, will be populated when users read the message
        messageType: options?.messageType || 'text',
        // Only include optional fields if they have defined values
        ...(options?.replyTo && { replyTo: options.replyTo }),
        ...(uploadedAttachments.length > 0 && { attachments: uploadedAttachments }),
        ...(options?.department && { department: options.department }),
        ...(options?.escalationReason && { escalationReason: options.escalationReason }),
        ...(options?.metadata && { metadata: options.metadata }),
      };

      console.log('Enhanced message object:', enhancedMessage);

      // Save message to affiliateMessages collection
      const docRef = await addDoc(collection(db, 'affiliateMessages'), {
        ...enhancedMessage,
        timestamp: Timestamp.now(),
        readBy: [], // Firestore array
      });

      console.log('Message saved with ID:', docRef.id);

      // Update the conversation with the last message info and activity
      const conversationUpdate: any = {
        lastActivity: Timestamp.now(),
        lastMessage: content,
        lastMessageSender: senderName,
        updatedAt: Timestamp.now(),
      };

      // If this is an escalation, update conversation status
      if (options?.isEscalation) {
        conversationUpdate.isEscalated = true;
        conversationUpdate.escalatedAt = Timestamp.now();
        conversationUpdate.escalatedBy = senderId;
        conversationUpdate.escalationReason = options.escalationReason;
        conversationUpdate.status = 'escalated';

        // Add audit trail entry for escalation
        const escalationAuditEntry = {
          id: generateId(),
          action: 'escalated',
          performedBy: senderId,
          performedByName: senderName,
          performedByRole: senderRole,
          timestamp: Timestamp.now(),
          details: `Conversation escalated: ${options.escalationReason || 'No reason provided'}`,
        };

        conversationUpdate.auditTrail = arrayUnion(escalationAuditEntry);
      }

      await updateDoc(doc(db, 'conversations', conversationId), conversationUpdate);

      console.log('Conversation updated successfully');

      // TODO: Generate notifications for recipients
      // This would involve creating notification documents for other participants

      return docRef.id;
    } catch (error) {
      console.error('Failed to send enhanced message:', error);
      return null;
    }
  },

  // Helper method to mark messages as read
  async markMessageAsRead(
    messageId: string,
    userId: string,
    userName: string
  ): Promise<boolean> {
    try {
      const readStatus = {
        userId,
        userName,
        readAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'affiliateMessages', messageId), {
        readBy: arrayUnion(readStatus),
        status: 'read',
      });

      return true;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      return false;
    }
  },

  // Helper method to edit a message
  async editMessage(
    messageId: string,
    newContent: string,
    editedBy: string
  ): Promise<boolean> {
    try {
      // First get the current message to preserve original content
      const messageDoc = await getDoc(doc(db, 'affiliateMessages', messageId));
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const currentData = messageDoc.data();
      
      await updateDoc(doc(db, 'affiliateMessages', messageId), {
        content: newContent,
        editedAt: Timestamp.now(),
        editedBy,
        originalContent: currentData.originalContent || currentData.content, // Preserve original if not already edited
      });

      return true;
    } catch (error) {
      console.error('Failed to edit message:', error);
      return false;
    }
  },

  // Helper method to update conversation status
  async updateConversationStatus(
    conversationId: string,
    status: 'active' | 'archived' | 'escalated' | 'resolved',
    performedBy: string,
    performedByName: string,
    performedByRole: 'governor' | 'admin' | 'investor',
    reason?: string
  ): Promise<boolean> {
    try {
      const auditEntry = {
        id: generateId(),
        action: 'status_changed',
        performedBy,
        performedByName,
        performedByRole,
        timestamp: Timestamp.now(),
        details: `Status changed to ${status}${reason ? `: ${reason}` : ''}`,
      };

      await updateDoc(doc(db, 'conversations', conversationId), {
        status,
        updatedAt: Timestamp.now(),
        auditTrail: arrayUnion(auditEntry),
      });

      return true;
    } catch (error) {
      console.error('Failed to update conversation status:', error);
      return false;
    }
  },
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // Try enhanced query first (with participantUids)
      try {
        const enhancedQuery = query(
          collection(db, 'conversations'),
          where('participantUids', 'array-contains', userId),
          orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(enhancedQuery);
        if (snapshot.docs.length > 0) {
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Conversation[];
        }
      } catch (enhancedError) {
        console.log('Enhanced query failed, falling back to legacy query');
      }
      
      // Fallback to legacy query
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(conversationsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Conversation[];
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      return [];
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const messagesQuery = query(
        collection(db, 'affiliateMessages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate(),
      })) as Message[];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  },

  // Delete all conversations created by a specific user
  async deleteAllUserConversations(userId: string): Promise<boolean> {
    try {
      console.log('=== DELETING ALL CONVERSATIONS FOR USER ===');
      console.log('User ID:', userId);
      
      // Get all conversations created by this user
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('createdBy', '==', userId)
      );
      
      const snapshot = await getDocs(conversationsQuery);
      console.log('Found', snapshot.docs.length, 'conversations to delete');
      
      // Delete each conversation
      const deletePromises = snapshot.docs.map(async (conversationDoc) => {
        console.log('Deleting conversation:', conversationDoc.id);
        
        // Also delete all messages in this conversation
        const messagesQuery = query(
          collection(db, 'affiliateMessages'),
          where('conversationId', '==', conversationDoc.id)
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        console.log('Found', messagesSnapshot.docs.length, 'messages to delete for conversation', conversationDoc.id);
        
        // Delete all messages
        const messageDeletePromises = messagesSnapshot.docs.map(messageDoc => {
          const messageDocRef = doc(db, 'affiliateMessages', messageDoc.id);
          return deleteDoc(messageDocRef);
        });
        
        await Promise.all(messageDeletePromises);
        
        // Delete the conversation
        const conversationDocRef = doc(db, 'conversations', conversationDoc.id);
        await deleteDoc(conversationDocRef);
      });
      
      await Promise.all(deletePromises);
      console.log('All conversations and messages deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete conversations:', error);
      return false;
    }
  },

  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
    // Use the available index: conversationId + timestamp for enhanced messages
    try {
      console.log('Subscribing to messages for conversation:', conversationId);
      
      // Try enhanced message query first (using timestamp field)
      const enhancedMessagesQuery = query(
        collection(db, 'affiliateMessages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      return onSnapshot(enhancedMessagesQuery, (snapshot) => {
        console.log('Enhanced messages snapshot received:', snapshot.docs.length, 'messages');
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().timestamp?.toDate() || doc.data().createdAt?.toDate() || new Date(),
          readAt: doc.data().readAt?.toDate(),
        })) as Message[];
        
        console.log('Enhanced processed messages:', messages);
        callback(messages);
      }, (error) => {
        console.error('Error in enhanced messages subscription:', error);
        // Try legacy message query with createdAt
        try {
          console.log('Trying legacy message query for conversation:', conversationId);
          const legacyMessagesQuery = query(
            collection(db, 'affiliateMessages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc')
          );
          
          return onSnapshot(legacyMessagesQuery, (snapshot) => {
            console.log('Legacy messages snapshot received:', snapshot.docs.length, 'messages');
            const messages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              readAt: doc.data().readAt?.toDate(),
            })) as Message[];
            
            console.log('Legacy processed messages:', messages);
            callback(messages);
          }, (legacyError) => {
            console.error('Legacy messages query also failed:', legacyError);
            // Final fallback - no orderBy
            try {
              console.log('Trying simple message query without orderBy');
              const simpleQuery = query(
                collection(db, 'affiliateMessages'),
                where('conversationId', '==', conversationId)
              );
              
              return onSnapshot(simpleQuery, (snapshot) => {
                console.log('Simple query - found', snapshot.docs.length, 'messages');
                const messages = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().timestamp?.toDate() || doc.data().createdAt?.toDate() || new Date(),
                  readAt: doc.data().readAt?.toDate(),
                })) as Message[];
                
                // Sort manually since we can't use orderBy
                messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                console.log('Simple processed messages:', messages);
                callback(messages);
              });
            } catch (simpleError) {
              console.error('Simple messages query failed:', simpleError);
              callback([]);
            }
          });
        } catch (legacyError) {
          console.error('Legacy messages query setup failed:', legacyError);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up messages subscription:', error);
      return () => {};
    }
  },

  subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void): () => void {
    console.log('=== SUBSCRIBING TO CONVERSATIONS ===');
    console.log('User ID:', userId);
    
    // Try enhanced query with createdBy filter
    return this.subscribeToConversationsEnhanced(userId, callback);
  },

  subscribeToConversationsEnhanced(userId: string, callback: (conversations: Conversation[]) => void): () => void {
    // Enhanced subscription using participantUids or participants array
    console.log('=== USING ENHANCED CONVERSATION SUBSCRIPTION ===');
    console.log('User ID:', userId);

    try {
      // Try participantUids first (enhanced mode)
      console.log('Trying query with participantUids filter');
      const participantUidsQuery = query(
        collection(db, 'conversations'),
        where('participantUids', 'array-contains', userId)
      );

      return onSnapshot(participantUidsQuery, (snapshot) => {
        console.log('participantUids query snapshot received:', snapshot.docs.length, 'conversations');

        const conversations = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Processing conversation ${doc.id}:`, {
            title: data.title,
            createdBy: data.createdBy,
            participantUids: data.participantUids,
            participants: data.participants
          });

          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastActivity: data.lastActivity?.toDate() || data.updatedAt?.toDate() || new Date(),
            lastMessage: data.lastMessage ?
              (typeof data.lastMessage === 'string'
                ? data.lastMessage
                : {
                    ...data.lastMessage,
                    createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
                  }
              ) : undefined,
          };
        }) as Conversation[];

        // Sort manually by lastActivity or updatedAt (most recent first)
        conversations.sort((a, b) => {
          const aTime = (a as any).lastActivity?.getTime() || a.updatedAt.getTime();
          const bTime = (b as any).lastActivity?.getTime() || b.updatedAt.getTime();
          return bTime - aTime;
        });

        console.log('Processed conversations:', conversations);
        callback(conversations);
      }, (error) => {
        console.error('Error with participantUids query:', error);
        console.error('Error details:', error.message, error.code);

        // Fallback to participants array (legacy mode)
        console.log('Falling back to participants array query');
        try {
          const participantsQuery = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', userId)
          );

          return onSnapshot(participantsQuery, (snapshot) => {
            console.log('participants array query snapshot received:', snapshot.docs.length, 'conversations');

            const conversations = snapshot.docs.map(doc => {
              const data = doc.data();
              console.log(`Processing conversation ${doc.id}:`, {
                title: data.title,
                participants: data.participants
              });

              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                lastMessage: data.lastMessage ?
                  (typeof data.lastMessage === 'string'
                    ? data.lastMessage
                    : {
                        ...data.lastMessage,
                        createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
                      }
                  ) : undefined,
              };
            }) as Conversation[];

            // Sort manually
            conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

            console.log('Processed conversations (legacy):', conversations);
            callback(conversations);
          }, (fallbackError) => {
            console.error('Fallback participants query also failed:', fallbackError);
            callback([]);
          });
        } catch (fallbackError) {
          console.error('Error setting up fallback subscription:', fallbackError);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up conversations subscription:', error);
      return () => {};
    }
  },

  subscribeToConversationsLegacy(userId: string, callback: (conversations: Conversation[]) => void): () => void {
    // Legacy subscription using participants array
    console.log('=== USING LEGACY CONVERSATION SUBSCRIPTION ===');
    try {
      console.log('Trying simple query without orderBy');
      const fallbackQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      
      return onSnapshot(fallbackQuery, (snapshot) => {
        console.log('Simple query snapshot received:', snapshot.docs.length, 'conversations');
        const conversations = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastMessage: typeof data.lastMessage === 'string' 
              ? data.lastMessage 
              : data.lastMessage && typeof data.lastMessage === 'object' && data.lastMessage.content
              ? {
                  ...data.lastMessage,
                  createdAt: data.lastMessage.createdAt?.toDate() || new Date(),
                }
              : undefined,
          };
        }) as Conversation[];
        
        // Sort manually
        conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        console.log('Simple conversations processed:', conversations);
        callback(conversations);
      });
    } catch (error) {
      console.error('Error setting up simple conversations subscription:', error);
      return () => {};
    }
  },
};