import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";

export default function DynamicTable({ data, columns, loading }) {
  return (
    <TableContainer sx={{ minWidth: 650, background: "#fff" }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.field}
                sx={{
                  fontWeight: 700,
                  background: "#f7f9fb",
                  color: "#222",
                  fontSize: 15,
                  borderBottom: "2px solid #e0e0e0",
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <CircularProgress size={28} sx={{ my: 2 }} />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow key={idx} hover>
                {columns.map((col) => (
                  <TableCell
                    key={col.field}
                    sx={{ fontSize: 15, color: "#222", py: 1.2 }}
                  >
                    {row[col.field]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
