const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const ocrService = require('../services/ocrService');
const geminiService = require('../services/geminiService');
const Pantry = require('../models/Pantry');

// Environment variables
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads/temp';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', UPLOAD_PATH);
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `recipe-${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

// Middleware to extract user ID
const getUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.query.userId || 'default-user';
  req.userId = userId;
  next();
};

router.use(getUserId);

// POST /api/recipe/analyze - Main endpoint for recipe analysis
router.post('/analyze', upload.single('image'), async (req, res) => {
  let imagePath = null;
  
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    imagePath = req.file.path;
    const fileSize = req.file.size;
    const fileName = req.file.filename;

    console.log(`📱 Starting recipe analysis for user: ${req.userId}`);
    console.log(`📸 Image: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);

    // Step 1: Get user's pantry
    console.log('🔄 Step 1: Retrieving user pantry...');
    let pantry = await Pantry.findByUserId(req.userId);
    
    if (!pantry) {
      pantry = await Pantry.createUserPantry(req.userId);
    }

    const pantryIngredients = pantry.ingredients || [];
    console.log(`📦 Found ${pantryIngredients.length} pantry ingredients`);

    // Step 2: Extract text from image using OCR
    console.log('🔄 Step 2: Extracting text from image...');
    const ocrResult = await ocrService.extractTextFromImage(imagePath);
    
    if (!ocrResult.text || ocrResult.text.trim().length === 0) {
      throw new Error('No text could be extracted from the image. Please ensure the image is clear and contains readable text.');
    }

    console.log(`📝 OCR completed: ${ocrResult.wordCount} words, ${ocrResult.confidence.toFixed(1)}% confidence`);

    // Step 3: Analyze recipe text structure
    console.log('🔄 Step 3: Analyzing recipe structure...');
    const recipeAnalysis = ocrService.analyzeRecipeText(ocrResult.text);

    // Step 4: Send to Gemini for feasibility analysis
    console.log('🔄 Step 4: Analyzing feasibility with Gemini AI...');
    const geminiAnalysis = await geminiService.analyzeRecipeFeasibility(
      ocrResult.text,
      pantryIngredients
    );

    // Step 5: Clean up uploaded file
    console.log('🔄 Step 5: Cleaning up temporary files...');
    await fs.remove(imagePath).catch(err => {
      console.warn('⚠️ Failed to delete uploaded file:', err.message);
    });

    // Prepare comprehensive response
    const analysisResult = {
      success: true,
      data: {
        // Core analysis results
        feasibilityScore: geminiAnalysis.feasibilityScore,
        recipeTitle: geminiAnalysis.recipeTitle,
        
        // OCR results
        ocrResults: {
          extractedText: ocrResult.text,
          confidence: ocrResult.confidence,
          wordCount: ocrResult.wordCount
        },
        
        // Recipe components
        recipe: {
          title: geminiAnalysis.recipeTitle,
          ingredients: geminiAnalysis.extractedIngredients,
          tools: geminiAnalysis.requiredTools,
          nutritionalInfo: geminiAnalysis.nutritionalInfo,
          structuredAnalysis: recipeAnalysis
        },
        
        // Pantry matching
        pantryAnalysis: {
          totalPantryItems: pantryIngredients.length,
          availableIngredients: geminiAnalysis.availableIngredients,
          missingIngredients: geminiAnalysis.missingIngredients,
          matchPercentage: pantryIngredients.length > 0 
            ? Math.round((geminiAnalysis.availableIngredients.length / geminiAnalysis.extractedIngredients.length) * 100)
            : 0
        },
        
        // AI suggestions
        suggestions: geminiAnalysis.suggestions,
        
        // Warnings and notes
        warnings: geminiAnalysis.warningsAndNotes,
        
        // Metadata
        analysis: {
          timestamp: geminiAnalysis.timestamp,
          processingTime: Date.now() - new Date(req.startTime || Date.now()),
          userId: req.userId,
          imageFileName: fileName
        }
      }
    };

    console.log(`✅ Analysis completed successfully!`);
    console.log(`📊 Feasibility Score: ${geminiAnalysis.feasibilityScore}%`);
    console.log(`🥘 Recipe: ${geminiAnalysis.recipeTitle}`);
    console.log(`📦 Available: ${geminiAnalysis.availableIngredients.length}/${geminiAnalysis.extractedIngredients.length} ingredients`);

    res.json(analysisResult);

  } catch (error) {
    console.error('❌ Recipe analysis failed:', error);

    // Clean up uploaded file on error
    if (imagePath) {
      await fs.remove(imagePath).catch(console.error);
    }

    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = 'Internal server error during recipe analysis';

    if (error.message.includes('No text could be extracted')) {
      statusCode = 422;
      errorMessage = error.message;
    } else if (error.message.includes('Gemini')) {
      statusCode = 503;
      errorMessage = 'AI analysis service temporarily unavailable';
    } else if (error.message.includes('OCR')) {
      statusCode = 422;
      errorMessage = 'Failed to process image. Please try with a clearer image.';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: NODE_ENV === 'development' ? {
        details: error.message,
        stack: error.stack
      } : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/recipe/extract-text - OCR only endpoint
router.post('/extract-text', upload.single('image'), async (req, res) => {
  let imagePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    imagePath = req.file.path;
    console.log(`📱 Extracting text from image for user: ${req.userId}`);

    const ocrResult = await ocrService.extractTextFromImage(imagePath);
    const recipeAnalysis = ocrService.analyzeRecipeText(ocrResult.text);

    // Clean up uploaded file
    await fs.remove(imagePath).catch(console.error);

    res.json({
      success: true,
      data: {
        extractedText: ocrResult.text,
        confidence: ocrResult.confidence,
        wordCount: ocrResult.wordCount,
        analysis: recipeAnalysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Text extraction failed:', error);
    
    if (imagePath) {
      await fs.remove(imagePath).catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to extract text from image',
      error: NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/recipe/analyze-text - Analyze existing text (no OCR)
router.post('/analyze-text', async (req, res) => {
  try {
    const { recipeText } = req.body;

    if (!recipeText || typeof recipeText !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Recipe text is required'
      });
    }

    console.log(`📱 Analyzing provided text for user: ${req.userId}`);

    // Get user's pantry
    let pantry = await Pantry.findByUserId(req.userId);
    if (!pantry) {
      pantry = await Pantry.createUserPantry(req.userId);
    }

    const pantryIngredients = pantry.ingredients || [];
    
    // Analyze with Gemini
    const geminiAnalysis = await geminiService.analyzeRecipeFeasibility(
      recipeText,
      pantryIngredients
    );

    // Analyze text structure
    const recipeAnalysis = ocrService.analyzeRecipeText(recipeText);

    res.json({
      success: true,
      data: {
        feasibilityScore: geminiAnalysis.feasibilityScore,
        recipeTitle: geminiAnalysis.recipeTitle,
        recipe: {
          ingredients: geminiAnalysis.extractedIngredients,
          tools: geminiAnalysis.requiredTools,
          nutritionalInfo: geminiAnalysis.nutritionalInfo,
          structuredAnalysis: recipeAnalysis
        },
        pantryAnalysis: {
          totalPantryItems: pantryIngredients.length,
          availableIngredients: geminiAnalysis.availableIngredients,
          missingIngredients: geminiAnalysis.missingIngredients
        },
        suggestions: geminiAnalysis.suggestions,
        warnings: geminiAnalysis.warningsAndNotes,
        timestamp: geminiAnalysis.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Text analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze recipe text',
      error: NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/recipe/extract-ingredients - Extract ingredients only from text
router.post('/extract-ingredients', async (req, res) => {
  try {
    const { recipeText } = req.body;

    if (!recipeText) {
      return res.status(400).json({
        success: false,
        message: 'Recipe text is required'
      });
    }

    console.log(`📱 Extracting ingredients from text for user: ${req.userId}`);

    const ingredients = await geminiService.extractIngredientsOnly(recipeText);
    const recipeAnalysis = ocrService.analyzeRecipeText(recipeText);

    res.json({
      success: true,
      data: {
        ingredients: ingredients,
        detectedIngredients: recipeAnalysis.ingredients,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Ingredient extraction failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract ingredients',
      error: NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/recipe/test - Test endpoint to verify services
router.get('/test', async (req, res) => {
  try {
    const testResults = {
      ocr: 'Not tested',
      gemini: 'Not tested',
      pantry: 'Not tested'
    };

    // Test OCR service
    try {
      await ocrService.initialize();
      testResults.ocr = 'Ready';
    } catch (error) {
      testResults.ocr = `Error: ${error.message}`;
    }

    // Test Gemini service
    try {
      await geminiService.initialize();
      testResults.gemini = 'Ready';
    } catch (error) {
      testResults.gemini = `Error: ${error.message}`;
    }

    // Test Pantry database
    try {
      const pantry = await Pantry.findByUserId('test-user');
      testResults.pantry = 'Ready';
    } catch (error) {
      testResults.pantry = `Error: ${error.message}`;
    }

    res.json({
      success: true,
      data: {
        services: testResults,
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Service test failed',
      error: error.message
    });
  }
});

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  
  if (error.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed'
    });
  }
  
  next(error);
});

module.exports = router; 