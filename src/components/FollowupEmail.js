import React, { useState, useEffect } from 'react';
import { Box, Button, Checkbox, Typography, Paper, TextField, FormControlLabel, Switch, CircularProgress, Chip } from '@mui/material';
import TableComponent from './TableComponent';

const FollowupEmail = ({ lead, onPrepareEmail }) => {
  const [units, setUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [proximityDistance, setProximityDistance] = useState(1.0);
  const [isAvailableSoon, setIsAvailableSoon] = useState(false);
  const [moveInDate, setMoveInDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePreferences, setActivePreferences] = useState({});

  // Define a mapping from preference keys to query parameter names
  const preferenceToQueryParam = {
    budget: 'max_price',
  };

  useEffect(() => {
    if (lead) {
      const preferences = JSON.parse(lead.preference);
      const initializedPreferences = Object.entries(preferences).reduce((acc, [key, value]) => {
        acc[key] = { value, active: !(key === 'address' || key === 'neighborhood') }; // Set address and neighborhood as inactive
        return acc;
      }, {});
      setActivePreferences(initializedPreferences);
    }
  }, [lead]);

  const fetchUnits = async () => {
    if (lead) {
      setLoading(true);
      try {
        const preferences = JSON.parse(lead.preference);
        const address = preferences.address || '';

        // Construct query parameters dynamically
        const queryParams = new URLSearchParams({
          session_key: 'session_key_5157117299269422',
          proximity: address,
          rentable: false,
          proximity_distance: proximityDistance,
          ...(isAvailableSoon ? { move_out: moveInDate } : { available: true }),
        });

        // Add active preferences to query parameters
        Object.entries(activePreferences).forEach(([key, { value, active }]) => {
          if (active) {
            const queryParamName = preferenceToQueryParam[key] || key; // Use mapping or default to key
            queryParams.append(queryParamName, value);
          }
        });

        const response = await fetch(`https://dash-production-b25c.up.railway.app/get_filtered_listings?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        if (result.data) {
          setUnits(result.data);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUnitSelect = (unitId) => {
    setSelectedUnits((prevSelected) =>
      prevSelected.includes(unitId)
        ? prevSelected.filter((id) => id !== unitId)
        : [...prevSelected, unitId]
    );
  };

  // Helper to get selected unit addresses and unit numbers
  const getSelectedUnitAddresses = () => {
    return units
      .filter((unit) => selectedUnits.includes(unit.unit_id))
      .map((unit) => ({
        address: unit.address,
        unit: unit.unit, // assuming 'unit' is the unit number/label
      }))
      .filter(({ address }) => Boolean(address));
  };

  // Prepare email with selected unit addresses and unit numbers in the body
  const handlePrepareEmail = () => {
    if (!lead) return;
    const selectedUnitsInfo = getSelectedUnitAddresses();
    const addressListHtml = selectedUnitsInfo.length
      ? `<ul>${selectedUnitsInfo.map(({ address, unit }) => `<li>${address}${unit ? `, Unit ${unit}` : ''}</li>`).join('')}</ul>`
      : '<p>No units selected.</p>';

    const emailData = {
      subject: `Follow-up: ${lead.Name}`,
      to: [lead.Email],
      cc: [],
      body: `<p>Dear ${lead.Name},</p>
        <p>Here are the addresses of the units you selected:</p>
        ${addressListHtml}
        <p>Best regards,<br/>Your Team</p>`
    };
    if (onPrepareEmail) onPrepareEmail(emailData);
  };

  const togglePreference = (key) => {
    setActivePreferences((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        active: !prev[key].active,
      },
    }));
  };

  const columns = [
    {
      field: 'select',
      headerName: '',
      type: 'checkbox',
      minWidth: '50px',
      backgroundColor: '#f0f0f0',
      renderCell: (row) => (
        <Checkbox
          checked={selectedUnits.includes(row.unit_id)}
          onChange={() => handleUnitSelect(row.unit_id)}
        />
      ),
    },
    { field: 'address', headerName: 'Address', type: 'text', minWidth: '150px' },
    { field: 'unit', headerName: 'Unit', type: 'text', minWidth: '50px' },
    { field: 'baths', headerName: 'Baths', type: 'text', minWidth: '50px' },
    { field: 'beds', headerName: 'Beds', type: 'text', minWidth: '50px' },
    { field: 'exposure', headerName: 'Exposure', type: 'text', minWidth: '100px' },
    { field: 'sqft', headerName: 'Sq Ft', type: 'number', minWidth: '70px' },
    { field: 'actual_rent', headerName: 'Rent', type: 'currency', minWidth: '70px' },
    { field: 'unit_status', headerName: 'Unit Status', type: 'text', minWidth: '100px' },
    {
      field: 'distance', headerName: 'Proximity (mi)', type: 'number', minWidth: '100px',
      renderCell: (row) => row.distance ? parseFloat(row.distance).toFixed(2) : '-'
    },
    {
      field: 'move_out', headerName: 'Availability', type: 'text', minWidth: '100px',
      renderCell: (row) => (row.move_out ? new Date(row.move_out).toLocaleDateString() : 'Available'),
    },
  ];

  return (
    <Paper
      sx={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        padding: '20px',
        backgroundColor: 'white',
        boxShadow: 3,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ marginBottom: '20px' }}>
        <Typography variant="h6" gutterBottom>
          {lead ? `Follow-up Email for ${lead.Name}` : 'No lead selected'}
        </Typography>
        {lead && (
          <>
            <Typography variant="body1" gutterBottom>
              Email: {lead.Email}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Phone: {lead.Phone}
            </Typography>
            <Box sx={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {Object.entries(activePreferences).map(([key, { value, active }]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  onClick={() => togglePreference(key)}
                  sx={{
                    backgroundColor: active ? '#e0e0e0' : '#f5f5f5',
                    color: active ? '#000' : '#888',
                    cursor: 'pointer',
                    opacity: active ? 1 : 0.5, // Toggle opacity
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </Box>
      <Box sx={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <TextField
          label="Proximity Distance"
          type="number"
          value={proximityDistance}
          onChange={(e) => setProximityDistance(e.target.value)}
          sx={{ width: '150px' }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isAvailableSoon}
              onChange={(e) => setIsAvailableSoon(e.target.checked)}
              color="primary"
            />
          }
          label="Available Soon"
        />
        {isAvailableSoon && (
          <TextField
            label="Move-in Date"
            type="date"
            value={moveInDate}
            onChange={(e) => setMoveInDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ width: '150px' }}
          />
        )}
        <Button variant="outlined" onClick={fetchUnits}>
          Update Values
        </Button>
      </Box>
      <Box sx={{ marginBottom: '20px' }}>
        <Typography variant="body2">
          {units.length} units available
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px' }}>
        <TableComponent
          data={units}
          columns={columns}
          rowHeight={20}
          cellPadding="2px 4px"
          disableDropdown={true}
          noShadow={true}
          noRounding={true}
          noMargin={true}
          stickyHeader={true}
          sortable={true}
          loading={loading}
        />
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handlePrepareEmail}
        sx={{
          position: 'relative',
          marginTop: '10px',
          alignSelf: 'flex-end',
        }}
      >
        Prepare Email
      </Button>
    </Paper>
  );
};

export default FollowupEmail;
