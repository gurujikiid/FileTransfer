import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LifeContext } from '../context/LifeContext';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { goals, setGoals, colorPalette } = useContext(LifeContext);
  
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(''); 

  const availableColors = colorPalette.filter(color => !goals.some(g => g.color === color));

  // Auto-select color if available
  useEffect(() => {
    if (availableColors.length > 0 && !newColor) setNewColor(availableColors[0]);
  }, [availableColors]);

  const handleAddGoal = () => {
    if (!newTitle.trim()) return Alert.alert('Error', 'Enter goal title.');
    if (availableColors.length === 0) return Alert.alert('Limit Reached', 'All 10 colors used!');

    const newGoal = {
      id: Date.now().toString(),
      title: newTitle,
      color: newColor || availableColors[0]
    };

    setGoals([...goals, newGoal]); // Naya goal list me sabse niche (Lowest priority) add hoga
    setNewTitle('');
    setNewColor('');
  };

  const deleteGoal = (id) => setGoals(goals.filter(g => g.id !== id));

  // Re-ordering logic for Priority
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

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.singleLineHeader}>
        <Text style={styles.screenTitle}>My Goals</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* MODERN ADD SECTION */}
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              placeholder="Add a new goal..." 
              value={newTitle} 
              onChangeText={setNewTitle} 
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddGoal}>
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.colorRow}>
            {colorPalette.map(color => {
              const isTaken = goals.some(g => g.color === color);
              if (isTaken) return null; 
              return (
                <TouchableOpacity 
                  key={color} 
                  style={[styles.colorCircle, { backgroundColor: color }, newColor === color && styles.selectedColor]} 
                  onPress={() => setNewColor(color)} 
                />
              );
            })}
          </View>
        </View>

        {/* MODERN PRIORITY LIST SECTION */}
        <Text style={styles.listTitle}>Top = Highest Priority</Text>
        
        {goals.map((goal, index) => (
          <View key={goal.id} style={styles.goalRow}>
            
            {/* Priority Controls (Up / Down) */}
            <View style={styles.reorderControls}>
              <TouchableOpacity onPress={() => moveGoalUp(index)} disabled={index === 0}>
                <Text style={[styles.arrow, index === 0 && styles.disabledArrow]}>▲</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => moveGoalDown(index)} disabled={index === goals.length - 1}>
                <Text style={[styles.arrow, index === goals.length - 1 && styles.disabledArrow]}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.goalColorIndicator, { backgroundColor: goal.color }]} />
            
            <Text style={styles.goalTitle}>{goal.title}</Text>
            
            <TouchableOpacity onPress={() => deleteGoal(goal.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F2F2F7' },
  singleLineHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingVertical: 12, paddingHorizontal: 15 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  
  container: { padding: 10, paddingBottom: 50, flexGrow: 1 }, 
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 12, height: 38, fontSize: 14, color: '#333' },
  addButton: { marginLeft: 10, backgroundColor: '#007AFF', borderRadius: 8, paddingHorizontal: 15, height: 38, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorCircle: { width: 24, height: 24, borderRadius: 12 },
  selectedColor: { borderWidth: 2, borderColor: '#333' },
  
  listTitle: { fontSize: 11, fontWeight: '600', color: '#8E8E93', marginBottom: 5, textTransform: 'uppercase', paddingLeft: 5 },
  goalRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6 },
  
  reorderControls: { alignItems: 'center', marginRight: 12 },
  arrow: { fontSize: 14, color: '#007AFF', paddingHorizontal: 5, fontWeight: 'bold' },
  disabledArrow: { color: '#E5E5EA' },
  
  goalColorIndicator: { width: 14, height: 14, borderRadius: 4, marginRight: 12 },
  goalTitle: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  deleteBtn: { paddingHorizontal: 5 },
  deleteText: { color: '#FF3B30', fontSize: 20, fontWeight: '400' }
});