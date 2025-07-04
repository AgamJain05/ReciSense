const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    enum: ['dairy', 'meat', 'vegetable', 'fruit', 'grain', 'spice', 'condiment', 'other'],
    default: 'other'
  },
  quantity: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    enum: ['piece', 'cup', 'tbsp', 'tsp', 'lb', 'oz', 'kg', 'g', 'ml', 'l', 'other'],
    default: 'piece'
  },
  expiryDate: {
    type: Date,
    default: null
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
});

const pantrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ingredients: [ingredientSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  totalItems: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update totalItems and lastUpdated before saving
pantrySchema.pre('save', function(next) {
  this.totalItems = this.ingredients.length;
  this.lastUpdated = new Date();
  next();
});

// Instance methods
pantrySchema.methods.addIngredient = async function(ingredient) {
  // Check if ingredient already exists
  const existingIndex = this.ingredients.findIndex(
    item => item.name.toLowerCase() === ingredient.name.toLowerCase()
  );
  
  let addedIngredient;
  
  if (existingIndex > -1) {
    // Update existing ingredient quantity
    this.ingredients[existingIndex].quantity += ingredient.quantity || 1;
    this.ingredients[existingIndex].unit = ingredient.unit || this.ingredients[existingIndex].unit;
    addedIngredient = this.ingredients[existingIndex];
  } else {
    // Add new ingredient with addedDate
    const newIngredient = {
      ...ingredient,
      addedDate: new Date()
    };
    this.ingredients.push(newIngredient);
    addedIngredient = newIngredient;
  }
  
  await this.save();
  return addedIngredient;
};

pantrySchema.methods.removeIngredient = function(ingredientName) {
  this.ingredients = this.ingredients.filter(
    item => item.name.toLowerCase() !== ingredientName.toLowerCase()
  );
  return this.save();
};

pantrySchema.methods.updateIngredient = async function(ingredientName, updates) {
  const ingredient = this.ingredients.find(
    item => item.name.toLowerCase() === ingredientName.toLowerCase()
  );
  
  if (ingredient) {
    Object.assign(ingredient, updates);
    await this.save();
    return ingredient;
  }
  
  throw new Error('Ingredient not found');
};

pantrySchema.methods.getIngredientNames = function() {
  return this.ingredients.map(item => item.name);
};

// Static methods
pantrySchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

pantrySchema.statics.createUserPantry = function(userId, ingredients = []) {
  return this.create({
    userId,
    ingredients,
    totalItems: ingredients.length
  });
};

module.exports = mongoose.model('Pantry', pantrySchema); 