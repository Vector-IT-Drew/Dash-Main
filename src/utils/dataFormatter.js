export const formatLeadData = (lead) => {
  return {
    person_id: lead.person_id,
    FullName: `${lead.first_name} ${lead.last_name}`, // Combine first and last name
    Email: lead.email_address,
    Phone: lead.phone_number,
    CreatedAt: lead.created_at,
    preference: lead.preference,
  };
};

export const defaultColumns = [
  { field: 'FullName', headerName: 'Full Name', type: 'text', minWidth: '150px' },
  { field: 'Email', headerName: 'Email', type: 'email', minWidth: '200px' },
  { field: 'Phone', headerName: 'Phone', type: 'text', minWidth: '150px' },
  { field: 'CreatedAt', headerName: 'Created At', type: 'date', minWidth: '150px' },
  { field: 'preference', headerName: 'Preferences', type: 'text', minWidth: '150px' },
]; 