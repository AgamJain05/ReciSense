import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  TextInput,
  Button,
  Chip,
  HelperText,
  Surface,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { theme } from '../theme/theme';
import useAppStore from '../store/useAppStore';

const INGREDIENT_CATEGORIES = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'meat', label: 'Meat' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'fruit', label: 'Fruits' },
  { value: 'grain', label: 'Grains' },
  { value: 'spice', label: 'Spices' },
  { value: 'condiment', label: 'Condiments' },
  { value: 'other', label: 'Other' }
];

const COMMON_UNITS = [
  { value: 'piece', label: 'pieces' },
  { value: 'cup', label: 'cups' },
  { value: 'tbsp', label: 'tablespoons' },
  { value: 'tsp', label: 'teaspoons' },
  { value: 'g', label: 'grams' },
  { value: 'kg', label: 'kilograms' },
  { value: 'lb', label: 'pounds' },
  { value: 'oz', label: 'ounces' },
  { value: 'l', label: 'liters' },
  { value: 'ml', label: 'milliliters' }
];

const AddIngredientModal = ({ visible, onDismiss, editingIngredient = null }) => {
  const { addIngredient, updateIngredient } = useAppStore();
  
  const [ingredient, setIngredient] = useState({
    name: '',
    category: 'other',
    quantity: '',
    unit: 'piece',
    expiryDate: null,
    notes: '',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (editingIngredient) {
      setIngredient({
        name: editingIngredient.name || '',
        category: editingIngredient.category || 'other',
        quantity: editingIngredient.quantity?.toString() || '',
        unit: editingIngredient.unit || 'piece',
        expiryDate: editingIngredient.expiryDate ? new Date(editingIngredient.expiryDate) : null,
        notes: editingIngredient.notes || '',
      });
    } else {
      resetForm();
    }
  }, [editingIngredient, visible]);

  const resetForm = () => {
    setIngredient({
      name: '',
      category: 'other',
      quantity: '',
      unit: 'piece',
      expiryDate: null,
      notes: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!ingredient.name.trim()) {
      newErrors.name = 'Ingredient name is required';
    }
    
    if (!ingredient.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(parseFloat(ingredient.quantity)) || parseFloat(ingredient.quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // DEBUG: Show current form state before validation
    console.log('🐛 Form state before save:', JSON.stringify(ingredient, null, 2));
    
    if (!validateForm()) {
      return;
    }

    try {
      const ingredientData = {
        ...ingredient,
        name: ingredient.name.trim(),
        quantity: parseFloat(ingredient.quantity),
        expiryDate: ingredient.expiryDate?.toISOString(),
      };

      // DEBUG: Log what we're actually sending
      console.log('🐛 AddIngredientModal - Sending data:', JSON.stringify(ingredientData, null, 2));

      if (editingIngredient) {
        await updateIngredient(editingIngredient.name, ingredientData);
      } else {
        await addIngredient(ingredientData);
      }

      resetForm();
      onDismiss();
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to save ingredient'
      );
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setIngredient(prev => ({ ...prev, expiryDate: selectedDate }));
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Title style={styles.sectionTitle}>Category</Title>
      <View style={styles.chipContainer}>
        {INGREDIENT_CATEGORIES.map((category) => (
          <Chip
            key={category.value}
            selected={ingredient.category === category.value}
            onPress={() => {
              console.log(`🐛 Category selected: ${category.label} -> value: ${category.value}`);
              setIngredient(prev => {
                const newState = { ...prev, category: category.value };
                console.log('🐛 New category state:', newState.category);
                return newState;
              });
            }}
            style={[
              styles.categoryChip,
              ingredient.category === category.value && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              ingredient.category === category.value && styles.selectedChipText
            ]}
          >
            {category.label}
          </Chip>
        ))}
      </View>
    </View>
  );

  const renderUnitSelector = () => (
    <View style={styles.section}>
      <Title style={styles.sectionTitle}>Unit</Title>
      <View style={styles.chipContainer}>
        {COMMON_UNITS.map((unit) => (
          <Chip
            key={unit.value}
            selected={ingredient.unit === unit.value}
            onPress={() => {
              console.log(`🐛 Unit selected: ${unit.label} -> value: ${unit.value}`);
              setIngredient(prev => {
                const newState = { ...prev, unit: unit.value };
                console.log('🐛 New unit state:', newState.unit);
                return newState;
              });
            }}
            style={[
              styles.unitChip,
              ingredient.unit === unit.value && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              ingredient.unit === unit.value && styles.selectedChipText
            ]}
          >
            {unit.label}
          </Chip>
        ))}
      </View>
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.modalCard}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.title}>
                {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
              </Title>
              <IconButton
                icon="close"
                size={20}
                onPress={onDismiss}
              />
            </View>

            <ScrollView 
              style={styles.form}
              showsVerticalScrollIndicator={false}
            >
              {/* Name Input */}
              <TextInput
                label="Ingredient Name"
                value={ingredient.name}
                onChangeText={(text) => setIngredient(prev => ({ ...prev, name: text }))}
                style={styles.input}
                error={!!errors.name}
                left={<TextInput.Icon icon="food" />}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              {/* Category Selector */}
              {renderCategorySelector()}

              {/* Quantity and Unit */}
              <View style={styles.quantityRow}>
                <TextInput
                  label="Quantity"
                  value={ingredient.quantity}
                  onChangeText={(text) => setIngredient(prev => ({ ...prev, quantity: text }))}
                  style={[styles.input, styles.quantityInput]}
                  keyboardType="numeric"
                  error={!!errors.quantity}
                  left={<TextInput.Icon icon="scale" />}
                />
              </View>
              <HelperText type="error" visible={!!errors.quantity}>
                {errors.quantity}
              </HelperText>

              {/* Unit Selector */}
              {renderUnitSelector()}

              {/* Expiry Date */}
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Expiry Date (Optional)</Title>
                <Surface style={styles.dateSection}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDatePicker(true)}
                    icon="calendar"
                    style={styles.dateButton}
                  >
                    {ingredient.expiryDate 
                      ? ingredient.expiryDate.toLocaleDateString()
                      : 'Select Date'
                    }
                  </Button>
                  {ingredient.expiryDate && (
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => setIngredient(prev => ({ ...prev, expiryDate: null }))}
                    />
                  )}
                </Surface>
              </View>

              {/* Notes */}
              <TextInput
                label="Notes (Optional)"
                value={ingredient.notes}
                onChangeText={(text) => setIngredient(prev => ({ ...prev, notes: text }))}
                style={styles.input}
                multiline
                numberOfLines={3}
                left={<TextInput.Icon icon="note-text" />}
              />

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={onDismiss}
                  style={styles.cancelButton}
                  labelStyle={[styles.buttonText, styles.secondaryButtonText]}
                  contentStyle={{paddingVertical: 8}}
                >
                  Cancel
                </Button>
                
                <Button
                  mode="contained"
                  onPress={handleSave}
                  style={styles.saveButton}
                  labelStyle={[styles.buttonText, styles.primaryButtonText]}
                  contentStyle={{paddingVertical: 8}}
                >
                  {editingIngredient ? 'Update' : 'Add'} Ingredient
                </Button>
              </View>
            </ScrollView>
          </Card.Content>
        </Card>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={ingredient.expiryDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalCard: {
    ...theme.components.modal,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  form: {
    maxHeight: '80%',
  },
  input: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryChip: {
    ...theme.components.chip,
    marginRight: 0,
    marginBottom: theme.spacing.sm,
  },
  unitChip: {
    ...theme.components.chip,
    marginRight: 0,
    marginBottom: theme.spacing.sm,
  },
  selectedChip: {
    ...theme.components.chipSelected,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.chipText,
  },
  selectedChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.chipSelectedText,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quantityInput: {
    flex: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
  },
  unitContainer: {
    flex: 3,
  },
  dateSection: {
    marginBottom: theme.spacing.lg,
  },
  dateButton: {
    ...theme.components.button.outlined,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  selectedDate: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    minHeight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  cancelButton: {
    ...theme.components.button.secondary,
    flex: 1,
  },
  saveButton: {
    ...theme.components.button.primary,
    flex: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
});

export default AddIngredientModal; 