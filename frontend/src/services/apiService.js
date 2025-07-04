import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// API Configuration
const getApiBaseUrl = () => {
  // For development, use localhost or your computer's IP
  if (__DEV__) {
    // For Expo Go development - use the machine's local IP
    const expoManifest = Constants.expoConfig?.hostUri;
    if (expoManifest) {
      // Extract IP from Expo's hostUri (e.g., "192.168.1.100:8081" -> "192.168.1.100")
      const ip = expoManifest.split(':')[0];
      return `http://${ip}:3000/api`;
    }
    
    // Fallback to localhost for web/simulator
    return 'http://localhost:3000/api';
  }
  
  // For production, use your deployed backend URL
  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('🔗 API Base URL configured:', API_BASE_URL);

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Helper method for making API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.defaultHeaders,
      ...options,
    };

    // Add user ID header
    if (options.userId) {
      config.headers['x-user-id'] = options.userId;
    }

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ API Response: ${endpoint} - Success`);
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // Helper method for uploading files
  async uploadFile(endpoint, filePath, additionalData = {}, userId = 'default-user') {
    try {
      console.log(`📤 Uploading file to: ${endpoint}`);
      console.log(`📁 File path: ${filePath}`);

      const formData = new FormData();
      
      // Add the image file
      formData.append('image', {
        uri: filePath,
        type: 'image/jpeg',
        name: 'recipe-image.jpg',
      });

      // Add any additional data
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-user-id': userId,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Upload failed: ${response.statusText}`);
      }

      console.log(`✅ File uploaded successfully to: ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`❌ Upload error: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Test services
  async testServices() {
    return this.request('/recipe/test');
  }

  // Pantry APIs
  async getPantry(userId = 'default-user') {
    return this.request('/pantry', {
      method: 'GET',
      userId,
    });
  }

  async addIngredient(userId = 'default-user', ingredient) {
    return this.request('/pantry/ingredients', {
      method: 'POST',
      userId,
      body: JSON.stringify(ingredient),
    });
  }

  async addMultipleIngredients(userId = 'default-user', ingredients) {
    return this.request('/pantry/ingredients/bulk', {
      method: 'POST',
      userId,
      body: JSON.stringify({ ingredients }),
    });
  }

  async updateIngredient(userId = 'default-user', ingredientName, updates) {
    return this.request(`/pantry/ingredients/${encodeURIComponent(ingredientName)}`, {
      method: 'PUT',
      userId,
      body: JSON.stringify(updates),
    });
  }

  async removeIngredient(userId = 'default-user', ingredientName) {
    return this.request(`/pantry/ingredients/${encodeURIComponent(ingredientName)}`, {
      method: 'DELETE',
      userId,
    });
  }

  async clearPantry(userId = 'default-user') {
    return this.request('/pantry', {
      method: 'DELETE',
      userId,
    });
  }

  async searchPantry(userId = 'default-user', query) {
    return this.request(`/pantry/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      userId,
    });
  }

  async getPantryStats(userId = 'default-user') {
    return this.request('/pantry/stats', {
      method: 'GET',
      userId,
    });
  }

  // Recipe Analysis APIs
  async analyzeRecipe(userId = 'default-user', imageUri) {
    return this.uploadFile('/recipe/analyze', imageUri, {}, userId);
  }

  async extractTextFromImage(userId = 'default-user', imageUri) {
    return this.uploadFile('/recipe/extract-text', imageUri, {}, userId);
  }

  async analyzeRecipeText(userId = 'default-user', recipeText) {
    return this.request('/recipe/analyze-text', {
      method: 'POST',
      userId,
      body: JSON.stringify({ recipeText }),
    });
  }

  async extractIngredients(userId = 'default-user', recipeText) {
    return this.request('/recipe/extract-ingredients', {
      method: 'POST',
      userId,
      body: JSON.stringify({ recipeText }),
    });
  }

  // Error handling helper
  handleApiError(error) {
    if (error.message.includes('Network request failed')) {
      return {
        success: false,
        message: 'No internet connection. Please check your network and try again.',
        error: 'network_error',
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        success: false,
        message: 'Request timed out. Please try again.',
        error: 'timeout_error',
      };
    }
    
    if (error.message.includes('404')) {
      return {
        success: false,
        message: 'Service not found. Please check if the backend is running.',
        error: 'not_found_error',
      };
    }
    
    if (error.message.includes('500')) {
      return {
        success: false,
        message: 'Server error. Please try again later.',
        error: 'server_error',
      };
    }

    return {
      success: false,
      message: error.message || 'An unexpected error occurred.',
      error: 'unknown_error',
    };
  }

  // Utility methods
  isOnline() {
    // In a real app, you might use NetInfo from @react-native-community/netinfo
    return true;
  }

  async checkBackendConnection() {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.warn('Backend connection check failed:', error);
      return false;
    }
  }

  // Configuration
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  // Debug helpers
  logConfiguration() {
    console.log('📱 API Service Configuration:');
    console.log(`🔗 Base URL: ${this.baseUrl}`);
    console.log(`🏗️ Environment: ${__DEV__ ? 'Development' : 'Production'}`);
    console.log(`📱 Platform: ${Constants.platform?.ios ? 'iOS' : 'Android'}`);
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export default
export default apiService; 