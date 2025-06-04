import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function InsightCallout({ type, label, text }) {
  const bg =
    type === "info"
      ? "#e3f2fd"
      : type === "warning"
      ? "#fff3e0"
      : "#e8f5e9";
  const color =
    type === "info"
      ? "#1976d2"
      : type === "warning"
      ? "#ff9800"
      : "#388e3c";
  return (
    <Box
      sx={{
        bgcolor: bg,
        borderRadius: 2,
        p: 2.5,
        minHeight: 60,
        mb: 1,
        border: `1.5px solid ${color}`,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <InfoOutlinedIcon sx={{ color, fontSize: 28 }} />
      <Box>
        <Chip
          label={label}
          sx={{
            background: color,
            color: "#fff",
            fontWeight: 700,
            mb: 0.5,
            fontSize: 13,
          }}
          size="small"
        />
        <Typography variant="body1" sx={{ color: "#222", fontWeight: 500 }}>
          {text}
        </Typography>
      </Box>
    </Box>
  );
}
