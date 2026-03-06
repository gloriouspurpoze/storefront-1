import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BannerCarousel } from '../components/BannerCarousel';

export function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Fixer</Text>
        <Text style={styles.subtitle}>Home</Text>
      </View>
      <BannerCarousel />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offers & Promotions</Text>
        <Text style={styles.sectionDesc}>
          Banners for offers are managed in the admin under Slider Management → Placement: Offers & Promotions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 22,
  },
});
