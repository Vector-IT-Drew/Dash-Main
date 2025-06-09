import React from 'react';
import { Modal, Box, Typography, IconButton, Divider, useTheme, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const TenantInfoComponent = ({ open, onClose, tenants = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: 280,
          maxWidth: 360,
          width: '92vw',
          bgcolor: isDark ? '#23272b' : 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
        }}
      >
        <Box sx={{ p: 1.5, pb: 0.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="subtitle1" fontWeight={600} color={isDark ? 'grey.100' : 'grey.900'}>
              Tenant Info
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: isDark ? 'grey.300' : 'grey.700' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider />
        <Box sx={{ p: 1.5, pt: 1 }}>
          {tenants.length === 0 ? (
            <Typography color="text.secondary" fontSize={15} textAlign="center">No tenant info available.</Typography>
          ) : (
            <Stack spacing={1.5} divider={tenants.length > 1 ? <Divider flexItem sx={{ my: 0.5, borderColor: isDark ? '#333' : '#eee' }} /> : null}>
              {tenants.map((tenant, idx) => (
                <Box key={idx}>
                  <Typography fontWeight={500} fontSize={14} color={isDark ? 'grey.200' : 'grey.800'} mb={0.25}>
                    Tenant {idx + 1}
                  </Typography>
                  <Typography variant="body2" fontSize={13} mb={0.25} color={isDark ? 'grey.100' : 'grey.900'}>
                    {tenant.first_name || ''} {tenant.last_name || ''}
                  </Typography>
                  <Box display="flex" alignItems="center" mb={0.25}>
                    <EmailIcon sx={{ fontSize: 15, mr: 0.5, color: 'primary.main' }} />
                    <Typography variant="caption" color="text.secondary">{tenant.email_address || '-'}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <PhoneIcon sx={{ fontSize: 15, mr: 0.5, color: 'primary.main' }} />
                    <Typography variant="caption" color="text.secondary">{tenant.phone_number || '-'}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default TenantInfoComponent; 