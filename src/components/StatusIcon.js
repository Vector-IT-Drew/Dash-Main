import React from 'react';
import { CheckCircle, HourglassEmpty, Error } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'sent':
      return (
        <Tooltip title="Sent">
          <CheckCircle style={{ color: 'green' }} />
        </Tooltip>
      );
    case 'pending':
      return (
        <Tooltip title="Pending">
          <HourglassEmpty style={{ color: 'orange' }} />
        </Tooltip>
      );
    case 'failed':
      return (
        <Tooltip title="Failed">
          <Error style={{ color: 'red' }} />
        </Tooltip>
      );
    default:
      return null;
  }
};

export default StatusIcon;