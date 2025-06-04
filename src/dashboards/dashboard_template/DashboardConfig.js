export const dashboardConfig = {
  title: "StreetEasy Live Performance Dashboard",
  availableMetrics: [
    { field: "id", label: "Listings", icon: "list", prefix: "", suffix: "" },
    { field: "listed_price", label: "Rent", icon: "attach_money", prefix: "$", suffix: "" },
    { field: "calc_dom", label: "DOM", icon: "calendar_today", prefix: "", suffix: " days" },
    { field: "leads_count", label: "Leads", icon: "person", prefix: "", suffix: "" },
    { field: "total_views", label: "Views", icon: "visibility", prefix: "", suffix: "" },
    { field: "saves_count", label: "Saves", icon: "bookmark", prefix: "", suffix: "" },
    { field: "shares_count", label: "Shares", icon: "share", prefix: "", suffix: "" },
    { field: "views_count", label: "Page Views", icon: "remove_red_eye", prefix: "", suffix: "" },
    { field: "size_sqft", label: "Size", icon: "square_foot", prefix: "", suffix: " sqft" },
  ],
  tabs: [
    {
      label: "Overview",
      layout: [
        {
          type: "metrics",
          cards: [
            {
              title: "Total Listings",
              dataSource: "streeteasy",
              metric: "id",
              aggregation: "count",
              icon: "list",
              filters: [],
            },
            {
              title: "Studio Prices",
              dataSource: "streeteasy",
              metric: "listed_price",
              aggregation: "avg",
              icon: "attach_money",
              prefix: "$",
              showChart: true,
              chartXAxis: "created_at",
              dateRange: "90",
              filters: [
                {
                  field: "bedrooms",
                  operator: "equals",
                  value: 0
                }
              ]
            },
            {
              title: "1BR Prices",
              dataSource: "streeteasy",
              metric: "listed_price",
              aggregation: "avg",
              icon: "attach_money",
              prefix: "$",
              showChart: true,
              chartXAxis: "created_at",
              dateRange: "90",
              filters: [
                {
                  field: "bedrooms",
                  operator: "equals",
                  value: 1
                }
              ]
            },
            {
              title: "Avg Rent",
              dataSource: "streeteasy", 
              metric: "listed_price",
              aggregation: "avg",
              icon: "attach_money",
              prefix: "$",
              filters: [],
              showChart: true,
              chartXAxis: "created_at",
              dateRange: "30",
            },
            {
              title: "Avg DOM",
              dataSource: "streeteasy",
              metric: "calc_dom",
              aggregation: "avg",
              icon: "calendar_today",
              suffix: " days",
              filters: [],
            },
            {
              title: "Total Expense",
              dataSource: "streeteasy",
              metric: "listed_price",
              aggregation: "sum",
              icon: "attach_money",
              prefix: "$",
              filters: [],
            },
            {
              title: "Total Leads",
              dataSource: "streeteasy",
              metric: "leads_count",
              aggregation: "sum",
              icon: "person",
              filters: [],
            },
          ],
        },
        {
          type: "insights",
          dataSource: "streeteasy",
        },
        {
          type: "table",
          dataSource: "streeteasy",
          columns: [
            { field: "address", label: "Address" },
            { field: "unit", label: "Unit" },
            { field: "listed_price", label: "Price" },
            { field: "calc_dom", label: "DOM" },
            { field: "leads_count", label: "Leads" },
            { field: "status", label: "Status" },
          ],
        },
      ],
    },
  ],
  dataSources: {
    streeteasy: {
      endpoint: "https://dash-production-b25c.up.railway.app/run_query",
      params: { query_id: "get_streeteasy_data" },
      method: "GET",
    },
  },
};
