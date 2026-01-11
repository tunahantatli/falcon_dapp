import { falcon_dapp_backend } from '../../../declarations/falcon_dapp_backend';

/**
 * Get user preferences from backend
 * @param {string} address - User's principal address
 * @returns {Promise<Object|null>} User preferences or null
 */
export const getUserPreferences = async (address) => {
  try {
    const prefs = await falcon_dapp_backend.getUserPreferences(address);
    return prefs.length > 0 ? prefs[0] : null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
};

/**
 * Get hidden tokens list from backend
 * @param {string} address - User's principal address
 * @returns {Promise<Array<string>>} Array of hidden token IDs
 */
export const getHiddenTokens = async (address) => {
  try {
    return await falcon_dapp_backend.getHiddenTokens(address);
  } catch (error) {
    console.error('Error fetching hidden tokens:', error);
    return [];
  }
};

/**
 * Save hidden tokens to backend
 * @param {string} address - User's principal address
 * @param {Array<string>} hiddenTokens - Array of token IDs to hide
 * @returns {Promise<boolean>} Success status
 */
export const saveHiddenTokens = async (address, hiddenTokens) => {
  try {
    return await falcon_dapp_backend.saveHiddenTokens(address, hiddenTokens);
  } catch (error) {
    console.error('Error saving hidden tokens:', error);
    return false;
  }
};

/**
 * Get custom tokens from backend
 * @param {string} address - User's principal address
 * @returns {Promise<Array>} Array of custom tokens
 */
export const getCustomTokens = async (address) => {
  try {
    return await falcon_dapp_backend.getCustomTokens(address);
  } catch (error) {
    console.error('Error fetching custom tokens:', error);
    return [];
  }
};

/**
 * Add custom token to backend
 * @param {string} address - User's principal address
 * @param {string} canisterId - Token canister ID
 * @param {string} name - Token name
 * @param {string} symbol - Token symbol
 * @param {number} decimals - Token decimals
 * @returns {Promise<boolean>} Success status
 */
export const addCustomToken = async (address, canisterId, name, symbol, decimals) => {
  try {
    return await falcon_dapp_backend.addCustomToken(address, canisterId, name, symbol, decimals);
  } catch (error) {
    console.error('Error adding custom token:', error);
    return false;
  }
};

/**
 * Remove custom token from backend
 * @param {string} address - User's principal address
 * @param {string} canisterId - Token canister ID to remove
 * @returns {Promise<boolean>} Success status
 */
export const removeCustomToken = async (address, canisterId) => {
  try {
    return await falcon_dapp_backend.removeCustomToken(address, canisterId);
  } catch (error) {
    console.error('Error removing custom token:', error);
    return false;
  }
};

/**
 * Sync localStorage with backend (Migration helper)
 * @param {string} address - User's principal address
 */
export const migrateLocalStorageToBackend = async (address) => {
  try {
    // Migrate hidden tokens
    const hiddenKey = `falcon_wallet_hidden_tokens_${address}`;
    const localHidden = localStorage.getItem(hiddenKey);
    if (localHidden) {
      const hiddenTokens = JSON.parse(localHidden);
      await saveHiddenTokens(address, hiddenTokens);
      localStorage.removeItem(hiddenKey); // Clean up
      console.log('✅ Migrated hidden tokens to backend');
    }

    // Migrate custom tokens
    const customKey = `falcon_wallet_custom_tokens_${address}`;
    const localCustom = localStorage.getItem(customKey);
    if (localCustom) {
      const customTokens = JSON.parse(localCustom);
      for (const token of customTokens) {
        await addCustomToken(
          address,
          token.canisterId,
          token.name,
          token.symbol,
          token.decimals
        );
      }
      localStorage.removeItem(customKey); // Clean up
      console.log('✅ Migrated custom tokens to backend');
    }
  } catch (error) {
    console.error('Error during localStorage migration:', error);
  }
};
