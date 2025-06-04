// Dark theme styles inspired by the crypto dashboard
export const darkTheme = {
  background: {
    primary: "#1a1d29",
    secondary: "#252837", 
    card: "#2a2d3e",
    hover: "#2f3349",
  },
  text: {
    primary: "#ffffff",
    secondary: "#a0a3bd",
    muted: "#6b7280",
  },
  accent: {
    primary: "#6366f1",
    success: "#10b981", 
    warning: "#f59e0b",
    error: "#ef4444",
    chart: "#8b5cf6",
  },
  border: "#343649",
};

// Icon mapping for different metric types
export const iconMap = {
  // Financial
  "attach_money": "💰",
  "trending_up": "📈",
  "trending_down": "📉",
  "account_balance": "🏦",
  "payment": "💳",
  "savings": "💰",
  
  // Real Estate
  "home": "🏠",
  "apartment": "🏢",
  "location_on": "📍",
  "square_foot": "📐",
  "bed": "🛏️",
  "bathtub": "🛁",
  
  // Analytics
  "list": "📋",
  "person": "👤",
  "people": "👥",
  "visibility": "👁️",
  "remove_red_eye": "👁️",
  "bookmark": "🔖",
  "share": "📤",
  "calendar_today": "📅",
  "schedule": "⏰",
  "timer": "⏱️",
  
  // Default fallback
  "default": "📊"
};

export const cardStyles = {
  base: {
    height: 120,
    borderRadius: 3,
    background: darkTheme.background.card,
    border: `1px solid ${darkTheme.border}`,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      background: darkTheme.background.hover,
      transform: "translateY(-4px)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
    },
  },
  basic: {
    minWidth: 200,
    maxWidth: 280,
  },
  withChart: {
    minWidth: 320,
    maxWidth: 400,
  },
  advanced: {
    minWidth: 280,
    maxWidth: 350,
  }
};

export const modalStyles = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: darkTheme.background.card,
  border: `1px solid ${darkTheme.border}`,
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  borderRadius: 3,
  p: 4,
  minWidth: 600,
  maxHeight: "85vh",
  overflow: "auto",
}; 