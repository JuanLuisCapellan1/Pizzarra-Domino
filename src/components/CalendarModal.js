import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { COLORS, HIT_SLOP } from '../constants/theme';
import Icon from './Icon';

const DAYS_HEADER = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Devuelve epoch ms a medianoche del día.
const toDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

const sameDay = (a, b) => a && b && toDay(a) === toDay(b);

function CalendarModal({
  visible,
  onClose,
  onApply,
  initialDate,
  initialStartDate,
  initialEndDate,
}) {
  const now = new Date();
  const todayEpoch = toDay(now);

  // Modo: 'day' | 'range'
  const [mode, setMode] = useState(initialStartDate ? 'range' : 'day');

  // Selección
  const [selectedDate, setSelectedDate] = useState(initialDate || null);
  const [startDate, setStartDate] = useState(initialStartDate || null);
  const [endDate, setEndDate] = useState(initialEndDate || null);

  // Mes visible
  const initMonth = initialDate || initialStartDate || now;
  const [viewYear, setViewYear] = useState(initMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initMonth.getMonth());

  // Restaurar selección al abrir
  useEffect(() => {
    if (visible) {
      if (initialStartDate) {
        setMode('range');
        setStartDate(initialStartDate);
        setEndDate(initialEndDate || null);
        setViewYear(initialStartDate.getFullYear());
        setViewMonth(initialStartDate.getMonth());
      } else if (initialDate) {
        setMode('day');
        setSelectedDate(initialDate);
        setViewYear(initialDate.getFullYear());
        setViewMonth(initialDate.getMonth());
      } else {
        setMode('day');
        setSelectedDate(null);
        setStartDate(null);
        setEndDate(null);
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Navegación de mes
  const goBack = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goForward = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  // Generar celdas del calendario
  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // getDay() → 0=Dom, queremos 0=Lun
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

    const result = [];

    // Días del mes anterior (relleno)
    for (let i = startOffset - 1; i >= 0; i--) {
      result.push({ day: daysInPrev - i, inMonth: false, date: null });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ day: d, inMonth: true, date: new Date(viewYear, viewMonth, d) });
    }

    // Relleno final hasta completar filas de 7
    const remaining = 7 - (result.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        result.push({ day: i, inMonth: false, date: null });
      }
    }

    return result;
  }, [viewYear, viewMonth]);

  // Toque en una celda
  const onDayPress = useCallback(
    (date) => {
      if (!date) return;
      if (mode === 'day') {
        setSelectedDate(date);
      } else {
        // Modo rango
        if (!startDate || (startDate && endDate)) {
          // Primer toque o reinicio
          setStartDate(date);
          setEndDate(null);
        } else {
          // Segundo toque
          if (toDay(date) < toDay(startDate)) {
            setEndDate(startDate);
            setStartDate(date);
          } else {
            setEndDate(date);
          }
        }
      }
    },
    [mode, startDate, endDate]
  );

  // Cambio de modo
  const switchMode = useCallback((m) => {
    setMode(m);
    setSelectedDate(null);
    setStartDate(null);
    setEndDate(null);
  }, []);

  // Aplicar
  const handleApply = useCallback(() => {
    if (mode === 'day' && selectedDate) {
      onApply({ date: selectedDate });
    } else if (mode === 'range' && startDate) {
      onApply({ startDate, endDate: endDate || startDate });
    }
  }, [mode, selectedDate, startDate, endDate, onApply]);

  // Limpiar
  const handleClear = useCallback(() => {
    onApply(null);
  }, [onApply]);

  const canApply =
    (mode === 'day' && selectedDate) ||
    (mode === 'range' && startDate);

  // Determinar el estado visual de cada celda
  const getCellState = useCallback(
    (cell) => {
      if (!cell.inMonth || !cell.date) return 'none';
      const epoch = toDay(cell.date);

      if (mode === 'day') {
        if (selectedDate && sameDay(cell.date, selectedDate)) return 'selected';
      } else {
        if (startDate && sameDay(cell.date, startDate)) return 'rangeStart';
        if (endDate && sameDay(cell.date, endDate)) return 'rangeEnd';
        if (
          startDate &&
          endDate &&
          epoch > toDay(startDate) &&
          epoch < toDay(endDate)
        ) {
          return 'inRange';
        }
        // Si solo hay startDate, solo rangeStart
        if (startDate && !endDate && sameDay(cell.date, startDate)) return 'rangeStart';
      }
      return 'none';
    },
    [mode, selectedDate, startDate, endDate]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtrar por fecha</Text>
            <TouchableOpacity onPress={onClose} hitSlop={HIT_SLOP}>
              <Icon name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Toggle de modo */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'day' && styles.modeBtnActive]}
              onPress={() => switchMode('day')}
            >
              <Text style={[styles.modeBtnText, mode === 'day' && styles.modeBtnTextActive]}>
                Día
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'range' && styles.modeBtnActive]}
              onPress={() => switchMode('range')}
            >
              <Text style={[styles.modeBtnText, mode === 'range' && styles.modeBtnTextActive]}>
                Rango
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navegación de mes */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goBack} hitSlop={HIT_SLOP}>
              <Icon name="chevron-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goForward} hitSlop={HIT_SLOP}>
              <Icon name="chevron-forward" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Encabezados de día */}
          <View style={styles.daysHeader}>
            {DAYS_HEADER.map((d, i) => (
              <View key={i} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grilla de días */}
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              const state = getCellState(cell);
              const isToday = cell.inMonth && cell.date && toDay(cell.date) === todayEpoch;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayCell,
                    state === 'selected' && styles.dayCellSelected,
                    state === 'rangeStart' && styles.dayCellRangeEdge,
                    state === 'rangeEnd' && styles.dayCellRangeEdge,
                    state === 'inRange' && styles.dayCellInRange,
                  ]}
                  onPress={() => cell.inMonth && onDayPress(cell.date)}
                  activeOpacity={cell.inMonth ? 0.6 : 1}
                  disabled={!cell.inMonth}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.inMonth && styles.dayTextOutside,
                      (state === 'selected' || state === 'rangeStart' || state === 'rangeEnd') &&
                        styles.dayTextSelected,
                      isToday && state === 'none' && styles.dayTextToday,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  {isToday && state === 'none' && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hint de rango */}
          {mode === 'range' && (
            <Text style={styles.hint}>
              {!startDate
                ? 'Toca el día de inicio'
                : !endDate
                ? 'Ahora toca el día final'
                : ''}
            </Text>
          )}

          {/* Botones */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={!canApply}
            >
              <Text style={[styles.applyBtnText, !canApply && styles.applyBtnTextDisabled]}>
                Aplicar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default memo(CalendarModal);

const CELL_SIZE = 42;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgElev,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: COLORS.text,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  monthLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  dayHeaderCell: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  dayHeaderText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CELL_SIZE / 2,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellRangeEdge: {
    backgroundColor: COLORS.primary,
  },
  dayCellInRange: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
  },
  dayText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextOutside: {
    color: '#333338',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  todayDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    minHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  clearBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.4,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  applyBtnTextDisabled: {
    color: '#FFFFFF',
  },
});
