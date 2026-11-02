import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, FlatList, Switch, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx'; // STRICTLY USING EXCEL PARSER

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// =====================================================================
// DECORATIVE BACKGROUND FOR GLASSMORPHISM
// =====================================================================
const GlassBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={styles.bgBase} />
    <View style={[styles.blob, { backgroundColor: '#FFD1FF', top: -100, left: -50, width: 300, height: 300 }]} />
    <View style={[styles.blob, { backgroundColor: '#D4E4FF', top: '30%', right: -100, width: 250, height: 250 }]} />
    <View style={[styles.blob, { backgroundColor: '#E8F5E9', bottom: -50, left: '10%', width: 350, height: 350 }]} />
  </View>
);

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const [transactions, setTransactions] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState('All Time'); 
  const [chartType, setChartType] = useState('BAR'); 
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  const [tableModalVisible, setTableSettingsVisible] = useState(false); 
  const [tableTypeFilter, setTableTypeFilter] = useState('All'); 
  const [tableMonthFilter, setTableMonthFilter] = useState('All'); 
  const [editingCell, setEditingCell] = useState(null); 

  const lastTapRef = useRef(0);
  const lastCellRef = useRef('');

  // =====================================================================
  // EXCEL UPLOAD ENGINE (MAPPED TO SHEET 2 | COLUMNS A, F, I, J, K)
  // =====================================================================
  const handleUploadExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '*/*'], 
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;
      
      const fileUri = result.assets[0].uri;
      setIsProcessing(true);

      // Fetch blob to bypass FileSystem issues
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const b64 = e.target.result.split(',')[1];
          const workbook = XLSX.read(b64, { type: 'base64' });

          // Targeting 'Passbook Payment History' or Sheet 2
          const targetName = 'Passbook Payment History';
          let sheetName = workbook.SheetNames[0]; 
          
          if (workbook.SheetNames.includes(targetName)) {
            sheetName = targetName;
          } else if (workbook.SheetNames.length > 1) {
            sheetName = workbook.SheetNames[1]; // strictly Sheet 2
          }

          const worksheet = workbook.Sheets[sheetName];

          if (!worksheet) {
            Alert.alert("Error", "No readable sheet found in the Excel file.");
            setIsProcessing(false);
            return;
          }

          // Parse Columns as A, B, C, D...
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A", defval: "" });
          const parsedData = [];
          let parseCount = 0;

          // Skip Header (Row 0), Process from Row 1
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            const colA = row['A']; // Date
            const colF = row['F']; // Amount
            const colI = String(row['I'] || '').trim(); // Remark
            const colJ = String(row['J'] || 'Uncategorized').trim(); // Type
            const colK = String(row['K'] || '').trim(); // Comment

            if (!colA || (!colF && colF !== 0)) continue;

            // Handle Excel Native Serial Dates & Text Dates
            let formattedDate = String(colA).trim();
            if (typeof colA === 'number') {
              const dateObj = new Date(Math.round((colA - 25569) * 86400 * 1000));
              formattedDate = dateObj.toISOString().split('T')[0];
            } else if (formattedDate.includes('/')) {
              const parts = formattedDate.split('/');
              if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            } else if (formattedDate.includes('-')) {
              const parts = formattedDate.split('-');
              if (parts[0].length === 2) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            const parsedAmount = parseFloat(String(colF).replace(/,/g, '')) || 0;

            parsedData.push({
              id: `tx_${Date.now()}_${i}`,
              date: formattedDate,
              amount: parsedAmount,
              remark: colI,
              type: colJ || 'Uncategorized',
              comment: colK
            });
            parseCount++;
          }

          if (parseCount === 0) {
            Alert.alert("Data Mismatch", "Check if Columns A and F have data.");
          } else {
            setTransactions(parsedData);
            Alert.alert("Upload Successful", `Parsed ${parseCount} records from '${sheetName}'.`);
          }
          setIsProcessing(false);

        } catch (parseError) {
          console.log(parseError);
          setIsProcessing(false);
          Alert.alert("Parser Error", "Could not parse Excel. Please check the file structure.");
        }
      };
      
      reader.onerror = () => {
        setIsProcessing(false);
        Alert.alert("Error", "Failed to read the file.");
      };

      reader.readAsDataURL(blob);

    } catch (err) {
      console.log(err);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to open or read document.");
    }
  };

  const clearDatabase = () => {
    Alert.alert("Clear Ledger", "Delete current parsed payment history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Ledger", style: "destructive", onPress: () => { setTransactions(null); setActiveFilter('All Time'); } }
    ]);
  };

  const handleUpdateCell = (id, field, value) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: field === 'amount' ? (parseFloat(value) || 0) : value } : t));
  };

  const handleCellTap = (id, field) => {
    const now = Date.now();
    const cellKey = `${id}_${field}`;
    
    if (lastTapRef.current && (now - lastTapRef.current) < 300 && lastCellRef.current === cellKey) {
      setEditingCell({ id, field }); 
    }
    
    lastTapRef.current = now;
    lastCellRef.current = cellKey;
  };

  useEffect(() => {
    const handleBackPress = () => {
      if (tableModalVisible) { setTableSettingsVisible(false); return true; }
      return false; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [tableModalVisible]);

  // =====================================================================
  // DYNAMIC MACRO & METRIC CALCULATIONS
  // =====================================================================
  const { summary, monthlyTrend, categoryData, uniqueTypes, filteredTableRows, availableMonths } = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return { summary: { inc:0, exp:0, net:0 }, monthlyTrend: [], categoryData: [], uniqueTypes: ['All'], filteredTableRows: [], availableMonths: [] };
    }

    const monthsSet = new Set();
    transactions.forEach(t => {
      if(t.date && String(t.date).length >= 7) {
        monthsSet.add(String(t.date).substring(0, 7)); // YYYY-MM
      }
    });
    
    const sortedRawMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
    
    const displayMonths = sortedRawMonths.map(m => {
      const parts = String(m).split('-');
      if (parts.length >= 2) {
        const moIdx = parseInt(parts[1], 10) - 1;
        if (!isNaN(moIdx) && MONTH_NAMES[moIdx]) {
          return `${MONTH_NAMES[moIdx]} ${parts[0]}`;
        }
      }
      return m; 
    });
    const filterOptions = ['All Time', ...displayMonths];

    let filtered = transactions;
    if (activeFilter !== 'All Time') {
      const parts = activeFilter.split(' ');
      if (parts.length >= 2) {
        const monthName = parts[0];
        const year = parts[1];
        const monthIdx = String(MONTH_NAMES.indexOf(monthName) + 1).padStart(2, '0');
        filtered = transactions.filter(t => t.date && String(t.date).startsWith(`${year}-${monthIdx}`));
      }
    }

    let inc = 0, exp = 0;
    filtered.forEach(t => {
      if (t.amount > 0) inc += t.amount;
      else exp += Math.abs(t.amount);
    });

    const catMap = {};
    filtered.filter(t => t.amount < 0).forEach(t => {
      if (!catMap[t.type]) catMap[t.type] = 0;
      catMap[t.type] += Math.abs(t.amount);
    });
    const categories = Object.keys(catMap).map(k => ({
      name: k, amount: catMap[k], icon: k.toLowerCase().includes('food') ? '🍔' : k.toLowerCase().includes('grocer') ? '🛒' : '⚡'
    })).sort((a, b) => b.amount - a.amount);

    const recent3Raw = sortedRawMonths.slice(0, 3).reverse(); 
    const trendMap = {};
    
    recent3Raw.forEach(m => {
      const parts = String(m).split('-');
      let shortName = String(m).substring(0, 3);
      if (parts.length >= 2) {
        const moIdx = parseInt(parts[1], 10) - 1;
        if (!isNaN(moIdx) && MONTH_NAMES[moIdx]) {
          shortName = MONTH_NAMES[moIdx].substring(0, 3);
        }
      }
      trendMap[m] = { name: shortName, inc: 0, exp: 0 };
    });

    transactions.forEach(t => {
      if(!t.date) return;
      const mKey = String(t.date).substring(0, 7);
      if (trendMap[mKey]) {
        if (t.amount > 0) trendMap[mKey].inc += t.amount;
        else trendMap[mKey].exp += Math.abs(t.amount);
      }
    });
    const trendArray = Object.values(trendMap);

    const typesSet = new Set(['All']);
    transactions.forEach(t => { if(t.type) typesSet.add(t.type); });

    let tableRows = transactions;
    if (tableMonthFilter !== 'All') {
      const parts = tableMonthFilter.split(' ');
      if (parts.length >= 2) {
        const monthName = parts[0];
        const year = parts[1];
        const monthIdx = String(MONTH_NAMES.indexOf(monthName) + 1).padStart(2, '0');
        tableRows = tableRows.filter(t => t.date && String(t.date).startsWith(`${year}-${monthIdx}`));
      }
    }
    if (tableTypeFilter !== 'All') {
      tableRows = tableRows.filter(t => t.type === tableTypeFilter);
    }

    return { 
      summary: { inc, exp, net: inc - exp }, 
      monthlyTrend: trendArray, 
      categoryData: categories,
      uniqueTypes: Array.from(typesSet),
      filteredTableRows: tableRows,
      availableMonths: filterOptions
    };
  }, [transactions, activeFilter, tableTypeFilter, tableMonthFilter]);

  const maxChartValue = Math.max(...monthlyTrend.map(m => Math.max(m.inc, m.exp)), 1);

  // =====================================================================
  // EMPTY STATE / LANDING
  // =====================================================================
  if (!transactions) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        <GlassBackground />
        <View style={styles.glassHeader}>
          <Text style={styles.headerTitleMain}>Wealth & Insights 💸</Text>
        </View>
        <View style={styles.uploadContainer}>
          <View style={styles.glassCardBig}>
            <Text style={styles.uploadTitle}>Excel Passbook Scanner</Text>
            <Text style={styles.uploadSub}>Upload your '.xlsx' Bank statement. We specifically scan Sheet 2 ('Passbook Payment History') and map Cols A, F, I, J, K directly.</Text>
            <TouchableOpacity style={styles.solidBtnUnified} onPress={handleUploadExcel} disabled={isProcessing}>
              <Text style={styles.solidBtnUnifiedTxt}>{isProcessing ? "Reading Excel..." : "📄 Upload Excel (.xlsx)"}</Text>
            </TouchableOpacity>
            <Text style={styles.securityTxt}>🔒 Processed securely on-device.</Text>
          </View>
        </View>
      </View>
    );
  }

  // =====================================================================
  // ROW RENDERER FOR FLATLIST (Double-Tap to Edit)
  // =====================================================================
  const renderTableRow = ({ item: row, index }) => (
    <View style={[styles.rawGridDataRow, index % 2 === 1 && {backgroundColor: '#FAFAFB'}]}>
      <View style={[styles.rawGridCell, {width: 40, backgroundColor: '#F4F5F7'}]}><Text style={styles.rawGridIdxTxt}>{index+1}</Text></View>
      
      <TouchableOpacity activeOpacity={1} style={[styles.rawGridCell, {width: 100}]} onPress={() => handleCellTap(row.id, 'date')}>
        {editingCell?.id === row.id && editingCell?.field === 'date' ? (
          <TextInput style={styles.rawGridInput} value={row.date} autoFocus onBlur={() => setEditingCell(null)} onChangeText={(v) => handleUpdateCell(row.id, 'date', v)} />
        ) : (
          <Text style={styles.rawGridText}>{row.date}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={1} style={[styles.rawGridCell, {width: 100}]} onPress={() => handleCellTap(row.id, 'amount')}>
        {editingCell?.id === row.id && editingCell?.field === 'amount' ? (
          <TextInput style={[styles.rawGridInput, {textAlign: 'right', fontWeight: 'bold'}]} value={String(row.amount)} autoFocus onBlur={() => setEditingCell(null)} keyboardType="numeric" onChangeText={(v) => handleUpdateCell(row.id, 'amount', v)} />
        ) : (
          <Text style={[styles.rawGridText, {textAlign: 'right', fontWeight: 'bold', color: row.amount > 0 ? '#34C759' : '#1C1C1E'}]}>{row.amount}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={1} style={[styles.rawGridCell, {width: 150}]} onPress={() => handleCellTap(row.id, 'remark')}>
        {editingCell?.id === row.id && editingCell?.field === 'remark' ? (
          <TextInput style={styles.rawGridInput} value={row.remark} autoFocus onBlur={() => setEditingCell(null)} onChangeText={(v) => handleUpdateCell(row.id, 'remark', v)} />
        ) : (
          <Text style={styles.rawGridText} numberOfLines={2}>{row.remark}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={1} style={[styles.rawGridCell, {width: 100}]} onPress={() => handleCellTap(row.id, 'type')}>
        {editingCell?.id === row.id && editingCell?.field === 'type' ? (
          <TextInput style={styles.rawGridInput} value={row.type} autoFocus onBlur={() => setEditingCell(null)} onChangeText={(v) => handleUpdateCell(row.id, 'type', v)} />
        ) : (
          <Text style={styles.rawGridText} numberOfLines={1}>{row.type}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={1} style={[styles.rawGridCell, {width: 150}]} onPress={() => handleCellTap(row.id, 'comment')}>
        {editingCell?.id === row.id && editingCell?.field === 'comment' ? (
          <TextInput style={styles.rawGridInput} value={row.comment} autoFocus onBlur={() => setEditingCell(null)} onChangeText={(v) => handleUpdateCell(row.id, 'comment', v)} />
        ) : (
          <Text style={styles.rawGridText} numberOfLines={2}>{row.comment}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <GlassBackground />
      
      <View style={styles.glassHeader}>
        <Text style={styles.headerTitleMain}>Wealth 💸</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <TouchableOpacity onPress={() => setTableSettingsVisible(true)} style={styles.iconViewTrigger}><Text style={{fontSize: 20}}>📑</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.dropdownFilterBtn}><Text style={styles.dropdownFilterBtnTxt}>{activeFilter} ▾</Text></TouchableOpacity>
          <TouchableOpacity onPress={clearDatabase} style={styles.clearBtn}><Text style={styles.clearBtnTxt}>Clear</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{padding: 15, paddingBottom: 50}}>
        
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>{activeFilter} Flow</Text>
          <View style={styles.netFlowRow}>
            <View style={styles.flowBox}>
              <Text style={styles.flowLabel}>Total Income</Text>
              <Text style={[styles.flowAmount, {color: '#34C759'}]}>+₹{summary.inc.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.flowDivider} />
            <View style={styles.flowBox}>
              <Text style={styles.flowLabel}>Total Spent</Text>
              <Text style={[styles.flowAmount, {color: '#FF3B30'}]}>-₹{summary.exp.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Net Savings (In Hand)</Text>
            <Text style={styles.savingsAmount}>₹{summary.net.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.chartHeaderRow}>
            <View style={{flex: 1}}>
              <Text style={styles.sectionTitle}>Trend Analysis Matrix</Text>
              <Text style={styles.chartSub}>Last active 3 months</Text>
            </View>
            <View style={styles.chartToggleGroup}>
              <TouchableOpacity style={[styles.chartToggleBtn, chartType === 'BAR' && styles.chartToggleBtnActive]} onPress={() => setChartType('BAR')}><Text style={[styles.chartToggleTxt, chartType === 'BAR' && styles.chartToggleTxtActive]}>Bar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.chartToggleBtn, chartType === 'LINE' && styles.chartToggleBtnActive]} onPress={() => setChartType('LINE')}><Text style={[styles.chartToggleTxt, chartType === 'LINE' && styles.chartToggleTxtActive]}>Line</Text></TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.chartLayoutContainer}>
            <View style={styles.chartYAxisUnits}>
              <Text style={styles.axisUnitTxt}>₹{maxChartValue > 1000 ? (maxChartValue/1000).toFixed(0)+'k' : maxChartValue}</Text>
              <Text style={styles.axisUnitTxt}>₹{maxChartValue > 1000 ? (maxChartValue/2000).toFixed(0)+'k' : (maxChartValue/2).toFixed(0)}</Text>
              <Text style={styles.axisUnitTxt}>₹0</Text>
            </View>

            <View style={styles.chartGridDisplay}>
              {monthlyTrend.map((data, idx) => {
                const incPercent = (data.inc / maxChartValue) * 100;
                const expPercent = (data.exp / maxChartValue) * 100;
                
                return (
                  <View key={idx} style={styles.chartCol}>
                    {chartType === 'BAR' ? (
                      <View style={styles.barsRow}>
                        <View style={styles.barTrack}><View style={[styles.barFill, { height: `${incPercent}%`, backgroundColor: '#34C759' }]} /></View>
                        <View style={styles.barTrack}><View style={[styles.barFill, { height: `${expPercent}%`, backgroundColor: '#FF3B30' }]} /></View>
                      </View>
                    ) : (
                      <View style={styles.lineGraphWrapper}>
                        <View style={styles.lineGraphTrack}>
                          <View style={[styles.lineNodeDot, { bottom: `${incPercent}%`, backgroundColor: '#34C759' }]} />
                          <View style={[styles.lineVectorConnector, { height: `${incPercent}%`, backgroundColor: 'rgba(52,199,89,0.15)' }]} />
                        </View>
                        <View style={styles.lineGraphTrack}>
                          <View style={[styles.lineNodeDot, { bottom: `${expPercent}%`, backgroundColor: '#FF3B30' }]} />
                          <View style={[styles.lineVectorConnector, { height: `${expPercent}%`, backgroundColor: 'rgba(255,59,48,0.15)' }]} />
                        </View>
                      </View>
                    )}
                    <Text style={styles.chartMonthTxt}>{data.name}</Text>
                  </View>
                );
              })}
              {monthlyTrend.length === 0 && <Text style={{fontSize:12, color:'#888', alignSelf:'center'}}>No sufficient trend data</Text>}
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#34C759'}]} /><Text style={styles.legendTxt}>Income Flows</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: '#FF3B30'}]} /><Text style={styles.legendTxt}>Expense Outflows</Text></View>
          </View>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.sectionHeader}>Expense Breakdown</Text>
          <View style={{marginTop: 10}}>
            {categoryData.length === 0 && <Text style={{fontSize: 12, color: '#888'}}>No expenses tracked for this period.</Text>}
            {categoryData.map(cat => {
              const maxCatVal = Math.max(...categoryData.map(c => c.amount)) || 1;
              const barPercent = (cat.amount / maxCatVal) * 100;
              return (
                <View key={cat.name} style={styles.catRow}>
                  <View style={styles.catIconBox}><Text style={{fontSize: 18}}>{cat.icon}</Text></View>
                  <View style={styles.catDetailsWrapper}>
                    <View style={styles.catMetaTextRow}>
                      <Text style={styles.catNameTxt}>{cat.name}</Text>
                      <Text style={styles.catValTxt}>₹{cat.amount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.catBarTrackBg}>
                      <View style={[styles.catBarFillNode, { width: `${barPercent}%`, backgroundColor: '#1C1C1E' }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* ======================================================== */}
      {/* INTERACTIVE MODALS & BOTTOM SHEETS                       */}
      {/* ======================================================== */}
      
      <Modal visible={filterModalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalBgCenter} activeOpacity={1} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.glassMenuCard}>
            <Text style={styles.modalTitle}>Select Timeline</Text>
            <View style={styles.sheetDivider} />
            <ScrollView style={{maxHeight: 300}}>
              {availableMonths.map(opt => (
                <TouchableOpacity key={opt} style={styles.menuListOption} onPress={() => { setActiveFilter(opt); setFilterModalVisible(false); }}>
                  <Text style={[styles.menuListOptionTxt, activeFilter === opt && {color:'#007AFF', fontWeight:'800'}]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={tableModalVisible} transparent={true} animationType="slide">
        <View style={[styles.tableModalContainer, { paddingTop: Math.max(insets.top, 20) }]}>
          
          <View style={styles.tableModalHeader}>
            <Text style={styles.tableModalTitle}>Passbook History (Double-tap to Edit)</Text>
            <TouchableOpacity onPress={() => setTableSettingsVisible(false)} style={styles.closeModalBtn}><Text style={styles.closeModalBtnTxt}>Done</Text></TouchableOpacity>
          </View>

          <View style={styles.tableInlineFilterBar}>
            
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
              <Text style={styles.filterBarLabel}>Month:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingRight: 20}}>
                <TouchableOpacity style={[styles.typeFilterBadge, tableMonthFilter === 'All' && styles.typeFilterBadgeActive]} onPress={() => setTableMonthFilter('All')}>
                  <Text style={[styles.typeFilterBadgeTxt, tableMonthFilter === 'All' && {color: '#fff'}]}>All</Text>
                </TouchableOpacity>
                {availableMonths.filter(m=>m!=='All Time').map(month => (
                  <TouchableOpacity key={month} style={[styles.typeFilterBadge, tableMonthFilter === month && styles.typeFilterBadgeActive]} onPress={() => setTableMonthFilter(month)}>
                    <Text style={[styles.typeFilterBadgeTxt, tableMonthFilter === month && {color: '#fff'}]}>{month.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.filterBarLabel}>Type:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingRight: 20}}>
                {uniqueTypes.map(type => (
                  <TouchableOpacity key={type} style={[styles.typeFilterBadge, tableTypeFilter === type && styles.typeFilterBadgeActive]} onPress={() => setTableTypeFilter(type)}>
                    <Text style={[styles.typeFilterBadgeTxt, tableTypeFilter === type && {color: '#fff'}]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

          </View>

          <ScrollView horizontal={true} style={{flex: 1, backgroundColor: '#fff'}} bounces={false}>
            <View style={styles.rawGridWrapper}>
              
              <View style={styles.rawGridHeaderRow}>
                <View style={[styles.rawGridCell, {width: 40}]}><Text style={styles.rawGridHeaderTxt}>A</Text></View>
                <View style={[styles.rawGridCell, {width: 100}]}><Text style={styles.rawGridHeaderTxt}>Date (Col A)</Text></View>
                <View style={[styles.rawGridCell, {width: 100}]}><Text style={styles.rawGridHeaderTxt}>Amount (Col F)</Text></View>
                <View style={[styles.rawGridCell, {width: 150}]}><Text style={styles.rawGridHeaderTxt}>Remark (Col I)</Text></View>
                <View style={[styles.rawGridCell, {width: 100}]}><Text style={styles.rawGridHeaderTxt}>Type (Col J)</Text></View>
                <View style={[styles.rawGridCell, {width: 150}]}><Text style={styles.rawGridHeaderTxt}>Comment (Col K)</Text></View>
              </View>

              <FlatList 
                data={filteredTableRows}
                keyExtractor={item => item.id}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={5}
                renderItem={renderTableRow}
                contentContainerStyle={{paddingBottom: 40}}
                bounces={false}
              />

            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

// =====================================================================
// UNIFIED PREMIUM LAYOUT STYLES
// =====================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F4F5F7' },
  blob: { position: 'absolute', borderRadius: 200, opacity: 0.6 },

  glassHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.85)', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 0, 0, 0.05)' },
  headerTitleMain: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
  dropdownFilterBtn: { backgroundColor: 'rgba(0, 122, 255, 0.08)', paddingHorizontal: 12, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,122,255,0.15)' },
  dropdownFilterBtnTxt: { color: '#007AFF', fontSize: 13, fontWeight: '800' },
  iconViewTrigger: { width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  clearBtn: { backgroundColor: 'rgba(255, 59, 48, 0.08)', paddingHorizontal: 12, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  clearBtnTxt: { color: '#FF3B30', fontSize: 12, fontWeight: '700' },

  uploadContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  glassCardBig: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,1)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3, alignItems: 'center' },
  uploadTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', marginBottom: 8 },
  uploadSub: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  solidBtnUnified: { backgroundColor: '#1C1C1E', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', width: '100%' },
  solidBtnUnifiedTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  securityTxt: { fontSize: 11, color: '#34C759', fontWeight: '700', marginTop: 15 },

  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,1)', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  
  netFlowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 15 },
  flowBox: { flex: 1, alignItems: 'center' },
  flowLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  flowAmount: { fontSize: 18, fontWeight: '900' },
  flowDivider: { width: 1, height: 35, backgroundColor: '#E5E5EA' },
  savingsRow: { backgroundColor: 'rgba(52, 199, 89, 0.08)', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savingsLabel: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  savingsAmount: { fontSize: 16, fontWeight: '900', color: '#34C759' },

  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  chartToggleGroup: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 2 },
  chartToggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  chartToggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  chartToggleTxt: { fontSize: 11, fontWeight: '700', color: '#8E8E93' },
  chartToggleTxtActive: { color: '#1C1C1E' },
  chartSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  chartContainer: { flexDirection: 'row', height: 160, justifyContent: 'space-around', alignItems: 'flex-end', paddingTop: 15, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#D1D1D6', paddingLeft: 10 },
  chartLayoutContainer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
  chartYAxisUnits: { height: 160, justifyContent: 'space-between', paddingBottom: 25, paddingRight: 8, alignItems: 'flex-end' },
  axisUnitTxt: { fontSize: 10, color: '#8E8E93', fontWeight: '700' },
  chartGridDisplay: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', height: 160, alignItems: 'flex-end', borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#D1D1D6', paddingLeft: 5 },
  chartCol: { alignItems: 'center', width: 65, height: '100%', justifyContent: 'flex-end' },
  
  barsRow: { flexDirection: 'row', gap: 4, height: 120, alignItems: 'flex-end' },
  barTrack: { width: 14, height: '100%', backgroundColor: '#F2F2F7', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  
  lineGraphWrapper: { flexDirection: 'row', gap: 12, height: 120, width: 45, alignItems: 'flex-end' },
  lineGraphTrack: { flex: 1, height: '100%', position: 'relative', justifyContent: 'flex-end', alignItems: 'center' },
  lineNodeDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, zIndex: 3, transform: [{ translateY: 5 }] },
  lineVectorConnector: { width: 1.5, borderStyle: 'dashed', borderRadius: 1 },
  
  chartMonthTxt: { fontSize: 11, fontWeight: '700', color: '#8E8E93', marginTop: 8 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 11, fontWeight: '600', color: '#555' },

  categoriesContainer: { marginTop: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  catDetailsWrapper: { flex: 1 },
  catMetaTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catNameTxt: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  catValTxt: { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  catBarTrackBg: { height: 6, backgroundColor: '#F2F2F7', borderRadius: 3, overflow: 'hidden' },
  catBarFillNode: { height: '100%', borderRadius: 3 },

  modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  glassMenuCard: { backgroundColor: '#fff', width: 280, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  menuListOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  menuListOptionTxt: { fontSize: 15, color: '#1C1C1E', textAlign: 'center' },

  tableModalContainer: { flex: 1, backgroundColor: '#fff' },
  tableModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  tableModalTitle: { fontSize: 15, fontWeight: '800', color: '#1C1C1E', flex: 1 },
  closeModalBtn: { backgroundColor: '#1C1C1E', height: 36, paddingHorizontal: 15, borderRadius: 6, justifyContent: 'center' },
  closeModalBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  
  tableInlineFilterBar: { padding: 10, backgroundColor: '#F4F5F7', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  filterBarLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginRight: 10, width: 50 },
  typeFilterBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D1D6' },
  typeFilterBadgeActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeFilterBadgeTxt: { fontSize: 11, fontWeight: '600', color: '#555' },

  rawGridWrapper: { backgroundColor: '#fff', alignSelf: 'flex-start' },
  rawGridHeaderRow: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderBottomWidth: 1, borderBottomColor: '#D1D1D6' },
  rawGridDataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', minHeight: 40 }, 
  rawGridCell: { justifyContent: 'center', paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#E5E5EA', minHeight: 40 },
  rawGridHeaderTxt: { fontSize: 11, fontWeight: '800', color: '#555', textAlign: 'center' },
  rawGridIdxTxt: { fontSize: 11, color: '#8E8E93', fontWeight: '700', textAlign: 'center' },
  rawGridText: { fontSize: 13, color: '#1C1C1E', textAlign: 'center' },
  rawGridInput: { padding: 0, margin: 0, fontSize: 13, color: '#007AFF', width: '100%', minHeight: 40, textAlign: 'center', backgroundColor: '#E5F1FF' },
});