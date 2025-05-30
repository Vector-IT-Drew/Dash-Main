import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography, 
  TextField, 
  Button, 
  IconButton,
  Avatar,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { API_BASE_URL, getSessionKey } from '../utils/api';

const NotesComponent = ({ open, onClose, unitId, unitNumber, propertyName, onNoteAdded }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const endOfMessagesRef = useRef(null);
  const currentUser = localStorage.getItem('full_name') || 'Anonymous User';
  const fullName = localStorage.getItem('full_name') || 'Anonymous User';
  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ');

  // Fetch notes when component opens
  useEffect(() => {
    if (open && unitId) {
      fetchNotes();
    }
    // eslint-disable-next-line
  }, [open, unitId]);

  // Scroll to bottom when notes change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notes]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        session_key: getSessionKey(),
        query_id: 'get_notes',
        target_type: 'units',
        target_id: unitId
      }).toString();

      const response = await fetch(`${API_BASE_URL}/run_query?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();

      // Map API fields to UI fields
      const notes = (data.data || []).map(note => ({
        id: note.note_id,
        content: note.note,
        created_at: note.created_at,
        created_by: note.creator_id,
        address: note.address,
        first_name: note.first_name,
        last_name: note.last_name,
        tag_ids: note.tag_ids,
        is_pending: false
      }));
      console.log('Fetched notes:', notes);
      setNotes(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setSubmitting(true);
    
    // Optimistically add note to UI
    const tempNote = {
      id: `temp-${Date.now()}`,
      content: newNote,
      created_at: new Date().toISOString(),
      created_by: fullName,
      first_name: firstName,
      last_name: lastName,
      is_pending: true
    };
    
    setNotes([...notes, tempNote]);
    setNewNote('');
    
    try {
      // Get the current user's person_id from localStorage or context
      const creatorId = localStorage.getItem('person_id') || '0'; // Default to '0' if not found
      
      const params = new URLSearchParams({
        session_key: getSessionKey(),
        target_type: 'units',
        target_id: unitId,
        note: newNote,
        creator_id: creatorId,
        tag_ids: JSON.stringify([])
      }).toString();

      console.log("Params:", params);
      
      const response = await fetch(`${API_BASE_URL}/create_note?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getSessionKey()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      
      const data = await response.json();
      
      // Replace the temporary note with the real one from the server
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === tempNote.id ? {
            id: data.note_id || tempNote.id,
            content: newNote,
            created_at: data.created_at || tempNote.created_at,
            created_by: fullName,
            first_name: data.first_name || firstName,
            last_name: data.last_name || lastName,
            is_pending: false
          } : note
        )
      );

      // Optimistically update the table's most recent note
      if (onNoteAdded) {
        onNoteAdded(
          unitId,
          newNote,
          data.created_at || tempNote.created_at,
          fullName
        );
      }

      // Optionally, notify parent to refresh table data (if you pass a prop for this)
      // onNoteAdded && onNoteAdded();
    } catch (error) {
      console.error('Error adding note:', error);
      // Remove the temporary note if there was an error
      setNotes(prevNotes => prevNotes.filter(note => note.id !== tempNote.id));
    } finally {
      setSubmitting(false);
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', 
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '70vh',
          minHeight: '70vh',
          height: '70vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#f5f5f5'
      }}>
        <Typography variant="h6" component="div">
          Notes for {unitNumber} - {propertyName}
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress />
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <Typography variant="body1" color="textSecondary">
              No notes yet. Add the first note below.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0,
            overflowY: 'auto',
            flex: 1,
            mb: 0
          }}>
            {notes.map((note) => (
              <Box
                key={note.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  background: note.is_pending ? '#f5f5f5' : '#fafbfc',
                  opacity: note.is_pending ? 0.7 : 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 15,
                    bgcolor: getAvatarColor(`${note.first_name} ${note.last_name}`),
                    mr: 1.2,
                  }}
                >
                  {getInitials(`${note.first_name} ${note.last_name}`)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {note.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(note.created_at)}
                  </Typography>
                </Box>
              </Box>
            ))}
            <div ref={endOfMessagesRef} />
          </Box>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        bgcolor: '#f5f5f5'
      }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Type your note here..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          variant="outlined"
          disabled={submitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleAddNote();
            }
          }}
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleAddNote}
          disabled={!newNote.trim() || submitting}
        >
          Add Note
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotesComponent;
