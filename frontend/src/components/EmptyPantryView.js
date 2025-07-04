import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

const EmptyPantryView = ({ onAddIngredient, style }) => {
  return (
    <Animatable.View
      animation="fadeInUp"
      duration={800}
      style={[styles.container, style]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          {/* Icon */}
          <Animatable.View
            animation="bounceIn"
            delay={300}
            style={styles.iconContainer}
          >
            <Surface style={styles.iconSurface}>
              <Ionicons 
                name="basket-outline" 
                size={65} 
                color={theme.colors.primary} 
              />
            </Surface>
          </Animatable.View>

          {/* Title */}
          <Animatable.View animation="fadeInUp" delay={500}>
            <Title style={styles.title}>Your Pantry is Empty</Title>
          </Animatable.View>

          {/* Description */}
          <Animatable.View animation="fadeInUp" delay={700}>
            <Paragraph style={styles.description}>
              Start building your digital pantry by adding ingredients you have at home. 
              This will help you get better recipe recommendations and feasibility scores.
            </Paragraph>
          </Animatable.View>

          {/* Benefits */}
          <Animatable.View animation="fadeInUp" delay={900} style={styles.benefitsContainer}>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Paragraph style={styles.benefitText}>
                Track expiry dates and reduce food waste
              </Paragraph>
            </View>
            
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Paragraph style={styles.benefitText}>
                Get accurate recipe feasibility scores
              </Paragraph>
            </View>
            
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Paragraph style={styles.benefitText}>
                Discover recipes you can cook right now
              </Paragraph>
            </View>
          </Animatable.View>

          {/* Action Button */}
          <Animatable.View animation="fadeInUp" delay={1100}>
            <Button
              mode="contained"
              onPress={onAddIngredient}
              style={styles.addButton}
              contentStyle={styles.addButtonContent}
              icon="plus"
            >
              Add Your First Ingredient
            </Button>
          </Animatable.View>

          {/* Quick Tips */}
          <Animatable.View animation="fadeInUp" delay={1300} style={styles.tipsContainer}>
            <Surface style={styles.tipsSurface}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={18} color={theme.colors.warning} />
                <Title style={styles.tipsTitle}>Quick Tips</Title>
              </View>
              
              <View style={styles.tipsList}>
                <Paragraph style={styles.tip}>
                  • Add basic staples like milk, eggs, flour first
                </Paragraph>
                <Paragraph style={styles.tip}>
                  • Include quantities and expiry dates when available
                </Paragraph>
                <Paragraph style={styles.tip}>
                  • Organize by categories for easy browsing
                </Paragraph>
              </View>
            </Surface>
          </Animatable.View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
    borderRadius: theme.roundness + 4,
  },
  content: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  iconSurface: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + '20',
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.sm,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  benefitText: {
    marginLeft: theme.spacing.xs,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
  },
  addButton: {
    ...theme.components.button.primary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 16,
  },
  addButtonContent: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  tipsContainer: {
    width: '100%',
  },
  tipsSurface: {
    backgroundColor: theme.colors.primaryLight,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  tipsList: {
    paddingLeft: theme.spacing.sm,
  },
  tip: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
    paddingLeft: theme.spacing.md,
  },
  lastTip: {
    marginBottom: 0,
  },
});

export default EmptyPantryView; 