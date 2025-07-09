import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: January 9, 2025</Text>

        <Text style={styles.paragraph}>
          ConnectList ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text style={styles.paragraph}>
          We are proud to be part of Tech Istanbul Incubation Center and accepted to the Technology Transfer Office, demonstrating our commitment to innovation and responsible technology development.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly to us, such as:
          {'\n'}• Account information (name, email, username)
          {'\n'}• Profile information (bio, avatar)
          {'\n'}• Content you create (lists, reviews, comments)
          {'\n'}• Messages between users
          {'\n'}• Device information and usage analytics
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to:
          {'\n'}• Provide and maintain our services
          {'\n'}• Personalize your experience
          {'\n'}• Send you notifications about your account
          {'\n'}• Improve our services
          {'\n'}• Comply with legal obligations
        </Text>

        <Text style={styles.sectionTitle}>3. Information Sharing</Text>
        <Text style={styles.paragraph}>
          We do not sell, trade, or rent your personal information. We may share your information only:
          {'\n'}• With your consent
          {'\n'}• To comply with legal obligations
          {'\n'}• To protect our rights and prevent fraud
          {'\n'}• With service providers who assist our operations
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
        </Text>

        <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Our app integrates with third-party services (TMDB, RAWG, Google Books, Yandex Places) to provide content. These services have their own privacy policies, and we encourage you to review them.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:
          {'\n'}• Access your personal information
          {'\n'}• Correct inaccurate information
          {'\n'}• Request deletion of your information
          {'\n'}• Opt-out of certain communications
          {'\n'}• Data portability
        </Text>

        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy, please contact us at:
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