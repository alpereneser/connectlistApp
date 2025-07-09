import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fontConfig } from '../../styles/global';
import { ArrowRight, ArrowLeft } from 'phosphor-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image?: any;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'ConnectList\'e Hoş Geldiniz',
    subtitle: 'Sosyal Listeler ile Keşfedin',
    description: 'Film, dizi, kitap, oyun ve daha fazlasını arkadaşlarınızla paylaşın. Kendi listelerinizi oluşturun ve başkalarının önerilerini keşfedin.',
  },
  {
    id: 2,
    title: 'Listeler Oluşturun',
    subtitle: 'Favori İçeriklerinizi Düzenleyin',
    description: 'İzlediğiniz filmleri, okuduğunuz kitapları, oynadığınız oyunları kategorilere ayırın. Kendi kişisel koleksiyonunuzu oluşturun.',
  },
  {
    id: 3,
    title: 'Arkadaşlarınızla Paylaşın',
    subtitle: 'Sosyal Deneyimi Yaşayın',
    description: 'Arkadaşlarınızın listelerini görün, yorum yapın ve öneriler alın. Ortak zevklerinizi keşfedin ve yeni içerikler bulun.',
  },
  {
    id: 4,
    title: 'Keşfetmeye Başlayın',
    subtitle: 'Yeni Dünyalara Kapı Açın',
    description: 'Popüler içerikleri keşfedin, trend olan listeleri görün ve kendi zevkinize uygun yeni şeyler bulun. Hemen başlayın!',
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const nextSlide = async () => {
    if (currentSlide < slides.length - 1) {
      const nextIndex = currentSlide + 1;
      setCurrentSlide(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      // Son slide'daysa auth sayfasına git
      await AsyncStorage.setItem('hasLaunched', 'true');
      router.replace('/auth/login');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      const prevIndex = currentSlide - 1;
      setCurrentSlide(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * width,
        animated: true,
      });
    }
  };

  const skipOnboarding = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    router.replace('/auth/login');
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/connectlist-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={styles.skipText}>Geç</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.content}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Indicators */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentSlide ? styles.activeIndicator : styles.inactiveIndicator,
            ]}
          />
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={prevSlide}
          style={[
            styles.navButton,
            styles.prevButton,
            currentSlide === 0 && styles.disabledButton,
          ]}
          disabled={currentSlide === 0}
        >
          <ArrowLeft size={24} color={currentSlide === 0 ? '#9CA3AF' : '#FF6B35'} />
        </TouchableOpacity>

        <TouchableOpacity onPress={nextSlide} style={[styles.navButton, styles.nextButton]}>
          {currentSlide === slides.length - 1 ? (
            <Text style={styles.startText}>Başla</Text>
          ) : (
            <ArrowRight size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Inter',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FF6B35',
    width: 24,
  },
  inactiveIndicator: {
    backgroundColor: '#E5E7EB',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
  },
  disabledButton: {
    backgroundColor: '#F9FAFB',
  },
  startText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
});