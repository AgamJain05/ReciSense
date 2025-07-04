const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🔄 Initializing OCR worker...');
      this.worker = await Tesseract.createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
      
      // Configure OCR parameters for better recipe text recognition
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-/:;• ',
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1'
      });
      
      this.isInitialized = true;
      console.log('✅ OCR worker initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OCR worker:', error);
      throw new Error('OCR initialization failed');
    }
  }

  async preprocessImage(imagePath) {
    try {
      const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
      
      // Preprocess image for better OCR accuracy
      await sharp(imagePath)
        .resize(1200, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .sharpen()
        .normalize()
        .png({ quality: 90 })
        .toFile(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('❌ Image preprocessing failed:', error);
      throw new Error('Image preprocessing failed');
    }
  }

  async extractTextFromImage(imagePath) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 Processing image with OCR...');
      
      // Preprocess image for better results
      const processedImagePath = await this.preprocessImage(imagePath);
      
      // Perform OCR
      const { data: { text, confidence } } = await this.worker.recognize(processedImagePath);
      
      // Clean up processed image
      await fs.remove(processedImagePath).catch(console.error);
      
      // Clean and process the extracted text
      const cleanedText = this.cleanExtractedText(text);
      
      console.log(`✅ OCR completed with confidence: ${confidence.toFixed(2)}%`);
      console.log(`📝 Extracted text preview: ${cleanedText.substring(0, 100)}...`);
      
      return {
        text: cleanedText,
        confidence: confidence,
        wordCount: cleanedText.split(' ').length
      };
    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  cleanExtractedText(rawText) {
    if (!rawText) return '';
    
    // Remove excessive whitespace and normalize line breaks
    let cleaned = rawText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    // Remove common OCR artifacts
    cleaned = cleaned
      .replace(/[|\\]/g, 'I')  // Common OCR mistakes
      .replace(/0/g, 'O')      // Zero to O in ingredient names
      .replace(/(?:^|\s)(?:@|#|&|%|$|\*)+(?:\s|$)/g, ' '); // Remove social media artifacts
    
    // Fix common recipe-related OCR errors
    const recipeCorrections = {
      'tsps?': 'tsp',
      'tbsps?': 'tbsp',
      'cups?': 'cup',
      'ozs?': 'oz',
      'lbs?': 'lb',
      'cloves?': 'clove',
      'spoons?': 'spoon'
    };
    
    Object.entries(recipeCorrections).forEach(([pattern, replacement]) => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      cleaned = cleaned.replace(regex, replacement);
    });
    
    return cleaned;
  }

  async terminate() {
    if (this.worker && this.isInitialized) {
      try {
        await this.worker.terminate();
        this.isInitialized = false;
        console.log('✅ OCR worker terminated');
      } catch (error) {
        console.error('❌ Error terminating OCR worker:', error);
      }
    }
  }

  // Analyze text to extract recipe components
  analyzeRecipeText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const analysis = {
      ingredients: [],
      instructions: [],
      title: '',
      servings: null,
      cookTime: null
    };
    
    // Simple heuristics to identify different parts of the recipe
    let currentSection = 'unknown';
    
    for (let line of lines) {
      line = line.trim();
      
      // Detect section headers
      if (/^(ingredients?|what you.?ll need)/i.test(line)) {
        currentSection = 'ingredients';
        continue;
      } else if (/^(instructions?|directions?|method|steps?)/i.test(line)) {
        currentSection = 'instructions';
        continue;
      }
      
      // Extract servings
      const servingsMatch = line.match(/(?:serves?|servings?|makes?)[\s:]*([\d]+)/i);
      if (servingsMatch) {
        analysis.servings = parseInt(servingsMatch[1]);
      }
      
      // Extract cooking time
      const timeMatch = line.match(/(\d+)\s*(min|minute|hour|hr)/i);
      if (timeMatch) {
        analysis.cookTime = `${timeMatch[1]} ${timeMatch[2]}`;
      }
      
      // Extract title (usually the first substantial line)
      if (!analysis.title && line.length > 10 && line.length < 100) {
        analysis.title = line;
      }
      
      // Classify content based on current section or content analysis
      if (this.looksLikeIngredient(line)) {
        analysis.ingredients.push(line);
      } else if (this.looksLikeInstruction(line)) {
        analysis.instructions.push(line);
      }
    }
    
    return analysis;
  }

  looksLikeIngredient(line) {
    // Check for common ingredient patterns
    const ingredientPatterns = [
      /^\d+[\s\w]*(?:cup|tsp|tbsp|lb|oz|g|kg|ml|l|piece|clove)/i,
      /^\d+\s*[\/\d]*\s*(?:cup|tsp|tbsp|lb|oz|g|kg|ml|l)/i,
      /(?:cup|tsp|tbsp|lb|oz|g|kg|ml|l)\s+(?:of\s+)?[\w\s]+/i
    ];
    
    return ingredientPatterns.some(pattern => pattern.test(line.trim()));
  }

  looksLikeInstruction(line) {
    // Check for instruction patterns
    const instructionPatterns = [
      /^\d+[\.\)]\s/,  // Numbered steps
      /^(?:first|next|then|finally|meanwhile|after)/i,
      /(?:heat|cook|bake|mix|stir|add|combine|place|put)/i
    ];
    
    return line.length > 20 && instructionPatterns.some(pattern => pattern.test(line.trim()));
  }
}

// Singleton instance
const ocrService = new OCRService();

module.exports = ocrService; 