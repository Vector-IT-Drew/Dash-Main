import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import DraggableContainer from '../components/DraggableContainer';
import BarChart from '../components/BarChart';
import TableComponent from '../components/TableComponent';
import FiltersComponent from '../components/FiltersComponent';
import FollowupEmail from '../components/FollowupEmail';
import EmailViewer from '../components/EmailViewer';
import { API_BASE_URL, getSessionKey } from '../utils/api';
import { useNavigate } from 'react-router-dom';

// Ignore this dashboard for now

const Dashboard2 = () => {
  const [tableData, setTableData] = useState([]);
  const [filters, setFilters] = useState({});
  const [emailData, setEmailData] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [isFollowupVisible, setFollowupVisible] = useState(false);
  const navigate = useNavigate();

  const fetchData = async (filters = {}) => {
    try {
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        navigate('/login');
        return;
      }
      
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/run_query?query_id=all_leads&session_key=${sessionKey}&${query}`);
      const result = await response.json();
      if (result.status === 'success') {
        const formattedData = result.data.map((lead) => ({
          person_id: lead.person_id,
          Name: `${lead.first_name} ${lead.last_name}`,
          Email: lead.email_address,
          Phone: lead.phone_number,
          CreatedAt: lead.created_at,
          preference: lead.preference,
          action: {
            label: 'Send Followup',
            action: (row) => setSelectedLead(row),
          },
        }));
        setTableData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchEmailData = async (personId) => {
    console.log(`Fetching emails for person_id: ${personId}`);
    try {
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/get_emails?session_key=${sessionKey}&person_id=${personId}&email_type=follow_up`);
      const result = await response.json();
      if (result.status === 'success') {
        setEmailData((prevData) => ({
          ...prevData,
          [personId]: result.data,
        }));
      }
    } catch (error) {
      console.error('Error fetching email data:', error);
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRowClick = (index, row) => {
    console.log(`Row clicked: ${index}, person_id: ${row.person_id}`);
    if (!emailData[row.person_id]) {
      fetchEmailData(row.person_id);
    }
  };

  const renderExpandedContent = (row) => {
    const emails = emailData[row.person_id];
    if (!emails) return <p>Loading emails...</p>;

    return (
      <TableComponent
        data={emails}
        columns={nestedTableConfig.columns}
        onRowClick={() => {}}
        renderExpandedContent={() => {}}
        rowHeight={10}
        nestedTableStyle={{}}
        disableDropdown={true}
        backgroundColor="#fcfcfc"
        headerBackgroundColor="#f1f1f1"
        headerTextColor="#222"
        cellTextColor="#000"
        cellPadding="3px"
        cellPaddingLeft="10px"
        noShadow={true}
        noRounding={true}
        noMargin={true}
        marginBottom="10px"
        headerPadding="5px"
      />
    );
  };

  const nestedTableConfig = {
    columns: [
      { field: 'status', headerName: '', type: 'send_status', minWidth: '10px', maxWidth: '20px' },
      { field: 'subject', headerName: 'Subject', type: 'text', minWidth: '30px', maxWidth: '100px' },
      { field: 'body', headerName: 'Body', type: 'text', minWidth: '50px', maxWidth: '100px' },
      { field: 'created_at', headerName: 'Created At', type: 'date' },
    ],
  };

  const columns = [
    { field: 'CreatedAt', headerName: '', type: 'date', minWidth: '70px', maxWidth: '80px', fontSize: '0.7rem', color: '#333' },
    { field: 'Name', headerName: 'Name', type: 'text', minWidth: '100px', maxWidth: '150px', backgroundColor: '#fafafa',  fontSize: '0.9rem'},
    { field: 'Email', headerName: 'Email', type: 'email', minWidth: '150px', maxWidth: '200px' , fontSize: '0.8rem' },
    { field: 'Phone', headerName: 'Phone', type: 'text', minWidth: '100px', maxWidth: '150px' , fontSize: '0.7rem' },
    { field: 'preference', headerName: 'Preferences', type: 'tagList', minWidth: '150px', maxWidth: '300px' },
    {
      field: 'action',
      headerName: 'Action',
      type: 'button',
      minWidth: '100px',
      maxWidth: '150px',
      label: 'Shrink Table & Show Followup',
      buttonStyle: { backgroundColor: 'blue', color: 'white' },
      action: (setTableWidth) => {
        setTableWidth('50%');
        setFollowupVisible(true);
      },
    },
  ];

  const chartData = {
    labels: ['May', 'June', 'July', 'August'],
    values: [15, 25, 35, 45],
  };

  const gridSize = 30;
  const tablePosition = { x: 0 * gridSize,  y: 2 * gridSize,  width: 55 * gridSize, height: 16 * gridSize };
  const followupEmailPosition = { x: 37 * gridSize, y: 2 * gridSize, width: 25 * gridSize, height: 5 * gridSize };
  const chartPosition = { x: 0 * gridSize, y: 40 * gridSize, width: 15 * gridSize, height: 16 * gridSize };
  const emailViewerPosition = { x: 60 * gridSize, y: 2 * gridSize, width: 25 * gridSize, height: 10 * gridSize };

  const filtersConfig = [
    { field: 'first_name', label: 'First Name', type: 'text' },
  ];

  console.log('Table Data:', tableData);

  useEffect(() => {
    console.log('Selected Lead:', selectedLead);
  }, [selectedLead]);

  return (
    <Box
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 55px)',
        top: '55px',
        backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    >
      <FiltersComponent filtersConfig={filtersConfig} onApplyFilters={handleApplyFilters} />
      
      <DraggableContainer defaultPosition={{ ...chartPosition }}>
        <BarChart labels={chartData.labels} values={chartData.values} />
      </DraggableContainer>

      <DraggableContainer defaultPosition={{ ...tablePosition }}>
        <TableComponent
          data={tableData}
          columns={columns}
          onRowClick={handleRowClick}
          renderExpandedContent={renderExpandedContent}
          headerPadding="10px"
          headerPaddingLeft="6px"
          cellPadding="4px"
        />
      </DraggableContainer>

      <DraggableContainer defaultPosition={{ ...followupEmailPosition }}>
        {isFollowupVisible && (
          <FollowupEmail
            lead={selectedLead}
            onClose={() => {
              setFollowupVisible(false);
            }}
          />
        )}
      </DraggableContainer>

      <DraggableContainer defaultPosition={{ ...emailViewerPosition }}>
        <EmailViewer />
      </DraggableContainer>

    </Box>
  );
};

export default Dashboard2;