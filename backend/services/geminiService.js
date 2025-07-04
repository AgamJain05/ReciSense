const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
        throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in your .env file');
      }

      console.log('🔄 Initializing Gemini AI...');
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isInitialized = true;
      console.log('✅ Gemini AI initialized successfully with model: gemini-1.5-flash');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error);
      throw new Error(`Gemini initialization failed: ${error.message}`);
    }
  }

  async analyzeRecipeFeasibility(recipeText, pantryIngredients) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 Analyzing recipe feasibility with Gemini AI...');

      const prompt = this.buildAnalysisPrompt(recipeText, pantryIngredients);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Parse the structured response
      const analysis = this.parseGeminiResponse(analysisText);
      
      console.log('✅ Gemini analysis completed');
      console.log(`📊 Feasibility Score: ${analysis.feasibilityScore}%`);
      
      return analysis;
    } catch (error) {
      console.error('❌ Gemini analysis failed:', error);
      throw new Error(`Recipe analysis failed: ${error.message}`);
    }
  }

  buildAnalysisPrompt(recipeText, pantryIngredients) {
    const pantryList = pantryIngredients.map(ing => `- ${ing.name} (${ing.quantity} ${ing.unit})`).join('\n');
    
    return `
As a culinary expert AI, analyze this recipe against the user's available pantry ingredients and provide a detailed feasibility assessment.

**RECIPE TEXT:**
${recipeText}

**USER'S PANTRY:**
${pantryList || 'No ingredients available'}

**ANALYSIS REQUIRED:**
Please provide a structured analysis in the following JSON format:

{
  "feasibilityScore": [0-100 percentage],
  "recipeTitle": "[extracted recipe title]",
  "extractedIngredients": [
    {
      "name": "[ingredient name]",
      "quantity": "[amount needed]",
      "unit": "[measurement unit]",
      "essential": [true/false]
    }
  ],
  "requiredTools": [
    "[tool/utensil needed]"
  ],
  "availableIngredients": [
    "[ingredients user has]"
  ],
  "missingIngredients": [
    {
      "name": "[missing ingredient]",
      "quantity": "[amount needed]",
      "unit": "[measurement unit]",
      "substitutes": ["[possible substitute 1]", "[possible substitute 2]"],
      "essential": [true/false]
    }
  ],
  "suggestions": {
    "substitutions": [
      {
        "original": "[original ingredient]",
        "substitute": "[replacement ingredient]",
        "ratio": "[conversion ratio]",
        "notes": "[additional notes]"
      }
    ],
    "modifications": [
      "[suggested recipe modifications]"
    ],
    "tips": [
      "[cooking tips and advice]"
    ]
  },
  "nutritionalInfo": {
    "estimatedCalories": "[per serving]",
    "difficulty": "[easy/medium/hard]",
    "cookingTime": "[estimated time]",
    "servings": "[number of servings]"
  },
  "warningsAndNotes": [
    "[important warnings or notes]"
  ]
}

**SCORING CRITERIA:**
- 100%: All ingredients available
- 80-99%: Most ingredients available, minor substitutions needed
- 60-79%: Some ingredients missing but good substitutes available
- 40-59%: Several key ingredients missing, significant modifications needed
- 20-39%: Most ingredients missing, major changes required
- 0-19%: Recipe not feasible with current pantry

**IMPORTANT GUIDELINES:**
1. Be practical and realistic in your assessment
2. Consider ingredient essentiality (salt, pepper, oil are often assumed available)
3. Suggest creative but feasible substitutions
4. Factor in cooking difficulty and required tools
5. Provide helpful cooking tips and modifications
6. Ensure all JSON is properly formatted and valid
7. If recipe text is unclear, make reasonable assumptions but note them
8. Focus on common cooking scenarios and home kitchens

Respond ONLY with the valid JSON structure above, no additional text or formatting.
`;
  }

  parseGeminiResponse(responseText) {
    try {
      // Clean the response to extract JSON
      let cleanedResponse = responseText.trim();
      
      // Remove any markdown formatting
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*```/gm, '')
        .replace(/```\s*$/gm, '');
      
      // Find JSON start and end
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON found in response');
      }
      
      const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
      const parsedResponse = JSON.parse(jsonString);
      
      // Validate required fields and set defaults
      const analysis = {
        feasibilityScore: this.validateScore(parsedResponse.feasibilityScore),
        recipeTitle: parsedResponse.recipeTitle || 'Unknown Recipe',
        extractedIngredients: Array.isArray(parsedResponse.extractedIngredients) 
          ? parsedResponse.extractedIngredients : [],
        requiredTools: Array.isArray(parsedResponse.requiredTools) 
          ? parsedResponse.requiredTools : [],
        availableIngredients: Array.isArray(parsedResponse.availableIngredients) 
          ? parsedResponse.availableIngredients : [],
        missingIngredients: Array.isArray(parsedResponse.missingIngredients) 
          ? parsedResponse.missingIngredients : [],
        suggestions: {
          substitutions: Array.isArray(parsedResponse.suggestions?.substitutions) 
            ? parsedResponse.suggestions.substitutions : [],
          modifications: Array.isArray(parsedResponse.suggestions?.modifications) 
            ? parsedResponse.suggestions.modifications : [],
          tips: Array.isArray(parsedResponse.suggestions?.tips) 
            ? parsedResponse.suggestions.tips : []
        },
        nutritionalInfo: {
          estimatedCalories: parsedResponse.nutritionalInfo?.estimatedCalories || 'Unknown',
          difficulty: parsedResponse.nutritionalInfo?.difficulty || 'medium',
          cookingTime: parsedResponse.nutritionalInfo?.cookingTime || 'Unknown',
          servings: parsedResponse.nutritionalInfo?.servings || 'Unknown'
        },
        warningsAndNotes: Array.isArray(parsedResponse.warningsAndNotes) 
          ? parsedResponse.warningsAndNotes : [],
        timestamp: new Date().toISOString()
      };
      
      return analysis;
    } catch (error) {
      console.error('❌ Failed to parse Gemini response:', error);
      console.log('📝 Raw response:', responseText);
      
      // Return fallback analysis
      return this.createFallbackAnalysis(responseText);
    }
  }

  validateScore(score) {
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return 50; // Default fallback score
    }
    return numScore;
  }

  createFallbackAnalysis(responseText) {
    return {
      feasibilityScore: 50,
      recipeTitle: 'Recipe Analysis',
      extractedIngredients: [],
      requiredTools: [],
      availableIngredients: [],
      missingIngredients: [],
      suggestions: {
        substitutions: [],
        modifications: ['Unable to parse detailed analysis. Please try again.'],
        tips: ['Check your recipe image quality and try again.']
      },
      nutritionalInfo: {
        estimatedCalories: 'Unknown',
        difficulty: 'medium',
        cookingTime: 'Unknown',
        servings: 'Unknown'
      },
      warningsAndNotes: [
        'Analysis parsing failed. Raw response available for debugging.',
        'Please check your internet connection and API key configuration.'
      ],
      rawResponse: responseText,
      timestamp: new Date().toISOString()
    };
  }

  async extractIngredientsOnly(recipeText) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const prompt = `
Extract only the ingredients from this recipe text and format them as a simple JSON array:

RECIPE TEXT:
${recipeText}

Return ONLY a JSON array in this format:
[
  {
    "name": "[ingredient name]",
    "quantity": "[amount]",
    "unit": "[unit of measurement]"
  }
]

Example response:
[
  {"name": "flour", "quantity": "2", "unit": "cups"},
  {"name": "eggs", "quantity": "3", "unit": "piece"},
  {"name": "salt", "quantity": "1", "unit": "tsp"}
]

Respond with only the JSON array, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const ingredientsText = response.text();
      
      // Parse the ingredients JSON
      const cleanedResponse = ingredientsText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('❌ Failed to extract ingredients:', error);
      return [];
    }
  }
}

// Singleton instance
const geminiService = new GeminiService();

module.exports = geminiService; 