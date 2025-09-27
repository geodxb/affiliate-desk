import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Plus, Paperclip, MessageSquare, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supportTicketService } from '../../services/supportTicketService';
import { firestoreService } from '../../services/firestoreService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import LoadingScreen from '../../components/common/LoadingScreen';
import { SupportTicket } from '../../types/supportTicket';
import { formatDate } from '../../lib/utils';
import { TICKET_TYPES, PRIORITY_LEVELS } from '../../lib/constants';
import { cn } from '../../lib/utils';

const SupportPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [investorData, setInvestorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);

  // Form state
  const [ticketForm, setTicketForm] = useState({
    type: '',
    priority: 'medium',
    subject: '',
    description: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [responseText, setResponseText] = useState('');
  const [responseAttachments, setResponseAttachments] = useState<File[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setShowLoadingScreen(true);
      subscribeToTickets();
      loadInvestorData();
    }
  }, [currentUser]);

  const loadInvestorData = async () => {
    if (!currentUser) return;
    
    try {
      const data = await firestoreService.getInvestorProfile(currentUser.uid);
      setInvestorData(data);
    } catch (error) {
      console.error('Failed to load investor data:', error);
    }
  };

  const subscribeToTickets = () => {
    if (!currentUser) return;

    const unsubscribe = supportTicketService.subscribeToTickets(
      currentUser.uid,
      async (tickets) => {
        // Ensure minimum 3 seconds loading time on initial load
        if (showLoadingScreen) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          setShowLoadingScreen(false);
        }
        setTickets(tickets);
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  // Show loading screen during initial load
  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) {
      alert('User authentication required. Please refresh the page and try again.');
      return;
    }

    console.log('=== SUBMITTING SUPPORT TICKET ===');
    console.log('Current User:', currentUser);
    console.log('User Profile:', userProfile);
    console.log('Investor Data:', investorData);

    try {
      // Get the most up-to-date investor name
      const investorName = investorData 
        ? `${investorData.firstName || ''} ${investorData.lastName || ''}`.trim()
        : `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.email || 'Unknown User';
      
      console.log('Using investor name:', investorName);
      
      await supportTicketService.createTicket(
        currentUser.uid, // investorId
        investorName, // investorName
        currentUser.uid, // submittedBy (always the investor)
        investorName, // submittedByName
        ticketForm.type, // ticketType
        ticketForm.priority, // priority
        ticketForm.subject, // subject
        ticketForm.description, // description
        [ticketForm.type], // tags (default to ticket type)
        attachments // attachments
      );

      console.log('Ticket submitted successfully');
      resetTicketForm();
      setShowNewTicket(false);
      alert('Support ticket submitted successfully!');
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      alert('Failed to submit ticket. Please try again.');
    }
  };

  const handleAddResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !selectedTicket || !responseText.trim()) return;

    try {
      const investorName = investorData 
        ? `${investorData.firstName || ''} ${investorData.lastName || ''}`.trim()
        : `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.email || 'Unknown User';

      await supportTicketService.addResponse(
        selectedTicket.id,
        currentUser.uid,
        investorName,
        'investor',
        responseText,
        false, // isInternal (investor responses are not internal)
        responseAttachments
      );

      setResponseText('');
      setResponseAttachments([]);
      alert('Response added successfully!');
    } catch (error) {
      console.error('Failed to add response:', error);
      alert('Failed to add response. Please try again.');
    }
  };

  const resetTicketForm = () => {
    setTicketForm({
      type: '',
      priority: 'medium',
      subject: '',
      description: '',
    });
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (files: File[]) => void) => {
    const files = Array.from(e.target.files || []);
    setter(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number, files: File[], setter: (files: File[]) => void) => {
    setter(files.filter((_, i) => i !== index));
  };

  const handleClearAllTickets = async () => {
    if (!currentUser) return;
    
    setClearing(true);
    try {
      await supportTicketService.deleteAllUserTickets(currentUser.uid);
      setShowClearModal(false);
      alert('All tickets cleared successfully!');
    } catch (error) {
      console.error('Failed to clear tickets:', error);
      alert('Failed to clear tickets. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-purple-600 bg-purple-100';
      case 'pending_approval':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityObj = PRIORITY_LEVELS.find(p => p.value === priority);
    return priorityObj?.color || 'text-gray-600';
  };

  const tableColumns = [
    {
      key: 'submittedAt' as keyof SupportTicket,
      title: 'Date',
      render: (value: Date) => formatDate(value),
    },
    {
      key: 'ticketType' as keyof SupportTicket,
      title: 'Subject',
      render: (value: string, ticket: SupportTicket) => (
        <div>
          <p className="font-medium">{ticket.subject}</p>
          <p className="text-sm text-gray-500 capitalize">
            {ticket.ticketType.replace('_', ' ')}
          </p>
        </div>
      ),
    },
    {
      key: 'priority' as keyof SupportTicket,
      title: 'Priority',
      render: (value: string) => (
        <span className={cn('font-medium capitalize', getPriorityColor(value))}>
          {value}
        </span>
      ),
    },
    {
      key: 'status' as keyof SupportTicket,
      title: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(value)}`}>
          {value.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'responses' as keyof SupportTicket,
      title: 'Responses',
      render: (value: any[]) => (
        <div className="flex items-center space-x-1">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{value.length}</span>
        </div>
      ),
    },
  ];

  const openTicketDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">
              Support Tickets
            </h1>
            <p className="text-gray-600">
              Submit and track your support requests.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => setShowNewTicket(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
            <Button 
              onClick={() => setShowClearModal(true)}
              variant="danger"
              size="sm"
            >
              Clear All Tickets
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tickets Table */}
      <Card className="p-6">
        <Table
          data={tickets}
          columns={tableColumns}
          loading={loading}
          emptyMessage="No support tickets found"
          onRowClick={openTicketDetail}
        />
      </Card>

      {/* New Ticket Modal */}
      <Modal
        isOpen={showNewTicket}
        onClose={() => {
          setShowNewTicket(false);
          resetTicketForm();
        }}
        title="New Support Ticket"
        size="lg"
      >
        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Type
              </label>
              <select
                value={ticketForm.type}
                onChange={(e) => setTicketForm({ ...ticketForm, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select type</option>
                {TICKET_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                Priority
              </label>
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Subject
            </label>
            <input
              type="text"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              placeholder="Please provide detailed information about your issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Attachments (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Paperclip className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Add files</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e, setAttachments)}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.jpeg,.jpg,.png,.gif,.bmp,.webp,.svg"
                />
              </label>
              <span className="text-sm text-gray-500">
                Images, PDFs, documents (max 10MB each)
              </span>
            </div>
            
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">📎 {file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index, attachments, setAttachments)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button type="submit" className="flex-1">
              Submit Ticket
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewTicket(false);
                resetTicketForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showTicketDetail}
        onClose={() => {
          setShowTicketDetail(false);
          setSelectedTicket(null);
          setResponseText('');
          setResponseAttachments([]);
        }}
        title="Ticket Details"
        size="xl"
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Ticket Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>ID: <span className="font-mono">{selectedTicket.id}</span></span>
                    <span>Submitted: {formatDate(selectedTicket.submittedAt)}</span>
                    <span className="capitalize">Type: {selectedTicket.ticketType.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className={cn('text-sm font-medium capitalize', getPriorityColor(selectedTicket.priority))}>
                    {selectedTicket.priority} Priority
                  </span>
                </div>
              </div>
            </div>

            {/* Original Description */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wide">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                  <div className="space-y-1">
                    {selectedTicket.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        📎 {attachment.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Responses */}
            {selectedTicket.responses.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 uppercase tracking-wide">Responses</h4>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {selectedTicket.responses.map((response) => (
                    <div
                      key={response.id}
                      className={cn(
                        'p-4 rounded-lg',
                        response.authorRole === 'investor'
                          ? 'bg-blue-50 ml-8'
                          : 'bg-gray-50 mr-8'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {response.responderName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(response.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {response.content}
                      </p>
                      
                      {response.attachments && response.attachments.length > 0 && (
                        <div className="mt-2">
                          {response.attachments.map((attachmentUrl, index) => (
                            <a
                              key={index}
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                            >
                              📎 Attachment {index + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Response */}
            {selectedTicket.status === 'open' || selectedTicket.status === 'in_progress' && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 uppercase tracking-wide">Add Response</h4>
                <form onSubmit={handleAddResponse} className="space-y-4">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Type your response..."
                    required
                  />
                  
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Paperclip className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Attach files</span>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileSelect(e, setResponseAttachments)}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt,.jpeg,.jpg,.png,.gif,.bmp,.webp,.svg"
                      />
                    </label>
                    
                    <Button type="submit" disabled={!responseText.trim()}>
                      Send Response
                    </Button>
                  </div>
                  
                  {responseAttachments.length > 0 && (
                    <div className="space-y-2">
                      {responseAttachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">📎 {file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index, responseAttachments, setResponseAttachments)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Clear All Tickets Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear All Tickets"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800">Warning</h4>
              <p className="text-sm text-red-700">
                This action will permanently delete all your support tickets and cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button
              onClick={handleClearAllTickets}
              variant="danger"
              disabled={clearing}
              className="flex-1"
            >
              {clearing ? 'Clearing...' : 'Yes, Clear All Tickets'}
            </Button>
            <Button
              onClick={() => setShowClearModal(false)}
              variant="outline"
              disabled={clearing}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupportPage;