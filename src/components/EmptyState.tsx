import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../theme/colors';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={80} color={COLORS.slate600} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.slate400,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.slate500,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default EmptyState;
