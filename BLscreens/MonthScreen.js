import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SectionList, TextInput, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LifeContext } from '../context/LifeContext';
import TimeUnitCircle from '../components/TimeUnitCircle';

export default function MonthScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { selectedYear, setSelectedYear, goals, taggedDays, setTaggedDays, getGoalColorsForDate, getReminder, getFestival } = useContext(LifeContext);

  const [calendarData, setCalendarData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState(null);
  
  const [isSettingAlarm, setIsSettingAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmMsg, setAlarmMsg] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alarmDateObj, setAlarmDateObj] = useState(new Date());

  const [isSettingFestival, setIsSettingFestival] = useState(false);
  const [festivalName, setFestivalName] = useState('');
  const [festivalColor, setFestivalColor] = useState('default');

  const sectionListRef = useRef(null);
  const todayId = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;

  useEffect(() => {
    const year = selectedYear;
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const data = [];
    const today = new Date(); today.setHours(0,0,0,0);

    for (let m = 0; m < 12; m++) {
      let days = []; let jsDay = new Date(year, m, 1).getDay(); let firstDay = (jsDay === 0) ? 6 : jsDay - 1; let daysInMonth = new Date(year, m + 1, 0).getDate();
      let hasPastInMonth = false; let hasCurrentInMonth = false;

      for (let i = 0; i < firstDay; i++) { days.push({ id: `pad-${m}-${i}`, empty: true }); }
      for (let d = 1; d <= daysInMonth; d++) {
        const current = new Date(year, m, d); const id = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isPast = current < today; const isToday = id === todayId;
        if (isPast) hasPastInMonth = true; if (isToday) hasCurrentInMonth = true;
        days.push({ id, text: String(d), isPast, isToday, empty: false });
      }
      data.push({ title: `${months[m]} ${year}`, data: [{ id: `M-${m}`, days }], hasPastInMonth, hasCurrentInMonth });
    }
    setCalendarData(data);
    setTimeout(() => scrollToCurrent(), 600);
  }, [selectedYear]);

  const scrollToCurrent = () => { if (selectedYear === new Date().getFullYear() && sectionListRef.current) { try { sectionListRef.current.scrollToLocation({ sectionIndex: new Date().getMonth(), itemIndex: 0, animated: true }); } catch(e){} } };

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      const currentYear = new Date().getFullYear();
      if (selectedYear !== currentYear) setSelectedYear(currentYear);
      setTimeout(() => scrollToCurrent(), 300);
    });
    return unsubscribe;
  }, [navigation, selectedYear]);

  const openModal = (dateId) => { 
    setSelectedDateId(dateId); 
    setIsSettingAlarm(false); setIsSettingFestival(false);
    setFestivalName(taggedDays[dateId]?.festival?.name || '');
    setFestivalColor(taggedDays[dateId]?.festival?.color || 'default');
    setModalVisible(true); 
  };
  
  const onTimeChange = (e, sel) => { setShowTimePicker(false); if (sel) { setAlarmDateObj(sel); let h = sel.getHours(); let m = sel.getMinutes(); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; m = m < 10 ? '0'+m : m; setAlarmTime(`${h}:${m} ${ampm}`); } };
  
  const saveAlarm = () => { 
    if (!alarmTime || !alarmMsg.trim()) { Alert.alert('Invalid Alarm', 'Time and Message required.'); return; }
    setTaggedDays(prev => { const d = prev[selectedDateId] || { goals: [], verified: false, reminder: null }; return { ...prev, [selectedDateId]: { ...d, reminder: { time: alarmTime, msg: alarmMsg } } }; }); 
    setIsSettingAlarm(false); setAlarmTime(''); setAlarmMsg(''); 
  };

  const removeAlarm = () => {
    setTaggedDays(prev => { const d = prev[selectedDateId]; if(!d) return prev; return { ...prev, [selectedDateId]: { ...d, reminder: null } }; });
    setIsSettingAlarm(false); setAlarmTime(''); setAlarmMsg('');
  };

  const saveFestival = () => {
    setTaggedDays(prev => ({ ...prev, [selectedDateId]: { ...(prev[selectedDateId] || { goals: [], reminder: null }), festival: (festivalName.trim() || festivalColor !== 'default') ? { name: festivalName.trim(), color: festivalColor === 'default' ? null : festivalColor } : prev[selectedDateId]?.festival } }));
    setIsSettingFestival(false);
  };

  const removeFestival = () => {
    setTaggedDays(prev => ({ ...prev, [selectedDateId]: { ...(prev[selectedDateId] || { goals: [], reminder: null }), festival: null } }));
    setFestivalName(''); setFestivalColor('default'); setIsSettingFestival(false);
  };
  
  const toggleGoalForDate = (goal) => { setTaggedDays(prev => { const d = prev[selectedDateId] || { goals: [], verified: false, reminder: null }; const isTagged = d.goals.includes(goal.id); return { ...prev, [selectedDateId]: { ...d, goals: isTagged ? d.goals.filter(id => id !== goal.id) : [...d.goals, goal.id] } }; }); };

  const isPastDay = selectedDateId && selectedDateId < todayId;
  const hasGoals = selectedDateId && (taggedDays[selectedDateId]?.goals || []).length > 0;
  const isVerified = selectedDateId && taggedDays[selectedDateId]?.verified;
  const needsVerification = isPastDay && hasGoals && !isVerified;

  const handleOkVerify = () => {
    setTaggedDays(prev => ({
      ...prev, [selectedDateId]: { 
        ...(prev[selectedDateId] || { goals: [], reminder: null }), 
        verified: needsVerification ? true : prev[selectedDateId]?.verified
      }
    }));
    setModalVisible(false);
  };

  const renderSectionHeader = ({ section }) => (<View style={styles.rowWrapper}><View style={styles.timelineCol}><View style={[styles.timelineLine, section.hasPastInMonth ? styles.timelinePast : styles.timelineFuture]} /></View><View style={styles.monthHeaderContainer}><Text style={styles.monthHeader}>{section.title}</Text></View></View>);
  
  const renderMonthGrid = ({ item, section }) => {
    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const rowGroups = [];
    for (let i = 0; i < item.days.length; i += 7) { rowGroups.push(item.days.slice(i, i + 7)); }

    return (
      <View style={styles.rowWrapper}>
        <View style={styles.timelineCol}>
          <View style={[styles.timelineLine, section.hasPastInMonth && !section.hasCurrentInMonth ? styles.timelinePast : styles.timelineFuture]} />
          {section.hasCurrentInMonth && <View style={styles.todayDotWrapper}><View style={styles.todayDotGlow} /><View style={styles.todayDot} /></View>}
        </View>
        <View style={styles.monthContent}>
          <View style={styles.daysGrid}>
            {daysOfWeek.map((d, i) => (
              <View key={`header-${i}`} style={[styles.dayCell, i === 4 && styles.fridayBorder, { height: 28 }]}>
                <Text style={[styles.dayHeaderText, i >= 5 && styles.weekendText]}>{d}</Text>
              </View>
            ))}
          </View>
          {rowGroups.map((week, rIdx) => {
            const hasFestInRow = week.some(d => getFestival(d.id)?.name);
            return (
              <View key={rIdx} style={styles.daysGrid}>
                {week.map((day, i) => {
                  const fest = getFestival(day.id);
                  if (day.empty) return <View key={day.id} style={[styles.dayCell, i === 4 && styles.fridayBorder, { height: hasFestInRow ? 38 : 30 }]} />;
                  return (
                    <View key={day.id} style={[styles.dayCell, i === 4 && styles.fridayBorder, { height: hasFestInRow ? 38 : 30 }]}>
                      <TimeUnitCircle size={24} text={day.text} colors={getGoalColorsForDate(day.id)} isPast={day.isPast} isVerified={taggedDays[day.id]?.verified} hasReminder={!!getReminder(day.id)} festival={fest} onPress={() => openModal(day.id)} />
                      {day.isToday && <View style={styles.todayUnderline} />}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.singleLineHeader}><Text style={styles.screenTitle}>Months - {selectedYear}</Text></View>
      <SectionList ref={sectionListRef} sections={calendarData} keyExtractor={(i) => i.id} contentContainerStyle={styles.container} stickySectionHeadersEnabled={false} renderSectionHeader={renderSectionHeader} renderItem={renderMonthGrid} onScrollToIndexFailed={() => {}} />
      
      {/* MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Update Day</Text>
            
            <View style={styles.actionRow}>
               {!isSettingAlarm && !isSettingFestival && (
                <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity style={[styles.reminderBtn, {flex: 1}]} onPress={() => setIsSettingAlarm(true)}><Text style={{color: '#007AFF', fontSize: 13, fontWeight: '700'}}>⏰ Set Alarm</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.reminderBtn, {flex: 1}]} onPress={() => setIsSettingFestival(true)}><Text style={{color: '#AF52DE', fontSize: 13, fontWeight: '700'}}>🎉 Set Event</Text></TouchableOpacity>
                </View>
              )}
              {isSettingAlarm && (
                <View style={styles.alarmInputBox}>
                  <TouchableOpacity onPress={() => setShowTimePicker(true)}><View pointerEvents="none"><TextInput style={styles.alarmInput} placeholder="Select Time..." placeholderTextColor="#999" value={alarmTime} editable={false} /></View></TouchableOpacity>
                  <TextInput style={styles.alarmInput} placeholder="Message" placeholderTextColor="#999" value={alarmMsg} onChangeText={setAlarmMsg} />
                  <View style={{flexDirection: 'row', gap: 10}}>
                    {taggedDays[selectedDateId]?.reminder && (<TouchableOpacity style={[styles.saveAlarmBtn, {backgroundColor: '#FF3B30', flex: 1}]} onPress={removeAlarm}><Text style={styles.saveAlarmText}>Remove</Text></TouchableOpacity>)}
                    <TouchableOpacity style={[styles.saveAlarmBtn, {backgroundColor: '#8E8E93', flex: 1}]} onPress={() => setIsSettingAlarm(false)}><Text style={styles.saveAlarmText}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.saveAlarmBtn, {flex: 1}]} onPress={saveAlarm}><Text style={styles.saveAlarmText}>Save</Text></TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {showTimePicker && <DateTimePicker value={alarmDateObj} mode="time" display="default" onChange={onTimeChange} />}
            
            {!isSettingAlarm && (
              <>
                {!isSettingFestival && goals.map(g => { const isSelected = (taggedDays[selectedDateId]?.goals || []).includes(g.id); return (<TouchableOpacity key={g.id} style={styles.modalGoalRow} onPress={() => toggleGoalForDate(g)}><View style={[styles.checkbox, isSelected && { backgroundColor: g.color, borderColor: g.color }]} /><Text style={[styles.modalGoalTitle, isSelected && styles.modalGoalTitleActive]}>{g.title}</Text></TouchableOpacity>);})}
                
                {isSettingFestival && (
                  <View style={styles.festivalSection}>
                    <Text style={styles.festivalTitle}>FESTIVAL / EVENT (Optional Name)</Text>
                    <TextInput style={styles.festivalInput} placeholder="Event Name..." placeholderTextColor="#999" value={festivalName} onChangeText={setFestivalName} />
                    <View style={styles.colorRow}>
                      {[{v: 'default'}, {v: '#212121'}, {v: '#FBC02D'}, {v: '#D32F2F'}, {v: '#7B1FA2'}, {v: '#388E3C'}, {v: '#1976D2'}].map(c => (
                        <TouchableOpacity key={c.v} onPress={() => setFestivalColor(c.v)} style={[styles.colorCircle, { backgroundColor: c.v === 'default' ? '#fff' : c.v }, festivalColor === c.v && styles.colorSelected]}>
                          {c.v === 'default' && <Text style={{fontSize: 8, fontWeight: '800', color: '#999', textAlign: 'center', lineHeight: 20}}>NO</Text>}
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
                      {taggedDays[selectedDateId]?.festival && (<TouchableOpacity style={[styles.saveAlarmBtn, {backgroundColor: '#FF3B30', flex: 1}]} onPress={removeFestival}><Text style={styles.saveAlarmText}>Remove</Text></TouchableOpacity>)}
                      <TouchableOpacity style={[styles.saveAlarmBtn, {backgroundColor: '#8E8E93', flex: 1}]} onPress={() => setIsSettingFestival(false)}><Text style={styles.saveAlarmText}>Cancel</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.saveAlarmBtn, {flex: 1}]} onPress={saveFestival}><Text style={styles.saveAlarmText}>Save</Text></TouchableOpacity>
                    </View>
                  </View>
                )}

                {!isSettingFestival && (
                  <TouchableOpacity style={[styles.okBtn, needsVerification && styles.verifyBtnColor]} onPress={handleOkVerify}>
                    <Text style={styles.okBtnText}>{needsVerification ? 'VERIFY' : 'OK'}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F2F2F7' },
  singleLineHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingVertical: 12, paddingHorizontal: 15 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  container: { paddingRight: 12, paddingBottom: 50 }, rowWrapper: { flexDirection: 'row', alignItems: 'stretch' }, timelineCol: { width: 22, alignItems: 'center', marginLeft: 4, marginRight: 4, position: 'relative' }, timelineLine: { width: 3.5, flex: 1 }, timelinePast: { backgroundColor: '#4A4A4A' }, timelineFuture: { backgroundColor: '#D1D1D6' }, todayDotWrapper: { position: 'absolute', top: '50%', marginTop: -6, width: 12, height: 12, justifyContent: 'center', alignItems: 'center', zIndex: 10 }, todayDotGlow: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF', opacity: 0.4 }, todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#007AFF' }, monthHeaderContainer: { paddingVertical: 4 }, monthHeader: { fontSize: 10, fontWeight: '700', color: '#8E8E93', backgroundColor: '#fff', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, overflow: 'hidden' }, monthContent: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, marginBottom: 4, marginTop: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }, dayHeaderText: { fontSize: 10, fontWeight: '800', color: '#8E8E93' }, weekendText: { color: '#FF3B30' }, daysGrid: { flexDirection: 'row' }, 
  dayCell: { width: '14.28%', alignItems: 'center', justifyContent: 'center' }, fridayBorder: { borderRightWidth: 1, borderRightColor: '#F2F2F7' }, todayUnderline: { width: 10, height: 2, backgroundColor: '#007AFF', borderRadius: 2, marginTop: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }, modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, width: 280, elevation: 5 }, modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 15, textAlign: 'center', color: '#1C1C1E' }, actionRow: { marginBottom: 10 }, reminderBtn: { backgroundColor: '#F2F2F7', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, okBtn: { backgroundColor: '#E5E5EA', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 }, verifyBtnColor: { backgroundColor: '#34C759' }, okBtnText: { fontSize: 14, fontWeight: '800', color: '#1C1C1E' }, alarmInputBox: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' }, alarmInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 6, padding: 8, marginBottom: 8, fontSize: 13, color: '#333' }, saveAlarmBtn: { backgroundColor: '#007AFF', padding: 8, borderRadius: 6, alignItems: 'center' }, saveAlarmText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  festivalSection: { marginTop: 10, padding: 12, backgroundColor: '#F9F9F9', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' }, festivalTitle: { fontSize: 10, fontWeight: '800', color: '#8E8E93', marginBottom: 8, letterSpacing: 0.5 }, festivalInput: { backgroundColor: '#fff', borderRadius: 6, padding: 8, fontSize: 13, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 10 }, colorRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' }, colorCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E5E5EA' }, colorSelected: { borderColor: '#1C1C1E', borderWidth: 3 }, modalGoalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }, checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: '#C7C7CC', borderRadius: 4, marginRight: 12 }, modalGoalTitle: { fontSize: 14, color: '#3A3A3C', fontWeight: '400' }, modalGoalTitleActive: { fontWeight: '600', color: '#1C1C1E' }
});