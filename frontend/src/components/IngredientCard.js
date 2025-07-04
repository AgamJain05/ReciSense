import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  IconButton,
  Surface,
  Menu,
  Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { theme } from '../theme/theme';

const IngredientCard = ({ 
  ingredient, 
  onEdit, 
  onDelete, 
  onPress,
  style,
  showMenu = true 
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const getCategoryIcon = (category) => {
    const iconMap = {
      'dairy': 'basket',
      'meat': 'nutrition',
      'vegetable': 'leaf',
      'fruit': 'apple',
      'grain': 'grain',
      'spice': 'flower',
      'condiment': 'bottle-soda',
      'other': 'help-circle',
    };
    return iconMap[category] || 'help-circle';
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'dairy': '#FFF3E0',
      'meat': '#FFEBEE',
      'vegetable': '#E8F5E8',
      'fruit': '#FFF8E1',
      'grain': '#F3E5F5',
      'spice': '#FFEBEE',
      'condiment': '#E3F2FD',
      'other': '#F5F5F5',
    };
    return colorMap[category] || '#F5F5F5';
  };

  const getCategoryDisplayName = (category) => {
    const displayMap = {
      'dairy': 'Dairy',
      'meat': 'Meat',
      'vegetable': 'Vegetables',
      'fruit': 'Fruits',
      'grain': 'Grains',
      'spice': 'Spices',
      'condiment': 'Condiments',
      'other': 'Other',
    };
    return displayMap[category] || category;
  };

  const getExpiryStatus = () => {
    if (!ingredient.expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(ingredient.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiry), color: theme.colors.error };
    } else if (daysUntilExpiry <= 3) {
      return { status: 'expiring', days: daysUntilExpiry, color: theme.colors.warning };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'soon', days: daysUntilExpiry, color: theme.colors.info };
    }
    return { status: 'fresh', days: daysUntilExpiry, color: theme.colors.success };
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Ingredient',
      `Are you sure you want to remove ${ingredient.name} from your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(ingredient.name)
        }
      ]
    );
  };

  const expiryInfo = getExpiryStatus();

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={300}
      style={[styles.container, style]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <Card style={[
          styles.card,
          expiryInfo?.status === 'expired' && styles.expiredCard,
          expiryInfo?.status === 'expiring' && styles.expiringCard
        ]}>
          <Card.Content style={styles.cardContent}>
            {/* Header with category and menu */}
            <View style={styles.header}>
              <Surface 
                style={[
                  styles.categoryBadge, 
                  { backgroundColor: getCategoryColor(ingredient.category) }
                ]}
              >
                <Ionicons 
                  name={getCategoryIcon(ingredient.category)} 
                  size={14} 
                  color={theme.colors.primary} 
                />
                <Text style={styles.categoryText}>{getCategoryDisplayName(ingredient.category)}</Text>
              </Surface>

              {showMenu && (
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      size={16}
                      onPress={() => setMenuVisible(true)}
                    />
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(false);
                      onEdit(ingredient);
                    }}
                    title="Edit"
                    leadingIcon="pencil"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(false);
                      handleDelete();
                    }}
                    title="Delete"
                    leadingIcon="delete"
                  />
                </Menu>
              )}
            </View>

            {/* Ingredient name */}
            <Title style={styles.ingredientName} numberOfLines={2}>
              {ingredient.name}
            </Title>

            {/* Quantity */}
            <View style={styles.quantityContainer}>
              <Ionicons name="scale" size={14} color={theme.colors.primary} />
              <Text style={styles.quantityText}>
                {ingredient.quantity} {ingredient.unit}
              </Text>
            </View>

            {/* Expiry information */}
            {expiryInfo && (
              <View style={styles.expiryContainer}>
                <Chip
                  style={[styles.expiryChip, { backgroundColor: expiryInfo.color + '20' }]}
                  textStyle={[styles.expiryText, { color: expiryInfo.color }]}
                  icon={() => (
                    <Ionicons 
                      name={
                        expiryInfo.status === 'expired' ? 'warning' :
                        expiryInfo.status === 'expiring' ? 'time' :
                        expiryInfo.status === 'soon' ? 'calendar' : 'checkmark-circle'
                      } 
                      size={12} 
                      color={expiryInfo.color} 
                    />
                  )}
                >
                  {expiryInfo.status === 'expired' 
                    ? `Expired ${expiryInfo.days}d ago`
                    : expiryInfo.status === 'expiring'
                    ? expiryInfo.days === 0 ? 'Expires today' : `${expiryInfo.days}d left`
                    : expiryInfo.status === 'soon'
                    ? `${expiryInfo.days} days left`
                    : 'Fresh'
                  }
                </Chip>
              </View>
            )}

            {/* Notes */}
            {ingredient.notes && ingredient.notes.trim() && (
              <View style={styles.notesContainer}>
                <Ionicons name="document-text" size={12} color={theme.colors.placeholder} />
                <Paragraph style={styles.notes} numberOfLines={2}>
                  {ingredient.notes}
                </Paragraph>
              </View>
            )}

            {/* Added date */}
            <View style={styles.footer}>
              <Text style={styles.addedDate}>
                Added: {new Date(ingredient.dateAdded).toLocaleDateString()}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  card: {
    ...theme.components.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  expiredCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    backgroundColor: theme.colors.errorLight,
  },
  expiringCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    backgroundColor: theme.colors.warningLight,
  },
  cardContent: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 0,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textTransform: 'capitalize',
    lineHeight: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  quantityText: {
    fontSize: 13,
    color: theme.colors.placeholder,
    marginLeft: 4,
    fontWeight: '500',
  },
  expiryContainer: {
    marginBottom: theme.spacing.xs,
  },
  expiryChip: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  notes: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginLeft: 4,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    marginTop: theme.spacing.xs,
  },
  addedDate: {
    fontSize: 10,
    color: theme.colors.disabled,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default IngredientCard; 