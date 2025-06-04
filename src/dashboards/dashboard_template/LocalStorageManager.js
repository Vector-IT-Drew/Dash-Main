// Local storage manager for metric card configurations
const STORAGE_KEY = 'dashboard_metric_cards';

export function saveCardConfig(cardId, config) {
  try {
    const existing = getStoredConfigs();
    existing[cardId] = {
      ...config,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    console.log('💾 Saved card config:', { cardId, config });
    return true;
  } catch (error) {
    console.error('❌ Error saving card config:', error);
    return false;
  }
}

export function getCardConfig(cardId) {
  try {
    const configs = getStoredConfigs();
    const config = configs[cardId];
    console.log('📖 Retrieved card config:', { cardId, config });
    return config || null;
  } catch (error) {
    console.error('❌ Error retrieving card config:', error);
    return null;
  }
}

export function getStoredConfigs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('❌ Error parsing stored configs:', error);
    return {};
  }
}

export function deleteCardConfig(cardId) {
  try {
    const existing = getStoredConfigs();
    delete existing[cardId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    console.log('🗑️ Deleted card config:', cardId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting card config:', error);
    return false;
  }
}

export function clearAllConfigs() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Cleared all card configs');
    return true;
  } catch (error) {
    console.error('❌ Error clearing configs:', error);
    return false;
  }
}