import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { theme } from '../theme/theme';

const { width: screenWidth } = Dimensions.get('window');

const ScoreVisualization = ({ 
  score, 
  ingredients = { available: 0, total: 0 },
  size = 'large',
  showStats = true,
  animated = true
}) => {
  const getScoreColor = (score) => {
    if (score >= 90) return theme.colors.success;
    if (score >= 70) return theme.colors.warning;
    if (score >= 50) return theme.colors.error;
    return theme.colors.onSurfaceVariant;
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  const chartData = [
    {
      name: 'Available',
      population: score,
      color: scoreColor,
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    },
    {
      name: 'Missing',
      population: 100 - score,
      color: theme.colors.surfaceVariant,
      legendFontColor: theme.colors.onSurfaceVariant,
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const getChartSize = () => {
    switch (size) {
      case 'small': return 120;
      case 'medium': return 150;
      case 'large': return 200;
      case 'progress': return 100;
      default: return 200;
    }
  };

  const styles = StyleSheet.create({
    container: {
      ...theme.components.card,
      marginVertical: theme.spacing.md,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    scoreContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    scoreCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
      shadowColor: theme.colors.primary,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    scoreText: {
      fontSize: 42,
      fontWeight: '800',
      color: theme.colors.onPrimary,
      letterSpacing: -1,
    },
    scoreLabel: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    scoreDescription: {
      fontSize: 14,
      color: theme.colors.placeholder,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: theme.spacing.md,
    },
    legendContainer: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.roundness,
      padding: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    legendTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    legendColor: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: theme.spacing.sm,
    },
    legendText: {
      fontSize: 14,
      flex: 1,
      color: theme.colors.text,
      fontWeight: '500',
    },
    legendScore: {
      fontSize: 12,
      color: theme.colors.placeholder,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  if (size === 'progress') {
    return (
      <View style={{ alignItems: 'center' }}>
        <PieChart
          data={chartData}
          width={getChartSize()}
          height={getChartSize()}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          hasLegend={false}
          center={[0, 0]}
        />
        <Text style={{
          position: 'absolute',
          top: '40%',
          fontSize: 16,
          fontWeight: 'bold',
          color: theme.colors.onSurface,
        }}>
          {score}%
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>{score}%</Text>
        <Text style={styles.scoreLabel}>{scoreLabel}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <PieChart
            data={chartData}
            width={getChartSize()}
            height={getChartSize()}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            hasLegend={false}
            center={[0, 0]}
          />
        </View>
      </View>

      {showStats && (
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Ingredients</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendColor} />
            <Text style={styles.legendText}>Available</Text>
            <Text style={styles.legendScore}>{ingredients.available}</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendColor} />
            <Text style={styles.legendText}>Missing</Text>
            <Text style={styles.legendScore}>{ingredients.total - ingredients.available}</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendColor} />
            <Text style={styles.legendText}>Total</Text>
            <Text style={styles.legendScore}>{ingredients.total}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default ScoreVisualization; 