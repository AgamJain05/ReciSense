import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Button,
  Card,
  FAB,
  IconButton,
  ProgressBar,
  Searchbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';

import useAppStore from '../store/useAppStore';
import { theme } from '../theme/theme';
import AddIngredientModal from '../components/AddIngredientModal';
import EmptyPantryView from '../components/EmptyPantryView';

const PantryScreen = ({ navigation }) => {
  const {
    pantry,
    loadPantry,
    removeIngredient,
    clearPantry,
    getPantryStats,
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, date, category, expiry

  useEffect(() => {
    console.log('🐛 PantryScreen - useEffect loadPantry called');
    console.log('🐛 PantryScreen - Current pantry state:', {
      totalItems: pantry.totalItems,
      ingredientsLength: pantry.ingredients?.length,
      loading: pantry.loading,
      error: pantry.error
    });
    loadPantry();
  }, [loadPantry]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPantry();
    setRefreshing(false);
  }, [loadPantry]);

  const handleRemoveIngredient = useCallback(async (ingredientName) => {
    Alert.alert(
      'Remove Ingredient',
      `Are you sure you want to remove "${ingredientName}" from your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeIngredient(ingredientName);
            if (result.success) {
              showMessage({
                message: 'Ingredient removed successfully',
                type: 'success',
                icon: 'success',
              });
            } else {
              showMessage({
                message: result.error || 'Failed to remove ingredient',
                type: 'danger',
                icon: 'danger',
              });
            }
          },
        },
      ]
    );
  }, [removeIngredient]);

  const handleClearPantry = useCallback(() => {
    if (pantry.totalItems === 0) return;

    Alert.alert(
      'Clear Pantry',
      'Are you sure you want to remove all ingredients from your pantry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const result = await clearPantry();
            if (result.success) {
              showMessage({
                message: 'Pantry cleared successfully',
                type: 'success',
                icon: 'success',
              });
            } else {
              showMessage({
                message: result.error || 'Failed to clear pantry',
                type: 'danger',
                icon: 'danger',
              });
            }
          },
        },
      ]
    );
  }, [clearPantry, pantry.totalItems]);

  const navigateToUpload = useCallback(() => {
    if (pantry.totalItems === 0) {
      Alert.alert(
        'Empty Pantry',
        'You need to add some ingredients to your pantry before analyzing recipes. Would you like to add ingredients now?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Add Ingredients',
            onPress: () => setShowAddModal(true),
          },
        ]
      );
      return;
    }
    navigation.navigate('Upload');
  }, [navigation, pantry.totalItems]);

  // Filter and sort ingredients
  const filteredIngredients = React.useMemo(() => {
    console.log('🐛 PantryScreen - Raw pantry.ingredients:', pantry.ingredients);
    console.log('🐛 PantryScreen - pantry.ingredients.length:', pantry.ingredients?.length);
    
    // First filter out any invalid/undefined ingredients
    let filtered = pantry.ingredients.filter(ingredient => 
      ingredient && typeof ingredient === 'object' && ingredient.name
    );
    
    console.log('🐛 PantryScreen - After filtering invalid items:', filtered.length);

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(ingredient =>
        ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🐛 PantryScreen - After search filter:', filtered.length);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ingredient => ingredient.category === selectedCategory);
      console.log('🐛 PantryScreen - After category filter:', filtered.length, 'selectedCategory:', selectedCategory);
    }

    // Sort ingredients
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        case 'date':
          const dateA = a.addedDate || a.dateAdded || new Date();
          const dateB = b.addedDate || b.dateAdded || new Date();
          return new Date(dateB) - new Date(dateA);
        case 'category':
          const categoryA = a.category || 'other';
          const categoryB = b.category || 'other';
          return categoryA.localeCompare(categoryB);
        case 'expiry':
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        default:
          return 0;
      }
    });

    console.log('🐛 PantryScreen - Final filtered ingredients:', filtered.length);
    console.log('🐛 PantryScreen - Final ingredients:', filtered.map(i => ({name: i.name, category: i.category})));
    
    return filtered;
  }, [pantry.ingredients, searchQuery, selectedCategory, sortBy]);

  // Get pantry statistics
  const pantryStats = getPantryStats();

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = ['all', ...Object.keys(pantryStats.categories)];
    return cats;
  }, [pantryStats.categories]);

  const renderIngredient = ({ item }) => (
    <TouchableOpacity 
      style={styles.ingredientCard}
      activeOpacity={0.9}
    >
      <View style={styles.ingredientContent}>
        <View style={styles.ingredientHeader}>
          <Text style={styles.ingredientName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category || 'Other'}
            </Text>
          </View>
        </View>
        
        <View style={styles.ingredientDetails}>
          {item.quantity && (
            <Text style={styles.detailText}>
              {item.quantity} {item.unit}
            </Text>
          )}
          
          {item.expiryDate && (
            <View style={styles.expiryContainer}>
              <Ionicons 
                name="calendar" 
                size={14} 
                color={theme.colors.accent} 
              />
              <Text style={styles.expiryText}>
                {new Date(item.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.ingredientActions}>
        <IconButton
          icon="pencil"
          size={18}
          onPress={() => setShowAddModal(true)}
          color={theme.colors.primary}
          style={styles.actionButton}
        />
        <IconButton
          icon="trash"
          size={18}
          onPress={() => handleRemoveIngredient(item.name)}
          color={theme.colors.error}
          style={styles.actionButton}
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => {
    if (pantry.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ProgressBar indeterminate color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your pantry...</Text>
        </View>
      );
    }

    if (searchQuery && filteredIngredients.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>No ingredients found for "{searchQuery}"</Text>
          <Button mode="outlined" onPress={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </View>
      );
    }

    return <EmptyPantryView onAddIngredient={() => setShowAddModal(true)} />;
  };

  if (pantry.error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>Failed to load pantry</Text>
        <Text style={styles.errorDescription}>{pantry.error}</Text>
        <Button mode="contained" onPress={loadPantry}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats - Compact Design */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{pantry.totalItems}</Text>
              <Text style={styles.statLabel}>ITEMS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Object.keys(pantryStats.categories).length}</Text>
              <Text style={styles.statLabel}>CATEGORIES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{pantryStats.expiringSoon}</Text>
              <Text style={styles.statLabel}>EXPIRING</Text>
            </View>
          </View>
          
          {pantry.totalItems > 0 && (
            <Button
              mode="contained"
              style={styles.analyzeButton}
              onPress={navigateToUpload}
              icon="camera"
              labelStyle={styles.analyzeButtonLabel}
              contentStyle={styles.analyzeButtonContent}
            >
              Analyze Recipe
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Search and Filters */}
      {pantry.totalItems > 0 && (
        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search ingredients..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor={theme.colors.primary}
          />
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesRow}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={`category-${category}-${index}`}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text 
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive
                  ]}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ingredients List */}
      <FlatList
        data={filteredIngredients}
        renderItem={renderIngredient}
        keyExtractor={(item, index) => item._id || `${item.name}-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {pantry.totalItems > 0 && (
          <FAB
            style={[styles.fab, styles.clearFab]}
            small
            icon="delete"
            onPress={handleClearPantry}
            color="white"
          />
        )}
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setShowAddModal(true)}
          color="white"
        />
      </View>

      {/* Add Ingredient Modal */}
      <AddIngredientModal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          showMessage({
            message: 'Ingredient added successfully',
            type: 'success',
            icon: 'success',
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  statsCard: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statsContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eaeaea',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  analyzeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 46,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  analyzeButtonContent: {
    height: '100%',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchbar: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    height: 48,
    elevation: 0,
    shadowOpacity: 0,
  },
  searchInput: {
    minHeight: 0,
    fontSize: 15,
    paddingBottom: 0,
    paddingTop: 0,
    color: '#343a40',
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryChip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#495057',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
  },
  ingredientCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f3f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  ingredientContent: {
    flex: 1,
    marginRight: 12,
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginRight: 10,
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: '#e7f5ff',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  ingredientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#495057',
    marginRight: 16,
    fontWeight: '500',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 13,
    color: '#868e96',
    marginLeft: 4,
    fontWeight: '500',
  },
  ingredientActions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: -6,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginVertical: 24,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 28,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 20,
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'column',
    gap: 12,
  },
  fab: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  clearFab: {
    backgroundColor: theme.colors.error,
  },
});

export default PantryScreen;