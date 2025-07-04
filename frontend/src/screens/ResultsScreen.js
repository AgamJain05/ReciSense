import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  List,
  Surface,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { theme } from '../theme/theme';
import useAppStore from '../store/useAppStore';
import { ScoreVisualization } from '../components';

const { width } = Dimensions.get('window');

const ResultsScreen = ({ route, navigation }) => {
  const { analysisData, recipeImage } = route.params;
  const { clearRecipeAnalysis } = useAppStore();
  
  const [expandedSections, setExpandedSections] = useState({
    ingredients: true,
    suggestions: false,
    nutrition: false,
    tools: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderScoreCard = () => {
    const score = analysisData.feasibilityScore;
    const availableCount = analysisData.pantryAnalysis?.availableIngredients?.length || 0;
    const missingCount = analysisData.pantryAnalysis?.missingIngredients?.length || 0;
    const totalCount = analysisData.recipe?.ingredients?.length || 0;

    return (
      <Animatable.View animation="fadeInUp" delay={100}>
        <Card style={styles.scoreCard}>
          <Card.Content>
            <View style={styles.scoreHeader}>
              <View>
                <Title style={styles.scoreTitle}>Analysis Results</Title>
                <Paragraph style={styles.recipeTitle}>{analysisData.recipeTitle}</Paragraph>
              </View>
              <IconButton
                icon="close"
                size={24}
                onPress={() => navigation.goBack()}
              />
            </View>

            <ScoreVisualization
              score={score}
              availableCount={availableCount}
              missingCount={missingCount}
              totalCount={totalCount}
              size="large"
              animated={true}
              showDetails={true}
            />
          </Card.Content>
        </Card>
      </Animatable.View>
    );
  };

  const renderIngredientsSection = () => {
    const available = analysisData.pantryAnalysis?.availableIngredients || [];
    const missing = analysisData.pantryAnalysis?.missingIngredients || [];

    return (
      <Animatable.View animation="fadeInUp" delay={300}>
        <Card style={styles.sectionCard}>
          <List.Accordion
            title="Ingredients Analysis"
            description={`${available.length} available, ${missing.length} missing`}
            left={props => <List.Icon {...props} icon="format-list-bulleted" />}
            expanded={expandedSections.ingredients}
            onPress={() => toggleSection('ingredients')}
          >
            {available.length > 0 && (
              <View style={styles.ingredientSection}>
                <View style={styles.ingredientHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <Text style={styles.ingredientSectionTitle}>Available Ingredients</Text>
                </View>
                <View style={styles.chipContainer}>
                  {available.map((ingredient, index) => (
                    <Chip
                      key={index}
                      style={[styles.chip, styles.availableChip]}
                      textStyle={styles.availableChipText}
                    >
                      {ingredient}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {missing.length > 0 && (
              <View style={styles.ingredientSection}>
                <View style={styles.ingredientHeader}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                  <Text style={styles.ingredientSectionTitle}>Missing Ingredients</Text>
                </View>
                <View style={styles.chipContainer}>
                  {missing.map((ingredient, index) => (
                    <Chip
                      key={index}
                      style={[styles.chip, styles.missingChip]}
                      textStyle={styles.missingChipText}
                    >
                      {typeof ingredient === 'string' ? ingredient : ingredient.name}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </List.Accordion>
        </Card>
      </Animatable.View>
    );
  };

  const renderActions = () => (
    <Animatable.View animation="fadeInUp" delay={700}>
      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={() => {
            clearRecipeAnalysis();
            navigation.navigate('Upload');
          }}
          style={styles.actionButton}
          icon="camera"
        >
          Analyze Another
        </Button>
        
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Pantry')}
          style={styles.actionButton}
          icon="basket"
        >
          Update Pantry
        </Button>
      </View>
    </Animatable.View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {renderScoreCard()}
      {recipeImage && (
        <Animatable.View animation="fadeInUp" delay={200}>
          <Card style={styles.imageCard}>
            <Image source={{ uri: recipeImage }} style={styles.recipeImage} />
          </Card>
        </Animatable.View>
      )}
      {renderIngredientsSection()}
      {renderActions()}
      
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  scoreCard: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  scoreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  recipeTitle: {
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },

  imageCard: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  ingredientSection: {
    padding: theme.spacing.md,
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ingredientSectionTitle: {
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  chip: {
    marginBottom: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  availableChip: {
    backgroundColor: theme.colors.successLight,
  },
  availableChipText: {
    color: theme.colors.success,
  },
  missingChip: {
    backgroundColor: theme.colors.errorLight,
  },
  missingChipText: {
    color: theme.colors.error,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
});

export default ResultsScreen; 