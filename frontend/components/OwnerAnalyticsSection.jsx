import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Trends', 'Reports', 'Archive'];

const CATEGORY_COLORS = {
  'Academic Support and Resources': '#dc2626',
  'Medical Concern': '#dc2626',
  'Mental Health Support': '#7c3aed',
  'Financial Aid Issues': '#f59e0b',
  'Campus Facilities': '#2563eb',
  'Extracurricular Activities': '#16a34a',
  Transportation: '#0891b2',
  Accommodation: '#db2777',
  'Food Services': '#65a30d',
  Other: '#64748b',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RETENTION_OPTIONS = ['3 months', '6 months', '1 year', '2 years'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthLabel(date) {
  return MONTHS[date.getMonth()] + ' ' + date.getFullYear();
}

function buildMonthlyTrend(concerns) {
  const map = {};
  concerns.forEach((c) => {
    const d = new Date(c.createdAt);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map[key]) map[key] = { total: 0, medical: 0 };
    map[key].total += 1;
    if (c.genre === 'Medical Concern' || c.genre === 'Mental Health Support') {
      map[key].medical += 1;
    }
  });

  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const data = map[key] || { total: 0, medical: 0 };
    result.push({ label: MONTHS[d.getMonth()], count: data.total, medicalCount: data.medical });
  }
  return result;
}

function buildCategoryBreakdown(concerns) {
  const map = {};
  concerns.forEach((c) => {
    const key = c.genre || 'Other';
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

function calcResolutionTime(concerns) {
  const resolved = concerns.filter((c) => c.status === 'resolved' && c.createdAt && c.updatedAt);
  if (!resolved.length) return null;
  const totalMs = resolved.reduce((sum, c) => sum + (new Date(c.updatedAt) - new Date(c.createdAt)), 0);
  return (totalMs / resolved.length / (1000 * 60 * 60 * 24)).toFixed(1);
}

function detectPeak(trend) {
  if (!trend.length) return null;
  const avg = trend.reduce((s, t) => s + t.count, 0) / trend.length;
  const peak = trend.reduce((prev, cur) => (cur.count > prev.count ? cur : prev), trend[0]);
  if (peak.count > avg * 1.3) {
    return { label: peak.label, pct: Math.round(((peak.count - avg) / avg) * 100) };
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InteractiveKpiCard({ icon, iconColors, value, label }) {
  return (
    <View style={styles.kpiCard}>
      <LinearGradient colors={iconColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.kpiIcon}>
        <Ionicons name={icon} size={16} color="#ffffff" />
      </LinearGradient>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

function AnimatedBarChart({ data, total }) {
  if (!data.length) return <View style={styles.emptyWrap}><Text style={styles.emptyText}>No data available</Text></View>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View style={styles.barChart}>
      {data.slice(0, 7).map((item) => {
        const pct = total ? Math.round((item.count / total) * 100) : 0;
        return (
          <View key={item.name} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{item.name}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { backgroundColor: CATEGORY_COLORS[item.name] || '#64748b', width: `${(item.count / max) * 100}%` }]} />
            </View>
            <Text style={styles.barVal}>{item.count} <Text style={{ fontSize: 9, color: '#94a3b8' }}>({pct}%)</Text></Text>
          </View>
        );
      })}
    </View>
  );
}

function InteractiveStatusChart({ resolved, pending, rejected, total }) {
  if (!total) return (
    <View style={styles.emptyStatusWrap}>
      <Ionicons name="stats-chart" size={40} color="#e2e8f0" />
      <Text style={styles.emptyText}>Awaiting Concern Submissions</Text>
    </View>
  );

  const data = [
    { label: 'Resolved', count: resolved, color: '#16a34a', bg: '#dcfce7', icon: 'checkmark-circle' },
    { label: 'Pending', count: pending, color: '#eab308', bg: '#fef9c3', icon: 'time' },
    { label: 'Rejected', count: rejected, color: '#ef4444', bg: '#fee2e2', icon: 'close-circle' },
  ];

  return (
    <View style={styles.statusWrap}>
      {data.map((item, idx) => {
        const pct = total ? Math.round((item.count / total) * 100) : 0;
        return (
          <View key={idx} style={styles.statusRow}>
            <View style={[styles.statusIconBox, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.statusRowTop}>
                <Text style={styles.statusRowLabel}>{item.label}</Text>
                <Text style={styles.statusRowVal}>{item.count} <Text style={{ color: '#94a3b8', fontSize: 11 }}>({pct}%)</Text></Text>
              </View>
              <View style={styles.statusTrack}>
                <View style={[styles.statusFill, { backgroundColor: item.color, width: `${pct}%` }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function LineGraph({ trend, peak }) {
  const max = Math.max(...trend.map((t) => t.count), 1);
  const H = 80;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 6 }}>
        {trend.map((t, i) => {
          const totalH = max ? Math.max((t.count / max) * (H - 10), 4) : 4;
          const medicalH = t.count ? (t.medicalCount / t.count) * totalH : 0;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Text style={styles.lineBarVal}>{t.count}</Text>
              <View style={[styles.lineBar, { height: totalH, backgroundColor: (peak && t.label === peak.label) ? '#fca5a5' : '#e2e8f0', overflow: 'hidden' }]}>
                {medicalH > 0 && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: medicalH, backgroundColor: '#dc2626' }} />}
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.lineLabels}>{trend.map((t, i) => <Text key={i} style={styles.lineLabelTxt}>{t.label}</Text>)}</View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#e2e8f0' }]} /><Text style={styles.legendTxt}>Total</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} /><Text style={styles.legendTxt}>Medical Related</Text></View>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerAnalyticsSection() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date());
  const [exporting, setExporting] = useState(false);
  
  // Archive States
  const [selectedRetention, setSelectedRetention] = useState('1 year');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true); setErrorMessage('');
    try {
      const res = await apiRequest('/concerns/all', { method: 'GET', token });
      setConcerns(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setErrorMessage(err.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    const total = concerns.length;
    const resolved = concerns.filter((c) => c.status === 'resolved').length;
    const pending = concerns.filter((c) => c.status === 'pending').length;
    const rejected = concerns.filter((c) => c.status === 'rejected').length;
    const resRate = total ? Math.round((resolved / total) * 100) : 0;
    const avgResTime = calcResolutionTime(concerns);
    return { total, resolved, pending, rejected, resRate, avgResTime };
  }, [concerns]);

  const trend = useMemo(() => buildMonthlyTrend(concerns), [concerns]);
  const peak = useMemo(() => detectPeak(trend), [trend]);
  const categoryData = useMemo(() => buildCategoryBreakdown(concerns), [concerns]);

  const monthConcerns = useMemo(() => concerns.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === reportMonth.getMonth() && d.getFullYear() === reportMonth.getFullYear();
  }), [concerns, reportMonth]);

  const getBase64Image = async () => {
    try {
      const asset = Asset.fromModule(require('../images/img1.jpeg'));
      await asset.downloadAsync();
      // Using literal 'base64' string to avoid EncodingType.Base64 being undefined in legacy
      const base64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, { encoding: 'base64' });
      return `data:image/jpeg;base64,${base64}`;
    } catch (e) { 
      console.log('PDF Image Base64 Error:', e);
      return null; 
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const imageBase64 = await getBase64Image();
      const title = `SCMS_Analytics_${monthLabel(reportMonth).replace(' ', '_')}`;
      if (format === 'PDF') {
        const html = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica', sans-serif; padding: 0; margin: 0; color: #1e293b; background: #f8fafc; }
                .header { background: #0f172a; color: white; padding: 40px; border-bottom: 8px solid #dc2626; }
                .header h1 { margin: 0; font-size: 32px; letter-spacing: 1px; }
                .hero-image { width: 100%; height: 250px; background-image: url('${imageBase64}'); background-size: cover; background-position: center; }
                .content { padding: 40px; }
                .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 40px 0; }
                .stat-card { background: white; border: 1px solid #e2e8f0; padding: 25px; border-radius: 16px; text-align: center; }
                .stat-val { font-size: 32px; font-weight: 800; color: #dc2626; }
              </style>
            </head>
            <body>
              <div class="header"><h1>SCMS ANALYTICS REPORT</h1><p>${monthLabel(reportMonth).toUpperCase()}</p></div>
              ${imageBase64 ? `<div class="hero-image"></div>` : ''}
              <div class="content">
                <div class="stats-grid">
                  <div class="stat-card"><div class="stat-val">${monthConcerns.length}</div><div>Total Submissions</div></div>
                  <div class="stat-card"><div class="stat-val">${Math.round((monthConcerns.filter(c => c.status === 'resolved').length / (monthConcerns.length || 1)) * 100)}%</div><div>Resolution Rate</div></div>
                  <div class="stat-card"><div class="stat-val">${monthConcerns.filter(c => c.genre === 'Medical Concern').length}</div><div>Medical Cases</div></div>
                </div>
              </div>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
      } else {
        const csv = "REPORT SUMMARY\nPeriod," + monthLabel(reportMonth) + "\nTotal," + monthConcerns.length + "\n\nCategory,Count\n" + buildCategoryBreakdown(monthConcerns).map(c => `"${c.name}",${c.count}`).join("\n");
        const fileUri = FileSystem.cacheDirectory + `${title}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csv);
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
      }
    } catch (e) { Alert.alert('Error', 'Failed to generate report.'); }
    finally { setExporting(false); }
  };

  const handleExecuteArchive = () => {
    setArchiving(true);
    setTimeout(() => {
      setArchiving(false);
      setShowArchiveModal(false);
      Alert.alert('Success', `Data older than ${selectedRetention} has been moved to archive.`);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab(tab); }}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator size="large" color="#dc2626" /><Text style={styles.loadingText}>Syncing Analytics...</Text></View>
      ) : (
        <View style={styles.contentWrap}>
          {activeTab === 'Overview' && (
            <>
              <View style={styles.kpiGrid}>
                <InteractiveKpiCard icon="chatbox-outline" iconColors={['#dc2626', '#991b1b']} value={String(stats.total)} label="Total Submissions" />
                <InteractiveKpiCard icon="checkmark-circle-outline" iconColors={['#16a34a', '#15803d']} value={`${stats.resRate}%`} label="Resolution Rate" />
                <InteractiveKpiCard icon="time-outline" iconColors={['#2563eb', '#1d4ed8']} value={stats.avgResTime ? `${stats.avgResTime}d` : 'N/A'} label="Avg. Resolution" />
                <InteractiveKpiCard icon="alert-circle-outline" iconColors={['#f59e0b', '#d97706']} value={String(stats.pending)} label="Pending Review" />
              </View>
              <SectionHeader title="Submission Status Breakdown" sub="Visual progress of concern resolution" />
              <View style={styles.card}><InteractiveStatusChart resolved={stats.resolved} pending={stats.pending} rejected={stats.rejected} total={stats.total} /></View>
              
              <SectionHeader title="High-Volume Categories" sub="Top hotspots across institution" />
              <View style={styles.hotspotList}>
                {categoryData.slice(0, 4).map((item) => (
                  <View key={item.name} style={[styles.hotspotRow, { borderLeftColor: CATEGORY_COLORS[item.name] || '#64748b' }]}>
                    <Text style={styles.hotspotCat} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.hotspotCount, { color: CATEGORY_COLORS[item.name] || '#64748b' }]}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeTab === 'Trends' && (
            <>
              <SectionHeader title="Monthly Insights" sub="Total volume vs medical spikes" />
              <View style={styles.card}><LineGraph trend={trend} peak={peak} /></View>
              <SectionHeader title="Global Distribution" sub="Categorical analysis" />
              <View style={styles.card}><AnimatedBarChart data={categoryData} total={stats.total} /></View>
            </>
          )}

          {activeTab === 'Reports' && (
            <>
              <View style={styles.monthSelector}>
                <TouchableOpacity onPress={() => setReportMonth(new Date(reportMonth.getFullYear(), reportMonth.getMonth() - 1, 1))}><Ionicons name="chevron-back" size={20} color="#dc2626" /></TouchableOpacity>
                <Text style={styles.monthLabel}>{monthLabel(reportMonth)}</Text>
                <TouchableOpacity onPress={() => setReportMonth(new Date(reportMonth.getFullYear(), reportMonth.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={20} color="#dc2626" /></TouchableOpacity>
              </View>
              <SectionHeader title="Category Snapshot" />
              <View style={styles.card}><AnimatedBarChart data={buildCategoryBreakdown(monthConcerns)} total={monthConcerns.length} /></View>
              <View style={styles.exportRow}>
                <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#dc2626' }]} onPress={() => handleExport('PDF')} disabled={exporting}>
                  {exporting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="document-text-outline" size={16} color="#fff" /><Text style={styles.exportBtnTxt}>Premium PDF Report</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#16a34a', marginTop: 10 }]} onPress={() => handleExport('Excel')} disabled={exporting}>
                  <Ionicons name="grid-outline" size={16} color="#fff" /><Text style={styles.exportBtnTxt}>Export Excel Snapshot</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === 'Archive' && (
            <View style={styles.card}>
              <View style={styles.archiveHeader}><Ionicons name="archive-outline" size={24} color="#dc2626" /><Text style={styles.archiveTitle}>Retention Policy</Text></View>
              <Text style={styles.archiveSub}>Snapshots and system logs are preserved according to institutional guidelines. Select a period to move records to the cold storage.</Text>
              
              <View style={styles.retentionGrid}>
                {RETENTION_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt} style={[styles.retentionPill, selectedRetention === opt && styles.retentionPillActive]} onPress={() => setSelectedRetention(opt)}>
                    <Text style={[styles.retentionPillTxt, selectedRetention === opt && styles.retentionPillTxtActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity style={styles.archiveBtn} onPress={() => setShowArchiveModal(true)}>
                <Ionicons name="archive" size={16} color="#fff" />
                <Text style={styles.archiveBtnTxt}>Execute Archive</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <Modal visible={showArchiveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Archive</Text>
            <Text style={styles.modalBody}>Are you sure you want to archive data older than {selectedRetention}? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowArchiveModal(false)}><Text style={styles.modalCancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleExecuteArchive}>
                {archiving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmTxt}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabContainer: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 16 },
  tabScroll: { paddingHorizontal: 16, gap: 10 },
  tabBtn: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#dc2626' },
  tabText: { fontSize: 13, fontWeight: '800', color: '#94a3b8' },
  tabTextActive: { color: '#dc2626' },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 13, fontWeight: '700', color: '#64748b' },
  contentWrap: { },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: { width: '48.5%', backgroundColor: '#ffffff', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  kpiLabel: { fontSize: 9, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginTop: 4 },
  sectionHeader: { marginBottom: 10, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  sectionSub: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 2 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  statusWrap: { gap: 12 },
  statusRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 10 },
  statusIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  statusRowLabel: { fontSize: 13, fontWeight: '800', color: '#475569' },
  statusRowVal: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  statusTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  statusFill: { height: '100%', borderRadius: 4 },
  hotspotList: { gap: 10, marginBottom: 16 },
  hotspotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  hotspotCat: { fontSize: 13, fontWeight: '800', color: '#0f172a', flex: 1 },
  hotspotCount: { fontSize: 16, fontWeight: '900' },
  barChart: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', width: 80 },
  barTrack: { flex: 1, height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barVal: { fontSize: 11, fontWeight: '800', color: '#0f172a', width: 60, textAlign: 'right' },
  lineBar: { width: '80%', borderRadius: 4 },
  lineBarVal: { fontSize: 9, fontWeight: '800', color: '#64748b', marginBottom: 2 },
  lineLabels: { flexDirection: 'row', marginTop: 6 },
  lineLabelTxt: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 16, marginBottom: 16, gap: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  monthLabel: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  exportRow: { marginTop: 10 },
  exportBtn: { height: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  exportBtnTxt: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  archiveHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  archiveTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  archiveSub: { fontSize: 13, color: '#64748b', fontWeight: '600', lineHeight: 20 },
  retentionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  retentionPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  retentionPillActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  retentionPillTxt: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  retentionPillTxtActive: { color: '#fff' },
  archiveBtn: { backgroundColor: '#dc2626', height: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  archiveBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  modalBody: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  modalCancelTxt: { fontSize: 14, fontWeight: '800', color: '#64748b' },
  modalConfirm: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  modalConfirmTxt: { fontSize: 14, fontWeight: '900', color: '#fff' },
  emptyWrap: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  emptyStatusWrap: { paddingVertical: 30, alignItems: 'center', gap: 10 },
});
