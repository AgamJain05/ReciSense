const express = require('express');
const router = express.Router();
const Pantry = require('../models/Pantry');

// Middleware to extract user ID from headers
const getUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.query.userId || 'default-user';
  req.userId = userId;
  next();
};

router.use(getUserId);

// GET /api/pantry - Get user's pantry
router.get('/', async (req, res) => {
  try {
    console.log(`📱 Getting pantry for user: ${req.userId}`);
    
    let pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      // Create empty pantry for new user
      pantry = await Pantry.createUserPantry(req.userId);
      console.log(`✅ Created new pantry for user: ${req.userId}`);
    }
    
    res.json({
      success: true,
      data: {
        ingredients: pantry.ingredients,
        totalItems: pantry.totalItems,
        lastUpdated: pantry.lastUpdated
      }
    });
  } catch (error) {
    console.error('❌ Error getting pantry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pantry data',
      error: error.message
    });
  }
});

// POST /api/pantry/ingredients - Add ingredient to pantry
router.post('/ingredients', async (req, res) => {
  try {
    const { name, category, quantity, unit, expiryDate } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Ingredient name is required'
      });
    }
    
    console.log(`📱 Adding ingredient to pantry for user: ${req.userId}`);
    
    let pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      pantry = await Pantry.createUserPantry(req.userId);
    }
    
    const ingredient = {
      name: name.toLowerCase().trim(),
      category: category || 'other',
      quantity: quantity || 1,
      unit: unit || 'piece',
      expiryDate: expiryDate ? new Date(expiryDate) : null
    };
    
    const addedIngredient = await pantry.addIngredient(ingredient);
    
    console.log(`✅ Added ingredient: ${addedIngredient.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Ingredient added successfully',
      data: {
        ingredient: addedIngredient,
        totalItems: pantry.totalItems
      }
    });
  } catch (error) {
    console.error('❌ Error adding ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add ingredient',
      error: error.message
    });
  }
});

// POST /api/pantry/ingredients/bulk - Add multiple ingredients
router.post('/ingredients/bulk', async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ingredients array is required'
      });
    }
    
    console.log(`📱 Bulk adding ${ingredients.length} ingredients for user: ${req.userId}`);
    
    let pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      pantry = await Pantry.createUserPantry(req.userId);
    }
    
    const addedIngredients = [];
    const errors = [];
    
    for (const ingredient of ingredients) {
      try {
        if (!ingredient.name) {
          errors.push(`Missing name for ingredient: ${JSON.stringify(ingredient)}`);
          continue;
        }
        
        const formattedIngredient = {
          name: ingredient.name.toLowerCase().trim(),
          category: ingredient.category || 'other',
          quantity: ingredient.quantity || 1,
          unit: ingredient.unit || 'piece',
          expiryDate: ingredient.expiryDate ? new Date(ingredient.expiryDate) : null
        };
        
        const addedIngredient = await pantry.addIngredient(formattedIngredient);
        addedIngredients.push(addedIngredient);
      } catch (err) {
        errors.push(`Failed to add ${ingredient.name}: ${err.message}`);
      }
    }
    
    console.log(`✅ Added ${addedIngredients.length} ingredients, ${errors.length} errors`);
    
    res.status(201).json({
      success: true,
      message: `Added ${addedIngredients.length} ingredients successfully`,
      data: {
        addedIngredients: addedIngredients,
        errors: errors,
        totalItems: pantry.totalItems
      }
    });
  } catch (error) {
    console.error('❌ Error bulk adding ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add ingredients',
      error: error.message
    });
  }
});

// PUT /api/pantry/ingredients/:name - Update ingredient
router.put('/ingredients/:name', async (req, res) => {
  try {
    const ingredientName = req.params.name;
    const updates = req.body;
    
    console.log(`📱 Updating ingredient: ${ingredientName} for user: ${req.userId}`);
    
    const pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      return res.status(404).json({
        success: false,
        message: 'Pantry not found'
      });
    }
    
    const updatedIngredient = await pantry.updateIngredient(ingredientName, updates);
    
    console.log(`✅ Updated ingredient: ${ingredientName}`);
    
    res.json({
      success: true,
      message: 'Ingredient updated successfully',
      data: {
        ingredient: updatedIngredient,
        totalItems: pantry.totalItems
      }
    });
  } catch (error) {
    console.error('❌ Error updating ingredient:', error);
    
    if (error.message === 'Ingredient not found') {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found in pantry'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update ingredient',
      error: error.message
    });
  }
});

// DELETE /api/pantry/ingredients/:name - Remove ingredient
router.delete('/ingredients/:name', async (req, res) => {
  try {
    const ingredientName = req.params.name;
    
    console.log(`📱 Removing ingredient: ${ingredientName} for user: ${req.userId}`);
    
    const pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      return res.status(404).json({
        success: false,
        message: 'Pantry not found'
      });
    }
    
    await pantry.removeIngredient(ingredientName);
    
    console.log(`✅ Removed ingredient: ${ingredientName}`);
    
    res.json({
      success: true,
      message: 'Ingredient removed successfully',
      data: {
        totalItems: pantry.totalItems
      }
    });
  } catch (error) {
    console.error('❌ Error removing ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove ingredient',
      error: error.message
    });
  }
});

// DELETE /api/pantry - Clear entire pantry
router.delete('/', async (req, res) => {
  try {
    console.log(`📱 Clearing pantry for user: ${req.userId}`);
    
    const pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      return res.status(404).json({
        success: false,
        message: 'Pantry not found'
      });
    }
    
    pantry.ingredients = [];
    await pantry.save();
    
    console.log(`✅ Cleared pantry for user: ${req.userId}`);
    
    res.json({
      success: true,
      message: 'Pantry cleared successfully',
      data: {
        totalItems: 0
      }
    });
  } catch (error) {
    console.error('❌ Error clearing pantry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear pantry',
      error: error.message
    });
  }
});

// GET /api/pantry/search - Search ingredients
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    console.log(`🔍 Searching pantry for: ${query} (user: ${req.userId})`);
    
    const pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      return res.json({
        success: true,
        data: {
          results: [],
          totalResults: 0
        }
      });
    }
    
    const results = pantry.ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({
      success: true,
      data: {
        results: results,
        totalResults: results.length,
        query: query
      }
    });
  } catch (error) {
    console.error('❌ Error searching pantry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search pantry',
      error: error.message
    });
  }
});

// GET /api/pantry/stats - Get pantry statistics
router.get('/stats', async (req, res) => {
  try {
    console.log(`📊 Getting pantry stats for user: ${req.userId}`);
    
    const pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      return res.json({
        success: true,
        data: {
          totalItems: 0,
          categories: {},
          expiringItems: [],
          lastUpdated: null
        }
      });
    }
    
    // Calculate category distribution
    const categories = pantry.ingredients.reduce((acc, ingredient) => {
      acc[ingredient.category] = (acc[ingredient.category] || 0) + 1;
      return acc;
    }, {});
    
    // Find expiring items (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const expiringItems = pantry.ingredients.filter(ingredient =>
      ingredient.expiryDate && 
      ingredient.expiryDate <= sevenDaysFromNow &&
      ingredient.expiryDate >= new Date()
    );
    
    res.json({
      success: true,
      data: {
        totalItems: pantry.totalItems,
        categories: categories,
        expiringItems: expiringItems,
        lastUpdated: pantry.lastUpdated
      }
    });
  } catch (error) {
    console.error('❌ Error getting pantry stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pantry statistics',
      error: error.message
    });
  }
});

module.exports = router; 