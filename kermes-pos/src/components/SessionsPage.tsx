import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Paper,
  Divider,
  useTheme,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLanguage } from '../context/LanguageContext';
import { Session } from '../types/session';
import { sessionService } from '../services/sessionService';
import { cartTransactionService } from '../services/cartTransactionService';

const SessionsPage: React.FC = () => {
  const { t } = useLanguage();
  const theme = useTheme();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandCreateDates, setExpandCreateDates] = useState(false);
  const [expandEditDates, setExpandEditDates] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0], // Today's date
    endDate: '', // Optional
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    // Empty dependency array - only run once on mount
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      console.log('SessionsPage: Loading sessions...');
      const data = await sessionService.getAllSessions();
      console.log('SessionsPage: Sessions loaded', data.length);
      // Sort by creation date, most recent first
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSessions(sorted);
    } catch (error) {
      console.error('SessionsPage: Error loading sessions', error);
      alert('Error loading sessions. Check browser console.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!formData.name.trim()) return;

    try {
      // Validate date range for overlaps if manual dates are provided
      if (formData.startDate || formData.endDate) {
        const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
        const endDate = formData.endDate ? new Date(formData.endDate) : undefined;
        
        const conflictingSession = await sessionService.checkDateRangeOverlap(
          startDate,
          endDate
        );
        
        if (conflictingSession) {
          const conflictStart = new Date(conflictingSession.startDate).toLocaleDateString('de-DE');
          const conflictEnd = conflictingSession.endDate 
            ? new Date(conflictingSession.endDate).toLocaleDateString('de-DE')
            : 'ongoing';
          alert(
            `Date range overlaps with existing session:\\n\\n` +
            `"${conflictingSession.name}"\\n` +
            `${conflictStart} - ${conflictEnd}\\n\\n` +
            `Please choose different dates.`
          );
          return;
        }
      }
      
      console.log('SessionsPage: Creating new session', formData.name);
      const newSession = await sessionService.createSession({
        name: formData.name,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      });

      console.log('SessionsPage: Session created successfully');
      
      // If a date range was specified, retroactively link transactions
      if (formData.startDate || formData.endDate) {
        try {
          const linkedCount = await sessionService.linkTransactionsByDateRange(newSession.id);
          console.log('SessionsPage: Linked', linkedCount, 'transactions to session');
        } catch (error) {
          console.warn('SessionsPage: Error linking transactions:', error);
        }
      }

      setFormData({ name: '', description: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
      setIsCreateDialogOpen(false);
      // Update state: add new session and pause all others
      setSessions(prev => [
        newSession,
        ...prev.map(s => s.status === 'active' ? { ...s, status: 'paused' as const } : s)
      ]);
    } catch (error) {
      console.error('SessionsPage: Error creating session', error);
      alert('Error creating session. Check browser console.');
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      console.log('SessionsPage: Completing session', sessionId);
      const updatedSession = await sessionService.completeSession(sessionId);
      console.log('SessionsPage: Session completed successfully');
      // Update state directly instead of reloading all sessions
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      handleMenuClose();
    } catch (error) {
      console.error('SessionsPage: Error completing session:', error);
      alert('Error completing session. Check console.');
    }
  };

  const handlePauseSession = async (sessionId: string) => {
    try {
      console.log('SessionsPage: Pausing session', sessionId);
      const updatedSession = await sessionService.pauseSession(sessionId);
      console.log('SessionsPage: Session paused successfully');
      // Update state directly instead of reloading all sessions
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      handleMenuClose();
    } catch (error) {
      console.error('SessionsPage: Error pausing session:', error);
      alert('Error pausing session. Check console.');
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    try {
      console.log('SessionsPage: Resuming session', sessionId);
      const updatedSession = await sessionService.resumeSession(sessionId);
      console.log('SessionsPage: Session resumed successfully');
      // Update state: set this session to active and all others to paused
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return updatedSession;
        } else if (s.status === 'active') {
          // Auto-paused by resumeSession, update in UI
          return { ...s, status: 'paused' as const };
        }
        return s;
      }));
      handleMenuClose();
    } catch (error) {
      console.error('SessionsPage: Error resuming session:', error);
      alert('Error resuming session. Check console.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session? The transactions will remain in the database.')) {
      try {
        console.log('SessionsPage: Deleting session', sessionId);
        await sessionService.deleteSession(sessionId);
        
        // Clear session_id from all transactions linked to this session
        const clearedCount = await cartTransactionService.clearSessionIdFromTransactions(sessionId);
        console.log('SessionsPage: Cleared session_id from', clearedCount, 'transactions');
        
        console.log('SessionsPage: Session deleted successfully');
        // Remove from state directly instead of reloading all sessions
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        handleMenuClose();
      } catch (error) {
        console.error('SessionsPage: Error deleting session:', error);
        alert('Error deleting session. Check console.');
      }
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    setSessionMenuAnchor(event.currentTarget);
    setSelectedSessionId(sessionId);
  };

  const handleMenuClose = () => {
    setSessionMenuAnchor(null);
    setSelectedSessionId(null);
  };

  const handleEditSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      
      // Check if session is completed
      if (session.status === 'completed') {
        alert('Cannot edit completed sessions.');
        return;
      }

      setEditingSessionId(sessionId);
      setEditFormData({
        name: session.name,
        description: session.description || '',
        startDate: session.startDate.split('T')[0],
        endDate: session.endDate ? session.endDate.split('T')[0] : '',
      });
      setIsEditDialogOpen(true);
      handleMenuClose();
    } catch (error) {
      console.error('SessionsPage: Error opening edit dialog:', error);
    }
  };

  const handleClearManualDates = async (sessionId: string) => {
    if (window.confirm('Clear manual date range? Transactions will no longer be retroactively linked by date.')) {
      try {
        console.log('SessionsPage: Clearing manual dates for session', sessionId);
        const updatedSession = await sessionService.clearManualDateRange(sessionId);
        console.log('SessionsPage: Manual dates cleared');
        // Update state with sorted order
        setSessions(prev => 
          [...prev.map(s => s.id === sessionId ? updatedSession : s)].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        setIsEditDialogOpen(false);
        setEditingSessionId(null);
      } catch (error) {
        console.error('SessionsPage: Error clearing manual dates:', error);
        alert('Error clearing dates. Check console.');
      }
    }
  };

  const handleSaveEditSession = async () => {
    if (!editingSessionId || !editFormData.name.trim()) return;

    try {
      console.log('SessionsPage: Updating session', editingSessionId);
      
      // Validate date range for overlaps if manual dates are provided
      if (editFormData.startDate || editFormData.endDate) {
        const startDate = editFormData.startDate ? new Date(editFormData.startDate) : new Date();
        const endDate = editFormData.endDate ? new Date(editFormData.endDate) : undefined;
        
        const conflictingSession = await sessionService.checkDateRangeOverlap(
          startDate,
          endDate,
          editingSessionId // Exclude current session from check
        );
        
        if (conflictingSession) {
          const conflictStart = new Date(conflictingSession.startDate).toLocaleDateString('de-DE');
          const conflictEnd = conflictingSession.endDate 
            ? new Date(conflictingSession.endDate).toLocaleDateString('de-DE')
            : 'ongoing';
          alert(
            `Date range overlaps with existing session:\n\n` +
            `"${conflictingSession.name}"\n` +
            `${conflictStart} - ${conflictEnd}\n\n` +
            `Please choose different dates.`
          );
          return;
        }
      }
      
      // Update session metadata with manual date range flag
      const updatedSession = await sessionService.updateSession(editingSessionId, {
        name: editFormData.name,
        description: editFormData.description,
        startDate: new Date(editFormData.startDate).toISOString(),
        endDate: editFormData.endDate ? new Date(editFormData.endDate).toISOString() : undefined,
        hasManualDateRange: !!(editFormData.startDate || editFormData.endDate), // Mark as manual if dates were set
      });

      // Link transactions with automatic unlinking from other sessions
      const { linkedCount, unlinkedCount } = await sessionService.linkTransactionsByDateRangeWithUnlink(editingSessionId);
      
      console.log(`SessionsPage: Linked ${linkedCount} transactions, unlinked ${unlinkedCount}`);
      if (unlinkedCount > 0) {
        alert(`Updated session! Moved ${unlinkedCount} transaction(s) from other sessions.`);
      }

      // Update state with sorted order
      setSessions(prev => 
        [...prev.map(s => s.id === editingSessionId ? updatedSession : s)].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setIsEditDialogOpen(false);
      setEditingSessionId(null);
    } catch (error) {
      console.error('SessionsPage: Error saving session:', error);
      alert('Error saving session. Check console.');
    }
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'active':
        return <PlayArrowIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case 'paused':
        return <PauseIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case 'completed':
        return <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      default:
        return null;
    }
  };

  const formatDuration = (startDate: string, endDate?: string, status?: Session['status'], updatedAt?: string, hasManualDateRange?: boolean) => {
    const start = new Date(startDate);
    
    // Determine end time based on session status
    let end: Date;
    
    if (hasManualDateRange && endDate) {
      // Manual date range: use the explicit endDate
      end = new Date(endDate);
    } else if (status === 'paused' && updatedAt) {
      // Paused: show duration until paused
      end = new Date(updatedAt);
    } else if (status === 'completed' && endDate) {
      // Completed: show duration until completion
      end = new Date(endDate);
    } else {
      // Active: show duration until now
      end = new Date();
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Build duration string with granularity
    const parts = [];
    if (diffDays > 0) parts.push(`${diffDays}d`);
    if (diffHours > 0) parts.push(`${diffHours}h`);
    if (diffMinutes > 0 || parts.length === 0) parts.push(`${diffMinutes}m`);
    
    return parts.join(' ');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t('app.sessions.title') || '🎉 Sessions'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('app.sessions.description') || 'Manage and track your Kermes events and activities'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateDialogOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
          }}
        >
          {t('app.sessions.newSession') || 'New Session'}
        </Button>
      </Box>

      {/* Sessions Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <Typography color="text.secondary">Loading sessions...</Typography>
        </Box>
      ) : sessions.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.secondary.light}22 100%)`,
            borderRadius: 2,
            border: `1.5px dashed ${theme.palette.divider}`,
          }}
        >
          <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {t('app.sessions.noSessions') || 'No sessions yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('app.sessions.createFirst') || 'Create your first session to start tracking sales'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            {t('app.sessions.createSession') || 'Create Session'}
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onMenuOpen={(e) => handleMenuOpen(e, session.id)}
              formatDuration={formatDuration}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          ))}
        </Box>
      )}

      {/* Session Actions Menu */}
      <Menu
        anchorEl={sessionMenuAnchor}
        open={Boolean(sessionMenuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedSessionId && (
          <>
            {(sessions.find((s) => s.id === selectedSessionId)?.status === 'active' || 
              sessions.find((s) => s.id === selectedSessionId)?.status === 'paused') && (
              <>
                <MenuItem onClick={() => selectedSessionId && handleEditSession(selectedSessionId)}>
                  <EditIcon sx={{ mr: 1, fontSize: 20 }} />
                  {t('common.edit') || 'Edit'}
                </MenuItem>
              </>
            )}
            {sessions.find((s) => s.id === selectedSessionId)?.status === 'active' && (
              <>
                <MenuItem onClick={() => selectedSessionId && handlePauseSession(selectedSessionId)}>
                  <PauseIcon sx={{ mr: 1, fontSize: 20 }} />
                  {t('app.sessions.pause') || 'Pause'}
                </MenuItem>
                <MenuItem onClick={() => selectedSessionId && handleCompleteSession(selectedSessionId)}>
                  <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                  {t('app.sessions.complete') || 'Complete'}
                </MenuItem>
              </>
            )}
            {sessions.find((s) => s.id === selectedSessionId)?.status === 'paused' && (
              <>
                <MenuItem onClick={() => selectedSessionId && handleResumeSession(selectedSessionId)}>
                  <PlayArrowIcon sx={{ mr: 1, fontSize: 20 }} />
                  {t('app.sessions.resume') || 'Resume'}
                </MenuItem>
                <MenuItem onClick={() => selectedSessionId && handleCompleteSession(selectedSessionId)}>
                  <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                  {t('app.sessions.complete') || 'Complete'}
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem
              onClick={() => selectedSessionId && handleDeleteSession(selectedSessionId)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
              {t('app.sessions.delete') || 'Delete'}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('app.sessions.newSession') || 'Create New Session'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label={t('app.sessions.sessionName') || 'Session Name'}
              placeholder="e.g., Kermes March 22, 2026"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
            <TextField
              fullWidth
              label={t('app.sessions.description') || 'Description (Optional)'}
              placeholder="Add notes or details about this session..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            
            {/* Collapsible Date Fields */}
            <Button
              onClick={() => setExpandCreateDates(!expandCreateDates)}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.875rem',
                p: 0,
                '&:hover': { background: 'transparent', color: 'text.primary' },
              }}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: expandCreateDates ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              }
            >
              {t('app.sessions.dateRange') || 'Link transactions by date range (optional)'}
            </Button>
            
            <Collapse in={expandCreateDates} timeout="auto" unmountOnExit>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('app.sessions.startDate') || 'Start Date'}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Transactions on or after this date will be linked to this session"
                />
                <TextField
                  fullWidth
                  type="date"
                  label={t('app.sessions.endDate') || 'End Date (Optional)'}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave blank for ongoing session. Transactions until this date will be linked."
                />
              </Stack>
            </Collapse>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsCreateDialogOpen(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Box
            component="span"
            title={!formData.name.trim() ? 'Please enter a session name' : ''}
          >
            <Button
              variant="contained"
              onClick={handleCreateSession}
              disabled={!formData.name.trim()}
            >
              {t('common.create') || 'Create'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('common.edit') || 'Edit Session'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label={t('app.sessions.sessionName') || 'Session Name'}
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              autoFocus
            />
            <TextField
              fullWidth
              label={t('app.sessions.description') || 'Description (Optional)'}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              multiline
              rows={3}
            />
            
            {/* Collapsible Date Fields */}
            <Button
              onClick={() => setExpandEditDates(!expandEditDates)}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.875rem',
                p: 0,
                '&:hover': { background: 'transparent', color: 'text.primary' },
              }}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: expandEditDates ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                  }}
                />
              }
            >
              {t('app.sessions.dateRange') || 'Link transactions by date range (optional)'}
            </Button>
            
            <Collapse in={expandEditDates} timeout="auto" unmountOnExit>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={t('app.sessions.startDate') || 'Start Date'}
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Changing dates will retroactively link transactions in that range"
                />
                <TextField
                  fullWidth
                  type="date"
                  label={t('app.sessions.endDate') || 'End Date (Optional)'}
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Transactions in overlapping date ranges will be moved from other sessions"
                />
              </Stack>
            </Collapse>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsEditDialogOpen(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          {editingSessionId && sessions.find(s => s.id === editingSessionId)?.hasManualDateRange && (
            <Button 
              onClick={() => editingSessionId && handleClearManualDates(editingSessionId)}
              color="warning"
              sx={{ mr: 'auto' }}
            >
              {t('app.sessions.clearDates') || 'Clear Manual Dates'}
            </Button>
          )}
          <Box
            component="span"
            title={!editFormData.name.trim() ? 'Please enter a session name' : ''}
          >
            <Button
              variant="contained"
              onClick={handleSaveEditSession}
              disabled={!editFormData.name.trim()}
            >
              {t('common.save') || 'Save'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// SessionCard Component
interface SessionCardProps {
  session: Session;
  onMenuOpen: (e: React.MouseEvent<HTMLElement>) => void;
  formatDuration: (startDate: string, endDate?: string, status?: Session['status'], updatedAt?: string, hasManualDateRange?: boolean) => string;
  getStatusColor: (status: Session['status']) => 'success' | 'warning' | 'default' | 'error';
  getStatusIcon: (status: Session['status']) => React.ReactElement | null;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onMenuOpen,
  formatDuration,
  getStatusColor,
  getStatusIcon,
}) => {
  const theme = useTheme();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const transactions = await cartTransactionService.getTransactions();
        // Filter transactions by session_id if available, otherwise fall back to date range
        const sessionTransactions = transactions.filter((tx) => {
          // Priority 1: If transaction has session_id, match it exactly
          if (tx.session_id) {
            return tx.session_id === session.id;
          }
          
          // Priority 2: For old transactions without session_id, use date range
          const txDate = new Date(tx.transaction_date);
          const startDate = new Date(session.startDate);
          const endDate = session.endDate ? new Date(session.endDate) : new Date();
          return txDate >= startDate && txDate <= endDate;
        });

        const totalRevenue = sessionTransactions.reduce((sum, tx) => sum + tx.total_amount, 0);
        const totalItems = sessionTransactions.reduce((sum, tx) => sum + tx.items_count, 0);

        setStats({
          transactionCount: sessionTransactions.length,
          totalRevenue,
          totalItems,
          averageOrderValue: sessionTransactions.length > 0 ? totalRevenue / sessionTransactions.length : 0,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [session]);

  const statusColor = getStatusColor(session.status);
  const statusLabel = session.status.charAt(0).toUpperCase() + session.status.slice(1);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.shadows[12],
        },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status bar */}
      <Box
        sx={{
          height: 4,
          background:
            statusColor === 'success'
              ? theme.palette.success.main
              : statusColor === 'warning'
              ? theme.palette.warning.main
              : theme.palette.divider,
        }}
      />

      <CardContent sx={{ pb: 1 }}>
        {/* Header with menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {session.name}
            </Typography>
            {session.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {session.description}
              </Typography>
            )}
            <Chip
              icon={getStatusIcon(session.status) || undefined}
              label={statusLabel}
              size="small"
              color={statusColor}
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          </Box>
          <IconButton size="small" onClick={onMenuOpen}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Stats */}
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Revenue
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.main' }}>
              {stats?.totalRevenue.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              €
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Transactions
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {stats?.transactionCount || 0}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Items Sold
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {stats?.totalItems || 0}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Avg. Order
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {stats?.averageOrderValue.toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              €
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Dates */}
        <Stack spacing={0.5} sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {/* Created date */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">Created:</Typography>
            <Typography variant="caption">
              {new Date(session.createdAt).toLocaleDateString('de-DE')}
            </Typography>
          </Box>
          
          {/* Session date range (only if manual) */}
          {session.hasManualDateRange && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
              <Typography variant="caption">Session:</Typography>
              <Typography variant="caption">
                {new Date(session.startDate).toLocaleDateString('de-DE')}
                {session.endDate && ` - ${new Date(session.endDate).toLocaleDateString('de-DE')}`}
              </Typography>
            </Box>
          )}
          
          {/* Duration */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
            <Typography variant="caption">Duration:</Typography>
            <Typography variant="caption">
              {formatDuration(session.startDate, session.endDate, session.status, session.updatedAt, session.hasManualDateRange)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SessionsPage;
