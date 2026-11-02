import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Modal, Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LifeContext } from '../context/LifeContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets(); 
  // Context updated (no crew logic)
  const { profile, setProfile, selectedYear, setSelectedYear, taggedDays, setTaggedDays, goals, setGoals, colorPalette, weekendNotes, setWeekendNotes, extendedWeekends, setExtendedWeekends, yearlyNotes, setYearlyNotes, monthlyNotes, setMonthlyNotes, googleAuth, setGoogleAuth, loadCloudData, syncToCloud, username, setUsername, customLists } = useContext(LifeContext);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [tempUsername, setTempUsername] = useState(username); 
  const [dob, setDob] = useState(profile.dob);
  const [lifespan, setLifespan] = useState(String(profile.lifespan));
  const [emailInput, setEmailInput] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateObj, setTempDateObj] = useState(new Date(profile.dob));

  const [editAlarmId, setEditAlarmId] = useState(null);
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmMsg, setAlarmMsg] = useState('');
  const [showAlarmPicker, setShowAlarmPicker] = useState(false);
  const [alarmDateObj, setAlarmDateObj] = useState(new Date());

  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(''); 
  const availableColors = colorPalette.filter(color => !goals.some(g => g.color === color));

  React.useEffect(() => {
    if (availableColors.length > 0 && !newColor) setNewColor(availableColors[0]);
  }, [availableColors]);

  const handleAddGoal = () => {
    if (!newTitle.trim()) return Alert.alert('Error', 'Enter goal title.');
    if (availableColors.length === 0) return Alert.alert('Limit Reached', 'All 10 colors used!');
    const newGoal = { id: Date.now().toString(), title: newTitle, color: newColor || availableColors[0] };
    setGoals([...goals, newGoal]); 
    setNewTitle('');
    setNewColor('');
  };

  const deleteGoal = (id) => setGoals(goals.filter(g => g.id !== id));
  const moveGoalUp = (index) => {
    if (index === 0) return;
    const newGoals = [...goals];
    [newGoals[index - 1], newGoals[index]] = [newGoals[index], newGoals[index - 1]];
    setGoals(newGoals);
  };
  const moveGoalDown = (index) => {
    if (index === goals.length - 1) return;
    const newGoals = [...goals];
    [newGoals[index + 1], newGoals[index]] = [newGoals[index], newGoals[index + 1]];
    setGoals(newGoals);
  };

  const dobYear = parseInt(dob.split('-')[0]) || 1990;
  const maxYear = dobYear + (parseInt(lifespan) || 70);

  const handleSave = () => {
    setProfile({ ...profile, name, dob, lifespan: parseInt(lifespan) || 70 });
    if (tempUsername) {
      const formattedUsername = tempUsername.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
      setUsername(formattedUsername);
    }
    setIsEditing(false);
    if (selectedYear < dobYear || selectedYear > maxYear) setSelectedYear(new Date().getFullYear());
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTempDateObj(selectedDate);
      setDob(`${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`);
    }
  };

  const pickImage = async () => {
    if (!isEditing) return;
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.2 });
    if (!result.canceled) setProfile({ ...profile, dp: result.assets[0].uri });
  };

  const changeYear = (dir) => {
    const nextYear = selectedYear + dir;
    if (nextYear >= dobYear && nextYear <= maxYear) setSelectedYear(nextYear);
  };

  const applyImportedData = (data) => {
    if (data.profile) setProfile(data.profile);
    if (data.taggedDays) setTaggedDays(data.taggedDays);
    if (data.goals) setGoals(data.goals);
    if (data.weekendNotes) setWeekendNotes(data.weekendNotes);
    if (data.extendedWeekends) setExtendedWeekends(data.extendedWeekends);
    if (data.yearlyNotes) setYearlyNotes(data.yearlyNotes);
    if (data.monthlyNotes) setMonthlyNotes(data.monthlyNotes);
    Alert.alert("Success", "Data completely imported!");
  };

  const exportData = async () => {
    const data = JSON.stringify({ profile, taggedDays, goals, weekendNotes, extendedWeekends, yearlyNotes, monthlyNotes, customLists });
    if (Platform.OS === 'web') {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'LifePlanner_Backup.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); Alert.alert("Success", "Backup downloaded locally.");
    } else { try { await Share.share({ message: data, title: 'LifePlanner Backup Data' }); } catch (error) { Alert.alert("Error", "Export failed."); } }
  };

  const importData = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/json'; input.onchange = e => { const file = e.target.files[0]; const reader = new FileReader(); reader.onload = event => { try { const data = JSON.parse(event.target.result); applyImportedData(data); } catch(err) { Alert.alert("Error", "Invalid file format."); } }; reader.readAsText(file); }; input.click();
    } else { setShowImportModal(true); }
  };

  const handleTextImport = () => { try { const data = JSON.parse(importText); applyImportedData(data); setShowImportModal(false); setImportText(''); } catch(e) { Alert.alert("Error", "Invalid Backup Data. Please paste correct JSON text."); } };

  const handleGoogleLogin = async () => {
    if (emailInput.includes('@')) { const email = emailInput.trim(); const hasData = await loadCloudData(email); if (hasData) { Alert.alert("Google Login Success", `Welcome back! Timeline restored from ${email}.`); setGoogleAuth({ email, lastSync: new Date().toISOString() }); } else { await syncToCloud(email); Alert.alert("Google Login Success", `Account connected. Current data synced to ${email}.`); } setShowEmailModal(false); } else { Alert.alert("Invalid Email", "Please enter a valid Google email."); }
  };

  const manualSync = async () => { if(googleAuth.email) { await syncToCloud(googleAuth.email); Alert.alert("Synced", "Timeline successfully synced with Google Cloud."); } };
  const disconnectGoogle = () => { setGoogleAuth({ email: null, lastSync: null }); setEmailInput(''); };
  const formatDate = (isoString) => { if (!isoString) return ''; const d = new Date(isoString); return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} at ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`; };

  const alarms = Object.entries(taggedDays).filter(([date, data]) => data.reminder).map(([date, data]) => ({ date, ...data.reminder })).sort((a, b) => a.date.localeCompare(b.date));
  const openAlarmModal = (alarm) => { setEditAlarmId(alarm.date); setAlarmTime(alarm.time); setAlarmMsg(alarm.msg); };
  const onAlarmTimeChange = (e, sel) => { setShowAlarmPicker(false); if (sel) { setAlarmDateObj(sel); let h = sel.getHours(); let m = sel.getMinutes(); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; m = m < 10 ? '0'+m : m; setAlarmTime(`${h}:${m} ${ampm}`); } };
  const saveEditedAlarm = () => { if (!alarmTime || !alarmMsg.trim()) { Alert.alert('Invalid Alarm', 'Time and Message required.'); return; } setTaggedDays(prev => ({ ...prev, [editAlarmId]: { ...prev[editAlarmId], reminder: { time: alarmTime, msg: alarmMsg } } })); setEditAlarmId(null); };
  const deleteAlarm = (id) => { setTaggedDays(prev => ({ ...prev, [id]: { ...prev[id], reminder: null } })); setEditAlarmId(null); };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* PROFILE INFO CARD */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.dpWrapper}>
              <TouchableOpacity onPress={pickImage} activeOpacity={isEditing ? 0.6 : 1}>
                {profile.dp ? <Image source={{ uri: profile.dp }} style={styles.avatar} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text></View>}
              </TouchableOpacity>
              {isEditing && <View style={styles.dpEditBadge}><Text style={styles.dpEditIcon}>📷</Text></View>}
            </View>
            <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)} style={styles.editBtn}><Text style={styles.editBtnText}>{isEditing ? 'Save ✅' : 'Edit ✏️'}</Text></TouchableOpacity>
          </View>
          
          <View style={styles.fieldRow}><Text style={styles.label}>Name</Text>{isEditing ? <TextInput style={styles.input} value={name} onChangeText={setName} /> : <Text style={styles.valueText}>{profile.name}</Text>}</View>
          
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Username</Text>
            {isEditing ? (
              <TextInput style={styles.input} value={tempUsername} onChangeText={setTempUsername} placeholder="@username (lowercase only)" autoCapitalize="none" />
            ) : (
              <Text style={[styles.valueText, {color: '#007AFF'}]}>{username ? `@${username}` : 'Not set'}</Text>
            )}
          </View>

          <View style={styles.fieldRow}><Text style={styles.label}>Date of Birth</Text>{isEditing ? (<TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}><Text style={styles.inputText}>{dob}</Text></TouchableOpacity>) : <Text style={styles.valueText}>{dob.split('-').reverse().join(' - ')}</Text>}</View>
          <View style={styles.fieldRow}><Text style={styles.label}>Expected Lifespan (Years)</Text>{isEditing ? <TextInput style={styles.input} value={lifespan} onChangeText={setLifespan} keyboardType="numeric" /> : <Text style={styles.valueText}>{profile.lifespan} Years</Text>}</View>
        </View>

        {/* MY GOALS CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>My Goals</Text>
          <View style={styles.goalInputRow}>
            <TextInput style={styles.goalInput} placeholder="Add a new goal..." placeholderTextColor="#999" value={newTitle} onChangeText={setNewTitle} />
            <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}><Text style={styles.addBtnText}>ADD</Text></TouchableOpacity>
          </View>
          <View style={styles.goalColorRow}>
            {colorPalette.map(color => {
              const isTaken = goals.some(g => g.color === color);
              if (isTaken) return null; 
              return (<TouchableOpacity key={color} style={[styles.goalColorCircle, { backgroundColor: color }, newColor === color && styles.selectedColor]} onPress={() => setNewColor(color)} />);
            })}
          </View>
          <Text style={styles.listTitle}>Top = Highest Priority</Text>
          {goals.map((goal, index) => (
            <View key={goal.id} style={styles.goalRowItem}>
              <View style={styles.reorderControls}>
                <TouchableOpacity onPress={() => moveGoalUp(index)} disabled={index === 0}><Text style={[styles.goalArrow, index === 0 && styles.disabledArrow]}>▲</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => moveGoalDown(index)} disabled={index === goals.length - 1}><Text style={[styles.goalArrow, index === goals.length - 1 && styles.disabledArrow]}>▼</Text></TouchableOpacity>
              </View>
              <View style={[styles.goalColorIndicator, { backgroundColor: goal.color }]} />
              <Text style={styles.goalTitleTxt}>{goal.title}</Text>
              <TouchableOpacity onPress={() => deleteGoal(goal.id)} style={styles.deleteBtn}><Text style={styles.deleteText}>×</Text></TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}><Text style={styles.sectionHeader}>App Settings</Text><View style={styles.settingRow}><Text style={styles.settingLabel}>Active Viewing Year</Text><View style={styles.yearToggler}><TouchableOpacity onPress={() => changeYear(-1)}><Text style={styles.arrow}>{'<'}</Text></TouchableOpacity><Text style={styles.navYear}>{selectedYear}</Text><TouchableOpacity onPress={() => changeYear(1)}><Text style={styles.arrow}>{'>'}</Text></TouchableOpacity></View></View><Text style={styles.hint}>Changing this updates the calendar view across all pages.</Text></View>
        <View style={styles.card}><Text style={styles.sectionHeader}>Data & Sync</Text>{!googleAuth.email ? (<TouchableOpacity style={styles.googleBtn} onPress={() => setShowEmailModal(true)}><Text style={styles.googleBtnTxt}>G  Sign in with Google</Text></TouchableOpacity>) : (<View style={styles.syncDetailsBox}><Text style={styles.syncEmailTxt}>Connected: {googleAuth.email}</Text><Text style={styles.syncDateTxt}>Last Synced: {formatDate(googleAuth.lastSync)}</Text><View style={{flexDirection: 'row', gap: 10, marginTop: 12}}><TouchableOpacity style={[styles.syncActionBtn, {backgroundColor: '#E5F1FF', flex: 1}]} onPress={manualSync}><Text style={{color: '#007AFF', fontWeight: '800', fontSize: 12, textAlign: 'center'}}>Sync Now</Text></TouchableOpacity><TouchableOpacity style={[styles.syncActionBtn, {backgroundColor: '#FDECEF', flex: 1}]} onPress={disconnectGoogle}><Text style={{color: '#FF3B30', fontWeight: '800', fontSize: 12, textAlign: 'center'}}>Disconnect</Text></TouchableOpacity></View></View>)}<View style={styles.localSyncRow}><TouchableOpacity style={[styles.syncBtnMain, {flex:1, marginRight: 5, backgroundColor: '#E5F1FF'}]} onPress={exportData}><Text style={[styles.syncBtnTxt, {color: '#007AFF'}]}>📤 Export Backup</Text></TouchableOpacity><TouchableOpacity style={[styles.syncBtnMain, {flex:1, marginLeft: 5, backgroundColor: '#E5F1FF'}]} onPress={importData}><Text style={[styles.syncBtnTxt, {color: '#007AFF'}]}>📥 Import Backup</Text></TouchableOpacity></View><Text style={styles.hint}>Weekly auto-sync is active while logged in.</Text></View>
        <View style={styles.card}><Text style={styles.sectionHeader}>Active Alarms</Text>{alarms.length === 0 ? (<Text style={styles.hint}>No active alarms set right now.</Text>) : (alarms.map((alarm, idx) => (<View key={idx} style={styles.alarmRow}><View style={{flex: 1}}><Text style={styles.alarmDate}>{alarm.date.split('-').reverse().join('-')}</Text><Text style={styles.alarmMsg}>"{alarm.msg}" at {alarm.time}</Text></View><TouchableOpacity style={styles.alarmEditBtn} onPress={() => openAlarmModal(alarm)}><Text style={styles.alarmEditTxt}>Modify</Text></TouchableOpacity></View>)))}</View>

        {showDatePicker && <DateTimePicker value={tempDateObj} mode="date" display="default" onChange={onDateChange} />}
        <Modal visible={showImportModal} transparent={true} animationType="fade"><View style={styles.modalBg}><View style={[styles.modalCard, { width: 320 }]}><Text style={styles.modalTitle}>Import Backup</Text><Text style={{fontSize: 12, color: '#666', marginBottom: 15, textAlign: 'center'}}>Paste your exported backup JSON text here to restore your data.</Text><TextInput style={[styles.input, { height: 100, textAlignVertical: 'top', marginBottom: 20 }]} placeholder="Paste backup text here..." multiline value={importText} onChangeText={setImportText} /><View style={styles.modalBtns}><TouchableOpacity style={{padding: 10, flex: 1, alignItems: 'center'}} onPress={() => setShowImportModal(false)}><Text style={{fontWeight: 'bold', color: '#555'}}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.saveBtn, {flex: 1, alignItems: 'center'}]} onPress={handleTextImport}><Text style={{fontWeight: 'bold', color: '#fff'}}>Import Data</Text></TouchableOpacity></View></View></View></Modal>
        <Modal visible={!!editAlarmId} transparent={true} animationType="fade"><View style={styles.modalBg}><View style={styles.modalCard}><Text style={styles.modalTitle}>Modify Alarm</Text><TouchableOpacity onPress={() => setShowAlarmPicker(true)}><View pointerEvents="none"><TextInput style={styles.input} value={alarmTime} editable={false} /></View></TouchableOpacity><TextInput style={[styles.input, {marginTop: 10, marginBottom: 20}]} placeholder="Message" value={alarmMsg} onChangeText={setAlarmMsg} /><View style={styles.modalBtns}><TouchableOpacity style={styles.delBtn} onPress={() => deleteAlarm(editAlarmId)}><Text style={styles.delTxt}>Delete</Text></TouchableOpacity><View style={{flexDirection: 'row', gap: 10}}><TouchableOpacity style={{padding: 10}} onPress={() => setEditAlarmId(null)}><Text style={{fontWeight: 'bold', color: '#555'}}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.saveBtn} onPress={saveEditedAlarm}><Text style={{fontWeight: 'bold', color: '#fff'}}>Save</Text></TouchableOpacity></View></View>{showAlarmPicker && <DateTimePicker value={alarmDateObj} mode="time" display="default" onChange={onAlarmTimeChange} />}</View></View></Modal>
        <Modal visible={showEmailModal} transparent={true} animationType="fade"><View style={styles.modalBg}><View style={styles.modalCard}><Text style={styles.modalTitle}>Google Secure Login</Text><Text style={{fontSize: 12, color: '#666', marginBottom: 15, textAlign: 'center'}}>Sign in to sync your timeline across devices securely.</Text><TextInput style={[styles.input, {marginBottom: 20}]} placeholder="Enter Google Email..." keyboardType="email-address" autoCapitalize="none" value={emailInput} onChangeText={setEmailInput} /><View style={styles.modalBtns}><TouchableOpacity style={{padding: 10, flex: 1, alignItems: 'center'}} onPress={() => setShowEmailModal(false)}><Text style={{fontWeight: 'bold', color: '#555'}}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.saveBtn, {flex: 1, alignItems: 'center'}]} onPress={handleGoogleLogin}><Text style={{fontWeight: 'bold', color: '#fff'}}>Sign In</Text></TouchableOpacity></View></View></View></Modal>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flexGrow: 1, padding: 15, paddingBottom: 50 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 }, dpWrapper: { position: 'relative' }, avatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#D1D1D6', justifyContent: 'center', alignItems: 'center' }, avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' }, dpEditBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#fff', borderRadius: 12, padding: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }, dpEditIcon: { fontSize: 12 }, editBtn: { backgroundColor: '#E5F1FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }, editBtnText: { color: '#007AFF', fontWeight: '700', fontSize: 13 },
  fieldRow: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 10 }, label: { fontSize: 11, fontWeight: '700', color: '#8E8E93', marginBottom: 5, textTransform: 'uppercase' }, valueText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginTop: 5 }, input: { backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 15, color: '#1C1C1E' }, dateInput: { backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 12, height: 40, justifyContent: 'center' }, inputText: { fontSize: 15, color: '#1C1C1E' },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', marginBottom: 15 }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, settingLabel: { fontSize: 14, fontWeight: '600', color: '#333' }, yearToggler: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 8 }, arrow: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', paddingHorizontal: 12, paddingVertical: 6 }, navYear: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' }, hint: { fontSize: 11, color: '#A1A1A6', marginTop: 10, fontStyle: 'italic' },
  googleBtn: { backgroundColor: '#1C1C1E', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 }, googleBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 }, syncDetailsBox: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 15 }, syncEmailTxt: { fontSize: 13, fontWeight: '800', color: '#1C1C1E', marginBottom: 2 }, syncDateTxt: { fontSize: 11, color: '#8E8E93', fontStyle: 'italic' }, syncActionBtn: { paddingVertical: 8, borderRadius: 6 }, syncBtnMain: { backgroundColor: '#F2F2F7', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 }, localSyncRow: { flexDirection: 'row', justifyContent: 'space-between' }, syncBtnTxt: { fontSize: 13, fontWeight: '800', color: '#1C1C1E' }, alarmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingBottom: 10, marginBottom: 10 }, alarmDate: { fontSize: 12, fontWeight: '800', color: '#8E8E93', marginBottom: 2 }, alarmMsg: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' }, alarmEditBtn: { backgroundColor: '#F2F2F7', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }, alarmEditTxt: { fontSize: 12, fontWeight: '600', color: '#007AFF' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, width: 280 }, modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign:'center' }, modalBtns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, delBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 }, delTxt: { color: '#fff', fontWeight: 'bold' }, saveBtn: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, goalInput: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 12, height: 38, fontSize: 14, color: '#333' }, addButton: { marginLeft: 10, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 15, height: 38, justifyContent: 'center' }, addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' }, goalColorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }, goalColorCircle: { width: 24, height: 24, borderRadius: 12 }, selectedColor: { borderWidth: 2, borderColor: '#333' }, listTitle: { fontSize: 11, fontWeight: '600', color: '#8E8E93', marginBottom: 5, textTransform: 'uppercase', paddingLeft: 5 }, goalRowItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#E5E5EA' }, reorderControls: { alignItems: 'center', marginRight: 12 }, goalArrow: { fontSize: 11, color: '#007AFF', paddingHorizontal: 5, paddingVertical: 1, fontWeight: 'bold' }, disabledArrow: { color: '#E5E5EA' }, goalColorIndicator: { width: 14, height: 14, borderRadius: 4, marginRight: 12 }, goalTitleTxt: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1C1C1E' }, deleteBtn: { paddingHorizontal: 5 }, deleteText: { color: '#FF3B30', fontSize: 20, fontWeight: '400' }
});