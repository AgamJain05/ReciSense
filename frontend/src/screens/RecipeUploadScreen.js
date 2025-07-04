import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  ProgressBar,
  IconButton,
  Surface,
  Chip,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { showMessage } from 'react-native-flash-message';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

import useAppStore from '../store/useAppStore';
import { theme } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const RecipeUploadScreen = ({ navigation }) => {
  const {
    pantry,
    recipeAnalysis,
    analyzeRecipe,
    clearRecipeAnalysis,
  } = useAppStore();

  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const scrollViewRef = useRef(null);

  React.useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera roll permissions to select recipe images for analysis.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        clearRecipeAnalysis();
        
        // Smooth scroll to show selected image
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 300, animated: true });
        }, 300);
        
        showMessage({
          message: '✅ Image selected successfully',
          type: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showMessage({
        message: '❌ Failed to select image',
        type: 'danger',
      });
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'We need camera access to take recipe photos for analysis.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        clearRecipeAnalysis();
        
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 300, animated: true });
        }, 300);
        
        showMessage({
          message: '📸 Photo captured successfully',
          type: 'success',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showMessage({
        message: '❌ Failed to take photo',
        type: 'danger',
      });
    }
  };

  const handleAnalyzeRecipe = async () => {
    if (!selectedImage) {
      showMessage({
        message: '⚠️ Please select an image first',
        type: 'warning',
      });
      return;
    }

    if (pantry.totalItems === 0) {
      Alert.alert(
        'Empty Pantry',
        'Your pantry is empty. Add some ingredients first to get a meaningful recipe analysis.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Pantry',
            onPress: () => navigation.navigate('Pantry'),
            style: 'default',
          },
        ]
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 0.9) {
          clearInterval(progressInterval);
          return 0.9;
        }
        return prev + 0.1;
      });
    }, 500);

    try {
      const result = await analyzeRecipe(selectedImage);
      
      clearInterval(progressInterval);
      setAnalysisProgress(1);
      
      if (result.success) {
        showMessage({
          message: '🎉 Recipe analyzed successfully!',
          type: 'success',
          duration: 3000,
        });

        setTimeout(() => {
          navigation.navigate('Results', {
            analysisData: result.data,
            recipeImage: selectedImage,
          });
        }, 1000);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      clearInterval(progressInterval);
      
      let errorMessage = 'Failed to analyze recipe. Please try again.';
      if (error.message.includes('network')) {
        errorMessage = '📡 Network error. Please check your connection and try again.';
      } else if (error.message.includes('text')) {
        errorMessage = '📝 Could not extract text from image. Try a clearer photo with visible text.';
      }

      showMessage({
        message: errorMessage,
        type: 'danger',
        duration: 4000,
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    clearRecipeAnalysis();
    showMessage({
      message: 'Image removed',
      type: 'info',
      duration: 1500,
    });
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View style={styles.headerContent}>
        <Animatable.View animation="fadeInDown" duration={800}>
          <View style={styles.headerIcon}>
            <Ionicons name="restaurant" size={32} color="white" />
          </View>
          <Title style={styles.headerTitle}>Recipe Analyzer</Title>
          <Paragraph style={styles.headerSubtitle}>
            Discover what you can cook with your ingredients
          </Paragraph>
        </Animatable.View>
      </View>
    </LinearGradient>
  );

  const renderPantryInfo = () => (
    <Animatable.View animation="fadeInUp" duration={600} delay={200}>
      <Card style={styles.pantryCard}>
        <Card.Content style={styles.pantryContent}>
          <View style={styles.pantryHeader}>
            <View style={styles.pantryIconContainer}>
              <Ionicons name="basket" size={24} color="#667eea" />
            </View>
            <View style={styles.pantryTextContainer}>
              <Title style={styles.pantryTitle}>Your Pantry</Title>
              <Paragraph style={styles.pantrySubtitle}>Ready for analysis</Paragraph>
            </View>
            <Chip 
              style={styles.pantryChip}
              textStyle={styles.pantryChipText}
            >
              {pantry.totalItems} items
            </Chip>
          </View>
          
          {pantry.totalItems === 0 && (
            <View style={styles.emptyPantryContainer}>
              <Ionicons name="add-circle-outline" size={48} color="#667eea" />
              <Text style={styles.emptyPantryText}>Add ingredients to get started</Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Pantry')}
                style={styles.addIngredientsButton}
                icon="plus"
                contentStyle={styles.buttonContent}
              >
                Add Ingredients
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  const renderImageSelection = () => (
    <Animatable.View animation="fadeInUp" duration={600} delay={400}>
      <Card style={styles.selectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Upload Recipe Image</Title>
          <Paragraph style={styles.sectionSubtitle}>
            Take a photo or choose from your gallery
          </Paragraph>
          
          <View style={styles.imageOptionsGrid}>
            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={takePhoto}
              disabled={isAnalyzing}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.imageOptionGradient}
              >
                <Ionicons name="camera" size={32} color="white" />
                <Text style={styles.imageOptionText}>Take Photo</Text>
                <Text style={styles.imageOptionSubtext}>Camera</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={pickImageFromLibrary}
              disabled={isAnalyzing}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.imageOptionGradient}
              >
                <Ionicons name="images" size={32} color="white" />
                <Text style={styles.imageOptionText}>Gallery</Text>
                <Text style={styles.imageOptionSubtext}>Choose photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  const renderSelectedImage = () => (
    <Animatable.View animation="fadeIn" duration={500}>
      <Card style={styles.selectedImageCard}>
        <Card.Content>
          <View style={styles.imageHeader}>
            <Title style={styles.sectionTitle}>Selected Recipe</Title>
            <IconButton
              icon="close"
              size={24}
              onPress={removeImage}
              disabled={isAnalyzing}
              style={styles.closeButton}
            />
          </View>
          
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <View style={styles.imageOverlay}>
              <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
            </View>
          </View>
          
          <View style={styles.imageActions}>
            <Button
              mode="outlined"
              onPress={pickImageFromLibrary}
              style={styles.retakeButton}
              disabled={isAnalyzing}
              icon="refresh"
              contentStyle={styles.buttonContent}
            >
              Change
            </Button>
            
            <Button
              mode="contained"
              onPress={handleAnalyzeRecipe}
              style={styles.analyzeButton}
              disabled={isAnalyzing}
              loading={isAnalyzing}
              icon="brain"
              contentStyle={styles.buttonContent}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Recipe'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  const renderProgressIndicator = () => {
    if (!isAnalyzing) return null;

    return (
      <Animatable.View animation="slideInUp" duration={500}>
        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <View style={styles.progressIconContainer}>
                <Ionicons name="brain" size={24} color="white" />
              </View>
              <View>
                <Title style={styles.progressTitle}>AI Analysis in Progress</Title>
                <Paragraph style={styles.progressSubtitle}>
                  {Math.round(analysisProgress * 100)}% Complete
                </Paragraph>
              </View>
            </View>
            
            <ProgressBar
              progress={analysisProgress}
              color="white"
              style={styles.progressBar}
            />
            
            <View style={styles.progressSteps}>
              <View style={[styles.progressStep, analysisProgress > 0.3 && styles.progressStepActive]}>
                <Ionicons name="document-text" size={16} color={analysisProgress > 0.3 ? "#4ade80" : "#64748b"} />
                <Text style={[styles.progressStepText, analysisProgress > 0.3 && styles.progressStepTextActive]}>
                  Extracting text
                </Text>
              </View>
              <View style={[styles.progressStep, analysisProgress > 0.6 && styles.progressStepActive]}>
                <Ionicons name="analytics" size={16} color={analysisProgress > 0.6 ? "#4ade80" : "#64748b"} />
                <Text style={[styles.progressStepText, analysisProgress > 0.6 && styles.progressStepTextActive]}>
                  AI processing
                </Text>
              </View>
              <View style={[styles.progressStep, analysisProgress > 0.9 && styles.progressStepActive]}>
                <Ionicons name="calculator" size={16} color={analysisProgress > 0.9 ? "#4ade80" : "#64748b"} />
                <Text style={[styles.progressStepText, analysisProgress > 0.9 && styles.progressStepTextActive]}>
                  Calculating results
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Animatable.View>
    );
  };

  const renderTips = () => (
    <Animatable.View animation="fadeInUp" duration={600} delay={600}>
      <Card style={styles.tipsCard}>
        <Card.Content>
          <View style={styles.tipsHeader}>
            <Ionicons name="lightbulb" size={24} color="#f59e0b" />
            <Title style={styles.tipsTitle}>Tips for Best Results</Title>
          </View>
          
          <View style={styles.tipsList}>
            {[
              'Ensure recipe text is clear and readable',
              'Include the complete ingredients list',
              'Use good lighting for better text extraction',
              'Avoid blurry or tilted images',
              'Crop to focus on the recipe content'
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipBullet}>
                  <Text style={styles.tipBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {renderHeader()}
        {renderPantryInfo()}
        {selectedImage ? renderSelectedImage() : renderImageSelection()}
        {renderProgressIndicator()}
        {renderTips()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 32,
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Pantry Info Styles
  pantryCard: {
    margin: 16,
    marginTop: -16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pantryContent: {
    padding: 20,
  },
  pantryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pantryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pantryTextContainer: {
    flex: 1,
  },
  pantryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  pantrySubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  pantryChip: {
    backgroundColor: '#667eea',
  },
  pantryChipText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyPantryContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyPantryText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  addIngredientsButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    minWidth: 160,
  },
  
  // Image Selection Styles
  selectionCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  imageOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  imageOptionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageOptionGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  imageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 12,
  },
  imageOptionSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  
  // Selected Image Styles
  selectedImageCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: '#f1f5f9',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  selectedImage: {
    width: '100%',
    height: Math.min(width * 0.8, 400),
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    borderColor: '#667eea',
    borderRadius: 12,
  },
  analyzeButton: {
    flex: 2,
    backgroundColor: '#667eea',
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
  },
  
  // Progress Styles
  progressCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#667eea',
    elevation: 6,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  progressSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressStepActive: {
    // Active state styling handled by color changes
  },
  progressStepText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  progressStepTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Tips Styles
  tipsCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
  },
  tipsList: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipBulletText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  
  bottomSpacing: {
    height: 32,
  },
});

export default RecipeUploadScreen; 