import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import type { SliderItem } from '../api/sliders';
import { getActiveSliders } from '../api/sliders';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 200;
const CARD_MARGIN = 16;

export function BannerCarousel() {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await getActiveSliders('mobile_app_home');
      const fallback = list.length ? list : await getActiveSliders('home_page_hero');
      setSliders(fallback.length ? fallback : list);
    } catch (e) {
      __DEV__ && console.warn('BannerCarousel load error', e);
      setSliders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);


  const openLink = (item: SliderItem) => {
    const url = item.button_url || '';
    if (url && (url.startsWith('http') || url.startsWith('/'))) {
      const toOpen = url.startsWith('/') ? `${url}` : url;
      Linking.openURL(toOpen).catch(() => {});
    }
  };

  const renderItem = ({ item }: { item: SliderItem }) => {
    const imageUri = item.image_url_mobile || item.image_url;
    if (!imageUri) return null;
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => item.button_url && openLink(item)}
        style={styles.card}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
        />
        {(item.title || item.subtitle) && (
          <View style={styles.overlay}>
            {item.title ? (
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
            ) : null}
            {item.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
            {item.button_text ? (
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{item.button_text}</Text>
              </View>
            ) : null}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && sliders.length === 0) {
    return (
      <View style={[styles.wrapper, styles.centered]}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (sliders.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={sliders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH - CARD_MARGIN * 2 + 12}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
    minHeight: BANNER_HEIGHT,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: CARD_MARGIN,
  },
  card: {
    width: SCREEN_WIDTH - CARD_MARGIN * 2,
    height: BANNER_HEIGHT,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  cta: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
