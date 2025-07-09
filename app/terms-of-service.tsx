import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: January 9, 2025</Text>

        <Text style={styles.paragraph}>
          Welcome to ConnectList! These Terms of Service ("Terms") govern your use of our mobile application. By using ConnectList, you agree to these Terms.
        </Text>

        <Text style={styles.paragraph}>
          ConnectList is developed with support from Tech Istanbul Incubation Center and the Technology Transfer Office.
        </Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using ConnectList, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the service.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          ConnectList is a social platform that allows users to:
          {'\n'}• Create and share lists of movies, TV shows, books, games, and places
          {'\n'}• Discover content through personalized recommendations
          {'\n'}• Connect with other users who share similar interests
          {'\n'}• Message and interact with other users
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          • You must be at least 13 years old to use ConnectList
          {'\n'}• You are responsible for maintaining the confidentiality of your account
          {'\n'}• You are responsible for all activities under your account
          {'\n'}• You must provide accurate and complete information
          {'\n'}• One person or legal entity may not maintain more than one account
        </Text>

        <Text style={styles.sectionTitle}>4. User Content</Text>
        <Text style={styles.paragraph}>
          • You retain ownership of content you post
          {'\n'}• You grant us a license to use, display, and distribute your content
          {'\n'}• You are responsible for your content's legality and appropriateness
          {'\n'}• We may remove content that violates these Terms
          {'\n'}• You may not post content that is illegal, harmful, or infringes on others' rights
        </Text>

        <Text style={styles.sectionTitle}>5. Prohibited Uses</Text>
        <Text style={styles.paragraph}>
          You may not:
          {'\n'}• Use the service for illegal purposes
          {'\n'}• Harass, abuse, or harm other users
          {'\n'}• Impersonate others or provide false information
          {'\n'}• Interfere with or disrupt the service
          {'\n'}• Attempt to gain unauthorized access
          {'\n'}• Scrape or copy content without permission
          {'\n'}• Use the service for commercial solicitation
        </Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The service and its original content (excluding user content) are and will remain the exclusive property of ConnectList. The service is protected by copyright, trademark, and other laws.
        </Text>

        <Text style={styles.sectionTitle}>7. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          ConnectList integrates with third-party services (TMDB, RAWG, Google Books, Yandex Places). Your use of these services is subject to their respective terms and conditions.
        </Text>

        <Text style={styles.sectionTitle}>8. Disclaimer</Text>
        <Text style={styles.paragraph}>
          The service is provided "as is" without warranties of any kind. We do not guarantee the service will be uninterrupted, secure, or error-free.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          ConnectList shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
        </Text>

        <Text style={styles.sectionTitle}>10. Termination</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon termination, your right to use the service will cease immediately.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. If we make material changes, we will notify you through the service or via email.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed by the laws of Turkey, without regard to its conflict of law provisions.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact Information</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at:
          {'\n'}Email: support@connectlist.me
          {'\n'}
          {'\n'}ConnectList
          {'\n'}Tech Istanbul Incubation Center
          {'\n'}Technology Transfer Office
        </Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#6B7280',
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});