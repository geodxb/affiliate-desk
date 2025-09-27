import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, MessageCircle, Plus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { messageService } from '../../services/messageService';
import { firestoreService } from '../../services/firestoreService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingScreen from '../../components/common/LoadingScreen';
import { Conversation, Message, ConversationMetadata, EnhancedMessage } from '../../types/message';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

const MessagesPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [investorData, setInvestorData] = useState<any>(null);
  const [conversations, setConversations] = useState<(Conversation | ConversationMetadata)[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<(Message | EnhancedMessage)[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newConversationRecipientType, setNewConversationRecipientType] = useState('admin');
  const [newConversationRecipientId, setNewConversationRecipientId] = useState('');
  const [newConversationDepartment, setNewConversationDepartment] = useState('');
  const [newConversationUrgency, setNewConversationUrgency] = useState('medium');
  const [newConversationDescription, setNewConversationDescription] = useState('');
  const [newConversationTags, setNewConversationTags] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<Array<{id: string, name: string, role: string}>>([]);
  const [governorUsers, setGovernorUsers] = useState<Array<{id: string, name: string, role: string}>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [useEnhancedMode, setUseEnhancedMode] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      setShowLoadingScreen(true);
      loadConversations();
      loadUsers();
      loadInvestorData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      subscribeToMessages();
    }
    return () => {
      // Cleanup previous subscription when conversation changes
      setMessages([]);
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = () => {
    if (!currentUser) return;

    console.log('=== LOADING CONVERSATIONS ===');
    console.log('Current user ID:', currentUser.uid);
    
    const unsubscribe = messageService.subscribeToConversations(
      currentUser.uid,
      async (conversations) => {
        console.log('=== CONVERSATIONS CALLBACK RECEIVED ===');
        console.log('Received conversations:', conversations);
        console.log('Number of conversations:', conversations.length);
        
        // Ensure minimum 3 seconds loading time on initial load
        if (showLoadingScreen) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          setShowLoadingScreen(false);
        }
        
        setConversations(conversations);
        setLoading(false);
        
        // Auto-select first conversation if none selected
        if (!selectedConversation && conversations.length > 0) {
          console.log('Auto-selecting first conversation:', conversations[0]);
          setSelectedConversation(conversations[0]);
        }
      }
    );

    return unsubscribe;
  };

  // Show loading screen during initial load
  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const [admins, governors] = await Promise.all([
        messageService.getAdminUsers(),
        messageService.getGovernorUsers()
      ]);
      setAdminUsers(admins);
      setGovernorUsers(governors);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadInvestorData = async () => {
    if (!currentUser) return;
    try {
      const profile = await firestoreService.getInvestorProfile(currentUser.uid);
      setInvestorData(profile);
    } catch (error) {
      console.error('Failed to load investor data:', error);
    }
  };
  const subscribeToMessages = () => {
    if (!selectedConversation) return;

    console.log('Setting up message subscription for conversation:', selectedConversation.id);
    const unsubscribe = messageService.subscribeToMessages(
      selectedConversation.id,
      (messages) => {
        console.log('=== MESSAGES CALLBACK RECEIVED ===');
        console.log('Received messages:', messages);
        console.log('Number of messages:', messages.length);
        setMessages(messages);
      }
    );

    return unsubscribe;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !selectedConversation || (!newMessage.trim() && attachments.length === 0)) {
      return;
    }

    const messageContent = newMessage.trim();
    const messageAttachments = [...attachments];
    
    // Clear form immediately to show sending state
    setNewMessage('');
    setAttachments([]);
    
    try {
      let success = false;
      
      if (useEnhancedMode) {
        // Use enhanced message sending
        const messageId = await messageService.sendEnhancedMessage(
          selectedConversation.id,
          currentUser.uid,
          investorData ? `${investorData.firstName} ${investorData.lastName}`.trim() : `${userProfile.firstName} ${userProfile.lastName}`.trim(),
          'investor',
          messageContent,
          messageAttachments,
          {
            priority: 'medium',
            department: (selectedConversation as ConversationMetadata).department || 'General',
            messageType: 'text',
            metadata: {
              source: 'investor_portal',
              timestamp: new Date().toISOString(),
            }
          }
        );
        success = !!messageId;
      } else {
        // Use legacy message sending
        success = await messageService.sendMessage(
          selectedConversation.id,
          currentUser.uid,
          investorData ? `${investorData.firstName} ${investorData.lastName}`.trim() : `${userProfile.firstName} ${userProfile.lastName}`.trim(),
          'investor',
          messageContent,
          messageAttachments
        );
      }

      if (!success) {
        throw new Error('Failed to send message');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore form data on error
      setNewMessage(messageContent);
      setAttachments(messageAttachments);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !newConversationDepartment || !newConversationRecipientId) {
      console.error('Missing required data for conversation creation:', {
        currentUser: !!currentUser,
        userProfile: !!userProfile,
        department: newConversationDepartment,
        recipientId: newConversationRecipientId
      });
      return;
    }

    try {
      const availableUsers = newConversationRecipientType === 'admin' ? adminUsers : governorUsers;
      const selectedUser = availableUsers.find(user => user.id === newConversationRecipientId);
      
      if (!selectedUser) {
        alert('Please select a valid recipient');
        return;
      }
      
      const conversationTitle = newConversationTitle || 
        `${newConversationDepartment} - ${newConversationUrgency.charAt(0).toUpperCase() + newConversationUrgency.slice(1)} Priority`;
      
      const senderName = investorData 
        ? `${investorData.firstName || ''} ${investorData.lastName || ''}`.trim()
        : `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
      
      const senderEmail = investorData?.email || userProfile.email || '';
      
      console.log('Creating conversation with:', {
        investorId: currentUser.uid,
        senderName,
        senderEmail,
        selectedUser,
        conversationTitle
      });
      
      let conversationId: string | null = null;
      
      if (useEnhancedMode) {
        // Use enhanced conversation creation
        conversationId = await messageService.createEnhancedConversation(
          currentUser.uid,
          senderName,
          senderEmail,
          selectedUser.id,
          selectedUser.name,
          newConversationRecipientType as 'admin' | 'governor',
          conversationTitle,
          newConversationDescription || `${newConversationDepartment} inquiry with ${newConversationUrgency} priority`,
          newConversationDepartment,
          newConversationUrgency,
          newConversationTags.length > 0 ? newConversationTags : [newConversationDepartment]
        );
      } else {
        // Use legacy conversation creation
        conversationId = await messageService.createConversation(
          currentUser.uid,
          senderName,
          selectedUser.id,
          selectedUser.name,
          newConversationRecipientType as 'admin' | 'governor',
          conversationTitle,
          newConversationDepartment,
          newConversationUrgency
        );
      }

      if (conversationId) {
        setShowNewConversation(false);
        resetNewConversationForm();
        // The subscription will automatically update the conversations list
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to create conversation. Please try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const resetNewConversationForm = () => {
    setNewConversationTitle('');
    setNewConversationRecipientType('admin');
    setNewConversationRecipientId('');
    setNewConversationDepartment('');
    setNewConversationUrgency('medium');
    setNewConversationDescription('');
    setNewConversationTags([]);
  };

  const handleClearAllConversations = async () => {
    if (!currentUser) return;
    
    setClearing(true);
    try {
      const success = await messageService.deleteAllUserConversations(currentUser.uid);
      if (success) {
        setShowClearModal(false);
        setSelectedConversation(null);
        alert('All conversations cleared successfully!');
      } else {
        alert('Failed to clear conversations. Please try again.');
      }
    } catch (error) {
      console.error('Failed to clear conversations:', error);
      alert('Failed to clear conversations. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const getAvailableUsers = () => {
    return newConversationRecipientType === 'admin' ? adminUsers : governorUsers;
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !newConversationTags.includes(tag.trim())) {
      setNewConversationTags([...newConversationTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewConversationTags(newConversationTags.filter(tag => tag !== tagToRemove));
  };

  const isEnhancedConversation = (conversation: Conversation | ConversationMetadata): conversation is ConversationMetadata => {
    return 'type' in conversation && 'priority' in conversation;
  };

  const isEnhancedMessage = (message: Message | EnhancedMessage): message is EnhancedMessage => {
    return 'priority' in message && 'status' in message;
  };
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        <Card className="p-4">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded" />
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2 p-4">
          <div className="animate-pulse h-full bg-gray-300 rounded" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">
              Messages
            </h1>
            <p className="text-gray-600">
              Communicate with our support team.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enhanced-mode"
                checked={useEnhancedMode}
                onChange={(e) => setUseEnhancedMode(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <label htmlFor="enhanced-mode" className="text-sm text-gray-700">
                Enhanced Mode
              </label>
            </div>
            <Button onClick={() => setShowNewConversation(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
            <Button 
              onClick={() => setShowClearModal(true)}
              variant="danger"
              size="sm"
            >
              Clear All
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="p-4 overflow-hidden flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-4">
            Conversations
          </h2>
          
          {conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No conversations yet</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedConversation(conversation)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-colors',
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  )}
                >
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {conversation.title}
                  </h3>
                  {(conversation.department || (isEnhancedConversation(conversation) && conversation.department)) && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {conversation.department || (isEnhancedConversation(conversation) ? conversation.department : '')}
                      </span>
                      {(conversation.urgency || (isEnhancedConversation(conversation) && conversation.priority)) && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          (conversation.urgency || (isEnhancedConversation(conversation) ? conversation.priority : '')) === 'urgent' ? 'bg-red-100 text-red-700' :
                          (conversation.urgency || (isEnhancedConversation(conversation) ? conversation.priority : '')) === 'high' ? 'bg-orange-100 text-orange-700' :
                          (conversation.urgency || (isEnhancedConversation(conversation) ? conversation.priority : '')) === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {(conversation.urgency || (isEnhancedConversation(conversation) ? conversation.priority : '')).charAt(0).toUpperCase() + (conversation.urgency || (isEnhancedConversation(conversation) ? conversation.priority : '')).slice(1)}
                        </span>
                      )}
                      {isEnhancedConversation(conversation) && conversation.isEscalated && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                          Escalated
                        </span>
                      )}
                    </div>
                  )}
                  {(conversation.lastMessage || (isEnhancedConversation(conversation) && conversation.lastMessage)) && (
                    <p className="text-xs text-gray-600 truncate mb-1">
                      {(() => {
                        const lastMsg = conversation.lastMessage || (isEnhancedConversation(conversation) ? conversation.lastMessage : '');
                        if (typeof lastMsg === 'string') {
                          return lastMsg;
                        } else if (lastMsg && typeof lastMsg === 'object' && 'content' in lastMsg) {
                          return lastMsg.content;
                        }
                        return '';
                      })()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {(() => {
                      const lastMsg = conversation.lastMessage;
                      const lastActivity = isEnhancedConversation(conversation) ? conversation.lastActivity : null;
                      
                      if (lastMsg || lastActivity) {
                        if (typeof lastMsg === 'string') {
                          return formatDate(lastActivity || conversation.updatedAt);
                        } else if (lastMsg && typeof lastMsg === 'object' && 'createdAt' in lastMsg) {
                          return formatDate(lastMsg.createdAt || conversation.updatedAt);
                        }
                        return formatDate(lastActivity || conversation.updatedAt);
                      }
                      return formatDate(conversation.createdAt);
                    })()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 uppercase tracking-wide">
                  {selectedConversation.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {(selectedConversation.recipientType === 'governor' || 
                    (isEnhancedConversation(selectedConversation) && selectedConversation.type?.includes('governor'))) 
                    ? 'Management' : 'Support Team'}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex',
                        message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                          message.senderId === currentUser?.uid
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="mt-2"
                              >
                                {attachment.isImage && attachment.base64 ? (
                                  <div className="space-y-1">
                                    <img
                                      src={attachment.base64}
                                      alt={attachment.name}
                                      className="max-w-xs max-h-48 rounded-lg border border-gray-200 cursor-pointer"
                                      onClick={() => window.open(attachment.base64, '_blank')}
                                    />
                                    <p className="text-xs text-gray-500">📎 {attachment.name}</p>
                                  </div>
                                ) : (
                                  <a
                                    href={attachment.base64 || attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-xs underline hover:text-blue-600"
                                    download={attachment.name}
                                  >
                                    📎 {attachment.name}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {isEnhancedMessage(message) && (
                          <div className="mt-1 flex items-center space-x-2">
                            {message.priority !== 'medium' && (
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                message.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                                message.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {message.priority}
                              </span>
                            )}
                            {message.isEscalation && (
                              <span className="text-xs px-1 py-0.5 rounded bg-red-200 text-red-800">
                                Escalated
                              </span>
                            )}
                            {message.editedAt && (
                              <span className="text-xs text-gray-500">
                                (edited)
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs mt-1 opacity-75">
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                {attachments.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        <span>📎 {file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt,.jpeg,.jpg,.png,.gif,.bmp,.webp,.svg"
                      />
                      <div className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                        <Paperclip className="w-5 h-5" />
                      </div>
                    </label>
                    
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() && attachments.length === 0}
                      className="px-4 py-3"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* New Conversation Modal */}
      <Modal
        isOpen={showNewConversation}
        onClose={() => {
          setShowNewConversation(false);
          resetNewConversationForm();
        }}
        title="New Conversation"
        size="lg"
      >
        <form onSubmit={handleCreateConversation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Contact Type *
              </label>
              <select
                value={newConversationRecipientType}
                onChange={(e) => {
                  setNewConversationRecipientType(e.target.value);
                  setNewConversationRecipientId(''); // Reset recipient when type changes
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="admin">Support Team</option>
                <option value="governor">Management</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Recipient *
              </label>
              <select
                value={newConversationRecipientId}
                onChange={(e) => setNewConversationRecipientId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loadingUsers}
              >
                <option value="">
                  {loadingUsers 
                    ? 'Loading...' 
                    : `Select ${newConversationRecipientType === 'admin' ? 'Support Team Member' : 'Management Member'}`
                  }
                </option>
                {getAvailableUsers().map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Department *
              </label>
              <select
                value={newConversationDepartment}
                onChange={(e) => setNewConversationDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Department</option>
                <option value="Account Management">Account Management</option>
                <option value="Trading Support">Trading Support</option>
                <option value="Withdrawals & Deposits">Withdrawals & Deposits</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Compliance & KYC">Compliance & KYC</option>
                <option value="Billing & Payments">Billing & Payments</option>
                <option value="Platform Issues">Platform Issues</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Urgency Level
              </label>
              <select
                value={newConversationUrgency}
                onChange={(e) => setNewConversationUrgency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={newConversationTitle}
              onChange={(e) => setNewConversationTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your inquiry"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-generate based on department and urgency
            </p>
          </div>

          {useEnhancedMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  Description (Optional)
                </label>
                <textarea
                  value={newConversationDescription}
                  onChange={(e) => setNewConversationDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Detailed description of your inquiry or issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newConversationTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add a tag and press Enter"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter to add tags. Department will be automatically included.
                </p>
              </div>
            </>
          )}
          
          <div className="flex space-x-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!newConversationDepartment || !newConversationRecipientId || loadingUsers}
            >
              Create Conversation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewConversation(false);
                resetNewConversationForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Clear All Conversations Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear All Conversations"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-red-800">
                <p className="font-semibold mb-2">Warning: This action cannot be undone!</p>
                <p className="text-sm">
                  This will permanently delete all your conversations and messages from the system.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700">
            Are you sure you want to delete all your conversations? This will remove:
          </p>
          
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>All conversation threads you created</li>
            <li>All messages in those conversations</li>
            <li>All attachments and files</li>
          </ul>

          <div className="flex space-x-4 pt-4">
            <Button
              onClick={handleClearAllConversations}
              variant="danger"
              loading={clearing}
              className="flex-1"
            >
              {clearing ? 'Clearing...' : 'Yes, Clear All'}
            </Button>
            <Button
              onClick={() => setShowClearModal(false)}
              variant="outline"
              className="flex-1"
              disabled={clearing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MessagesPage;