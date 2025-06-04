import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { dashboardConfig } from "./DashboardConfig";
import { useDataSources } from "./DataSourceManager";
import MetricCard from "./MetricCard";
import DynamicTable from "./DynamicTable";
import InsightCallout from "./InsightCallout";
import { darkTheme } from "./DashboardStyles";

const customTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: darkTheme.accent.primary },
    background: { default: darkTheme.background.primary, paper: darkTheme.background.card },
    text: { primary: darkTheme.text.primary, secondary: darkTheme.text.secondary },
  },
});

export default function DashboardTemplate() {
  const [tabIdx, setTabIdx] = useState(0);
  const [config, setConfig] = useState(dashboardConfig);
  const { data, loading } = useDataSources(config);
  const tab = config.tabs[tabIdx];

  // Debug logging
  console.log('DashboardTemplate data:', data);
  console.log('Available data sources:', Object.keys(data));
  
  const handleCardUpdate = (sectionIdx, cardIdx, newCard) => {
    console.log('🔧 handleCardUpdate called:', { sectionIdx, cardIdx, newCard });
    console.log('⚠️ NOT mutating config to prevent re-renders');
    
    // DON'T mutate the config - just log for now
    // In a real app, you'd want to store this in separate state
    console.log('🎯 Card update received but not applied to prevent refresh');
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          background: darkTheme.background.primary,
          p: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: darkTheme.text.primary,
            fontWeight: 700,
            mb: 3,
          }}
        >
          {config.title}
        </Typography>

        <Tabs
          value={tabIdx}
          onChange={(e, newValue) => setTabIdx(newValue)}
          sx={{
            mb: 4,
            "& .MuiTab-root": {
              color: darkTheme.text.secondary,
              "&.Mui-selected": { color: darkTheme.accent.primary },
            },
          }}
        >
          {config.tabs.map((tab, idx) => (
            <Tab key={idx} label={tab.label} />
          ))}
        </Tabs>

        <Box>
          {tab.layout.map((section, sectionIdx) => {
            if (section.type === "metrics") {
              return (
                <Grid
                  container
                  spacing={3}
                  key={sectionIdx}
                  sx={{ mb: 4 }}
                >
                  {section.cards.map((card, cardIdx) => {
                    // Debug logging for each card
                    console.log(`Card ${cardIdx}:`, card);
                    console.log(`Data for ${card.dataSource}:`, data[card.dataSource]);
                    console.log(`ColTypes for ${card.dataSource}:`, data[`${card.dataSource}_colTypes`]);
                    
                    // Generate unique card ID
                    const cardId = `${card.dataSource}_${card.metric}_${cardIdx}`;
                    
                    return (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        lg={3}
                        key={cardIdx}
                      >
                        <MetricCard
                          cardId={cardId}
                          title={card.title}
                          metric={card.metric}
                          aggregation={card.aggregation}
                          data={data[card.dataSource] || []}
                          colTypes={data[`${card.dataSource}_colTypes`] || {}}
                          dataSource={card.dataSource}
                          dataSources={data}
                          onUpdate={(newCard) => handleCardUpdate(sectionIdx, cardIdx, newCard)}
                          showChart={card.showChart || false}
                          chartXAxis={card.chartXAxis || ""}
                          dateRange={card.timeFrame || "all"}
                          filters={card.filters || []}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              );
            }
            
            if (section.type === "insights") {
              return (
                <Box key={sectionIdx} sx={{ mb: 4 }}>
                  <InsightCallout data={data[section.dataSource] || []} />
                </Box>
              );
            }
            
            if (section.type === "table") {
              return (
                <Box
                  sx={{
                    background: darkTheme.background.card,
                    borderRadius: 3,
                    border: `1px solid ${darkTheme.border}`,
                    overflow: "hidden",
                    mb: 4,
                  }}
                  key={sectionIdx}
                >
                  <DynamicTable
                    data={data[section.dataSource] || []}
                    columns={section.columns}
                    loading={loading}
                  />
                </Box>
              );
            }
            return null;
          })}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
