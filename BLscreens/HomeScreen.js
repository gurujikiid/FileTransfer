import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, SectionList, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LifeContext } from '../context/LifeContext';
import TimeUnitCircle from '../components/TimeUnitCircle';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets(); 
  const { selectedYear, setSelectedYear, goals, taggedDays, setTaggedDays, weekendNotes, setWeekendNotes, extendedWeekends, setExtendedWeekends, getGoalColorsForDate, getReminder, getFestival } = useContext(LifeContext);

  const [calendarData, setCalendarData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState(null);
  const [selectedWk, setSelectedWk] = useState(null);
  
  const [isSettingAlarm, setIsSettingAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmMsg, setAlarmMsg] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alarmDateObj, setAlarmDateObj] = useState(new Date());

  const [isSettingFestival, setIsSettingFestival] = useState(false);
  const [festivalName, setFestivalName] = useState('');
  const [festivalColor, setFestivalColor] = useState('default');

  const [isMatrixView, setIsMatrixView] = useState(false);
  const sectionListRef = useRef(null);
  const todayId = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;

  useEffect(() => {
    const year = selectedYear;
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const data = [];
    const today = new Date(); today.setHours(0,0,0,0);

    for (let m = 0; m < 12; m++) {
      let weekends = []; let date = new Date(year, m, 1); let hasPastInMonth = false;
      while (date.getMonth() === m) {
        if (date.getDay() === 6) { 
          const sat = new Date(date); const sun = new Date(date); sun.setDate(sun.getDate() + 1);
          const fri = new Date(sat); fri.setDate(fri.getDate() - 1); const mon = new Date(sun); mon.setDate(mon.getDate() + 1);
          const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          
          const satStr = fmt(sat); const isPastSat = sat < today; if(isPastSat) hasPastInMonth = true;
          const diffDays = (sat.getTime() - today.getTime()) / (1000 * 3600 * 24);
          const isCurrentWeek = (diffDays >= -2 && diffDays <= 4);

          weekends.push({
            id: `W-${satStr}`, friId: fmt(fri), satId: satStr, sunId: fmt(sun), monId: fmt(mon),
            friDate: String(fri.getDate()).padStart(2,'0'), satDate: String(sat.getDate()).padStart(2,'0'), sunDate: String(sun.getDate()).padStart(2,'0'), monDate: String(mon.getDate()).padStart(2,'0'),
            isPastFri: fri < today, isPastSat, isPastSun: sun < today, isPastMon: mon < today, isCurrentWeek, monthIdx: m
          });
        }
        date.setDate(date.getDate() + 1);
      }
      if (weekends.length > 0) data.push({ title: `${months[m]} ${year}`, monthShort: months[m].substring(0,3), data: weekends, hasPastInMonth });
    }
    setCalendarData(data);
    setTimeout(() => scrollToCurrent(), 600);
  }, [selectedYear]);

  const scrollToCurrent = () => { if (selectedYear === new Date().getFullYear() && sectionListRef.current && !isMatrixView) { try { sectionListRef.current.scrollToLocation({ sectionIndex: new Date().getMonth(), itemIndex: 0, animated: true }); } catch (e) {} } };

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      setIsMatrixView(false); const currentYear = new Date().getFullYear();
      if (selectedYear !== currentYear) setSelectedYear(currentYear);
      setTimeout(() => scrollToCurrent(), 300);
    });
    return unsubscribe;
  }, [navigation, selectedYear]);

  const stats = useMemo(() => {
    let left = 0, pastEmpty = 0, totalWknds = 0;
    calendarData.forEach(month => {
      totalWknds += month.data.length;
      month.data.forEach(wk => {
        if (!wk.isPastSat) left++;
        else {
          const c = (id) => (taggedDays[id]?.goals && taggedDays[id].goals.length > 0);
          if (!c(wk.satId) && !c(wk.sunId)) pastEmpty++; 
        }
      });
    });
    const wastedPercent = totalWknds === 0 ? 0 : Math.round((pastEmpty / totalWknds) * 100);
    return { left, wastedPercent, percent: Math.round((left / totalWknds) * 100) || 0 };
  }, [calendarData, taggedDays]);

  const openModal = (dateId, wk) => { 
    setSelectedDateId(dateId); setSelectedWk(wk); 
    setIsSettingAlarm(false); setIsSettingFestival(false);
    setFestivalName(taggedDays[dateId]?.festival?.name || '');
    setFestivalColor(taggedDays[dateId]?.festival?.color || 'default');
    setModalVisible(true); 
  };
  
  const toggleExtend = (dayType) => { if(!selectedWk) return; setExtendedWeekends(prev => { const c = prev[selectedWk.id] || { friday: false, monday: false }; return { ...prev, [selectedWk.id]: { ...c, [dayType]: !c[dayType] } }; }); };
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
  
  const toggleGoalForDate = (goal) => { setTaggedDays(prev => { const d = prev[selectedDateId] || { goals: [], verified: false, reminder: null }; const isTagged = d.goals.includes(goal.id); return { ...prev, [selectedDateId]: { ...d, goals: isTagged ? d.goals.filter(id => id !== goal.id) : [...d.goals, goal.id] } }; }); setWeekendNotes(prev => { const d = taggedDays[selectedDateId] || { goals: [] }; if (!d.goals.includes(goal.id) && selectedWk) { const cur = prev[selectedWk.id] || ''; if (!cur.includes(goal.title)) return { ...prev, [selectedWk.id]: cur ? `${cur}, ${goal.title}` : goal.title }; } return prev; }); };

  const isPastDay = selectedDateId && selectedDateId < todayId;
  const hasGoals = selectedDateId && (taggedDays[selectedDateId]?.goals || []).length > 0;
  const isVerified = selectedDateId && taggedDays[selectedDateId]?.verified;
  const needsVerification = isPastDay && hasGoals && !isVerified;

  const handleOkVerify = () => {
    setTaggedDays(prev => ({ ...prev, [selectedDateId]: { ...(prev[selectedDateId] || { goals: [], reminder: null }), verified: needsVerification ? true : prev[selectedDateId]?.verified } }));
    setModalVisible(false);
  };

  const renderSectionHeader = ({ section }) => (<View style={styles.rowWrapper}><View style={styles.timelineCol}><View style={[styles.timelineLine, section.hasPastInMonth ? styles.timelinePast : styles.timelineFuture]} /></View><View style={styles.monthHeaderContainer}><Text style={styles.monthHeader}>{section.title}</Text></View></View>);
  
  const renderStandardWeekend = ({ item: wk }) => {
    const hasFri = extendedWeekends[wk.id]?.friday; const hasMon = extendedWeekends[wk.id]?.monday;
    return (
      <View style={styles.rowWrapper}>
        <View style={styles.timelineCol}>
          <View style={[styles.timelineLine, wk.isPastSun ? styles.timelinePast : styles.timelineFuture]} />
          {wk.isCurrentWeek && <View style={styles.todayDotWrapper}><View style={styles.todayDotGlow} /><View style={styles.todayDot} /></View>}
        </View>
        <View style={styles.weekendContent}>
          <View style={styles.circlesContainer}>
            {hasFri && <TimeUnitCircle size={28} text={wk.friDate} colors={getGoalColorsForDate(wk.friId)} isPast={wk.isPastFri} isVerified={taggedDays[wk.friId]?.verified} hasReminder={!!getReminder(wk.friId)} festival={getFestival(wk.friId)} onPress={() => openModal(wk.friId, wk)} />}{hasFri && <View style={styles.circleGap} />}
            <TimeUnitCircle size={28} text={wk.satDate} colors={getGoalColorsForDate(wk.satId)} isPast={wk.isPastSat} isVerified={taggedDays[wk.satId]?.verified} hasReminder={!!getReminder(wk.satId)} festival={getFestival(wk.satId)} onPress={() => openModal(wk.satId, wk)} /><View style={styles.circleGap} />
            <TimeUnitCircle size={28} text={wk.sunDate} colors={getGoalColorsForDate(wk.sunId)} isPast={wk.isPastSun} isVerified={taggedDays[wk.sunId]?.verified} hasReminder={!!getReminder(wk.sunId)} festival={getFestival(wk.sunId)} onPress={() => openModal(wk.sunId, wk)} />
            {hasMon && <View style={styles.circleGap} />}{hasMon && <TimeUnitCircle size={28} text={wk.monDate} colors={getGoalColorsForDate(wk.monId)} isPast={wk.isPastMon} isVerified={taggedDays[wk.monId]?.verified} hasReminder={!!getReminder(wk.monId)} festival={getFestival(wk.monId)} onPress={() => openModal(wk.monId, wk)} />}
          </View>
          <TextInput style={[styles.inputBox, wk.isPastSat && styles.pastInput]} placeholder="" multiline={true} value={weekendNotes[wk.id] || ''} onChangeText={(text) => setWeekendNotes(prev => ({ ...prev, [wk.id]: text }))} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.singleLineHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.headerScroll}>
          <TouchableOpacity activeOpacity={0.6} onPress={() => setIsMatrixView(!isMatrixView)}>
            <Text style={styles.screenTitle}>Weekend '{String(selectedYear).slice(-2)}</Text>
          </TouchableOpacity>
          <View style={styles.statsBadges}>
            <Text style={styles.statBadgeText}>{stats.left} Left ({stats.percent}%)</Text>
          </View>
        </ScrollView>
      </View>

      {isMatrixView ? (
        <ScrollView contentContainerStyle={styles.matrixContainer}>
          <View style={styles.wastedBarWrapper}>
            <Text style={styles.wastedText}>{stats.wastedPercent}% weekend wasted</Text>
            <View style={styles.wastedBarBg}>
              <View style={[styles.wastedBarFill, { width: `${stats.wastedPercent}%` }]} />
            </View>
          </View>

          {calendarData.map(month => (
            <View key={month.title} style={styles.matrixMonthRow}>
              <Text style={styles.matrixMonthName}>{month.monthShort}</Text>
              <View style={styles.matrixWeekends}>
                {month.data.map(wk => (
                  <TouchableOpacity key={wk.id} style={styles.matrixBlock} onPress={() => openModal(wk.satId, wk)}>
                    <View style={styles.matrixMiniRow}>
                       <TimeUnitCircle size={14} text="" colors={getGoalColorsForDate(wk.satId)} isPast={wk.isPastSat} isVerified={taggedDays[wk.satId]?.verified} festival={getFestival(wk.satId)} />
                       <TimeUnitCircle size={14} text="" colors={getGoalColorsForDate(wk.sunId)} isPast={wk.isPastSun} isVerified={taggedDays[wk.sunId]?.verified} festival={getFestival(wk.sunId)} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <SectionList ref={sectionListRef} sections={calendarData} keyExtractor={(i) => i.id} contentContainerStyle={styles.container} stickySectionHeadersEnabled={false} renderSectionHeader={renderSectionHeader} renderItem={renderStandardWeekend} onScrollToIndexFailed={() => {}} />
      )}

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
            
            {!isSettingAlarm && !isSettingFestival && selectedWk && (<View style={styles.extendRow}><TouchableOpacity style={styles.extendBtn} onPress={() => toggleExtend('friday')}><Text style={styles.extendBtnText}>{extendedWeekends[selectedWk.id]?.friday ? '- Drop Fri' : '+ Add Fri'}</Text></TouchableOpacity><TouchableOpacity style={styles.extendBtn} onPress={() => toggleExtend('monday')}><Text style={styles.extendBtnText}>{extendedWeekends[selectedWk.id]?.monday ? '- Drop Mon' : '+ Add Mon'}</Text></TouchableOpacity></View>)}
            
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
  singleLineHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingVertical: 10 },
  headerScroll: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 12 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#007AFF' }, 
  statsBadges: { flexDirection: 'row', gap: 6 }, statBadgeText: { fontSize: 12, fontWeight: '700', color: '#333', backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  
  container: { paddingRight: 12, paddingBottom: 50 }, rowWrapper: { flexDirection: 'row', alignItems: 'stretch' }, timelineCol: { width: 22, alignItems: 'center', marginLeft: 4, marginRight: 4, position: 'relative' }, timelineLine: { width: 3.5, flex: 1 }, timelinePast: { backgroundColor: '#4A4A4A' }, timelineFuture: { backgroundColor: '#D1D1D6' }, todayDotWrapper: { position: 'absolute', top: '50%', marginTop: -6, width: 12, height: 12, justifyContent: 'center', alignItems: 'center', zIndex: 10 }, todayDotGlow: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF', opacity: 0.4 }, todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#007AFF' }, 
  monthHeaderContainer: { flex: 1, alignItems: 'center', paddingVertical: 4, paddingRight: 22 },
  monthHeader: { fontSize: 11, fontWeight: '800', color: '#8E8E93', backgroundColor: '#E5E5EA', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, overflow: 'hidden', letterSpacing: 1, marginBottom: 2 }, 
  weekendContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3, marginTop: 1, backgroundColor: '#fff', padding: 5, paddingVertical: 6, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }, circlesContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 8, marginTop: 1, flexWrap: 'wrap', maxWidth: 140 }, circleGap: { width: 3 }, inputBox: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 6, minHeight: 28, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, color: '#1C1C1E', textAlignVertical: 'top' }, pastInput: { backgroundColor: '#F9F9F9', color: '#8E8E93' },
  
  matrixContainer: { padding: 20, paddingBottom: 60 }, wastedBarWrapper: { marginBottom: 25 }, wastedText: { textAlign: 'right', fontSize: 12, fontWeight: '800', color: '#FF3B30', marginBottom: 6, textTransform: 'uppercase' }, wastedBarBg: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, overflow: 'hidden' }, wastedBarFill: { height: '100%', backgroundColor: '#FF3B30', borderRadius: 4 }, matrixMonthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, matrixMonthName: { width: 40, fontSize: 11, fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase' }, matrixWeekends: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, gap: 6 }, matrixBlock: { padding: 4, backgroundColor: '#fff', borderRadius: 6, shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }, matrixMiniRow: { flexDirection: 'row', gap: 2 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }, modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, width: 280, elevation: 5 }, modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 15, textAlign: 'center', color: '#1C1C1E' }, actionRow: { marginBottom: 15 }, reminderBtn: { backgroundColor: '#F2F2F7', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }, alarmInputBox: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' }, alarmInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 6, padding: 8, marginBottom: 8, fontSize: 13, color: '#333' }, saveAlarmBtn: { backgroundColor: '#007AFF', padding: 8, borderRadius: 6, alignItems: 'center' }, saveAlarmText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }, 
  modalGoalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }, checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: '#C7C7CC', borderRadius: 4, marginRight: 12 }, modalGoalTitle: { fontSize: 14, color: '#3A3A3C', fontWeight: '400' }, modalGoalTitleActive: { fontWeight: '600', color: '#1C1C1E' }, extendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 }, extendBtn: { flex: 1, backgroundColor: '#F2F2F7', paddingVertical: 8, borderRadius: 6, alignItems: 'center' }, extendBtnText: { fontSize: 12, fontWeight: '600', color: '#555' },
  
  festivalSection: { marginTop: 10, padding: 12, backgroundColor: '#F9F9F9', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' }, festivalTitle: { fontSize: 10, fontWeight: '800', color: '#8E8E93', marginBottom: 8, letterSpacing: 0.5 }, festivalInput: { backgroundColor: '#fff', borderRadius: 6, padding: 8, fontSize: 13, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 10 }, colorRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' }, colorCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E5E5EA' }, colorSelected: { borderColor: '#1C1C1E', borderWidth: 3 },
  okBtn: { backgroundColor: '#E5E5EA', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 }, verifyBtnColor: { backgroundColor: '#34C759' }, okBtnText: { fontSize: 14, fontWeight: '800', color: '#1C1C1E' }
});