import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import DraggableContainer from '../components/DraggableContainer';
import BarChart from '../components/BarChart';
import TableComponent from '../components/TableComponent';
import FiltersComponent from '../components/FiltersComponent';
import FollowupEmail from '../components/FollowupEmail';
import EmailViewer from '../components/EmailViewer';
import { API_BASE_URL, getSessionKey } from '../utils/api';
import { useNavigate } from 'react-router-dom';


const Dashboard1 = ({ navigateToDashboard }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filters, setFilters] = useState({});
  const [preparedEmail, setPreparedEmail] = useState(null);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSelectLead = (row) => {
    console.log('Lead selected:', row);
    setSelectedLead(row);
    setActiveTab(1); // Switch to the Dashboard tab
  };

  // Configuration for data mapping and column definitions
  const dataConfig = {
    endpoint: 'https://dash-production-b25c.up.railway.app/run_query',
    queryId: 'all_leads',
    sessionKey: 'session_key_5157117299269422',
    mapData: (item) => ({
      person_id: item.person_id,
      Name: `${item.first_name} ${item.last_name}`,
      Email: item.email_address,
      Phone: item.phone_number,
      CreatedAt: item.created_at,
      preference: item.preference,
      action: {
        label: 'Select Lead',
        action: handleSelectLead,
      },
    }),
    columns: [
      { field: 'CreatedAt', headerName: 'Created At', type: 'date', minWidth: '70px', maxWidth: '80px', fontSize: '0.7rem', color: '#333' },
      { field: 'Name', headerName: 'Name', type: 'text', minWidth: '100px', maxWidth: '150px', backgroundColor: '#fafafa', fontSize: '0.9rem' },
      { field: 'Email', headerName: 'Email', type: 'email', minWidth: '150px', maxWidth: '200px', fontSize: '0.8rem' },
      { field: 'Phone', headerName: 'Phone', type: 'text', minWidth: '100px', maxWidth: '150px', fontSize: '0.7rem' },
      { field: 'preference', headerName: 'Preferences', type: 'tagList', minWidth: '150px', maxWidth: '300px' },
      {
        field: 'action',
        headerName: '',
        type: 'iconButton',
        minWidth: '36px',
        maxWidth: '36px',
        action: handleSelectLead,
        icon: 'select',
      },
    ],
  };

  const fetchData = async (filters = {}) => {
    try {
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        navigate('/login');
        return;
      }
      
      const queryParams = new URLSearchParams({
        session_key: sessionKey,
        query_id: 'all_leads',
        filters: JSON.stringify(filters)
      }).toString();

      const response = await fetch(`${API_BASE_URL}/run_query?${queryParams}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching data:', errorText);
        return;
      }

      const result = await response.json();

      if (result.status === 'success') {
        const formattedData = result.data.map(dataConfig.mapData);
        setTableData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);

  useEffect(() => {
    console.log('Selected Lead:', selectedLead);
  }, [selectedLead]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const filtersConfig = [
    { field: 'first_name', label: 'First Name', type: 'text' },
    { field: 'last_name', label: 'Last Name', type: 'text' },
    // Add more filter configurations as needed
  ];

  const gridSize = 30;
  const followupEmailPosition = { x: 0 * gridSize, y: 0 * gridSize, width: 41 * gridSize, height: 27 * gridSize };
  const barchartPosition = { x: 0 * gridSize, y: 28 * gridSize, width: 8 * gridSize, height: 6 * gridSize };
  const emailViewerPosition = { x: 42 * gridSize, y: 0 * gridSize, width: 20 * gridSize, height: 27 * gridSize };

  return (
    <Box
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        height: 'auto',
        top: '55px',
        overflow: 'auto',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
      >
        <Tab label="Data" />
        <Tab label="Dashboard" />
      </Tabs>

      {activeTab === 0 && (
        <Box sx={{ padding: '20px', paddingTop: '60px' }}>
          <FiltersComponent filtersConfig={filtersConfig} onApplyFilters={handleApplyFilters} />
          <TableComponent
            data={tableData}
            columns={dataConfig.columns}
          />
        </Box>
      )}

      {activeTab === 1 && (
        <Box
            style={{
                position: 'relative',
                width: '100%',
                height: '200vh',
                top: '55px',
                backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                backgroundSize: '30px 30px',
            }}
        >
          <DraggableContainer defaultPosition={barchartPosition}>
            <BarChart labels={['January', 'February', 'March', 'April']} values={[10, 20, 30, 40]} />
          </DraggableContainer>

          <DraggableContainer defaultPosition={followupEmailPosition}>
            <FollowupEmail
              lead={selectedLead}
              onPrepareEmail={setPreparedEmail}
            />
          </DraggableContainer>

          <DraggableContainer defaultPosition={{ ...emailViewerPosition }}>
            <EmailViewer emailData={preparedEmail ? preparedEmail : undefined} />
          </DraggableContainer>
        
        </Box>
      )}
    </Box>
  );
};

export default Dashboard1; 