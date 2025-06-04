import { useState, useEffect } from "react";

// Helper to get session key (adjust if your method is different)
function getSessionKey() {
  return localStorage.getItem("session_key");
}

export function useDataSources(config) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  console.log('🔄 useDataSources hook called with config:', {
    dataSources: Object.keys(config.dataSources),
    configHash: JSON.stringify(config).substring(0, 50) + '...'
  });

  useEffect(() => {
    console.log('🚀 useDataSources useEffect triggered');
    console.log('⚠️ This should only run ONCE when component mounts!');
    
    let isMounted = true;
    setLoading(true);

    const fetchAll = async () => {
      console.log('📡 Starting data fetch for all sources...');
      const results = {};
      const sessionKey = getSessionKey();

      for (const [key, ds] of Object.entries(config.dataSources)) {
        try {
          let url = ds.endpoint;
          let params = { ...ds.params, session_key: sessionKey };

          if (ds.method === "GET") {
            const paramString = new URLSearchParams(params).toString();
            url += "?" + paramString;
          }

          console.log(`🔄 Fetching ${key} from:`, url);

          const res = await fetch(url, {
            method: ds.method || "GET",
            headers: { "Content-Type": "application/json" },
            ...(ds.method === "POST" ? { body: JSON.stringify(params) } : {}),
          });
          
          const json = await res.json();
          
          console.log(`📥 Response for ${key}:`, {
            success: json.success,
            dataLength: json.data?.length,
            colTypesKeys: Object.keys(json.col_types || {}).length,
            colTypes: json.col_types
          });

          // Store both data and column types
          results[key] = json.data || [];
          results[`${key}_colTypes`] = json.col_types || {};
          
        } catch (error) {
          console.error(`❌ Error fetching ${key}:`, error);
          results[key] = [];
          results[`${key}_colTypes`] = {};
        }
      }
      
      if (isMounted) {
        console.log('🎯 Final results stored:', Object.keys(results));
        console.log('📊 Data summary:', Object.keys(results).map(key => ({
          key,
          isData: !key.includes('_colTypes'),
          length: Array.isArray(results[key]) ? results[key].length : 'N/A'
        })));
        
        setData(results);
        setLoading(false);
        console.log('✅ Data loading completed');
      }
    };

    fetchAll();
    return () => {
      console.log('🧹 useDataSources cleanup');
      isMounted = false;
    };
  }, []); // REMOVED config dependency - only run once!

  return { data, loading };
}
