import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Switch, Share, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import Papa from 'papaparse';

// =====================================================================
// EXPO NOTIFICATIONS SETUP
// =====================================================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getZodiacSign = (day, month) => {
  if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "♒";
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "♓";
  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "♈";
  if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "♉";
  if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "♊";
  if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "♋";
  if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "♌";
  if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "♍";
  if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "♎";
  if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "♏";
  if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "♐";
  if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "♑";
  return "🎂";
};

const GlassBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={styles.bgBase} />
    <View style={[styles.blob, { backgroundColor: '#FFD1FF', top: -100, left: -50, width: 300, height: 300 }]} />
    <View style={[styles.blob, { backgroundColor: '#D4E4FF', top: '30%', right: -100, width: 250, height: 250 }]} />
  </View>
);

export default function BirthdayScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [birthdays, setBirthdays] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // New Birthday Form States
  const [newName, setNewName] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [newYear, setNewYear] = useState(''); 
  const [newIsActive, setNewIsActive] = useState(true);
  const [newAlarm, setNewAlarm] = useState(true);

  // Custom Alarm States
  const [alarm1Active, setAlarm1Active] = useState(false);
  const [alarm1Day, setAlarmGroup1Day] = useState('Prev Day'); // 'Same Day' or 'Prev Day'
  const [alarm1Time, setAlarm1Time] = useState('11:55 PM'); // e.g. 11:55 PM

  const [alarm2Active, setAlarm2Active] = useState(false);
  const [alarm2Day, setTableAlarm2Day] = useState('Prev Day'); 
  const [alarm2Time, setAlarm2Time] = useState('06:00 PM');

  useEffect(() => {
    const checkPermissions = async () => {
      const settings = await typeof window !== 'undefined' && Notifications.getPermissionsAsync();
      if (settings && settings.granted === false) {
        await Notifications.requestPermissionsAsync();
      }
    };
    if (Platform.OS !== 'web') checkPermissions();
  }, []);

  // --- TRIPLE SMART ALARM TRIGGER LOGIC ---
  const scheduleCustomAlarms = async (bday) => {
    if (!bday.reminder || !bday.isActive || Platform.OS === 'web') return;

    const today = new Date();
    let nextBday = new Date(today.getFullYear(), bday.month - 1, bday.day);
    if (nextBday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }

    try {
      // 1. MANDATORY ALARM: Same Day 9:00 AM
      const mandatoryAlarm = new Date(nextBday);
      mandatoryAlarm.setHours(9, 0, 0, 0);
      if (mandatoryAlarm > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `Happy Birthday ${bday.name}! 🎉`, body: `Don't forget to wish them a fantastic day!` },
          trigger: mandatoryAlarm,
        });
      }

      // Helper parser for custom time input (e.g., "11:55 PM" -> hours: 23, mins: 55)
      const parseTimeString = (timeStr, targetDate, isPrevDay) => {
        const triggerDate = new Date(targetDate);
        if (isPrevDay) triggerDate.setDate(triggerDate.getDate() - 1);

        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return null;
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();

        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        triggerDate.setHours(hours, minutes, 0, 0);
        return triggerDate;
      };

      // 2. CUSTOM ALARM 1
      if (bday.customAlarms?.alarm1?.active) {
        const c1 = bday.customAlarms.alarm1;
        const time1 = parseTimeString(c1.time, nextBday, c1.day === 'Prev Day');
        if (time1 && time1 > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: { title: `Birthday Alert for ${bday.name}! 🎂`, body: `Custom reminder set for this moment.` },
            trigger: time1,
          });
        }
      }

      // 3. CUSTOM ALARM 2
      if (bday.customAlarms?.alarm2?.active) {
        const c2 = bday.customAlarms.alarm2;
        const time2 = parseTimeString(c2.time, nextBday, c2.day === 'Prev Day');
        if (time2 && time2 > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: { title: `Special Reminder: ${bday.name} 🎉`, body: `Time to execute your celebration plans!` },
            trigger: time2,
          });
        }
      }

    } catch (e) { console.log("Alarm parsing error", e); }
  };

  const calculateUpcoming = (day, month, year) => {
    const today = new Date();
    let nextBday = new Date(today.getFullYear(), month - 1, day);
    if (nextBday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = Math.abs(nextBday - today);
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let turningAge = year ? nextBday.getFullYear() - year : null;
    return { daysLeft, turningAge };
  };

  const sortedBirthdays = useMemo(() => {
    return [...birthdays].map(b => ({
      ...b,
      ...calculateUpcoming(b.day, b.month, b.year),
      zodiac: getZodiacSign(b.day, b.month)
    })).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [birthdays]);

  // --- ACTIONS ---
  const handleAdd = () => {
    const d = parseInt(newDay);
    const m = parseInt(newMonth);
    const y = newYear ? parseInt(newYear) : null;

    if (!newName.trim() || isNaN(d) || isNaN(m) || d < 1 || d > 31 || m < 1 || m > 12) {
      return Alert.alert('Invalid Input', 'Please fill proper Name, Day (1-31), and Month (1-12).');
    }

    const newBday = { 
      id: Date.now().toString(), 
      name: newName.trim(), 
      day: d, month: m, year: y, 
      isActive: newIsActive, 
      reminder: newAlarm,
      customAlarms: {
        alarm1: { active: alarm1Active, day: alarm1Day, time: alarm1Time },
        alarm2: { active: alarm2Active, day: alarm2Day, time: alarm2Time }
      }
    };

    setBirthdays([...birthdays, newBday]);
    scheduleCustomAlarms(newBday);

    setModalVisible(false);
    setNewName(''); setNewDay(''); setNewMonth(''); setNewYear('');
    setAlarm1Active(false); setAlarm2Active(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove birthday tracker?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setBirthdays(birthdays.filter(b => b.id !== id)) }
    ]);
  };

  const toggleStatus = (id, field) => {
    const updated = birthdays.map(b => b.id === id ? { ...b, [field]: !b[field] } : b);
    setBirthdays(updated);
    if ((field === 'reminder' || field === 'isActive')) {
      const target = updated.find(b => b.id === id);
      if (target.isActive && target.reminder) scheduleCustomAlarms(target);
    }
  };

  const handleExport = () => {
    const csvStr = Papa.unparse(birthdays);
    Share.share({ message: csvStr, title: 'My_Birthdays.csv' });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <GlassBackground />
      
      <View style={styles.glassHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{paddingRight: 10}}><Text style={styles.headerActionTxt}>◀ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Birthdays 🎂</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}><Text style={{fontSize: 24, color:'#007AFF', fontWeight: '900'}}>+</Text></TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.outlineBtn} onPress={handleExport}><Text style={styles.outlineBtnTxt}>📤 Export CSV</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{padding: 10, paddingBottom: 50}}>
        {sortedBirthdays.map((b, idx) => {
          const isNext = idx === 0 && b.isActive && b.daysLeft > 0;
          const isToday = b.daysLeft === 0;

          // Generate active alarms string text
          let alarmSummary = "9:00 AM";
          if (b.customAlarms?.alarm1?.active) alarmSummary += ` | ${b.customAlarms.alarm1.day === 'Prev Day' ? 'Prev' : 'Same'} ${b.customAlarms.alarm1.time}`;
          if (b.customAlarms?.alarm2?.active) alarmSummary += ` | ${b.customAlarms.alarm2.day === 'Prev Day' ? 'Prev' : 'Same'} ${b.customAlarms.alarm2.time}`;

          return (
            <View key={b.id} style={[styles.compactTile, !b.isActive && {opacity: 0.5}, isNext && styles.highlightTile, isToday && styles.todayTile]}>
              <View style={[styles.avatarBox, isNext && {backgroundColor: 'rgba(52,199,89,0.2)'}]}>
                <Text style={styles.zodiacTxt}>{b.zodiac}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.bdayName} numberOfLines={1}>{b.name}</Text>
                <Text style={styles.bdayDate}>{b.day} {MONTH_NAMES[b.month - 1]} {b.turningAge ? `• Turns ${b.turningAge}` : ''}</Text>
                {b.reminder && b.isActive && <Text style={styles.alarmSummaryTxt}>🔔 {alarmSummary}</Text>}
              </View>

              <View style={styles.rightCol}>
                <Text style={[styles.daysLeft, isToday && {color: '#AF52DE'}]}>{isToday ? "🎉 TODAY" : `${b.daysLeft} Days`}</Text>
                <View style={styles.miniTogglesRow}>
                  <TouchableOpacity onPress={() => toggleStatus(b.id, 'reminder')} style={[styles.miniIconBtn, b.reminder && b.isActive ? styles.iconActive : styles.iconInactive]}><Text style={{fontSize:10}}>🔔</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleStatus(b.id, 'isActive')} style={[styles.miniIconBtn, b.isActive ? styles.iconActive : styles.iconInactive]}><Text style={{fontSize:10}}>👁️</Text></TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.sleekDeleteBtn} onPress={() => handleDelete(b.id)}><Text style={{fontSize: 14, color: '#FF3B30'}}>🗑️</Text></TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* ================================================================= */}
      {/* SMART ADD MODAL (WITH OPTIONAL 2 MANUAL ALARMS BUILD)            */}
      {/* ================================================================= */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBgCenter}>
          <ScrollView contentContainerStyle={{justifyContent:'center', alignItems:'center', flexGrow:1, paddingVertical: 40}} style={{width:'100%'}}>
            <View style={styles.glassModal}>
              <Text style={styles.modalTitle}>Add Birthday Profile</Text>
              
              <TextInput style={styles.modalInputFull} placeholder="Full Name" value={newName} onChangeText={setNewName} placeholderTextColor="#888" />
              
              <View style={styles.dateInputRow}>
                <View style={styles.dateInputWrapper}><Text style={styles.inputLabel}>Day</Text><TextInput style={styles.modalInputSmall} placeholder="DD" value={newDay} onChangeText={setNewDay} keyboardType="numeric" maxLength={2} /></View>
                <View style={styles.dateInputWrapper}><Text style={styles.inputLabel}>Month</Text><TextInput style={styles.modalInputSmall} placeholder="MM" value={newMonth} onChangeText={setNewMonth} keyboardType="numeric" maxLength={2} /></View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.inputLabel}>Year <Text style={{fontSize:9, color:'#888'}}>(Opt)</Text></Text>
                  <TextInput style={styles.modalInputSmall} placeholder="YYYY" value={newYear} onChangeText={setNewYear} keyboardType="numeric" maxLength={4} />
                </View>
              </View>

              <View style={styles.mandatoryAlarmBox}>
                <Text style={styles.mandatoryText}>⚙️ Mandatory System Alarm Enabled:</Text>
                <Text style={styles.mandatoryDetail}>• Same Day morning at 9:00 AM</Text>
              </View>

              {/* MANUAL ALARM SLOT 1 */}
              <View style={styles.customAlarmConfigBox}>
                <View style={styles.alarmHeaderRow}>
                  <Text style={styles.alarmSectionTitle}>➕ Manual Alarm 1</Text>
                  <Switch value={alarm1Active} onValueChange={setAlarm1Active} />
                </View>
                {alarm1Active && (
                  <View style={styles.alarmOptionsGrid}>
                    <View style={{flexDirection:'row', gap: 6, marginBottom: 8}}>
                      <TouchableOpacity style={[styles.choiceBadge, alarm1Day === 'Same Day' && styles.choiceBadgeActive]} onPress={() => setAlarmGroup1Day('Same Day')}><Text style={styles.choiceBadgeTxt}>Same Day</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.choiceBadge, alarm1Day === 'Prev Day' && styles.choiceBadgeActive]} onPress={() => setAlarmGroup1Day('Prev Day')}><Text style={styles.choiceBadgeTxt}>Prev Day</Text></TouchableOpacity>
                    </View>
                    <TextInput style={styles.timeTextInput} value={alarm1Time} onChangeText={setAlarm1Time} placeholder="e.g. 11:55 PM" placeholderTextColor="#888" />
                  </View>
                )}
              </View>

              {/* MANUAL ALARM SLOT 2 */}
              <View style={styles.customAlarmConfigBox}>
                <View style={styles.alarmHeaderRow}>
                  <Text style={styles.alarmSectionTitle}>➕ Manual Alarm 2</Text>
                  <Switch value={alarm2Active} onValueChange={setAlarm2Active} />
                </View>
                {alarm2Active && (
                  <View style={styles.alarmOptionsGrid}>
                    <View style={{flexDirection:'row', gap: 6, marginBottom: 8}}>
                      <TouchableOpacity style={[styles.choiceBadge, alarm2Day === 'Same Day' && styles.choiceBadgeActive]} onPress={() => setTableAlarm2Day('Same Day')}><Text style={styles.choiceBadgeTxt}>Same Day</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.choiceBadge, alarm2Day === 'Prev Day' && styles.choiceBadgeActive]} onPress={() => setTableAlarm2Day('Prev Day')}><Text style={styles.choiceBadgeTxt}>Prev Day</Text></TouchableOpacity>
                    </View>
                    <TextInput style={styles.timeTextInput} value={alarm2Time} onChangeText={setAlarm2Time} placeholder="e.g. 06:00 PM" placeholderTextColor="#888" />
                  </View>
                )}
              </View>

              <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                <TouchableOpacity style={[styles.solidBtn, {backgroundColor: '#E5E5EA', flex: 1}]} onPress={() => setModalVisible(false)}><Text style={{color:'#333', fontWeight:'bold', textAlign:'center'}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.solidBtn, {flex: 1, backgroundColor:'#007AFF'}]} onPress={handleAdd}><Text style={{color:'#fff', fontWeight:'bold', textAlign:'center'}}>Save Tracker</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F4F5F7' },
  blob: { position: 'absolute', borderRadius: 200, opacity: 0.6 },
  
  glassHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.85)', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  headerActionTxt: { color: '#007AFF', fontSize: 15, fontWeight: '700' },
  actionRow: { padding: 10, paddingBottom: 5 },
  outlineBtn: { borderWidth: 1, borderColor: '#D1D1D6', paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)' },
  outlineBtnTxt: { color: '#1C1C1E', fontWeight: '700', fontSize: 12 },

  compactTile: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  highlightTile: { borderColor: '#34C759', backgroundColor: '#F2FCF4', borderWidth: 1.5 },
  todayTile: { borderColor: '#AF52DE', backgroundColor: '#FDF2FF', borderWidth: 2 },
  
  avatarBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  zodiacTxt: { fontSize: 18 },
  infoCol: { flex: 1, justifyContent: 'center' },
  bdayName: { fontSize: 15, fontWeight: '800', color: '#1C1C1E', marginBottom: 2 },
  bdayDate: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  alarmSummaryTxt: { fontSize: 10, color: '#007AFF', fontWeight: '700', marginTop: 3 },
  
  rightCol: { alignItems: 'flex-end', marginRight: 10 },
  daysLeft: { fontSize: 13, fontWeight: '800', color: '#34C759', marginBottom: 4 },
  miniTogglesRow: { flexDirection: 'row', gap: 6 },
  miniIconBtn: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  iconActive: { backgroundColor: '#E5F1FF', borderColor: '#007AFF' },
  iconInactive: { backgroundColor: '#F2F2F7', borderColor: '#D1D1D6', opacity: 0.5 },
  sleekDeleteBtn: { padding: 8, backgroundColor: '#FDECEF', borderRadius: 8 },

  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  glassModal: { backgroundColor: '#fff', width: 330, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 15 },
  modalInputFull: { backgroundColor: '#F4F5F7', height: 44, borderRadius: 8, paddingHorizontal: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 15 },
  
  dateInputRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  dateInputWrapper: { flex: 1 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', marginBottom: 4, textTransform: 'uppercase' },
  modalInputSmall: { backgroundColor: '#F4F5F7', height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 15, textAlign: 'center' },

  mandatoryAlarmBox: { backgroundColor: '#EDF5FF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#D0E4FF', marginBottom: 12 },
  mandatoryText: { fontSize: 12, fontWeight: '700', color: '#0056C6' },
  mandatoryDetail: { fontSize: 12, color: '#0056C6', marginTop: 2, fontWeight: '600' },

  customAlarmConfigBox: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 10 },
  alarmHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alarmSectionTitle: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  alarmOptionsGrid: { marginTop: 8 },
  choiceBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#E5E5EA' },
  choiceBadgeActive: { backgroundColor: '#1C1C1E' },
  choiceBadgeTxt: { fontSize: 11, fontWeight: '600', color: '#fff' },
  timeTextInput: { backgroundColor: '#fff', height: 36, borderRadius: 6, borderWidth: 1, borderColor: '#D1D1D6', paddingHorizontal: 10, fontSize: 13, marginTop: 5 },

  solidBtn: { height: 44, borderRadius: 8, justifyContent: 'center' }
});