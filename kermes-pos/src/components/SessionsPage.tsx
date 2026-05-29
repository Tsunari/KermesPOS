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
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { Session } from '../types/session';
import { sessionService } from '../services/sessionService';
import { cartTransactionService } from '../services/cartTransactionService';

const getLocalDateString = (d: Date = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const SessionsPage: React.FC = () => {
  const { t } = useLanguage();
  const theme = useTheme();
  const { formatPrice } = useSettings();

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
    startDate: getLocalDateString(), // Today's date
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
      alert(t('app.sessions.errorLoadingSessions') || 'Error loading sessions. Check browser console.');
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
            (t('app.sessions.dateOverlapError') || 
              `Date range overlaps with existing session:\n\n"{name}"\n{start} - {end}\n\nPlease choose different dates.`)
              .replace('{name}', conflictingSession.name)
              .replace('{start}', conflictStart)
              .replace('{end}', conflictEnd)
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

      setFormData({ name: '', description: '', startDate: getLocalDateString(), endDate: '' });
      setIsCreateDialogOpen(false);
      // Update state: add new session and pause all others
      setSessions(prev => [
        newSession,
        ...prev.map(s => s.status === 'active' ? { ...s, status: 'paused' as const } : s)
      ]);
    } catch (error) {
      console.error('SessionsPage: Error creating session', error);
      alert(t('app.sessions.errorCreatingSession') || 'Error creating session. Check browser console.');
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
      alert(t('app.sessions.errorCompletingSession') || 'Error completing session. Check console.');
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
      alert(t('app.sessions.errorPausingSession') || 'Error pausing session. Check console.');
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
      alert(t('app.sessions.errorResumingSession') || 'Error resuming session. Check console.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm(t('app.sessions.confirmDeleteSession') || 'Are you sure you want to delete this session? The transactions will remain in the database.')) {
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
        alert(t('app.sessions.errorDeletingSession') || 'Error deleting session. Check console.');
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
        alert(t('app.sessions.cannotEditCompleted') || 'Cannot edit completed sessions.');
        return;
      }

      setEditingSessionId(sessionId);
      setEditFormData({
        name: session.name,
        description: session.description || '',
        startDate: getLocalDateString(new Date(session.startDate)),
        endDate: session.endDate ? getLocalDateString(new Date(session.endDate)) : '',
      });
      setIsEditDialogOpen(true);
      handleMenuClose();
    } catch (error) {
      console.error('SessionsPage: Error opening edit dialog:', error);
    }
  };

  const handleClearManualDates = async (sessionId: string) => {
    if (window.confirm(t('app.sessions.confirmClearDates') || 'Clear manual date range? Transactions will no longer be retroactively linked by date.')) {
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
        alert(t('app.sessions.errorClearingDates') || 'Error clearing dates. Check console.');
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
            (t('app.sessions.dateOverlapError') || 
              `Date range overlaps with existing session:\n\n"{name}"\n{start} - {end}\n\nPlease choose different dates.`)
              .replace('{name}', conflictingSession.name)
              .replace('{start}', conflictStart)
              .replace('{end}', conflictEnd)
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
        alert(
          t('Updated session! Moved ${unlinkedCount} transaction(s) from other sessions.') || 
          `Updated session! Moved ${unlinkedCount} transaction(s) from other sessions.`
        );
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
      alert(t('app.sessions.errorSavingSession') || 'Error saving session. Check console.');
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
        return (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'success.main',
              mr: 0.5,
              animation: 'activePulse 1.5s infinite ease-in-out',
              '@keyframes activePulse': {
                '0%': { transform: 'scale(0.8)', opacity: 0.5, boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.7)' },
                '70%': { transform: 'scale(1.2)', opacity: 1, boxShadow: '0 0 0 5px rgba(46, 125, 50, 0)' },
                '100%': { transform: 'scale(0.8)', opacity: 0.5, boxShadow: '0 0 0 0 rgba(46, 125, 50, 0)' },
              }
            }}
          />
        );
      case 'paused':
        return <PauseIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      case 'completed':
        return <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />;
      default:
        return null;
    }
  };

  const formatDuration = (session: Session) => {
    const { startDate, endDate, status, updatedAt, hasManualDateRange, createdAt } = session;
    
    // Choose starting point: manual date vs creation timestamp
    const start = hasManualDateRange ? new Date(startDate) : new Date(createdAt);
    
    // Determine ending point based on status
    let end: Date;
    
    if (hasManualDateRange && endDate) {
      end = new Date(endDate);
    } else if (status === 'paused' && updatedAt) {
      end = new Date(updatedAt);
    } else if (status === 'completed' && endDate) {
      end = new Date(endDate);
    } else {
      end = new Date();
    }
    
    const diffMs = end.getTime() - start.getTime();
    
    // If difference is negative (e.g. clock drift or future dates), return 0m
    if (diffMs <= 0) return `0${t('app.sessions.durationMinutes') || 'm'}`;
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Build duration string with granularity
    const parts = [];
    if (diffDays > 0) parts.push(`${diffDays}${t('app.sessions.durationDays') || 'd'}`);
    if (diffHours > 0) parts.push(`${diffHours}${t('app.sessions.durationHours') || 'h'}`);
    if (diffMinutes > 0 || parts.length === 0) parts.push(`${diffMinutes}${t('app.sessions.durationMinutes') || 'm'}`);
    
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
          component={Box}
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
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2.5 }}>
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
        <DialogTitle sx={{ 
          fontWeight: 800, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: '#fff',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <EventIcon />
          {t('app.sessions.newSession') || 'Create New Session'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
              label={t('app.sessions.sessionDescription') || 'Description (Optional)'}
              placeholder={t('app.sessions.descriptionPlaceholder') || "Add notes or details about this session..."}
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
              {t('app.sessions.linkDatesLabel') || 'Link transactions by date range (optional)'}
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
                  helperText={t('app.sessions.startDateHelper') || "Transactions on or after this date will be linked to this session"}
                />
                <TextField
                  fullWidth
                  type="date"
                  label={t('app.sessions.endDate') || 'End Date (Optional)'}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText={t('app.sessions.endDateHelper') || "Leave blank for ongoing session. Transactions until this date will be linked."}
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
        <DialogTitle sx={{ 
          fontWeight: 800, 
          background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
          color: '#fff',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <EditIcon />
          {t('common.edit') || 'Edit Session'}
        </DialogTitle>
        <DialogContent sx={{ pt: '24px !important' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label={t('app.sessions.sessionName') || 'Session Name'}
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              autoFocus
            />
            <TextField
              fullWidth
              label={t('app.sessions.sessionDescription') || 'Description (Optional)'}
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
              {t('app.sessions.linkDatesLabel') || 'Link transactions by date range (optional)'}
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
                  helperText={t('app.sessions.editStartDateHelper') || "Changing dates will retroactively link transactions in that range"}
                />
                <TextField
                  fullWidth
                  type="date"
                  label={t('app.sessions.endDate') || 'End Date (Optional)'}
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText={t('app.sessions.editEndDateHelper') || "Transactions in overlapping date ranges will be moved from other sessions"}
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
  formatDuration: (session: Session) => string;
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
  const { t } = useLanguage();
  const { formatPrice } = useSettings();
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
  const statusLabel = t(`app.sessions.status${session.status.charAt(0).toUpperCase() + session.status.slice(1)}`) || session.status;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        border: `1.5px solid ${theme.palette.divider}`,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 20px 0 rgba(0,0,0,0.3)' 
          : '0 4px 20px 0 rgba(0,0,0,0.05)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 12px 30px 0 rgba(0,0,0,0.5)'
            : '0 12px 30px 0 rgba(0,0,0,0.1)',
          borderColor: session.status === 'active' ? theme.palette.success.main : 'primary.light',
        },
        ...(session.status === 'active' && {
          border: `2px solid ${theme.palette.success.main}`,
          animation: 'cardPulse 2.5s infinite ease-in-out',
          '@keyframes cardPulse': {
            '0%': { boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px 0 rgba(46, 125, 50, 0.15)' : '0 4px 20px 0 rgba(46, 125, 50, 0.08)' },
            '50%': { boxShadow: theme.palette.mode === 'dark' ? '0 8px 30px 0 rgba(46, 125, 50, 0.4)' : '0 8px 30px 0 rgba(46, 125, 50, 0.18)' },
            '100%': { boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px 0 rgba(46, 125, 50, 0.15)' : '0 4px 20px 0 rgba(46, 125, 50, 0.08)' }
          }
        })
      }}
    >
      {/* Status indicator bar */}
      <Box
        sx={{
          height: 5,
          background:
            statusColor === 'success'
              ? theme.palette.success.main
              : statusColor === 'warning'
              ? theme.palette.warning.main
              : theme.palette.divider,
        }}
      />

      <CardContent sx={{ pb: 2, pt: 2.5, px: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header with action menu button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.3px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session.name}
            </Typography>
            {session.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.description}
              </Typography>
            )}
            <Chip
              icon={getStatusIcon(session.status) || undefined}
              label={statusLabel}
              size="small"
              color={statusColor}
              variant="outlined"
              sx={{ 
                mt: 0.5, 
                fontWeight: 700, 
                fontSize: 11,
                height: 24,
                px: 0.5,
                bgcolor: statusColor === 'success' 
                  ? 'success.light' + '11' 
                  : statusColor === 'warning' 
                  ? 'warning.light' + '11' 
                  : 'transparent',
                borderColor: statusColor === 'success' 
                  ? 'success.main' + '55' 
                  : statusColor === 'warning' 
                  ? 'warning.main' + '55' 
                  : 'divider'
              }}
            />
          </Box>
          <IconButton size="small" onClick={onMenuOpen} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px', p: 0.75 }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* 2x2 Glassmorphic Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, my: 1.5 }}>
          {/* Revenue */}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 0.75, 
              borderRadius: 2, 
              bgcolor: 'rgba(46, 125, 50, 0.12)',
              color: 'success.main'
            }}>
              <MonetizationOnIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('app.sessions.revenue') || 'Revenue'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats ? formatPrice(stats.totalRevenue) : formatPrice(0)}
              </Typography>
            </Box>
          </Box>

          {/* Transactions */}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 0.75, 
              borderRadius: 2, 
              bgcolor: 'rgba(25, 118, 210, 0.12)',
              color: 'primary.main'
            }}>
              <ReceiptIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('app.sessions.transactions') || 'Transactions'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats?.transactionCount || 0}
              </Typography>
            </Box>
          </Box>

          {/* Items Sold */}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 0.75, 
              borderRadius: 2, 
              bgcolor: 'rgba(156, 39, 176, 0.12)',
              color: 'secondary.main'
            }}>
              <ShoppingBagIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('app.sessions.itemsSold') || 'Items'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats?.totalItems || 0}
              </Typography>
            </Box>
          </Box>

          {/* Avg. Order */}
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 0.75, 
              borderRadius: 2, 
              bgcolor: 'rgba(237, 108, 2, 0.12)',
              color: 'warning.main'
            }}>
              <TrendingUpIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('app.sessions.avgOrder') || 'Avg.'}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats ? formatPrice(stats.averageOrderValue) : formatPrice(0)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Metadata section (Dates & Duration) */}
        <Stack spacing={0.75} sx={{ mt: 'auto', fontSize: '0.75rem', color: 'text.secondary' }}>
          {/* Created date/time */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontSize: 11 }}>{t('app.sessions.created') || 'Created'}:</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 11 }}>
              {session.hasManualDateRange 
                ? new Date(session.createdAt).toLocaleDateString('de-DE')
                : new Date(session.createdAt).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
              }
            </Typography>
          </Box>
          
          {/* Session date range (only if manual) */}
          {session.hasManualDateRange && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
              <Typography variant="caption" sx={{ fontSize: 11 }}>{t('app.sessions.session') || 'Session'}:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 11 }}>
                {new Date(session.startDate).toLocaleDateString('de-DE')}
                {session.endDate && ` - ${new Date(session.endDate).toLocaleDateString('de-DE')}`}
              </Typography>
            </Box>
          )}

          {/* Paused time (only if auto & paused) */}
          {!session.hasManualDateRange && session.status === 'paused' && session.updatedAt && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
              <Typography variant="caption" sx={{ fontSize: 11 }}>{t('app.sessions.pausedAt') || 'Paused'}:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 11 }}>
                {new Date(session.updatedAt).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}

          {/* Completed time (only if auto & completed) */}
          {!session.hasManualDateRange && session.status === 'completed' && session.endDate && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
              <Typography variant="caption" sx={{ fontSize: 11 }}>{t('app.sessions.completedAt') || 'Completed'}:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 11 }}>
                {new Date(session.endDate).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}
          
          {/* Duration */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
            <Typography variant="caption" sx={{ fontSize: 11 }}>{t('app.sessions.duration') || 'Duration'}:</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 11 }}>
              {formatDuration(session)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SessionsPage;
