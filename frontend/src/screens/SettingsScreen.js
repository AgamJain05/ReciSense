import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Switch,
  List,
  Button,
  Divider,
  Dialog,
  Portal,
  Text,
  Surface,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { theme } from '../theme/theme';
import useAppStore from '../store/useAppStore';

const SettingsScreen = ({ navigation }) => {
  const { 
    pantry, 
    settings, 
    updateSettings, 
    clearPantry,
    clearRecipeAnalysis 
  } = useAppStore();
  
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearType, setClearType] = useState(null);

  const handleClearPantry = () => {
    setClearType('pantry');
    setShowClearDialog(true);
  };

  const handleClearAnalysisHistory = () => {
    setClearType('analysis');
    setShowClearDialog(true);
  };

  const confirmClear = () => {
    if (clearType === 'pantry') {
      clearPantry();
    } else if (clearType === 'analysis') {
      clearRecipeAnalysis();
    }
    setShowClearDialog(false);
    setClearType(null);
  };

  const clearAllAppData = async () => {
    Alert.alert(
      'Clear All App Data',
      'This will reset everything including pantry and settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              console.log('🗑️ AsyncStorage cleared');
              Alert.alert('Success', 'App data cleared. Please restart the app.');
            } catch (error) {
              console.error('Failed to clear AsyncStorage:', error);
            }
          },
        },
      ]
    );
  };

  const renderAppSettings = () => (
    <Animatable.View animation="fadeInUp" delay={100}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>App Preferences</Title>
          
          <List.Item
            title="Push Notifications"
            description="Get notified about expiring ingredients"
            left={props => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSettings({ notifications: value })}
              />
            )}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Dark Mode"
            description="Switch between light and dark themes"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={settings.darkMode}
                onValueChange={(value) => updateSettings({ darkMode: value })}
              />
            )}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Auto-save Photos"
            description="Save analyzed recipe photos to gallery"
            left={props => <List.Icon {...props} icon="content-save" />}
            right={() => (
              <Switch
                value={settings.autoSavePhotos}
                onValueChange={(value) => updateSettings({ autoSavePhotos: value })}
              />
            )}
          />
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  const renderAnalysisSettings = () => (
    <Animatable.View animation="fadeInUp" delay={200}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Analysis Settings</Title>
          
          <List.Item
            title="High Quality OCR"
            description="Better text extraction, slower processing"
            left={props => <List.Icon {...props} icon="eye" />}
            right={() => (
              <Switch
                value={settings.highQualityOCR}
                onValueChange={(value) => updateSettings({ highQualityOCR: value })}
              />
            )}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Detailed Analysis"
            description="Include nutritional info and cooking tips"
            left={props => <List.Icon {...props} icon="chart-line" />}
            right={() => (
              <Switch
                value={settings.detailedAnalysis}
                onValueChange={(value) => updateSettings({ detailedAnalysis: value })}
              />
            )}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Smart Substitutions"
            description="AI suggests ingredient alternatives"
            left={props => <List.Icon {...props} icon="swap-horizontal" />}
            right={() => (
              <Switch
                value={settings.smartSubstitutions}
                onValueChange={(value) => updateSettings({ smartSubstitutions: value })}
              />
            )}
          />
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  const renderDataManagement = () => (
    <Animatable.View animation="fadeInUp" delay={300}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Data Management</Title>
          
          <Surface style={styles.dataInfo}>
            <View style={styles.dataRow}>
              <Ionicons name="basket" size={18} color={theme.colors.primary} />
              <Text style={styles.dataLabel}>Pantry Items</Text>
              <Text style={styles.dataValue}>{pantry.totalItems}</Text>
            </View>
            
            <View style={styles.dataRow}>
              <Ionicons name="time" size={18} color={theme.colors.primary} />
              <Text style={styles.dataLabel}>Last Updated</Text>
              <Text style={styles.dataValue}>
                {pantry.lastUpdated 
                  ? new Date(pantry.lastUpdated).toLocaleDateString()
                  : 'Never'
                }
              </Text>
            </View>
          </Surface>
          
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={handleClearPantry}
              style={styles.dangerButton}
              icon="delete"
            >
              Clear Pantry
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleClearAnalysisHistory}
              style={styles.dangerButton}
              icon="history"
            >
              Clear History
            </Button>

            <Button
              mode="outlined"
              onPress={clearAllAppData}
              style={[styles.dangerButton, { backgroundColor: '#ff4444' }]}
              icon="nuke"
            >
              🐛 Clear All Data
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  const renderAbout = () => (
    <Animatable.View animation="fadeInUp" delay={400}>
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>About</Title>
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Privacy Policy"
            description="How we handle your data"
            left={props => <List.Icon {...props} icon="shield-check" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert(
                'Privacy Policy',
                'Your data is stored locally on your device. Recipe images are temporarily uploaded for analysis and immediately deleted. No personal data is stored on our servers.'
              );
            }}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Help & Support"
            description="Get help using the app"
            left={props => <List.Icon {...props} icon="help-circle" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert(
                'Help & Support',
                'For support, please contact us at support@recisense.com or visit our website for tutorials and FAQs.'
              );
            }}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Rate App"
            description="Help us improve with your feedback"
            left={props => <List.Icon {...props} icon="star" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              Alert.alert(
                'Rate App',
                'Thank you for using ReciSense! Your feedback helps us improve the app for everyone.'
              );
            }}
          />
        </Card.Content>
      </Card>
    </Animatable.View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animatable.View animation="fadeInDown">
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.header}>
              <Ionicons name="settings" size={28} color={theme.colors.primary} />
              <View style={styles.headerText}>
                <Title>Settings</Title>
                <Paragraph>Customize your app experience</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Animatable.View>

      {renderAppSettings()}
      {renderAnalysisSettings()}
      {renderDataManagement()}
      {renderAbout()}

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={showClearDialog} onDismiss={() => setShowClearDialog(false)}>
          <Dialog.Title>Confirm Action</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {clearType === 'pantry' 
                ? 'Are you sure you want to clear all pantry items? This action cannot be undone.'
                : 'Are you sure you want to clear analysis history? This action cannot be undone.'
              }
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClearDialog(false)}>Cancel</Button>
            <Button onPress={confirmClear} mode="contained">
              Clear
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
    padding: theme.spacing.sm,
  },
  headerCard: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  sectionCard: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 16,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.primary,
    fontSize: 18,
  },
  divider: {
    marginVertical: theme.spacing.xs,
  },
  dataInfo: {
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    elevation: 1,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  dataLabel: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
  },
  dataValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  dangerButton: {
    flex: 1,
    borderColor: theme.colors.error,
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
});

export default SettingsScreen; 