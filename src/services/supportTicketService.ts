import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { SupportTicket, TicketResponse, Attachment } from '../types/supportTicket';
import { generateId } from '../lib/utils';

export const supportTicketService = {
  async createTicket(
    investorId: string,
    investorName: string,
    submittedBy: string,
    submittedByName: string,
    ticketType: string,
    priority: string,
    subject: string,
    description: string,
    tags: string[] = [],
    attachments?: File[]
  ): Promise<string | null> {
    try {
      console.log('=== CREATING SUPPORT TICKET IN SERVICE ===');
      console.log('Investor ID:', investorId);
      console.log('Investor Name:', investorName);
      console.log('Submitted By:', submittedBy);
      console.log('Submitted By Name:', submittedByName);
      console.log('Ticket Type:', ticketType);
      console.log('Priority:', priority);
      console.log('Subject:', subject);
      
      const uploadedAttachments: string[] = [];

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const attachmentId = generateId();
          const storageRef = ref(storage, `support-tickets/${attachmentId}-${file.name}`);
          
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          uploadedAttachments.push(downloadURL);
        }
      }

      // Validate required fields
      if (!investorName || investorName.trim() === '') {
        throw new Error('Investor name is required');
      }

      const ticket = {
        investorId,
        investorName,
        submittedBy,
        submittedByName,
        ticketType,
        priority,
        subject,
        description,
        status: 'open',
        submittedAt: Timestamp.now(),
        assignedTo: null,
        assignedToName: null,
        assignedAt: null,
        responses: [],
        resolution: null,
        resolvedAt: null,
        resolvedBy: null,
        closedAt: null,
        closedBy: null,
        tags,
        attachments: uploadedAttachments,
        lastActivity: Timestamp.now(),
        escalated: false,
        escalatedAt: null,
        escalatedReason: null,
      };

      console.log('Ticket object to be saved:', ticket);

      const docRef = await addDoc(collection(db, 'supportTickets'), ticket);
      console.log('Ticket created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      return null;
    }
  },

  async addResponse(
    ticketId: string,
    responderId: string,
    responderName: string,
    responderRole: 'admin' | 'governor' | 'investor',
    content: string,
    isInternal: boolean = false,
    attachments?: File[]
  ): Promise<boolean> {
    try {
      const uploadedAttachments: string[] = [];

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const attachmentId = generateId();
          const storageRef = ref(storage, `support-tickets/${ticketId}/${attachmentId}-${file.name}`);
          
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          uploadedAttachments.push(downloadURL);
        }
      }

      const response: Omit<TicketResponse, 'timestamp'> & { timestamp: any } = {
        id: `response_${Date.now()}`,
        ticketId,
        responderId,
        responderName,
        responderRole,
        content,
        timestamp: Timestamp.now(),
        isInternal,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      };

      // Update ticket with new response and lastActivity
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        responses: arrayUnion(response),
        lastActivity: Timestamp.now(),
        status: 'in_progress', // Always set to in_progress when response is added
      });

      return true;
    } catch (error) {
      console.error('Failed to add response to ticket:', error);
      return false;
    }
  },

  async updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'pending_approval' | 'resolved' | 'closed',
    updatedBy: string,
    resolution?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        lastActivity: Timestamp.now(),
      };

      if (status === 'resolved') {
        updateData.resolvedAt = Timestamp.now();
        updateData.resolvedBy = updatedBy;
        if (resolution) {
          updateData.resolution = resolution;
        }
      }

      if (status === 'closed') {
        updateData.closedAt = Timestamp.now();
        updateData.closedBy = updatedBy;
      }

      await updateDoc(doc(db, 'supportTickets', ticketId), updateData);
      return true;
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      return false;
    }
  },

  async assignTicket(
    ticketId: string,
    assignedTo: string,
    assignedToName: string
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        assignedTo,
        assignedToName,
        assignedAt: Timestamp.now(),
        lastActivity: Timestamp.now(),
        status: 'in_progress',
      });
      return true;
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      return false;
    }
  },

  async escalateTicket(
    ticketId: string,
    escalatedReason: string
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        escalated: true,
        escalatedAt: Timestamp.now(),
        escalatedReason,
        lastActivity: Timestamp.now(),
        priority: 'urgent',
      });
      return true;
    } catch (error) {
      console.error('Failed to escalate ticket:', error);
      return false;
    }
  },

  async getTickets(investorId: string): Promise<SupportTicket[]> {
    try {
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('investorId', '==', investorId),
        orderBy('lastActivity', 'desc')
      );

      const snapshot = await getDocs(ticketsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate() || new Date(),
        assignedAt: doc.data().assignedAt?.toDate(),
        resolvedAt: doc.data().resolvedAt?.toDate(),
        closedAt: doc.data().closedAt?.toDate(),
        escalatedAt: doc.data().escalatedAt?.toDate(),
        responses: doc.data().responses?.map((response: any) => ({
          ...response,
          timestamp: response.timestamp?.toDate() || new Date(),
        })) || [],
      })) as SupportTicket[];
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      return [];
    }
  },

  subscribeToTickets(investorId: string, callback: (tickets: SupportTicket[]) => void): () => void {
    try {
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('investorId', '==', investorId),
        orderBy('lastActivity', 'desc')
      );

      return onSnapshot(ticketsQuery, (snapshot) => {
        const tickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate() || new Date(),
          lastActivity: doc.data().lastActivity?.toDate() || new Date(),
          assignedAt: doc.data().assignedAt?.toDate(),
          resolvedAt: doc.data().resolvedAt?.toDate(),
          closedAt: doc.data().closedAt?.toDate(),
          escalatedAt: doc.data().escalatedAt?.toDate(),
          responses: doc.data().responses?.map((response: any) => ({
            ...response,
            timestamp: response.timestamp?.toDate() || new Date(),
          })) || [],
        })) as SupportTicket[];
        
        callback(tickets);
      }, (error) => {
        console.error('Error in support tickets subscription:', error);
        // Try fallback without orderBy
        try {
          const fallbackQuery = query(
            collection(db, 'supportTickets'),
            where('investorId', '==', investorId)
          );
          
          return onSnapshot(fallbackQuery, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              submittedAt: doc.data().submittedAt?.toDate() || new Date(),
              lastActivity: doc.data().lastActivity?.toDate() || new Date(),
              assignedAt: doc.data().assignedAt?.toDate(),
              resolvedAt: doc.data().resolvedAt?.toDate(),
              closedAt: doc.data().closedAt?.toDate(),
              escalatedAt: doc.data().escalatedAt?.toDate(),
              responses: doc.data().responses?.map((response: any) => ({
                ...response,
                timestamp: response.timestamp?.toDate() || new Date(),
              })) || [],
            })) as SupportTicket[];
            
            // Sort manually by lastActivity
            tickets.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
            callback(tickets);
          });
        } catch (fallbackError) {
          console.error('Support tickets fallback query failed:', fallbackError);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up support tickets subscription:', error);
      return () => {};
    }
  },

  async deleteAllUserTickets(investorId: string): Promise<boolean> {
    try {
      console.log('=== DELETING ALL TICKETS FOR USER ===');
      console.log('User ID:', investorId);
      
      // Get all tickets created by this user
      const ticketsQuery = query(
        collection(db, 'supportTickets'),
        where('investorId', '==', investorId)
      );
      
      const snapshot = await getDocs(ticketsQuery);
      console.log('Found', snapshot.docs.length, 'tickets to delete');
      
      // Delete each ticket
      const deletePromises = snapshot.docs.map(async (ticketDoc) => {
        console.log('Deleting ticket:', ticketDoc.id);
        const ticketDocRef = doc(db, 'supportTickets', ticketDoc.id);
        await deleteDoc(ticketDocRef);
      });
      
      await Promise.all(deletePromises);
      console.log('All tickets deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete tickets:', error);
      return false;
    }
  },
};