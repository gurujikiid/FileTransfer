import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Share, Switch, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LifeContext } from '../context/LifeContext';
import { ListContext } from '../context/ListContext';

// =====================================================================
// 1. DECORATIVE BACKGROUND FOR GLASSMORPHISM
// =====================================================================
const GlassBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={styles.bgBase} />
    <View style={[styles.blob, { backgroundColor: '#FFD1FF', top: -100, left: -50, width: 300, height: 300 }]} />
    <View style={[styles.blob, { backgroundColor: '#D4E4FF', top: '30%', right: -100, width: 250, height: 250 }]} />
    <View style={[styles.blob, { backgroundColor: '#E8F5E9', bottom: -50, left: '10%', width: 350, height: 350 }]} />
  </View>
);

// =====================================================================
// 2. SPREADSHEET COMPONENT (TIGHT, CRASH-PROOF TABLE)
// =====================================================================
const SpreadsheetView = ({ listId, onBack, topInset }) => {
  const { customLists, setCustomLists } = useContext(ListContext);
  
  const safeLists = Array.isArray(customLists) ? customLists : [];
  const activeList = safeLists.find(l => l.id === listId);

  const [colMenuVisible, setColMenuVisible] = useState(false);
  const [selectedCol, setSelectedCol] = useState(null);
  const [tempColOptions, setTempColOptions] = useState(''); // For editing dropdown list
  
  const [rowMenuVisible, setRowMenuVisible] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [addColVisible, setAddColVisible] = useState(false);
  
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('Text');
  const [newColOptions, setNewColOptions] = useState(''); // For creating dropdown list
  
  const [tableSettingsVisible, setTableSettingsVisible] = useState(false);
  const [sortConfig, setSortConfig] = useState({ colId: 'serial', asc: true });

  // Pickers State
  const [datePickerData, setDatePickerData] = useState({ visible: false, rowId: null, colId: null, date: new Date() });
  const [dropdownData, setDropdownData] = useState({ visible: false, rowId: null, colId: null, options: [] });

  if (!activeList) return null;

  const safeColumns = Array.isArray(activeList.columns) && activeList.columns.length > 0 
    ? activeList.columns 
    : [
        { id: 'c_title', name: 'Task / Item', type: 'Text', width: 150 },
        { id: 'c_done', name: 'Status', type: 'Checkbox', width: 80 }
      ];

  const safeRows = Array.isArray(activeList.rows) && activeList.rows.length > 0
    ? activeList.rows
    : (Array.isArray(activeList.items) ? activeList.items.map((item, idx) => ({
        id: item.id || `r_${Date.now()}_${idx}`,
        serial: idx + 1,
        cells: { 'c_title': item.text || '', 'c_done': item.checked || false }
      })) : []);

  const safeSettings = activeList.settings || {};
  const wrapText = safeSettings.wrapText === true;
  const hideRowNumber = safeSettings.hideRowNumber === true;
  const showCalculations = safeSettings.showCalculations === true; 
  
  const rawTextSize = Number(safeSettings.textSize);
  const textSize = isNaN(rawTextSize) || rawTextSize < 10 ? 14 : rawTextSize;

  const updateListProperty = (key, val) => {
    setCustomLists(safeLists.map(l => l.id === listId ? { 
      ...l, 
      columns: l.columns || safeColumns, 
      rows: l.rows || safeRows, 
      settings: l.settings || safeSettings,
      [key]: val 
    } : l));
  };

  const updateSetting = (key) => updateListProperty('settings', { ...safeSettings, [key]: !safeSettings[key] });
  const updateTextSize = (change) => updateListProperty('settings', { ...safeSettings, textSize: Math.max(10, Math.min(24, textSize + change)) });
  
  const adjustTableWidth = (change) => {
    const newCols = safeColumns.map(c => ({ ...c, width: Math.max(60, (c.width || 120) + change) }));
    updateListProperty('columns', newCols);
  };

  const updateCell = (rowId, colId, value) => {
    updateListProperty('rows', safeRows.map(row => row.id === rowId ? { ...row, cells: { ...(row.cells || {}), [colId]: value } } : row));
  };

  const openColMenu = (col) => { 
    setSelectedCol(col); 
    setTempColOptions(col.options ? col.options.join(', ') : '');
    setColMenuVisible(true); 
  };
  
  const updateColAttr = (key, val) => {
    updateListProperty('columns', safeColumns.map(c => c.id === selectedCol.id ? { ...c, [key]: val } : c));
    setSelectedCol({ ...selectedCol, [key]: val });
  };

  const saveColEdit = () => {
    if (selectedCol.type === 'Dropdown') {
      const opts = tempColOptions.split(',').map(s => s.trim()).filter(Boolean);
      updateListProperty('columns', safeColumns.map(c => c.id === selectedCol.id ? { ...c, options: opts } : c));
    }
    setColMenuVisible(false);
  };

  const moveCol = (dir) => {
    const idx = safeColumns.findIndex(c => c.id === selectedCol.id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === safeColumns.length - 1)) return;
    const newCols = [...safeColumns];
    [newCols[idx], newCols[idx + dir]] = [newCols[idx + dir], newCols[idx]];
    updateListProperty('columns', newCols);
  };
  const deleteCol = () => { updateListProperty('columns', safeColumns.filter(c => c.id !== selectedCol.id)); setColMenuVisible(false); };
  
  const addColumn = () => {
    if (!newColName.trim()) return Alert.alert('Error', 'Name required');
    const opts = newColType === 'Dropdown' ? newColOptions.split(',').map(s => s.trim()).filter(Boolean) : [];
    updateListProperty('columns', [...safeColumns, { id: 'c_' + Date.now(), name: newColName, type: newColType, width: 120, options: opts }]);
    setAddColVisible(false); setNewColName(''); setNewColType('Text'); setNewColOptions('');
  };

  const addRow = () => {
    const maxSerial = safeRows.reduce((max, r) => Math.max(max, r.serial || 0), 0);
    updateListProperty('rows', [...safeRows, { id: 'r_' + Date.now(), serial: maxSerial + 1, cells: {} }]);
  };
  const openRowMenu = (index) => { setSelectedRowIndex(index); setRowMenuVisible(true); };
  const moveRow = (dir) => {
    const idx = selectedRowIndex;
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === safeRows.length - 1)) return;
    const newRows = [...safeRows];
    [newRows[idx], newRows[idx + dir]] = [newRows[idx + dir], newRows[idx]];
    const tempSerial = newRows[idx].serial;
    newRows[idx].serial = newRows[idx + dir].serial;
    newRows[idx + dir].serial = tempSerial;
    updateListProperty('rows', newRows);
    setSelectedRowIndex(idx + dir);
  };
  const deleteRow = () => { updateListProperty('rows', safeRows.filter((_, i) => i !== selectedRowIndex)); setRowMenuVisible(false); };

  const handleSort = (colId) => {
    const isAsc = sortConfig.colId === colId ? !sortConfig.asc : true;
    setSortConfig({ colId, asc: isAsc });
    const sorted = [...safeRows].sort((a, b) => {
      if (colId === 'serial') return isAsc ? (a.serial||0) - (b.serial||0) : (b.serial||0) - (a.serial||0);
      const cellsA = a.cells || {}; const cellsB = b.cells || {};
      let vA = cellsA[colId] || ''; let vB = cellsB[colId] || '';
      if (typeof vA === 'string') vA = vA.toLowerCase(); if (typeof vB === 'string') vB = vB.toLowerCase();
      if (vA < vB) return isAsc ? -1 : 1; if (vA > vB) return isAsc ? 1 : -1; return 0;
    });
    updateListProperty('rows', sorted);
  };

  const onDateChange = (event, selectedDate) => {
    setDatePickerData({ ...datePickerData, visible: false });
    if (selectedDate) {
      const fmtDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      updateCell(datePickerData.rowId, datePickerData.colId, fmtDate);
    }
  };

  const hasSummableCols = safeColumns.some(c => c.type === 'Number');

  return (
    <View style={[styles.container, { paddingTop: Math.max(topInset, 20) }]}>
      <GlassBackground />
      
      <View style={styles.glassHeader}>
        <TouchableOpacity onPress={onBack} style={{paddingRight: 10}}><Text style={styles.headerActionTxt}>◀ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{activeList.title}</Text>
        <TouchableOpacity onPress={() => setTableSettingsVisible(true)} style={{paddingLeft: 10}}>
          <Text style={{fontSize: 22}}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal={true} style={{flex: 1}} bounces={false}>
        <ScrollView contentContainerStyle={styles.tableScrollY} bounces={false}>
          
          <View style={styles.glassTable}>
            {/* Header Row */}
            <View style={styles.tableHeaderRow}>
              {!hideRowNumber && (
                <TouchableOpacity style={[styles.cellTight, styles.headerCell, { width: 35 }]} onPress={() => handleSort('serial')}>
                  <Text style={[styles.headerCellTxt, {textAlign: 'center'}]}>SN</Text>
                </TouchableOpacity>
              )}
              {safeColumns.map(col => (
                <TouchableOpacity key={col.id} style={[styles.cellTight, styles.headerCell, { width: col.width || 120 }]} onPress={() => openColMenu(col)}>
                  <Text style={[styles.headerCellTxt, {textAlign: 'center'}]} numberOfLines={1}>{col.name}</Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity style={[styles.cellTight, styles.headerCell, { width: 35, alignItems: 'center' }]} onPress={() => setAddColVisible(true)}>
                <Text style={{fontSize: 16, fontWeight: '900', color: '#007AFF'}}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Data Rows */}
            {safeRows.map((row, index) => {
              const cells = row.cells || {};
              return (
                <View key={row.id} style={[styles.tableDataRow, index % 2 === 1 && styles.rowAlt]}>
                  {!hideRowNumber && (
                    <View style={[styles.cellTight, { width: 35, backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                      <Text style={[styles.serialTxt, {fontSize: textSize}]}>{row.serial || index + 1}</Text>
                    </View>
                  )}
                  {safeColumns.map(col => {
                    const val = cells[col.id];
                    let content;
                    
                    if (col.type === 'Checkbox') {
                      content = (
                        <TouchableOpacity style={[styles.glassCheckbox, val && styles.glassCheckboxActive]} onPress={() => updateCell(row.id, col.id, !val)}>
                          {val && <Text style={styles.checkMark}>✓</Text>}
                        </TouchableOpacity>
                      );
                    } else if (col.type === 'Date') {
                      content = (
                        <TouchableOpacity style={styles.cellTouchable} onPress={() => setDatePickerData({ visible: true, rowId: row.id, colId: col.id, date: val ? new Date(val) : new Date() })}>
                          <Text style={[styles.cellTxt, {fontSize: textSize, color: val ? '#1C1C1E' : 'rgba(0,0,0,0.2)'}]}>{val ? val.split('-').reverse().join('/') : 'DD/MM'}</Text>
                        </TouchableOpacity>
                      );
                    } else if (col.type === 'Dropdown') {
                      content = (
                        <TouchableOpacity style={styles.cellTouchable} onPress={() => setDropdownData({ visible: true, rowId: row.id, colId: col.id, options: col.options || [] })}>
                          <Text style={[styles.cellTxt, {fontSize: textSize, color: val ? '#1C1C1E' : 'rgba(0,0,0,0.2)'}]} numberOfLines={1}>{val || 'Select'}</Text>
                        </TouchableOpacity>
                      );
                    } else {
                      const isNumeric = col.type === 'Number';
                      const isLink = col.type === 'Link';
                      content = (
                        <TextInput 
                          style={[styles.cellInput, {
                            fontSize: textSize, textAlign: isNumeric ? 'right' : 'center', color: isLink ? '#007AFF' : '#1C1C1E', textDecorationLine: isLink ? 'underline' : 'none'
                          }]} 
                          value={val !== null && val !== undefined ? String(val) : ''} 
                          onChangeText={(v) => updateCell(row.id, col.id, v)} 
                          placeholder="-" placeholderTextColor="rgba(0,0,0,0.2)" 
                          keyboardType={isNumeric ? 'numeric' : (isLink ? 'url' : 'default')} 
                          autoCapitalize={isLink ? 'none' : 'sentences'}
                          multiline={wrapText} 
                        />
                      );
                    }
                    return <View key={col.id} style={[styles.cellTight, { width: col.width || 120 }]}>{content}</View>;
                  })}
                  <TouchableOpacity style={[styles.cellTight, { width: 35, alignItems: 'center' }]} onPress={() => openRowMenu(index)}>
                    <Text style={{color: 'rgba(0,0,0,0.4)', fontWeight: 'bold', fontSize: 16}}>⋮</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Auto-Sum Footer Row */}
            {safeRows.length > 0 && showCalculations && (
              <View style={[styles.tableDataRow, {backgroundColor: 'rgba(0,0,0,0.06)', borderTopWidth: 2, borderTopColor: 'rgba(0,0,0,0.1)'}]}>
                {!hideRowNumber && <View style={[styles.cellTight, { width: 35 }]}><Text style={[styles.serialTxt, {fontWeight: '900', color: '#1C1C1E', fontSize: 10}]}>Calc</Text></View>}
                {safeColumns.map(col => {
                  let calcContent = '-';
                  if (col.type === 'Number') {
                    const total = safeRows.reduce((acc, row) => acc + (parseFloat((row.cells||{})[col.id]) || 0), 0);
                    calcContent = Math.round(total * 100) / 100;
                  } else if (col.type === 'Checkbox') {
                    const checkedCount = safeRows.filter(row => (row.cells||{})[col.id] === true).length;
                    calcContent = `${checkedCount} ✓`;
                  }
                  return (
                    <View key={'calc_'+col.id} style={[styles.cellTight, { width: col.width || 120, paddingHorizontal: 6 }]}>
                      <Text style={{fontWeight: '900', fontSize: textSize, color: '#1C1C1E', textAlign: col.type === 'Checkbox' ? 'center' : 'right'}}>{calcContent}</Text>
                    </View>
                  );
                })}
                <View style={[styles.cellTight, { width: 35 }]} />
              </View>
            )}

            <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
              <Text style={styles.addRowTxt}>+ New Row</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScrollView>

      {/* NATIVE DATE PICKER */}
      {datePickerData.visible && (
        <DateTimePicker
          value={datePickerData.date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* DROPDOWN OPTIONS MODAL */}
      <Modal visible={dropdownData.visible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalBgCenter} activeOpacity={1} onPress={() => setDropdownData({ ...dropdownData, visible: false })}>
          <View style={styles.glassModal}>
            <Text style={styles.modalTitle}>Select Option</Text>
            <View style={styles.sheetDivider} />
            <ScrollView style={{maxHeight: 250}}>
              {dropdownData.options.map((opt, idx) => (
                <TouchableOpacity key={idx} style={styles.modalListOpt} onPress={() => { updateCell(dropdownData.rowId, dropdownData.colId, opt); setDropdownData({...dropdownData, visible: false}); }}>
                  <Text style={[styles.modalListTxt, {textAlign: 'center', color: '#007AFF'}]}>{opt}</Text>
                </TouchableOpacity>
              ))}
              {dropdownData.options.length === 0 && <Text style={styles.hintTxt}>No options. Edit column to add.</Text>}
            </ScrollView>
            <TouchableOpacity style={[styles.glassBtn, {marginTop: 15}]} onPress={() => { updateCell(dropdownData.rowId, dropdownData.colId, ''); setDropdownData({...dropdownData, visible: false}); }}><Text style={styles.glassBtnTxt}>Clear Selection</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* SPREADSHEET SETTING MODALS */}
      <Modal visible={colMenuVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalBgCenter} activeOpacity={1} onPress={() => setColMenuVisible(false)}>
          <View style={styles.glassModal}>
            <Text style={styles.modalTitle}>Edit Column</Text>
            <TextInput style={styles.modalTextInput} value={selectedCol?.name || ''} onChangeText={(v) => updateColAttr('name', v)} />
            
            {selectedCol?.type === 'Dropdown' && (
              <>
                <Text style={styles.modalSub}>Dropdown Options (Comma separated)</Text>
                <TextInput style={styles.modalTextInput} value={tempColOptions} onChangeText={setTempColOptions} placeholder="e.g. High, Medium, Low" />
              </>
            )}

            <View style={styles.sheetDivider} />
            <Text style={styles.modalSub}>Width: {selectedCol?.width || 120}px</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.glassBtn} onPress={() => updateColAttr('width', Math.max(50, (selectedCol?.width||120) - 20))}><Text style={styles.glassBtnTxt}>➖ Shrink</Text></TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} onPress={() => updateColAttr('width', (selectedCol?.width||120) + 20)}><Text style={styles.glassBtnTxt}>➕ Expand</Text></TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Position</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.glassBtn} onPress={() => moveCol(-1)}><Text style={styles.glassBtnTxt}>◀ Left</Text></TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} onPress={() => moveCol(1)}><Text style={styles.glassBtnTxt}>Right ▶</Text></TouchableOpacity>
            </View>
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.btnDangerTight} onPress={deleteCol}><Text style={styles.btnDangerTxt}>🗑️ Delete Column</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.solidBtn, {marginTop: 10, width: '100%'}]} onPress={saveColEdit}><Text style={styles.solidBtnTxt}>Done</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={rowMenuVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalBgCenter} activeOpacity={1} onPress={() => setRowMenuVisible(false)}>
          <View style={styles.glassModal}>
            <Text style={styles.modalTitle}>Row Actions</Text>
            <View style={[styles.modalBtnRow, {marginTop: 15}]}>
              <TouchableOpacity style={styles.glassBtn} onPress={() => moveRow(-1)}><Text style={styles.glassBtnTxt}>▲ Move Up</Text></TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} onPress={() => moveRow(1)}><Text style={styles.glassBtnTxt}>▼ Move Down</Text></TouchableOpacity>
            </View>
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.btnDangerTight} onPress={deleteRow}><Text style={styles.btnDangerTxt}>🗑️ Delete Row</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.solidBtn, {marginTop: 10, width: '100%', alignItems: 'center'}]} onPress={() => setRowMenuVisible(false)}><Text style={styles.solidBtnTxt}>Close</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={addColVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalBgCenter} activeOpacity={1} onPress={() => setAddColVisible(false)}>
          <View style={styles.glassModal}>
            <Text style={styles.modalTitle}>New Column</Text>
            <TextInput style={styles.modalTextInput} placeholder="Column Name..." placeholderTextColor="#888" value={newColName} onChangeText={setNewColName} />
            
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 15, marginBottom: 15}}>
              {['Text', 'Number', 'Checkbox', 'Date', 'Link', 'Dropdown'].map(type => (
                <TouchableOpacity key={type} style={[styles.typeBadge, newColType === type && styles.typeBadgeActive]} onPress={() => setNewColType(type)}>
                  <Text style={[styles.typeBadgeTxt, newColType === type && {color: '#fff'}]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {newColType === 'Dropdown' && (
              <TextInput style={[styles.modalTextInput, {marginBottom: 15}]} placeholder="Options (comma separated)" placeholderTextColor="#888" value={newColOptions} onChangeText={setNewColOptions} />
            )}
            
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.solidBtn, {backgroundColor: '#E5E5EA', flex: 1}]} onPress={() => setAddColVisible(false)}><Text style={[styles.solidBtnTxt, {color: '#333'}]}>Back</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.solidBtn, {flex: 1}]} onPress={addColumn}><Text style={styles.solidBtnTxt}>Done</Text></TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={tableSettingsVisible} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.modalBgBottom} activeOpacity={1} onPress={() => setTableSettingsVisible(false)}>
          <View style={styles.glassSheet}>
            <Text style={styles.modalTitle}>View Settings</Text>
            <View style={styles.sheetDivider} />
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show Calculations Row (Sum/Count)</Text>
              <Switch value={showCalculations} onValueChange={() => updateSetting('showCalculations')} trackColor={{true: '#007AFF'}} />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Wrap Text in Cells</Text>
              <Switch value={wrapText} onValueChange={() => updateSetting('wrapText')} trackColor={{true: '#007AFF'}} />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Hide SN Column</Text>
              <Switch value={hideRowNumber} onValueChange={() => updateSetting('hideRowNumber')} trackColor={{true: '#007AFF'}} />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Adjust Table Width</Text>
              <View style={{flexDirection: 'row', gap: 15}}>
                <TouchableOpacity onPress={() => adjustTableWidth(-20)}><Text style={styles.iconBtn}>➖</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => adjustTableWidth(20)}><Text style={styles.iconBtn}>➕</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Text Size ({textSize}px)</Text>
              <View style={{flexDirection: 'row', gap: 15}}>
                <TouchableOpacity onPress={() => updateTextSize(-2)}><Text style={styles.iconBtn}>➖</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => updateTextSize(2)}><Text style={styles.iconBtn}>➕</Text></TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={[styles.solidBtn, {marginTop: 20, width: '100%', alignItems: 'center'}]} onPress={() => setTableSettingsVisible(false)}><Text style={styles.solidBtnTxt}>Done</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// =====================================================================
// 3. MASTER LIST COMPONENT (DATABASES)
// =====================================================================
export default function ListsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { username, colorPalette } = useContext(LifeContext); 
  const { customLists, setCustomLists } = useContext(ListContext);

  const safeLists = Array.isArray(customLists) ? customLists : [];

  const [newListName, setNewListName] = useState('');
  const [activeListId, setActiveListId] = useState(null);
  const [filterTag, setFilterTag] = useState(null);

  const [listMenuVisible, setListMenuVisible] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tempTagInput, setTempTagInput] = useState('');
  const [tempTagColor, setTempTagColor] = useState('#007AFF');

  // Hardcore Hardware Back Button Fix
  useEffect(() => {
    const handleBackPress = () => {
      if (activeListId) { setActiveListId(null); return true; }
      return false; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [activeListId]);

  // Bottom Tab Press Fix (Resets to main list page when clicking 'Lists' tab)
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (activeListId) setActiveListId(null);
    });
    return unsubscribe;
  }, [navigation, activeListId]);

  const allTagsMap = new Map();
  safeLists.forEach(list => {
    (list.tags || []).forEach(tag => {
      const tagName = typeof tag === 'string' ? tag : tag.name;
      const tagColor = typeof tag === 'string' ? '#007AFF' : tag.color;
      if(!allTagsMap.has(tagName)) allTagsMap.set(tagName, tagColor);
    });
  });
  const allTags = Array.from(allTagsMap, ([name, color]) => ({ name, color }));
  const filteredLists = filterTag ? safeLists.filter(l => (l.tags||[]).some(t => (typeof t === 'string' ? t : t.name) === filterTag)) : safeLists;

  const createList = () => {
    if (!newListName.trim()) return;
    setCustomLists([{ id: Date.now().toString(), title: newListName.trim(), tags: [], settings: { wrapText: false, textSize: 14, hideRowNumber: false, showCalculations: false }, columns: [{ id: 'c_title', name: 'Task / Item', type: 'Text', width: 150 }, { id: 'c_done', name: 'Status', type: 'Checkbox', width: 80 }], rows: [] }, ...safeLists]);
    setNewListName('');
  };

  const handleDuplicate = () => {
    if(!selectedList) return;
    const dup = JSON.parse(JSON.stringify(selectedList));
    dup.id = Date.now().toString(); dup.title += " (Copy)";
    setCustomLists([...safeLists, dup]); setListMenuVisible(false);
  };

  const saveRename = () => { setCustomLists(safeLists.map(l => l.id === selectedList.id ? { ...l, title: tempName } : l)); setRenameModalVisible(false); };
  const handleDeleteList = () => { setCustomLists(safeLists.filter(l => l.id !== selectedList.id)); setListMenuVisible(false); };
  
  const addTagToList = () => {
    if (!tempTagInput.trim()) return;
    const newTag = { name: tempTagInput.trim(), color: tempTagColor };
    setCustomLists(safeLists.map(l => {
      if (l.id === selectedList.id) {
        const currentTags = l.tags || [];
        if (!currentTags.some(t => (t.name || t) === newTag.name)) return { ...l, tags: [...currentTags, newTag] };
      } return l;
    }));
    setTempTagInput('');
  };

  const removeTagFromList = (tagName) => { setCustomLists(safeLists.map(l => l.id === selectedList.id ? { ...l, tags: (l.tags||[]).filter(t => (t.name || t) !== tagName) } : l)); };

  if (activeListId) return <SpreadsheetView listId={activeListId} onBack={() => setActiveListId(null)} topInset={insets.top} />;

  const activeTags = safeLists.find(l => l.id === selectedList?.id)?.tags || [];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <GlassBackground />

      {allTags.length > 0 && (
        <View style={styles.glassFilterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.glassBadge, !filterTag && styles.glassBadgeActive]} onPress={() => setFilterTag(null)}>
              <Text style={[styles.glassBadgeTxt, !filterTag && styles.glassBadgeTxtActive]}>All</Text>
            </TouchableOpacity>
            {allTags.map(tag => (
              <TouchableOpacity key={tag.name} style={[styles.glassBadge, filterTag === tag.name && {backgroundColor: tag.color, borderColor: tag.color}]} onPress={() => setFilterTag(filterTag === tag.name ? null : tag.name)}>
                <View style={[styles.tagDot, {backgroundColor: tag.color}]} />
                <Text style={[styles.glassBadgeTxt, filterTag === tag.name && {color: '#fff'}]}>{tag.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={{padding: 15, paddingBottom: 50}}>
        <View style={styles.createRow}>
          <TextInput style={styles.masterInput} placeholder="Create new database..." placeholderTextColor="#888" value={newListName} onChangeText={setNewListName} />
          <TouchableOpacity style={styles.solidBtn} onPress={createList}><Text style={styles.solidBtnTxt}>Create</Text></TouchableOpacity>
        </View>

        {filteredLists.length === 0 && <Text style={styles.hintTxt}>No databases found.</Text>}

        {filteredLists.map(list => {
          const safeRowsCount = Array.isArray(list.rows) ? list.rows.length : (Array.isArray(list.items) ? list.items.length : 0);
          return (
            <TouchableOpacity key={list.id} style={styles.glassCard} onPress={() => setActiveListId(list.id)}>
              <View style={styles.cardIconBox}><Text style={{fontSize: 20}}>📄</Text></View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{list.title}</Text>
                <Text style={styles.cardSub}>{safeRowsCount} records</Text>
                <View style={styles.tagRow}>
                  {(list.tags || []).map((t, idx) => {
                    const tName = typeof t === 'string' ? t : t.name;
                    const tColor = typeof t === 'string' ? '#007AFF' : t.color;
                    return (
                      <View key={idx} style={[styles.miniTag, {backgroundColor: tColor + '30'}]}>
                        <View style={[styles.tagDot, {backgroundColor: tColor}]} />
                        <Text style={[styles.miniTagTxt, {color: tColor}]}>{tName}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity style={{padding: 10}} onPress={() => {setSelectedList(list); setListMenuVisible(true);}}><Text style={{fontSize: 20, color: 'rgba(0,0,0,0.5)', fontWeight:'bold'}}>⋮</Text></TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* MASTER MODALS */}
      <Modal visible={listMenuVisible} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.modalBgBottom} activeOpacity={1} onPress={() => setListMenuVisible(false)}>
          <View style={styles.glassSheet}>
            <Text style={styles.modalTitle}>{selectedList?.title}</Text>
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.modalListOpt} onPress={() => { setListMenuVisible(false); setTempName(selectedList?.title || ''); setRenameModalVisible(true); }}><Text style={styles.modalListTxt}>✏️ Rename</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalListOpt} onPress={() => { setListMenuVisible(false); setTagModalVisible(true); }}><Text style={styles.modalListTxt}>🏷️ Edit Tags & Colors</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalListOpt} onPress={handleDuplicate}><Text style={styles.modalListTxt}>📋 Duplicate List</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalListOpt} onPress={() => { setListMenuVisible(false); Share.share({ message: `Check out "${selectedList?.title}" on LifePlanner! By @${username||'User'}` }); }}><Text style={styles.modalListTxt}>👥 Share</Text></TouchableOpacity>
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.btnDangerTight} onPress={handleDeleteList}><Text style={styles.btnDangerTxt}>🗑️ Delete Database</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.solidBtn, {marginTop: 15, width: '100%', alignItems: 'center'}]} onPress={() => setListMenuVisible(false)}><Text style={styles.solidBtnTxt}>✖️ Close Menu</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={renameModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBgCenter}>
          <View style={styles.glassModal}>
            <Text style={styles.modalTitle}>Rename</Text>
            <TextInput style={styles.modalTextInput} value={tempName} onChangeText={setTempName} placeholderTextColor="#888" />
            <View style={[styles.modalBtnRow, {marginTop: 15}]}>
              <TouchableOpacity style={[styles.solidBtn, {backgroundColor: '#E5E5EA', flex: 1}]} onPress={() => setRenameModalVisible(false)}><Text style={[styles.solidBtnTxt, {color: '#333'}]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.solidBtn, {flex: 1}]} onPress={saveRename}><Text style={styles.solidBtnTxt}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={tagModalVisible} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.modalBgBottom} activeOpacity={1} onPress={() => setTagModalVisible(false)}>
          <View style={[styles.glassSheet, {height: '75%'}]}>
            <Text style={styles.modalTitle}>Manage Tags</Text>
            <View style={styles.sheetDivider} />
            
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15}}>
              {activeTags.map((t, idx) => {
                const tName = typeof t === 'string' ? t : t.name; const tColor = typeof t === 'string' ? '#007AFF' : t.color;
                return (
                  <View key={idx} style={[styles.miniTag, {backgroundColor: tColor + '20', borderWidth: 1, borderColor: tColor, paddingVertical: 6, paddingHorizontal: 12}]}>
                    <View style={[styles.tagDot, {backgroundColor: tColor}]} /><Text style={[styles.miniTagTxt, {color: tColor, fontSize: 13}]}>{tName}</Text>
                    <TouchableOpacity onPress={() => removeTagFromList(tName)} style={{marginLeft: 8}}><Text style={{color: '#FF3B30', fontWeight:'bold'}}>×</Text></TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <TextInput style={[styles.modalTextInput, {marginBottom: 15}]} placeholder="New Tag Name..." placeholderTextColor="#888" value={tempTagInput} onChangeText={setTempTagInput} />
            <Text style={{fontWeight: 'bold', marginBottom: 8}}>Color</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15}}>
              {(colorPalette || ['#007AFF','#34C759','#FF3B30','#FF9500','#AF52DE']).map(color => (
                <TouchableOpacity key={color} style={[styles.colorCircle, { backgroundColor: color }, tempTagColor === color && styles.colorCircleActive]} onPress={() => setTempTagColor(color)} />
              ))}
            </View>
            <TouchableOpacity style={[styles.glassBtn, {width:'100%', marginBottom: 15}]} onPress={addTagToList}><Text style={styles.glassBtnTxt}>+ Add Tag</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.solidBtn, {width:'100%'}]} onPress={() => setTagModalVisible(false)}><Text style={styles.solidBtnTxt}>Done</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// =====================================================================
// 4. STYLES (GLASSMORPHISM & ULTRA-TIGHT SPREADSHEET)
// =====================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F4F5F7' },
  blob: { position: 'absolute', borderRadius: 200, opacity: 0.6 },

  glassHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.85)', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)' },
  headerTitleMain: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  headerActionTxt: { color: '#007AFF', fontSize: 14, fontWeight: '700' },

  tableScrollY: { padding: 15, paddingBottom: 60 },
  glassTable: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2, alignSelf: 'flex-start' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.03)', borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.08)' },
  tableDataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  rowAlt: { backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  
  cellTight: { justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(0, 0, 0, 0.04)', paddingHorizontal: 0, minHeight: 36 },
  headerCell: { paddingVertical: 8, paddingHorizontal: 6, borderRightColor: 'rgba(0,0,0,0.08)' },
  headerCellTxt: { fontSize: 12, fontWeight: '800', color: 'rgba(0,0,0,0.6)' },
  serialTxt: { fontSize: 13, fontWeight: '700', color: 'rgba(0,0,0,0.4)', textAlign: 'center' },
  cellInput: { flex: 1, paddingHorizontal: 8, paddingVertical: 0, margin: 0, color: '#1C1C1E', minHeight: 36 },
  cellTouchable: { flex: 1, justifyContent: 'center', paddingHorizontal: 8, minHeight: 36 },
  cellTxt: { textAlign: 'center', fontWeight: '500' },
  
  glassCheckbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  glassCheckboxActive: { backgroundColor: '#34C759', borderColor: '#34C759' },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  
  addRowBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'flex-start', paddingLeft: 15 },
  addRowTxt: { color: '#007AFF', fontSize: 13, fontWeight: '700' },

  glassFilterBar: { backgroundColor: 'rgba(255, 255, 255, 0.5)', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.6)' },
  filterScroll: { paddingHorizontal: 15, paddingVertical: 10, gap: 10 },
  glassBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  glassBadgeActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  glassBadgeTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(0,0,0,0.6)' },
  glassBadgeTxtActive: { color: '#fff' },
  
  createRow: { flexDirection: 'row', marginBottom: 15 },
  masterInput: { flex: 1, backgroundColor: '#fff', height: 44, borderRadius: 10, paddingHorizontal: 15, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#D1D1D6' },
  solidBtn: { backgroundColor: '#1C1C1E', height: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  solidBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  glassCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', marginBottom: 2 },
  cardSub: { fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: '600', marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  miniTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  miniTagTxt: { fontSize: 10, fontWeight: '800' },
  tagDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  hintTxt: { fontSize: 14, color: 'rgba(0,0,0,0.4)', textAlign: 'center', marginTop: 20, fontWeight: '600' },

  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBgBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  glassModal: { backgroundColor: '#fff', width: 300, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  glassSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  modalSub: { fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', marginTop: 15, marginBottom: 8, textTransform: 'uppercase' },
  sheetDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 15 },
  
  modalTextInput: { backgroundColor: '#F9F9F9', color: '#000', height: 44, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, borderWidth: 1, borderColor: '#D1D1D6', width: '100%', marginTop: 10 },
  
  modalListOpt: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  modalListTxt: { fontSize: 16, color: '#1C1C1E', fontWeight: '600' },
  
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  glassBtn: { flex: 1, backgroundColor: '#E5F1FF', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  glassBtnTxt: { color: '#007AFF', fontWeight: '700', fontSize: 14 },
  
  btnDangerTight: { backgroundColor: '#FDECEF', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', width: '100%' },
  btnDangerTxt: { color: '#FF3B30', fontWeight: '800', fontSize: 14 },

  iconBtn: { fontSize: 24, color: '#007AFF' },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  settingLabel: { fontSize: 15, color: '#1C1C1E', fontWeight: '600' },
  
  typeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#E5E5EA' },
  typeBadgeActive: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  typeBadgeTxt: { fontSize: 13, fontWeight: '600', color: '#555' },

  colorCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: 'transparent' },
  colorCircleActive: { borderColor: '#1C1C1E' }
});