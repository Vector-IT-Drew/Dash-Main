import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Tabs, Tab } from '@mui/material';

const EmailViewer = ({ emailData, onSend }) => {
  // Always call hooks at the top level
  const [subject, setSubject] = useState(emailData ? emailData.subject : '');
  const [to, setTo] = useState(emailData ? emailData.to.join(', ') : '');
  const [cc, setCc] = useState(emailData ? emailData.cc.join(', ') : '');
  const [body, setBody] = useState(emailData ? emailData.body : '');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (emailData) {
      setSubject(emailData.subject);
      setTo(emailData.to.join(', '));
      setCc(emailData.cc.join(', '));
      setBody(emailData.body);
    } else {
      setSubject('');
      setTo('');
      setCc('');
      setBody('');
    }
  }, [emailData]);

  // Render blank/empty state if no emailData
  if (!emailData) {
    return (
      <Paper
        sx={{
          width: '100%',
          height: '100%',
          padding: 0,
          backgroundColor: 'white',
          boxShadow: 3,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No email prepared yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        width: '100%',
        height: '100%',
        padding: 0, // Remove padding to fill container
        backgroundColor: 'white',
        boxShadow: 3,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        className="email-viewer-header"
        sx={{
          cursor: 'move',
          background: '#1e3a8a',
          color: '#fff',
          p: 2,
          borderRadius: '8px 8px 0 0',
          mb: 0, // Remove margin below header
        }}
      >
        <Typography variant="h6" sx={{ m: 0 }}>Email Viewer</Typography>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, pt: 2 }}>
        <TextField
          label="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="To"
            value={to}
            onChange={e => setTo(e.target.value)}
            fullWidth
            helperText="Separate multiple emails with commas"
          />
          <TextField
            label="CC"
            value={cc}
            onChange={e => setCc(e.target.value)}
            fullWidth
            helperText="Separate multiple emails with commas"
          />
        </Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label="Visual" />
          <Tab label="HTML" />
        </Tabs>
        <Box sx={{ minHeight: 180, border: '1px solid #eee', borderRadius: 2, p: 2, background: '#fafbfc', flex: 1 }}>
          {tab === 0 ? (
            <Box
              contentEditable
              suppressContentEditableWarning
              style={{ minHeight: 150, outline: 'none', height: '100%', overflow: 'auto' }}
              onInput={e => setBody(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <TextField
              multiline
              minRows={8}
              value={body}
              onChange={e => setBody(e.target.value)}
              fullWidth
              sx={{ fontFamily: 'monospace', height: '100%' }}
            />
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3, alignSelf: 'flex-end' }}
          onClick={() => onSend ? onSend({ subject, to, cc, body }) : alert('Email sent!')}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default EmailViewer;
