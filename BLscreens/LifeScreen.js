import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LifeContext } from '../context/LifeContext';

const BlinkingDot = () => {
  const anim = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.2, duration: 600, useNativeDriver: true })
    ])).start();
  }, []);
  return <Animated.View style={[styles.blinkingDot, { opacity: anim }]} />;
};

const WaterMonth = ({ monthStr, progressFill, isPast, isCurrent, hasNote, onPress }) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (progressFill > 0 && progressFill < 100) {
      Animated.loop(Animated.timing(anim1, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })).start();
      Animated.loop(Animated.timing(anim2, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true })).start();
    }
  }, [progressFill]);

  const transX1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });
  const transX2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }); 
  
  const bg = isPast ? '#3A3A3C' : '#E5E5EA'; 
  const textColor = (progressFill > 45 || isPast) ? '#fff' : '#8E8E93';

  return (
    <TouchableOpacity onPress={onPress} style={[styles.monthCard, { backgroundColor: bg }]}>
      <View style={styles.tankContainer}>
        {progressFill > 0 && progressFill < 100 && (
          <>
            <Animated.View style={{ transform: [{ translateX: transX2 }], position: 'absolute', bottom: `${progressFill}%`, marginBottom: -2, left: 0, width: '200%', height: 12, opacity: 0.6 }}>
              <Svg width="100%" height="100%" viewBox="0 0 80 12" preserveAspectRatio="none"><Path d="M0 5 Q 10 0, 20 5 T 40 5 T 60 5 T 80 5 V 12 H 0 Z" fill="#60a5fa" /></Svg>
            </Animated.View>
            <Animated.View style={{ transform: [{ translateX: transX1 }], position: 'absolute', bottom: `${progressFill}%`, marginBottom: -2, left: 0, width: '200%', height: 12, opacity: 1 }}>
              <Svg width="100%" height="100%" viewBox="0 0 80 12" preserveAspectRatio="none"><Path d="M0 5 Q 10 10, 20 5 T 40 5 T 60 5 T 80 5 V 12 H 0 Z" fill="#3b82f6" /></Svg>
            </Animated.View>
          </>
        )}
        <View style={[styles.waterFill, { height: `${progressFill}%` }]} />
        <View style={styles.tankOverlay}>
          <Text style={[styles.monthText, { color: textColor }]}>{monthStr}</Text>
        </View>
      </View>
      {hasNote && <View style={styles.noteIndicatorDot} />}
    </TouchableOpacity>
  );
};

export default function LifeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, selectedYear, yearlyNotes, setYearlyNotes, monthlyNotes, setMonthlyNotes, taggedDays } = useContext(LifeContext);

  const [modalType, setModalType] = useState(null); 
  const [activeId, setActiveId] = useState(null); 
  const [tempNote, setTempNote] = useState('');

  const currentActualYear = new Date().getFullYear();
  const currentActualMonth = new Date().getMonth(); 
  const dobYear = parseInt(profile.dob.split('-')[0]) || 1990;
  
  const currentAge = Math.max(0, currentActualYear - dobYear);
  const lifeLeftPercent = Math.max(0, 100 - Math.round((currentAge / profile.lifespan) * 100));

  const lifeYears = Array.from({ length: profile.lifespan }, (_, i) => i + 1);
  const yearMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const lifeRows = [];
  for (let i = 0; i < lifeYears.length; i += 10) {
    lifeRows.push(lifeYears.slice(i, i + 10));
  }

  const getMonthLiveProgress = (monthIndex) => {
    let totalWeekends = 0, coloredWeekends = 0;
    let date = new Date(selectedYear, monthIndex, 1);
    while(date.getMonth() === monthIndex) {
      if(date.getDay() === 6) { 
        totalWeekends++;
        const satStr = `${selectedYear}-${String(monthIndex+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        const sunDate = new Date(date); sunDate.setDate(sunDate.getDate() + 1);
        const sunStr = `${sunDate.getFullYear()}-${String(sunDate.getMonth()+1).padStart(2,'0')}-${String(sunDate.getDate()).padStart(2,'0')}`;
        const satHasGoals = taggedDays[satStr]?.goals?.length > 0;
        const sunHasGoals = taggedDays[sunStr]?.goals?.length > 0;
        if(satHasGoals || sunHasGoals) coloredWeekends++;
      }
      date.setDate(date.getDate()+1);
    }
    if (totalWeekends === 0) return 0;
    return Math.round((coloredWeekends / totalWeekends) * 100);
  };

  const openModal = (type, id) => { setModalType(type); setActiveId(id); setTempNote(type === 'year' ? (yearlyNotes[id] || '') : (monthlyNotes[id] || '')); };
  const saveNote = () => { if (modalType === 'year') setYearlyNotes(p => ({ ...p, [activeId]: tempNote })); if (modalType === 'month') setMonthlyNotes(p => ({ ...p, [activeId]: tempNote })); setModalType(null); };

  const hierarchicalChronicle = useMemo(() => {
    const data = [];
    for (let y = dobYear; y <= dobYear + profile.lifespan; y++) {
      const yNote = yearlyNotes[y];
      const mNotes = Object.keys(monthlyNotes).filter(k => k.startsWith(String(y))).map(k => ({ mId: k, note: monthlyNotes[k], isCurrentMonth: false }));
      
      let isCurrentYear = (y === currentActualYear);
      if (isCurrentYear) {
        const currMId = `${y}-${String(currentActualMonth + 1).padStart(2, '0')}`;
        const existing = mNotes.find(m => m.mId === currMId);
        if (existing) {
          existing.isCurrentMonth = true;
        } else {
          mNotes.push({ mId: currMId, note: '', isCurrentMonth: true });
        }
        mNotes.sort((a, b) => parseInt(a.mId.split('-')[1]) - parseInt(b.mId.split('-')[1]));
      }

      let hasData = yNote || mNotes.length > 0;
      if (hasData) {
        data.push({ year: y, yearNote: yNote, months: mNotes });
      }
    }
    data.forEach((item, idx) => {
      if (idx === 0) item.gap = 0;
      else item.gap = item.year - data[idx - 1].year;
    });
    return data;
  }, [yearlyNotes, monthlyNotes, dobYear, profile.lifespan, currentActualYear, currentActualMonth]);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View><Text style={styles.headerTitle}>The Life Map</Text><Text style={styles.subtext}>Age: {currentAge} / {profile.lifespan}</Text></View>
            <Text style={styles.statVal}>{lifeLeftPercent}% Left</Text>
          </View>
          <View style={styles.loadingBarBg}><View style={[styles.loadingBarFill, { width: `${100 - lifeLeftPercent}%` }]} /></View>

          <View style={styles.gridContainer}>
            {lifeRows.map((row, rIdx) => (
              <View key={rIdx} style={styles.lifeRow}>
                <View style={styles.boxesRow}>
                  {row.map(yearSpan => {
                    const actualYear = dobYear + yearSpan;
                    const isPast = actualYear < currentActualYear;
                    const isCurrent = actualYear === currentActualYear;
                    const hasNote = !!yearlyNotes[actualYear];
                    return (
                      <TouchableOpacity key={yearSpan} onPress={() => openModal('year', actualYear)}
                        style={[styles.box, isPast ? styles.boxPast : styles.boxFuture, isCurrent && styles.boxCurrent, hasNote && styles.boxHasNote]}>
                        <Text style={styles.boxNumber}>{yearSpan}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.rowLabel}>{dobYear + row[row.length - 1]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View><Text style={styles.headerTitle}>Chapter {selectedYear}</Text><Text style={styles.subtext}>Execution ratio of weekends filled.</Text></View>
          </View>

          <View style={styles.monthsGrid}>
            {yearMonths.map((monthStr, index) => {
              const progressFill = getMonthLiveProgress(index);
              const isPast = selectedYear < currentActualYear || (selectedYear === currentActualYear && index < currentActualMonth);
              const isCurrent = selectedYear === currentActualYear && index === currentActualMonth;
              const monthId = `${selectedYear}-${String(index + 1).padStart(2,'0')}`;
              return (
                <WaterMonth key={monthStr} monthStr={monthStr} progressFill={progressFill} isPast={isPast} isCurrent={isCurrent} hasNote={!!monthlyNotes[monthId]} onPress={() => openModal('month', monthId)} />
              );
            })}
          </View>
        </View>

        {hierarchicalChronicle.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.headerTitle}>The Chronicle</Text>
            <Text style={styles.subtext}>Your grouped ancestral life map.</Text>
            
            <View style={styles.timelineContainer}>
              {hierarchicalChronicle.map((item, idx) => (
                <View key={item.year} style={[styles.yearBlock, idx > 0 && item.gap > 1 ? { paddingTop: Math.min((item.gap - 1) * 20, 100) } : {}]}>
                  
                  <View style={styles.yearNodeRow}>
                    <View style={styles.goldDot} />
                    <Text style={styles.hierarchyYearTitle}>{item.year} (Age {item.year - dobYear}){item.yearNote ? <Text style={styles.yearNoteInline}> — {item.yearNote}</Text> : ''}</Text>
                  </View>

                  {item.months.map(m => {
                    const mNum = parseInt(m.mId.split('-')[1]);
                    return (
                      <View key={m.mId} style={styles.nestedMonthRow}>
                        <View style={styles.childLine} />
                        {m.isCurrentMonth ? <BlinkingDot /> : <View style={styles.blueDot} />}
                        <View style={{flex: 1}}>
                          <Text style={styles.hierarchyMonthTitle}>
                            {yearMonths[mNum - 1]} {item.year} 
                            {m.note ? <Text style={styles.hierarchyMonthNote}> — {m.note}</Text> : null}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}

        <Modal visible={!!modalType} transparent animationType="fade"><View style={styles.modalBg}><View style={styles.modalCard}><Text style={styles.modalTitle}>{modalType === 'year' ? `Year ${activeId} Log` : `${activeId} Log`}</Text><TextInput style={styles.modalInput} placeholder="Document a memory..." multiline value={tempNote} onChangeText={setTempNote} /><View style={styles.modalBtns}><TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}><Text style={styles.cancelTxt}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.saveBtn} onPress={saveNote}><Text style={styles.saveTxt}>Save</Text></TouchableOpacity></View></View></View></Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 15, paddingBottom: 50 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  subtext: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  statVal: { fontSize: 13, fontWeight: '800', color: '#007AFF', backgroundColor: '#E5F1FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  loadingBarBg: { height: 6, backgroundColor: '#E5E5EA', borderRadius: 3, marginBottom: 15, overflow: 'hidden' },
  loadingBarFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 3 },

  gridContainer: { flexDirection: 'column', gap: 5 },
  lifeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  boxesRow: { flexDirection: 'row', gap: 5, flex: 1, paddingRight: 8 },
  box: { flex: 1, aspectRatio: 1, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, 
  rowLabel: { fontSize: 10, fontWeight: '700', color: '#A1A1A6', width: 35, textAlign: 'right' },
  boxNumber: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
  boxPast: { backgroundColor: '#4A4A4A' }, 
  boxFuture: { backgroundColor: '#E5E5EA' }, 
  boxCurrent: { backgroundColor: '#007AFF', borderWidth: 2, borderColor: '#CDE1FF' },
  boxHasNote: { backgroundColor: '#FFCC00' }, 

  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginTop: 5 },
  monthCard: { width: '22%', marginBottom: 12, position: 'relative', borderRadius: 10, overflow: 'hidden' },
  tankContainer: { height: 50, width: '100%', justifyContent: 'flex-end', position: 'relative' },
  waterFill: { backgroundColor: '#3b82f6', width: '100%' }, 
  tankOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 3 },
  monthText: { fontSize: 12, fontWeight: '800' },
  noteIndicatorDot: { position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFCC00', zIndex: 5 },

  timelineContainer: { marginTop: 15, paddingLeft: 10 },
  yearBlock: { borderLeftWidth: 2, borderLeftColor: '#E5E5EA', paddingBottom: 25 },
  yearNodeRow: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: -7, top: -2 }, 
  goldDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFCC00', marginRight: 10, borderWidth: 2, borderColor: '#fff' },
  hierarchyYearTitle: { fontSize: 14, fontWeight: '800', color: '#1C1C1E', flex: 1, marginTop: -2 },
  yearNoteInline: { fontSize: 13, color: '#666', fontWeight: '400', fontStyle: 'italic' },
  
  nestedMonthRow: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: 0, marginTop: 15 },
  childLine: { width: 15, height: 2, backgroundColor: '#E5E5EA', marginTop: 8 }, 
  blueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF', marginRight: 10, marginTop: 5, borderWidth: 1.5, borderColor: '#fff' },
  hierarchyMonthTitle: { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  hierarchyMonthNote: { fontSize: 13, color: '#666', fontWeight: '400', fontStyle: 'italic' },

  blinkingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30', marginRight: 9, marginTop: 4, borderWidth: 1.5, borderColor: '#fff', shadowColor: '#FF3B30', shadowOpacity: 0.8, shadowRadius: 4, elevation: 3 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, width: 300 }, modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 }, modalInput: { backgroundColor: '#F2F2F7', borderRadius: 8, height: 100, padding: 10, textAlignVertical: 'top', fontSize: 14, marginBottom: 15 }, modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }, cancelBtn: { padding: 10 }, cancelTxt: { color: '#FF3B30', fontWeight: 'bold' }, saveBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }, saveTxt: { color: '#fff', fontWeight: 'bold' }
});