import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const GlassBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={styles.bgBase} />
    <View style={[styles.blob, { backgroundColor: '#FFD1FF', top: -100, left: -50, width: 300, height: 300 }]} />
    <View style={[styles.blob, { backgroundColor: '#D4E4FF', top: '30%', right: -100, width: 250, height: 250 }]} />
  </View>
);

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <GlassBackground />
      <View style={styles.glassHeader}>
        <Text style={styles.headerTitleMain}>Menu ☰</Text>
      </View>

      <ScrollView contentContainerStyle={{padding: 15}}>
        
        <Text style={styles.sectionTitle}>Tools & Planners</Text>
        
        {/* Navigation to Birthday Page */}
        <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('BirthdayScreen')}>
          <Text style={styles.iconTxt}>🎂</Text>
          <View style={{flex: 1}}>
            <Text style={styles.cardTitle}>Birthday Reminder</Text>
            <Text style={styles.cardSub}>Track upcoming birthdays & set alarms</Text>
          </View>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>

        {/* You can move Profile here to save space in Bottom Tab */}
        <TouchableOpacity style={styles.menuCard} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.iconTxt}>👤</Text>
          <View style={{flex: 1}}>
            <Text style={styles.cardTitle}>My Profile</Text>
            <Text style={styles.cardSub}>Settings and Customization</Text>
          </View>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F4F5F7' },
  blob: { position: 'absolute', borderRadius: 200, opacity: 0.6 },
  glassHeader: { backgroundColor: 'rgba(255, 255, 255, 0.85)', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTitleMain: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 10, marginTop: 10 },
  
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#fff' },
  iconTxt: { fontSize: 24, marginRight: 15 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  cardSub: { fontSize: 12, color: '#8E8E93' },
  arrow: { fontSize: 14, color: '#007AFF', fontWeight: '900' }
});