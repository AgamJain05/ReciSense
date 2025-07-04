import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

const useAppStore = create(
  persist(
    (set, get) => ({
      // Pantry state
      pantry: {
        ingredients: [],
        totalItems: 0,
        lastUpdated: null,
        loading: false,
        error: null,
      },

      // Recipe analysis state
      recipeAnalysis: {
        current: null,
        history: [],
        loading: false,
        error: null,
      },

      // App settings
      settings: {
        notifications: true,
        darkMode: false,
        autoSavePhotos: false,
        highQualityOCR: true,
        detailedAnalysis: true,
        smartSubstitutions: true,
      },

      // Pantry actions
      loadPantry: async () => {
        set((state) => ({
          pantry: { ...state.pantry, loading: true, error: null }
        }));

        try {
          const response = await apiService.getPantry('default-user');
          console.log('🐛 loadPantry - Raw API response:', JSON.stringify(response, null, 2));
          
          if (response.success) {
            // Backend now returns ingredients directly in response.data.ingredients
            const ingredients = response.data.ingredients || [];
            
            console.log('🐛 loadPantry - Response data:', response.data);
            console.log('🐛 loadPantry - Ingredients data:', ingredients);
            console.log('🐛 loadPantry - Ingredients length:', ingredients.length);
            
            // Remove duplicates based on name, category, quantity, and unit
            const uniqueIngredients = ingredients.filter((ingredient, index, self) => {
              return index === self.findIndex(i => 
                i.name === ingredient.name && 
                i.category === ingredient.category && 
                i.quantity === ingredient.quantity && 
                i.unit === ingredient.unit
              );
            });
            
            console.log('🐛 loadPantry - After deduplication:', uniqueIngredients.length);
            
                          set((state) => ({
                pantry: {
                  ...state.pantry,
                  ingredients: uniqueIngredients,
                  totalItems: uniqueIngredients.length,
                  lastUpdated: response.data.lastUpdated || new Date().toISOString(),
                  loading: false,
                  error: null,
                }
              }));
          } else {
            throw new Error(response.error || 'Failed to load pantry');
          }
        } catch (error) {
          console.error('Load pantry error:', error);
          set((state) => ({
            pantry: {
              ...state.pantry,
              loading: false,
              error: error.message,
            }
          }));
        }
      },

      addIngredient: async (ingredientData) => {
        // DEBUG: Log what store is sending to API
        console.log('🐛 Store - addIngredient called with:', JSON.stringify(ingredientData, null, 2));
        
        try {
          const response = await apiService.addIngredient('default-user', ingredientData);
          console.log('🐛 Store - addIngredient API response:', JSON.stringify(response, null, 2));
          
          if (response.success) {
            console.log('🐛 Store - Adding ingredient to local state:', response.data);
            
            // Extract ingredient from nested structure
            const newIngredient = response.data.ingredient || response.data;
            console.log('🐛 Store - Extracted ingredient:', newIngredient);
            
            set((state) => {
              // Check if ingredient already exists
              const existingIndex = state.pantry.ingredients.findIndex(ingredient =>
                ingredient.name === newIngredient.name &&
                ingredient.category === newIngredient.category &&
                ingredient.unit === newIngredient.unit
              );

              let updatedIngredients;
              if (existingIndex !== -1) {
                // Update existing ingredient by combining quantities
                updatedIngredients = [...state.pantry.ingredients];
                updatedIngredients[existingIndex] = {
                  ...updatedIngredients[existingIndex],
                  quantity: updatedIngredients[existingIndex].quantity + newIngredient.quantity,
                  lastUpdated: new Date().toISOString()
                };
                console.log('🐛 Store - Updated existing ingredient:', updatedIngredients[existingIndex]);
              } else {
                // Add new ingredient
                updatedIngredients = [...state.pantry.ingredients, newIngredient];
                console.log('🐛 Store - Added new ingredient');
              }
              
              const newState = {
                pantry: {
                  ...state.pantry,
                  ingredients: updatedIngredients,
                  totalItems: updatedIngredients.length,
                  lastUpdated: new Date().toISOString(),
                }
              };
              console.log('🐛 Store - New pantry state:', {
                totalItems: newState.pantry.totalItems,
                ingredientsCount: newState.pantry.ingredients.length,
                ingredients: newState.pantry.ingredients.map(i => i.name)
              });
              return newState;
            });
            return { success: true };
          } else {
            throw new Error(response.error || 'Failed to add ingredient');
          }
        } catch (error) {
          console.error('Add ingredient error:', error);
          return { success: false, error: error.message };
        }
      },

      updateIngredient: async (originalName, updatedData) => {
        try {
          const response = await apiService.updateIngredient('default-user', originalName, updatedData);
          if (response.success) {
            // Extract ingredient from nested structure
            const updatedIngredient = response.data.ingredient || response.data;
            
            set((state) => ({
              pantry: {
                ...state.pantry,
                ingredients: state.pantry.ingredients.map(ingredient =>
                  ingredient.name === originalName ? updatedIngredient : ingredient
                ),
                lastUpdated: new Date().toISOString(),
              }
            }));
            return { success: true };
          } else {
            throw new Error(response.error || 'Failed to update ingredient');
          }
        } catch (error) {
          console.error('Update ingredient error:', error);
          return { success: false, error: error.message };
        }
      },

      removeIngredient: async (ingredientName) => {
        try {
          const response = await apiService.removeIngredient('default-user', ingredientName);
          if (response.success) {
            set((state) => ({
              pantry: {
                ...state.pantry,
                ingredients: state.pantry.ingredients.filter(
                  ingredient => ingredient.name !== ingredientName
                ),
                totalItems: state.pantry.totalItems - 1,
                lastUpdated: new Date().toISOString(),
              }
            }));
            return { success: true };
          } else {
            throw new Error(response.error || 'Failed to remove ingredient');
          }
        } catch (error) {
          console.error('Remove ingredient error:', error);
          return { success: false, error: error.message };
        }
      },

      clearPantry: async () => {
        try {
          const response = await apiService.clearPantry('default-user');
          if (response.success) {
            set((state) => ({
              pantry: {
                ...state.pantry,
                ingredients: [],
                totalItems: 0,
                lastUpdated: new Date().toISOString(),
              }
            }));
            return { success: true };
          } else {
            throw new Error(response.error || 'Failed to clear pantry');
          }
        } catch (error) {
          console.error('Clear pantry error:', error);
          return { success: false, error: error.message };
        }
      },

      getPantryStats: () => {
        const { pantry } = get();
        const stats = {
          totalItems: pantry.totalItems,
          categories: {},
          expiringSoon: 0,
          expired: 0,
        };

        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        pantry.ingredients.forEach(ingredient => {
          // Count by category
          if (stats.categories[ingredient.category]) {
            stats.categories[ingredient.category]++;
          } else {
            stats.categories[ingredient.category] = 1;
          }

          // Check expiry status
          if (ingredient.expiryDate) {
            const expiryDate = new Date(ingredient.expiryDate);
            if (expiryDate < now) {
              stats.expired++;
            } else if (expiryDate < weekFromNow) {
              stats.expiringSoon++;
            }
          }
        });

        return stats;
      },

      // Recipe analysis actions
      analyzeRecipe: async (imageUri) => {
        set((state) => ({
          recipeAnalysis: {
            ...state.recipeAnalysis,
            loading: true,
            error: null,
          }
        }));

        try {
          const response = await apiService.analyzeRecipe('default-user', imageUri);
          if (response.success) {
            const analysisData = response.data;
            
            set((state) => ({
              recipeAnalysis: {
                ...state.recipeAnalysis,
                current: analysisData,
                history: [analysisData, ...state.recipeAnalysis.history].slice(0, 10), // Keep last 10
                loading: false,
                error: null,
              }
            }));

            return { success: true, data: analysisData };
          } else {
            throw new Error(response.error || 'Failed to analyze recipe');
          }
        } catch (error) {
          console.error('Analyze recipe error:', error);
          set((state) => ({
            recipeAnalysis: {
              ...state.recipeAnalysis,
              loading: false,
              error: error.message,
            }
          }));
          return { success: false, error: error.message };
        }
      },

      clearRecipeAnalysis: () => {
        set((state) => ({
          recipeAnalysis: {
            ...state.recipeAnalysis,
            current: null,
            history: [],
          }
        }));
      },

      // Settings actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          }
        }));
      },
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pantry: state.pantry,
        settings: state.settings,
        recipeAnalysis: {
          ...state.recipeAnalysis,
          loading: false, // Don't persist loading state
          error: null, // Don't persist error state
        },
      }),
    }
  )
);

export default useAppStore; 