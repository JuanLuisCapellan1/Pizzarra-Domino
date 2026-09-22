import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SectionList,
  ScrollView,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import CalendarModal from '../components/CalendarModal';
import { COLORS, HIT_SLOP } from '../constants/theme';
import { useHistory } from '../store/historyStore';
import { gameWinner, groupGames, groupGamesByDate, formatDateLong } from '../utils/gameHelpers';
import GameCard from '../components/GameCard';

const keyExtractor = (item) => item.id;

const FILTERS = [
  { key: 'todas', label: 'Todas' },
  { key: 'ganamos', label: 'Ganamos' },
  { key: 'perdimos', label: 'Perdimos' },
  { key: '200', label: 'Meta 200' },
  { key: '150', label: 'Meta 150' },
  { key: '100', label: 'Meta 100' },
];

// Formatea la fecha o rango para el chip removible.
const formatDateChip = (df) => {
  if (!df) return '';
  if (df.date) return formatDateLong(df.date);
  if (df.startDate && df.endDate) {
    const s = formatDateLong(df.startDate);
    const e = formatDateLong(df.endDate);
    return s === e ? s : `${s} – ${e}`;
  }
  return '';
};

export default function HistoryScreen({ onBack, onOpenGame }) {
  const { games, loaded } = useHistory();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('todas');
  const [dateFilter, setDateFilter] = useState(null);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const sections = useMemo(() => {
    let g = games;
    if (filter === 'ganamos') g = g.filter((x) => gameWinner(x) === 'A');
    else if (filter === 'perdimos') g = g.filter((x) => gameWinner(x) === 'B');
    else if (filter === '200') g = g.filter((x) => x.meta === 200);
    else if (filter === '150') g = g.filter((x) => x.meta === 150);
    else if (filter === '100') g = g.filter((x) => x.meta === 100);

    const q = query.trim().toLowerCase();
    if (q) {
      g = g.filter(
        (x) =>
          (x.teamA || '').toLowerCase().includes(q) ||
          (x.teamB || '').toLowerCase().includes(q)
      );
    }

    // Filtro por fecha
    if (dateFilter) {
      if (dateFilter.date) {
        const start = new Date(dateFilter.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter.date);
        end.setHours(23, 59, 59, 999);
        g = g.filter((x) => {
          const t = typeof x.date === 'number' ? x.date : new Date(x.date).getTime();
          return t >= start.getTime() && t <= end.getTime();
        });
      } else if (dateFilter.startDate && dateFilter.endDate) {
        const start = new Date(dateFilter.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter.endDate);
        end.setHours(23, 59, 59, 999);
        g = g.filter((x) => {
          const t = typeof x.date === 'number' ? x.date : new Date(x.date).getTime();
          return t >= start.getTime() && t <= end.getTime();
        });
      }
    }

    return dateFilter ? groupGamesByDate(g) : groupGames(g);
  }, [games, query, filter, dateFilter]);

  const isEmpty = loaded && sections.length === 0;
  const totalGames = games.length;

  const renderItem = useCallback(
    ({ item }) => <GameCard game={item} onPress={onOpenGame} />,
    [onOpenGame]
  );

  const renderSectionHeader = useCallback(
    ({ section }) => (
      <Text style={styles.sectionHeader}>
        {section.title.toUpperCase()} · {section.data.length}
      </Text>
    ),
    []
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={HIT_SLOP}
        >
          <Icon name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Historial</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBar}>
        <Icon name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar equipo..."
          placeholderTextColor="#5a5a62"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={HIT_SLOP}>
            <Icon name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setCalendarVisible(true)}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por fecha"
          style={styles.calendarBtn}
        >
          <Icon
            name="calendar-outline"
            size={18}
            color={dateFilter ? COLORS.primary : COLORS.textMuted}
          />
          {dateFilter && <View style={styles.calendarBadge} />}
        </TouchableOpacity>
      </View>

      {dateFilter && (
        <View style={styles.dateChipRow}>
          <View style={styles.dateChip}>
            <Icon name="calendar-outline" size={12} color={COLORS.primary} />
            <Text style={styles.dateChipText}>{formatDateChip(dateFilter)}</Text>
            <TouchableOpacity
              onPress={() => setDateFilter(null)}
              hitSlop={HIT_SLOP}
            >
              <Icon name="close-circle" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {totalGames === 0 && loaded ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Icon name="time-outline" size={28} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Sin partidas guardadas</Text>
          <Text style={styles.emptyText}>
            Las partidas se guardan automáticamente cuando se alcanza la meta.
          </Text>
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Icon name="search" size={26} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Text style={styles.emptyText}>Intenta otro filtro o nombre de equipo.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={6}
          windowSize={7}
        />
      )}

      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onApply={(df) => {
          setDateFilter(df);
          setCalendarVisible(false);
        }}
        initialDate={dateFilter?.date || null}
        initialStartDate={dateFilter?.startDate || null}
        initialEndDate={dateFilter?.endDate || null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 40 },
  title: {
    flex: 1,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  searchBar: {
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    padding: 0,
  },
  chipsRow: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.text,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chipTextActive: {
    color: COLORS.bg,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  sectionHeader: {
    color: '#5a5a62',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingTop: 18,
    paddingBottom: 10,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 14,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13.5,
    textAlign: 'center',
    maxWidth: 260,
  },
  calendarBtn: {
    position: 'relative',
    padding: 2,
  },
  calendarBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },
  dateChipRow: {
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  dateChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
