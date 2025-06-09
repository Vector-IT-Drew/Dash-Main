import React, { useState, useEffect, useMemo } from 'react';
import { Box, Tabs, Tab, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DraggableContainer from '../components/DraggableContainer';
import TableComponent from '../components/TableComponent';
import FiltersComponent from '../components/FiltersComponent';
import MetricCard from '../components/MetricCard';
import { API_BASE_URL, getSessionKey } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { 
  preprocessData,
  calculateTotalUnits, 
  calculateDailyMoveOuts,
  calculateUnitsByStatus,
  calculateDistributionByField,
  calculateDOMDistribution,
  getCurrentVacancyCount,
  getExpectedVacancyCount,
  getDownUnitsMetric,
  getAverageDaysOnMarket
} from '../utils/metricCalculations';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import NotesComponent from '../components/NotesComponent';
import DynamicMetricCard from '../components/DynamicMetricCard';
import DynamicMetricChart from '../components/DynamicMetricChart';
import CircularProgress from '@mui/material/CircularProgress';
import TenantInfoComponent from '../components/TenantInfoComponent';
import QuickFilterTabs from '../components/QuickFilterTabs';

const ClientDataView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tableData, setTableData] = useState([]);
  
  // Store filters in localStorage to persist them
  const [filters, setFilters] = useState(() => {
    // Try to load saved filters from localStorage
    const savedFilters = localStorage.getItem('clientDataViewFilters');
    return savedFilters ? JSON.parse(savedFilters) : {};
  });
  
  const navigate = useNavigate();
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Sorting state
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  
  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('clientDataViewFilters', JSON.stringify(filters));
  }, [filters]);

  // Metrics state
  const [metrics, setMetrics] = useState({
    totalUnits: { count: 0, loading: true },
    vacancyRate: { rate: 0, loading: true },
    daysOnMarket: { 
      average: 0, 
      count: 0, 
      chartData: { 
        labels: [], 
        datasets: [{ data: [] }]
      }, 
      loading: true 
    },
    dailyMoveOuts: { 
      total: 0, 
      chartData: { 
        labels: [], 
        datasets: [{ data: [] }]
      }, 
      loading: true 
    },
    activeApplications: { count: 0, loading: true },
    prelease: { count: 0, loading: true },
    renewalCheck: { count: 0, loading: true },
    dealStatusDistribution: { 
      distribution: {}, 
      chartData: { 
        labels: [], 
        datasets: [{ data: [] }]
      }, 
      loading: true 
    },
    daysOnMarketDistribution: { 
      stats: null, 
      chartData: { 
        labels: [], 
        datasets: [{ data: [] }]
      }, 
      loading: true 
    }
  });

  const handleTabChange = (event, newValue) => { setActiveTab(newValue); };

  // Configuration for data mapping and column definitions
  const dataConfig = {
    endpoint: `${API_BASE_URL}/run_query`,
    queryId: 'get_client_data',
    mapData: (item) => {
      // Calculate derived fields
      const currentDate = new Date();
      const moveOutDate = item.move_out ? new Date(item.move_out) : null;
      const dom = moveOutDate ? Math.max(0, Math.floor((moveOutDate - currentDate) / (1000 * 60 * 60 * 24))) : '-';
      
      // Calculate YOY change
      const prevGross = parseFloat(item.previous_gross) || 0;
      const currentGross = parseFloat(item.gross) || 0;
      const yoy = prevGross !== 0 ? ((currentGross - prevGross) / prevGross * 100).toFixed(1) : '-';
      
      // Calculate per sqft metrics
      const sqft = parseFloat(item.sqft) || 0;
      const gpsf = sqft !== 0 ? (currentGross / sqft * 12).toFixed(2) : '-';
      const ppsf = sqft !== 0 ? (parseFloat(item.actual_rent || 0) / sqft * 12).toFixed(2) : '-';

      // Calculate percentage changes for gross and actual rent
      const grossChange = prevGross !== 0 ? ((currentGross - prevGross) / prevGross * 100) : null;
      const grossChangeFormatted = grossChange !== null ? 
        (grossChange >= 0 ? `+${grossChange.toFixed(2)}%` : `${grossChange.toFixed(2)}%`) : '-';

      const prevActualRent = parseFloat(item.previous_actual_rent) || 0;
      const currentActualRent = parseFloat(item.actual_rent) || 0;
      const rentChange = prevActualRent !== 0 ? ((currentActualRent - prevActualRent) / prevActualRent * 100) : null;
      const rentChangeFormatted = rentChange !== null ? 
        (rentChange >= 0 ? `+${rentChange.toFixed(2)}%` : `${rentChange.toFixed(2)}%`) : '-';

      // Add tenant_info_display field
      const tenantInfoDisplay = (() => {
        let tenants = item.tenant_info;
        if (typeof tenants === 'string') {
          try { tenants = JSON.parse(tenants); } catch { tenants = []; }
        }
        if (Array.isArray(tenants) && tenants.length > 0) {
          const t = tenants[0];
          return `${t.first_name || ''} ${t.last_name || ''}`.trim();
        }
        return '-';
      })();

      return {
        id: item.id || 0,
        address: item.address || '-',
        unit: item.unit || '-',
        lease_type: item.lease_type || '-',
        beds: item.beds || '-',
        baths: item.baths || '-',
        sqft: item.sqft || '-',
        tenant_info_display: tenantInfoDisplay,
        tenant_info_full: (() => {
          let tenants = item.tenant_info;
          if (typeof tenants === 'string') {
            try { tenants = JSON.parse(tenants); } catch { tenants = []; }
          }
          return Array.isArray(tenants) ? tenants : [];
        })(),
        unit_status: item.unit_status || '-',
        deal_status: item.deal_status || '-',
        previous_deal_status: item.previous_deal_status || '-',
        gross: item.gross || '-',
        previous_gross: item.previous_gross || '-',
        actual_rent: item.actual_rent || '-',
        previous_actual_rent: item.previous_actual_rent || '-',
        concession: item.concession || '-',
        term: item.term || '-',
        move_in: item.move_in || '-',
        start_date: item.start_date || '-',
        move_out: item.move_out || '-',
        previous_move_out: item.previous_move_out || '-',
        expiry: item.expiry || '-',
        portfolio: item.portfolio || '-',
        unit_id: item.unit_id || item.id || item.UnitID,
        most_recent_note: item.most_recent_note || '',
        note_created_at: item.note_created_at || '',
        note_creator_id: item.note_creator_id || '',
        creator_full_name: item.creator_full_name || '',
        rentable: item.rentable,
        // Add new calculated fields
        dom: dom,
        yoy: yoy,
        gpsf: gpsf,
        ppsf: ppsf,
        // Add percentage change fields
        gross_change: grossChangeFormatted,
        gross_change_value: grossChange,
        rent_change: rentChangeFormatted,
        rent_change_value: rentChange,
      };
    },
    columns: [
      { field: 'address', headerName: 'Address', type: 'text', minWidth: '200px', maxWidth: '200px', fontSize: '0.9rem' },
      { field: 'unit', headerName: 'Unit', type: 'text', minWidth: '70px', maxWidth: '70px', fontSize: '0.8rem' },
      { field: 'lease_type', headerName: 'Lease Type', type: 'text', minWidth: '90px', maxWidth: '90px', fontSize: '0.8rem' },
      { field: 'beds', headerName: 'Beds', type: 'number', minWidth: '40px', maxWidth: '40px', fontSize: '0.8rem' },
      { field: 'baths', headerName: 'Baths', type: 'number', minWidth: '55px', maxWidth: '55px', fontSize: '0.8rem' },
      { field: 'sqft', headerName: 'Sqft', type: 'number', minWidth: '65px', maxWidth: '65px', fontSize: '0.8rem' },
      { field: 'tenant_info_display', headerName: 'Tenants', type: 'text', minWidth: '120px', maxWidth: '120px', fontSize: '0.8rem' },
      { field: 'unit_status', headerName: 'Unit Status', type: 'badge', minWidth: '110px', maxWidth: '110px', fontSize: '0.8rem' },
      { field: 'deal_status', headerName: 'Deal Status', type: 'badge', minWidth: '120px', maxWidth: '120px', fontSize: '0.8rem' },
      { field: 'gross', headerName: 'Gross', type: 'currency', minWidth: '80px', maxWidth: '80px', fontSize: '0.8rem', reduceRightPadding: true },
      { field: 'gross_change', headerName: '', type: 'percentage_change', minWidth: '55px', maxWidth: '55px', fontSize: '0.7rem', reduceLeftPadding: true, reduceRightPadding: true },
      { field: 'actual_rent', headerName: 'Actual Rent', type: 'currency', minWidth: '80px', maxWidth: '80px', fontSize: '0.8rem', reduceRightPadding: true },
      { field: 'rent_change', headerName: '', type: 'percentage_change', minWidth: '55px', maxWidth: '55px', fontSize: '0.7rem', reduceLeftPadding: true , reduceRightPadding: true },
      { field: 'concession', headerName: 'Conc', type: 'number', minWidth: '60px', maxWidth: '60px', fontSize: '0.8rem' },
      { field: 'term', headerName: 'Term', type: 'number', minWidth: '50px', maxWidth: '50px', fontSize: '0.8rem' },
      { field: 'move_in', headerName: 'Move-In', type: 'date', minWidth: '105px', maxWidth: '105px', fontSize: '0.8rem' , reduceRightPadding: true},
      { field: 'move_out', headerName: 'Move-Out', type: 'date', minWidth: '105px', maxWidth: '105px', fontSize: '0.8rem' , reduceRightPadding: true},
      { field: 'start_date', headerName: 'Lease Start', type: 'date',  minWidth: '105px', maxWidth: '105px', fontSize: '0.8rem' , reduceRightPadding: true},
      { field: 'expiry', headerName: 'Expiry', type: 'date', minWidth: '105px', maxWidth: '105px', fontSize: '0.8rem' , reduceRightPadding: true },
      { field: 'notes', headerName: 'Notes', type: 'notes', minWidth: '280px', maxWidth: '280px', fontSize: '0.8rem' },
      // Add new calculated columns
      { field: 'dom', headerName: 'DOM', type: 'number', minWidth: '65px', maxWidth: '65px', fontSize: '0.8rem' },
      { field: 'yoy', headerName: 'YOY%', type: 'number', minWidth: '65px', maxWidth: '65px', fontSize: '0.8rem' },
      { field: 'gpsf', headerName: 'GPSF', type: 'currency', minWidth: '65px', maxWidth: '65px', fontSize: '0.8rem' },
      { field: 'ppsf', headerName: 'PPSF', type: 'currency', minWidth: '70px', maxWidth: '70px', fontSize: '0.8rem' }
    ],
  };

  const fetchData = async (filters = {}) => {
    try {
      // Set all metrics to loading
      setMetrics(prev => ({
        totalUnits: { ...prev.totalUnits, loading: true },
        vacancyRate: { ...prev.vacancyRate, loading: true },
        daysOnMarket: { ...prev.daysOnMarket, loading: true },
        dailyMoveOuts: { ...prev.dailyMoveOuts, loading: true },
        activeApplications: { ...prev.activeApplications, loading: true },
        prelease: { ...prev.prelease, loading: true },
        renewalCheck: { ...prev.renewalCheck, loading: true },
        dealStatusDistribution: { ...prev.dealStatusDistribution, loading: true },
        daysOnMarketDistribution: { ...prev.daysOnMarketDistribution, loading: true }
      }));
      
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        navigate('/login');
        return;
      }
      
      const queryParams = new URLSearchParams({
        session_key: sessionKey,
        query_id: dataConfig.queryId,
        filters: JSON.stringify(filters)
      }).toString();

      const response = await fetch(`${dataConfig.endpoint}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching data:', errorText);
        return;
      }

      const result = await response.json();
      console.log('API Result:', result);

      if (result.status === 'success') {
        // Preprocess the data to calculate DOM for each row
        const processedData = preprocessData(result.data);
        
        const formattedData = result.data.map(dataConfig.mapData);
        setTableData(formattedData);
        
        // Calculate metrics using the processed data
        const totalUnitsMetric = calculateTotalUnits(processedData);
        
        const dailyMoveOutsMetric = calculateDailyMoveOuts(processedData);
        
        const activeAppsMetric = calculateUnitsByStatus(processedData, 'deal_status', 'active application');
        
        const preleaseMetric = calculateUnitsByStatus(processedData, 'deal_status', 'prelease');
        
        const renewalCheckMetric = calculateUnitsByStatus(processedData, 'deal_status', 'renewal check');
        
        const domMetric = {
          average: getAverageDaysOnMarket(formattedData),
          count: formattedData.filter(row => parseFloat(row.dom) > 0).length,
          chartData: { labels: [], datasets: [{ data: [] }] } // You'll need to build this if needed
        };
        
        const dealStatusDistribution = calculateDistributionByField(processedData, 'deal_status');
        
        const domDistribution = calculateDOMDistribution(processedData);
        console.log('DOM Distribution:', domDistribution);
        
        // Update metrics state
        setMetrics({
          totalUnits: { ...totalUnitsMetric, loading: false },
          daysOnMarket: { ...domMetric, loading: false },
          dailyMoveOuts: { ...dailyMoveOutsMetric, loading: false },
          activeApplications: { ...activeAppsMetric, loading: false },
          prelease: { ...preleaseMetric, loading: false },
          renewalCheck: { ...renewalCheckMetric, loading: false },
          dealStatusDistribution: { ...dealStatusDistribution, loading: false },
          daysOnMarketDistribution: { ...domDistribution, loading: false }
        });
        
        // Reset to first page when new data is loaded
        setPage(0);

        console.log('Raw data sample:', result.data.slice(0, 3));
        console.log('Available fields:', Object.keys(result.data[0]));

      
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMetrics(prev => ({
        totalUnits: { ...prev.totalUnits, loading: false },
        vacancyRate: { ...prev.vacancyRate, loading: false },
        daysOnMarket: { ...prev.daysOnMarket, loading: false },
        dailyMoveOuts: { ...prev.dailyMoveOuts, loading: false },
        activeApplications: { ...prev.activeApplications, loading: false },
        prelease: { ...prev.prelease, loading: false },
        renewalCheck: { ...prev.renewalCheck, loading: false },
        dealStatusDistribution: { ...prev.dealStatusDistribution, loading: false },
        daysOnMarketDistribution: { ...prev.daysOnMarketDistribution, loading: false }
      }));
    }
  };

  useEffect(() => {
    fetchData(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 50));
    setPage(0);
  };

  // Sorting handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filtersConfig = [
    { field: 'address', label: 'Address', type: 'text' },
    { field: 'portfolio', label: 'Portfolio', type: 'text' , useDropdown: true },
    { field: 'unit', label: 'Unit', type: 'text' },
    { field: 'beds', label: 'Beds', type: 'number' },
    { field: 'baths', label: 'Baths', type: 'number' },
    { field: 'unit_status', label: 'Unit Status', type: 'text', useDropdown: true },
    { field: 'deal_status', label: 'Deal Status', type: 'text', useDropdown: true },
    { field: 'lease_type', label: 'Lease Type', type: 'text', useDropdown: true },
  ];

  const gridSize = 20;
  
  // Positions for metric cards
  const totalUnitsPosition = { x: 0, y: 0, width: 220, height: 80 };
  const domCardPosition = { x: 940, y: 0, width: 220, height: 80 };
  const vacancyRatePosition = { x: 240, y: 0, width: 200, height: 80 };
  const expectedVacancyPosition = { x: 460, y: 0, width: 220, height: 80 };

  const activeAppsPosition = { x: 0, y: 100, width: 220, height: 80 };
  const preleasePosition = { x: 0, y: 200, width: 220, height: 80 };
  const renewalCheckPosition = { x: 0, y: 300, width: 220, height: 80 };
  const downUnitsPosition = { x: 700, y: 0, width: 220, height: 80 };

  const upcomingMoveOutsPosition = { x: 1180, y: 0, width: 500, height: 380 };

  const dynamicPiePosition = { x: 700, y: 100, width: 460, height: 280 };   
  const dynamicMetricChartPosition = { x: 0, y: 400, width: 680, height: 400 };   

  const averageMetricPosition = { x: 700, y: 400, width: 720, height: 280 };

  const unitStatusDistributionPosition = { x: 240, y: 100, width: 440, height: 280 };

  // Calculate occupancy data based on unit statuses
  const occupancyChartData = useMemo(() => {
    if (!tableData.length) {
      return {
        labels: [],
        datasets: [{
          label: 'Units by Status',
          data: [],
          backgroundColor: [
            'rgba(75, 192, 140, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
          ],
          borderColor: [
            'rgba(75, 192, 140, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1
        }]
      };
    }

    // Count units by status
    const statusCounts = {};
    tableData.forEach(unit => {
      const status = unit.unit_status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Convert to array and sort by count (descending)
    const sortedStatuses = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // Limit to top 8 statuses

    // Calculate percentages
    const total = tableData.length;
    const statusPercentages = sortedStatuses.map(([status, count]) => ({
      status,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(1))
    }));

    console.log('Unit status distribution:', statusPercentages);

    return {
      labels: statusPercentages.map(item => `${item.status} (${item.percentage}%)`),
      datasets: [{
        label: 'Units by Status',
        data: statusPercentages.map(item => item.count),
        backgroundColor: [
          'rgba(75, 192, 140, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
          'rgba(83, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(75, 192, 140, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
        ],
        borderWidth: 1
      }]
    };
  }, [tableData]);

  const [selectedUnitForNotes, setSelectedUnitForNotes] = useState(null);

  const handleOpenNotes = (unit) => {
    console.log("handleOpenNotes received:", unit);
    setSelectedUnitForNotes({
      unitId: unit.unitId,
      unitNumber: unit.unitNumber,
      propertyName: unit.propertyName
    });
  };

  const handleNoteAdded = (unitId, note, createdAt, creatorFullName) => {
    setTableData(prev =>
      prev.map(row =>
        row.unit_id === unitId
          ? {
              ...row,
              most_recent_note: note,
              note_created_at: createdAt,
              creator_full_name: creatorFullName,
              note_creator_id: '',
            }
          : row
      )
    );
  };

  const [dynamicMetricCardFilters, setDynamicMetricCardFilters] = useState({
    deal_status: '',
    unit_status: '',
    move_out_start: '',
    move_out_end: '',
    metric: ''
  });
  const [dynamicMetricChartFilters, setDynamicMetricChartFilters] = useState({
    deal_status: '',
    unit_status: '',
    move_out_start: '',
    move_out_end: '',
    metric: ''
  });

  const [unitDealsData, setUnitDealsData] = useState({});

  const downUnits = getDownUnitsMetric(tableData);

  // Add state for settings menu
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const isSettingsMenuOpen = Boolean(settingsAnchorEl);
  
  // Handle settings menu open
  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  
  // Handle settings menu close
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  
  // Reset dashboard layout
  const handleResetLayout = () => {
    // Get all keys from localStorage that match the current dashboard
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`dashboard-client-data-view-component-`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all matching keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reload the page to apply default positions
    window.location.reload();
    
    // Close the menu
    handleSettingsClose();
  };

  // Reset datatable layout (column order, sorting, etc.)
  const handleResetTableLayout = () => {
    // Reset table column order
    const tableKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('table-columns-')) {
        tableKeys.push(key);
      }
    }
    
    // Remove all table-related keys
    tableKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reset sorting state
    setOrder('asc');
    setOrderBy('');
    
    // Reset pagination
    setPage(0);
    setRowsPerPage(50);
    
    // Force a re-render of the table by temporarily setting tableData to empty and back
    setTableData([]);
    setTimeout(() => {
      // Reload the page to ensure all table components reset properly
      window.location.reload();
    }, 100);
    
    // Close the menu
    handleSettingsClose();
  };

  const fetchUnitDeals = async (unitId) => {
    console.log(`Fetching unit deals for unit_id: ${unitId}`);
    try {
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        navigate('/login');
        return;
      }
      
      const queryParams = new URLSearchParams({
        session_key: sessionKey,
        query_id: 'get_unit_deals',
        unit_id: unitId
      }).toString();
      
      const response = await fetch(`${API_BASE_URL}/run_query?${queryParams}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setUnitDealsData((prevData) => ({
          ...prevData,
          [unitId]: result.data,
        }));
      }
    } catch (error) {
      console.error('Error fetching unit deals data:', error);
    }
  };

  const handleRowClick = (index, row) => {
    console.log(`Row clicked: ${index}, unit_id: ${row.unit_id}`);
    if (!unitDealsData[row.unit_id]) {
      fetchUnitDeals(row.unit_id);
    }
  };

  const formatDateWithoutTimezoneShift = (dateString) => {
    if (!dateString || dateString === '-' || dateString === 'null') return '-';
    
    try {
      // Handle different possible date formats
      if (typeof dateString === 'string') {
        // If it's a standard ISO date string with T separator
        if (dateString.includes('T')) {
          const [datePart] = dateString.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          
          // Validate the date parts
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return dateString; // Return original if parsing failed
          }
          
          return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${String(year).slice(-2)}`;
        } 
        // If it's just a date string without time (YYYY-MM-DD)
        else if (dateString.includes('-')) {
          const [year, month, day] = dateString.split('-').map(Number);
          
          // Validate the date parts
          if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return dateString; // Return original if parsing failed
          }
          
          return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${String(year).slice(-2)}`;
        }
        // If it's already in MM/DD/YYYY format
        else if (dateString.includes('/')) {
          const parts = dateString.split('/');
          if (parts.length === 3) {
            const [month, day, year] = parts.map(Number);
            
            // Validate the date parts
            if (isNaN(month) || isNaN(day) || isNaN(year)) {
              return dateString; // Return original if parsing failed
            }
            
            return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${String(year).toString().slice(-2)}`;
          }
        }
      }
      
      // Fallback to standard Date object with timezone handling
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Add one day to compensate for timezone issues
        date.setDate(date.getDate());
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
      }
      
      // If all else fails, return the original string
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString; // Return the original string if there's an error
    }
  };

  // Add state for tenant info modal
  const [tenantInfoModalOpen, setTenantInfoModalOpen] = useState(false);
  const [tenantInfoModalTenants, setTenantInfoModalTenants] = useState([]);

  const renderExpandedContent = (row) => {
    const deals = unitDealsData[row.unit_id];
    if (!deals) return <Box p={2} textAlign="center"><CircularProgress size={24} /></Box>;
    if (deals.length === 0) {
      return <Box p={2} textAlign="center">No deals found for this unit</Box>;
    }

    const formattedDeals = deals.map(deal => {
      // Calculate percentage changes for this deal
      const prevGross = parseFloat(deal.previous_gross) || 0;
      const currentGross = parseFloat(deal.gross) || 0;
      const grossChange = prevGross !== 0 ? ((currentGross - prevGross) / prevGross * 100) : null;
      const grossChangeFormatted = grossChange !== null ? 
        (grossChange >= 0 ? `+${grossChange.toFixed(2)}%` : `${grossChange.toFixed(2)}%`) : '-';

      const prevActualRent = parseFloat(deal.previous_actual_rent) || 0;
      const currentActualRent = parseFloat(deal.actual_rent) || 0;
      const rentChange = prevActualRent !== 0 ? ((currentActualRent - prevActualRent) / prevActualRent * 100) : null;
      const rentChangeFormatted = rentChange !== null ? 
        (rentChange >= 0 ? `+${rentChange.toFixed(2)}%` : `${rentChange.toFixed(2)}%`) : '-';

      // Add tenant info processing
      const tenantInfoDisplay = (() => {
        let tenants = deal.tenant_info;
        if (typeof tenants === 'string') {
          try { tenants = JSON.parse(tenants); } catch { tenants = []; }
        }
        if (Array.isArray(tenants) && tenants.length > 0) {
          const t = tenants[0];
          return `${t.first_name || ''} ${t.last_name || ''}`.trim();
        }
        return '-';
      })();

      return {
        ...deal,
        spacer_alignment: '',
        start_date: deal.start_date ? formatDateWithoutTimezoneShift(deal.start_date) : '-',
        expiry: deal.expiry ? formatDateWithoutTimezoneShift(deal.expiry) : '-',
        move_in: deal.move_in ? formatDateWithoutTimezoneShift(deal.move_in) : '-',
        move_out: deal.move_out ? formatDateWithoutTimezoneShift(deal.move_out) : '-',
        gross_change: grossChangeFormatted,
        gross_change_value: grossChange,
        rent_change: rentChangeFormatted,
        rent_change_value: rentChange,
        spacer_alignment_end: '',
        tenant_info_display: tenantInfoDisplay,
        tenant_info_full: (() => {
          let tenants = deal.tenant_info;
          if (typeof tenants === 'string') {
            try { tenants = JSON.parse(tenants); } catch { tenants = []; }
          }
          return Array.isArray(tenants) ? tenants : [];
        })(),
      };
    });

    // Define columns for the unit deals table - compact version with alignment
    const dealColumns = [
      // Spacer to align with main table (dropdown + address + unit + lease_type + beds + baths + sqft + unit_status)
      { field: 'current_deal', headerName: '', type: 'current_deal_indicator', minWidth: '40px', maxWidth: '40px', fontSize: '0.8rem'}, // 35+200+70+90+40+55+65+120 = 675px
      { field: 'spacer_alignment', headerName: '', type: 'text', minWidth: '520px', maxWidth: '520px', fontSize: '0.8rem'}, // 35+200+70+90+40+55+65+120 = 675px
      // Add tenant info column before deal status
      { field: 'tenant_info_display', headerName: 'Tenant', type: 'text', minWidth: '227px', maxWidth: '227px', fontSize: '0.8rem' },
      
      { field: 'deal_status', headerName: 'Deal Status', type: 'badge', minWidth: '120px', maxWidth: '120px', fontSize: '0.8rem'}, 
      { field: 'gross', headerName: 'Gross', type: 'currency', minWidth: '80px', maxWidth: '80px', fontSize: '0.8rem', reduceRightPadding: true}, 
      { field: 'gross_change', headerName: '', type: 'percentage_change', minWidth: '55px', maxWidth: '55px', fontSize: '0.7rem', reduceLeftPadding: true}, 
      { field: 'actual_rent', headerName: 'Actual Rent', type: 'currency', minWidth: '80px', maxWidth: '80px', fontSize: '0.8rem', reduceRightPadding: true}, 
      { field: 'rent_change', headerName: '', type: 'percentage_change', minWidth: '55px', maxWidth: '55px', fontSize: '0.7rem', reduceLeftPadding: true}, 
      { field: 'concession', headerName: 'Conc', type: 'number', minWidth: '60px', maxWidth: '60px', fontSize: '0.8rem'}, 
      { field: 'term', headerName: 'Term', type: 'number', minWidth: '50px', maxWidth: '50px', fontSize: '0.8rem'}, 
      { field: 'move_in', headerName: 'Move-In', type: 'date', minWidth: '105px', maxWidth: '105px', fontSize: '0.8rem'}, 
      { field: 'move_out', headerName: 'Move-Out', type: 'date', minWidth: '105px', maxWidth: '105px', fontSize: '0.8rem'}, 
      { field: 'start_date', headerName: 'Lease Start', type: 'date', minWidth: '105px', maxWidth: '105px', fontSize: '0.8rem'}, 
      { field: 'expiry', headerName: 'Expiry', type: 'date', minWidth: '105px', maxWidth: '105px', fontSize: '0.8rem'}, 
      { field: 'spacer_alignment_end', headerName: '', type: 'text', minWidth: '300px', maxWidth: '500px', fontSize: '0.8rem'}, // 35+200+70+90+40+55+65+120 = 675px
    ];

    return (
      <Box sx={{ display: 'block', width: 'fit-content', backgroundColor: '#eee', overflow: 'visible', border: 'none', borderRadius: 0, margin: 0, padding: 0 }}>
        <TableComponent
          data={formattedDeals}
          columns={dealColumns}
          onRowClick={() => {}}
          renderExpandedContent={() => {}}
          rowHeight={30}
          nestedTableStyle={{ width: 'fit-content' }}
          disableDropdown={true}
          backgroundColor="#f5f5f5"
          headerBackgroundColor="#f5f5f5"
          headerTextColor="#333333"
          cellTextColor="#555555"
          cellPadding="4px"
          cellPaddingLeft="4px"
          noShadow={true}
          noRounding={true}
          noMargin={true}
          marginBottom="0px"
          sortable={false}
          columnHeight={24}
          pagination={false}
          showHeaders={false}
          enableExport={false}
          // Custom cell renderer for tenant_info_display
          customCellRenderers={{
            tenant_info_display: (value, dealRow) => (
              value === '-' ? (
                <span style={{ color: '#888', opacity: 0.7 }}>{value}</span>
              ) : (
                <span
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onClick={e => {
                    e.stopPropagation();
                    setTenantInfoModalTenants(dealRow.tenant_info_full || []);
                    setTenantInfoModalOpen(true);
                  }}
                  onMouseOver={e => { e.currentTarget.style.opacity = 0.7; }}
                  onMouseOut={e => { e.currentTarget.style.opacity = 1; }}
                >
                  {value}
                </span>
              )
            )
          }}
        />
      </Box>
    );
  };

  const quickTabs = [
    { label: 'Prelease', value: 'Prelease' },
    { label: 'Renewal Check', value: 'Renewal Check' }
    // Add more tabs as needed
    // {
    //   label: 'Renewal Check',
    //   value: 'renewal_check',
    //   filterOverrides: { ... }
    // },
  ];

  const [selectedQuickTab, setSelectedQuickTab] = useState(null);

  // Merge agg_filter with user filters
  const mergedFilters = useMemo(() => {
    const aggFilter = selectedQuickTab ? { agg_filter: selectedQuickTab } : {};
    return { ...filters, ...aggFilter };
  }, [filters, selectedQuickTab]);

  useEffect(() => {
    fetchData(mergedFilters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedFilters]);

  return (
    <Box
    sx={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      height: 'auto',
      overflow: 'hidden',
      backgroundColor: '#ffffff'
        }}
    >
      {/* Controls Row: Filters (left), QuickFilterTabs (center), Tabs+Settings (right) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          width: '100%',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Left: Filters Button */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, ml: 5 }}>
          <FiltersComponent 
            filtersConfig={filtersConfig} 
            onApplyFilters={setFilters} 
            initialFilters={filters}
            data={tableData}
            onFilterToggle={setIsFiltersOpen}
          />
        </Box>
        {/* Center: QuickFilterTabs */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0 }}>
          <QuickFilterTabs
            tabs={quickTabs}
            selectedTab={selectedQuickTab}
            onTabChange={setSelectedQuickTab}
          />
        </Box>
        {/* Right: Tabs and Settings */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minWidth: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ minHeight: 40, height: 40 }}
          >
            <Tab label="Data" sx={{ minHeight: 40, height: 40 }} />
            <Tab label="Dashboard" sx={{ minHeight: 40, height: 40 }} />
          </Tabs>
          <IconButton 
            onClick={handleSettingsClick}
            size="medium"
            sx={{ ml: 1, mr: 2 }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content: Table or Dashboard */}
      {activeTab === 0 && (
        <Box 
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            position: 'relative',
            zIndex: 1,
            marginTop: isFiltersOpen ? '130px' : 0,
            transition: 'margin-top 0.15s ease-in-out',
            height: 'calc(100vh - 60px)', // Reduce top padding so table is right below controls
            padding: '0 20px', // Only horizontal padding
          }}
        >
          <TableComponent
              data={tableData}
              columns={dataConfig.columns}
              onRowClick={handleRowClick}
              renderExpandedContent={renderExpandedContent}
              rowHeight={35}
              headerHeight={45}
              backgroundColor="#ffffff"
              headerBackgroundColor="#f5f5f5"
              headerTextColor="#333333"
              cellTextColor="#555555"
              cellPadding="2px"
              cellPaddingLeft="8px"
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              count={tableData.length}
              orderBy={orderBy}
              order={order}
              onRequestSort={handleRequestSort}
              pagination={true}
              sortable={true}
              stickyHeader={true}
              setSelectedUnitForNotes={setSelectedUnitForNotes}
              onNoteClick={handleOpenNotes}
              enableExport={true}
              exportFileName="client_data"
              customCellRenderers={{
                tenant_info_display: (value, row) => (
                  value === '-' ? (
                    <span style={{ color: '#888', opacity: 0.7 }}>{value}</span>
                  ) : (
                    <span
                      style={{
                      
                        cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setTenantInfoModalTenants(row.tenant_info_full || []);
                        setTenantInfoModalOpen(true);
                      }}
                      onMouseOver={e => { e.currentTarget.style.opacity = 0.7; }}
                      onMouseOut={e => { e.currentTarget.style.opacity = 1; }}
                    >
                      {value}
                    </span>
                  )
                )
              }}
          />
        </Box>
      )}

      {activeTab === 1 && (
        <Box
          style={{
            position: 'relative',
            width: '100%',
            height: '100vh',
            overflow: 'auto',
            // backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
            backgroundSize: `${gridSize}px ${gridSize}px`,
            padding: '20px',
            margin: '20px',
            marginTop: '55px',
            backgroundColor: '#FFFEFF'
          }}
        >
          {/* Total Units Card */}
          <DraggableContainer 
            defaultPosition={totalUnitsPosition} 
            componentId="total-units-card" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Total Units"
              value={tableData.length > 0 ? metrics.totalUnits.count : 'N/A'}
              loading={metrics.totalUnits.loading}
              description="Total number of units selected"
              icon={<HomeIcon />}
              iconColor="#4285F4"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>
          
          {/* Daily Move-Outs Card */}
          <DraggableContainer 
            defaultPosition={{...upcomingMoveOutsPosition}} 
            componentId="upcoming-move-outs" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Upcoming Move-Outs (30 Days)"
              value={metrics.dailyMoveOuts.total}
              showChart={true}
              chartType="line"
              chartData={metrics.dailyMoveOuts.chartData}
              loading={metrics.dailyMoveOuts.loading}
              iconColor="#FF5722"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
              chartOptions={{
                scales: {
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                      autoSkip: true,
                      maxTicksLimit: 15
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      title: function(tooltipItems) {
                        return `Move-outs on ${tooltipItems[0].label}`;
                      }
                    }
                  }
                }
              }}
            />
          </DraggableContainer>

          {/* Active Applications Card */}
          <DraggableContainer 
            defaultPosition={{...activeAppsPosition}} 
            componentId="active-applications" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Active Applications"
              value={metrics.activeApplications.count}
              loading={metrics.activeApplications.loading}
              iconColor="#2196F3"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>

          {/* Prelease Card */}
          <DraggableContainer 
            defaultPosition={{ ...preleasePosition }} 
            componentId="prelease" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Prelease"
              value={metrics.prelease.count}
              loading={metrics.prelease.loading}
              iconColor="#FF9800"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>

          {/* Renewal Check Card */}
          <DraggableContainer 
            defaultPosition={{ ...renewalCheckPosition }} 
            componentId="renewal-check" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Renewal Check"
              value={metrics.renewalCheck.count}
              loading={metrics.renewalCheck.loading}
              iconColor="#E91E63"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>

          {/* Avg Days on Market Card */}
          <DraggableContainer 
            defaultPosition={domCardPosition} 
            componentId="dom-card" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Avg Days on Market"
              value={tableData.length > 0 ? getAverageDaysOnMarket(tableData) : 'N/A'}
              suffix={tableData.length > 0 && getAverageDaysOnMarket(tableData) > 0 ? " days" : ""}
              loading={false}
              description={`${tableData.filter(row => parseFloat(row.dom) > 0).length} units currently on market`}
              icon={<CalendarTodayIcon />}
              iconColor="#FBBC05"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>

          {/* Unit Status Distribution Card */}
          <DraggableContainer 
            defaultPosition={{ ...unitStatusDistributionPosition}} 
            componentId="unit-status-distribution" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Unit Status Distribution"
              showChart={true}
              chartType="pie"
              showLegend={true}
              chartData={occupancyChartData}
              description="Distribution of units by status"
              iconColor="#4CAF50"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>

          {/* Vacancy Cards */}
          <DraggableContainer 
            defaultPosition={{ ...vacancyRatePosition }} 
            componentId="current-vacancy" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Current Vacancy"
              value={`${getCurrentVacancyCount(tableData)} units`}
              loading={metrics.totalUnits.loading}
              description="All units that are vacant and rentable"
              icon={<HomeIcon />}
              iconColor="#4285F4"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>

          {/* Expected Vacancy Card */}
          <DraggableContainer 
            defaultPosition={{ ...expectedVacancyPosition }} 
            componentId="expected-vacancy" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Expected Vacancy"
              value={`${getExpectedVacancyCount(tableData)} units`}
              loading={metrics.totalUnits.loading}
              description="Units that are vacant and rentable, but not under active deal"
              icon={<HomeIcon />}
              iconColor="#4285F4"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>

          {/* Average Metric Card */}
          <DraggableContainer 
            defaultPosition={{ ...averageMetricPosition }} 
            componentId="average-metric" 
            dashboardId="client-data-view"
          >
            <DynamicMetricCard
              data={tableData}
              filters={dynamicMetricCardFilters}
              setFilters={setDynamicMetricCardFilters}
              cardTitle="Average Metric"
              backgroundColor="#ffffff"
            />
          </DraggableContainer>

          {/* Dynamic Pie Chart */}
          <DraggableContainer 
            defaultPosition={{ ...dynamicPiePosition}} 
            componentId="dynamic-pie-chart" 
            dashboardId="client-data-view"
          >
            <DynamicMetricChart
              data={tableData}
              chartType="pie"
              filterType="dropdown"
            />
          </DraggableContainer>

          {/* Dynamic Metric Chart */}
          <DraggableContainer 
            defaultPosition={{ ...dynamicMetricChartPosition}} 
            componentId="dynamic-metric-chart" 
            dashboardId="client-data-view"
          >
            <DynamicMetricChart
              data={tableData}
              filters={dynamicMetricChartFilters}
              setFilters={setDynamicMetricChartFilters}
              maxValue={70}
            />
          </DraggableContainer>

          {/* Down Units Card */}
          <DraggableContainer 
            defaultPosition={{...downUnitsPosition}} 
            componentId="down-units" 
            dashboardId="client-data-view"
          >
            <MetricCard
              title="Down Units"
              value={
                <span>
                  {downUnits.count}
                  <span style={{ color: '#888', fontSize: '0.6em', marginLeft: 6 }}>
                    ({downUnits.percent}%)
                  </span>
                </span>
              }
              loading={metrics.totalUnits.loading}
              description="Units that are DNR, Holdover, or Legal"
              iconColor="#BDBDBD"
              backgroundColor="#ffffff"
              width="100%"
              height="100%"
            />
          </DraggableContainer>
        </Box>
      )}

      {selectedUnitForNotes && (
        <NotesComponent
          open={!!selectedUnitForNotes}
          onClose={() => setSelectedUnitForNotes(null)}
          unitId={selectedUnitForNotes.unitId}
          unitNumber={selectedUnitForNotes.unitNumber}
          propertyName={selectedUnitForNotes.propertyName}
          onNoteAdded={handleNoteAdded}
        />
      )}
      {/* Tenant Info Modal */}
      <TenantInfoComponent
        open={tenantInfoModalOpen}
        onClose={() => setTenantInfoModalOpen(false)}
        tenants={tenantInfoModalTenants}
      />
    </Box>
  );
};

export default ClientDataView;

