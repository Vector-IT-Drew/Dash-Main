import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Button,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownloadIcon from '@mui/icons-material/Download';
import { API_BASE_URL, getSessionKey } from '../utils/api';

function groupReportsByName(reports) {
  // Group by name, sort each group by created_at descending
  const groups = {};
  for (const report of reports) {
    if (!groups[report.name]) groups[report.name] = [];
    groups[report.name].push(report);
  }
  // Sort each group by created_at descending
  for (const name in groups) {
    groups[name].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return groups;
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  // Format: M/D/YY h:mm AM/PM
  const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${date} ${hours}:${minutes} ${ampm}`;
};

const Reports = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const sessionKey = getSessionKey();
        const params = new URLSearchParams({
          session_key: sessionKey,
          query_id: 'get_reports',
        }).toString();
        const res = await fetch(`${API_BASE_URL}/run_query?${params}`);
        const result = await res.json();
        if (result.status === 'success') {
          setData(result.data);
        }
      } catch (e) {
        setData([]);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  const grouped = groupReportsByName(data);

  return (
    <Box sx={{ p: 3,  mt:1.5, pt: 0}}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, pl: 5, mt: 0 }}>
        Reports
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(grouped).map(([name, reports]) => {
                const latest = reports[0];
                return (
                  <React.Fragment key={name}>
                    <TableRow hover>
                      <TableCell>
                        {reports.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => setOpenGroup(openGroup === name ? null : name)}
                          >
                            {openGroup === name ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>{latest.name}</TableCell>
                      <TableCell>{formatDateTime(latest.created_at)}</TableCell>
                      <TableCell>
                        <span
                          style={{
                            color:
                              latest.status === 'completed'
                                ? '#388e3c'
                                : latest.status === 'pending'
                                ? '#bdbdbd'
                                : '#f44336',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        >
                          {latest.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          sx={{ minWidth: 100, fontWeight: 500 }}
                        >
                          Generate
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                        <Collapse in={openGroup === name} timeout="auto" unmountOnExit>
                          <Box margin={1}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              All Reports
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableCell>Created At</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>File</TableCell>
                                  <TableCell>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reports.map((r) => {
                                  const isPending = r.status === 'pending';
                                  return (
                                    <TableRow key={r.report_id}>
                                      <TableCell>{formatDateTime(r.created_at)}</TableCell>
                                      <TableCell>
                                        <span
                                          style={{
                                            color:
                                              r.status === 'completed'
                                                ? '#388e3c'
                                                : isPending
                                                ? '#bdbdbd'
                                                : '#f44336',
                                            fontWeight: 500,
                                            textTransform: 'capitalize',
                                          }}
                                        >
                                          {r.status}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        {r.file_path ? (
                                          <span style={{ color: isPending ? '#bdbdbd' : '#1976d2' }}>
                                            {r.file_path.split('/').pop()}
                                          </span>
                                        ) : (
                                          '-'
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          startIcon={<DownloadIcon />}
                                          disabled={isPending}
                                          sx={{
                                            minWidth: 110,
                                            backgroundColor: isPending ? '#e0e0e0' : undefined,
                                            color: isPending ? '#888' : undefined,
                                            boxShadow: 'none',
                                            '&:hover': isPending
                                              ? { backgroundColor: '#e0e0e0' }
                                              : undefined,
                                          }}
                                          // onClick={() => ...} // download logic to be added later
                                        >
                                          Download
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Reports; 