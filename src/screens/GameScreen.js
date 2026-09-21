import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import HistoryEntryRow from '../components/HistoryEntryRow';
import { COLORS, HIT_SLOP, SIZES } from '../constants/theme';
import { useAddGame } from '../store/historyStore';
import { buildRoundsFromEntries } from '../utils/gameHelpers';

const QUICK_VALUES = [25, 30, 60];

export default function GameScreen({ onOpenHistory }) {
  const { addGame } = useAddGame();

  const [limit, setLimit] = useState(200);
  const [nameA, setNameA] = useState('NOSOTROS');
  const [nameB, setNameB] = useState('ELLOS');

  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [history, setHistory] = useState([]);

  const [inputVisible, setInputVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [victoryModalVisible, setVictoryModalVisible] = useState(false);

  const [winnerTeam, setWinnerTeam] = useState(null);
  const [selectedEntryToVoid, setSelectedEntryToVoid] = useState(null);

  const [activeTeam, setActiveTeam] = useState(null);
  const [textInput, setTextInput] = useState('');

  const [editTarget, setEditTarget] = useState(null);
  const [tempEditValue, setTempEditValue] = useState('');

  const startedAtRef = useRef(null);
  const savedRef = useRef(false);
  // Contador local para generar IDs únicos aun con taps en el mismo ms.
  const entrySeqRef = useRef(0);

  // Snapshot fresco del estado relevante para el effect de guardado.
  // Evita meter `history/limit/nameA/nameB` como deps del effect: solo
  // queremos correrlo cuando `winnerTeam` transita, no cada jugada.
  const gameStateRef = useRef({ history, limit, nameA, nameB });
  useEffect(() => {
    gameStateRef.current = { history, limit, nameA, nameB };
  }, [history, limit, nameA, nameB]);

  const closeInputModal = useCallback(() => {
    Keyboard.dismiss();
    setInputVisible(false);
    setTextInput('');
  }, []);

  const openAddScore = useCallback((team) => {
    setActiveTeam(team);
    setTextInput('');
    setInputVisible(true);
  }, []);

  const checkWin = useCallback((newScore, teamName, teamCode) => {
    if (newScore >= limit) {
      setWinnerTeam({ name: teamName, code: teamCode });
      setVictoryModalVisible(true);
    }
    return newScore;
  }, [limit]);

  const handleSubmitScore = useCallback((pointsOverride = null) => {
    const points = pointsOverride !== null ? pointsOverride : parseInt(textInput, 10);
    if (!points || isNaN(points)) return;

    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now();
    }

    if (activeTeam === 'A') {
      setScoreA((prev) => checkWin(prev + points, nameA, 'A'));
    } else {
      setScoreB((prev) => checkWin(prev + points, nameB, 'B'));
    }

    const id = `${Date.now()}-${entrySeqRef.current++}`;
    const newEntry = {
      id,
      team: activeTeam,
      points,
      voided: false,
    };
    setHistory((prev) => [newEntry, ...prev]);

    closeInputModal();
  }, [activeTeam, checkWin, closeInputModal, nameA, nameB, textInput]);

  const confirmVoidEntry = useCallback((entry) => {
    setSelectedEntryToVoid(entry);
    setVoidModalVisible(true);
  }, []);

  const handleVoidAction = useCallback(() => {
    if (!selectedEntryToVoid) return;

    const { id, team, points, voided } = selectedEntryToVoid;
    const shouldVoid = !voided;
    const adjustment = shouldVoid ? -points : points;

    if (team === 'A') {
      setScoreA((prev) => {
        const newScore = prev + adjustment;
        if (newScore < limit && winnerTeam?.code === 'A') setWinnerTeam(null);
        return Math.max(0, newScore);
      });
    } else {
      setScoreB((prev) => {
        const newScore = prev + adjustment;
        if (newScore < limit && winnerTeam?.code === 'B') setWinnerTeam(null);
        return Math.max(0, newScore);
      });
    }

    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, voided: shouldVoid } : item))
    );

    setVoidModalVisible(false);
    setSelectedEntryToVoid(null);
  }, [limit, selectedEntryToVoid, winnerTeam]);

  const openEdit = useCallback((target, currentValue) => {
    setEditTarget(target);
    setTempEditValue(currentValue.toString());
    setSettingsVisible(true);
  }, []);

  const saveSettings = useCallback(() => {
    if (editTarget === 'limit') {
      const newLimit = parseInt(tempEditValue, 10) || 200;
      setLimit(newLimit);
      if (scoreA < newLimit && scoreB < newLimit) {
        setWinnerTeam(null);
      }
    }
    if (editTarget === 'nameA') setNameA(tempEditValue);
    if (editTarget === 'nameB') setNameB(tempEditValue);
    setSettingsVisible(false);
  }, [editTarget, scoreA, scoreB, tempEditValue]);

  const handleResetConfirm = useCallback(() => {
    setScoreA(0);
    setScoreB(0);
    setHistory([]);
    setWinnerTeam(null);
    setVictoryModalVisible(false);
    setResetModalVisible(false);
    startedAtRef.current = null;
    savedRef.current = false;
    entrySeqRef.current = 0;
  }, []);

  // Guarda la partida en el historial persistente cuando se detecta ganador.
  // Solo depende de `winnerTeam` y `addGame` — el resto del estado se lee de
  // gameStateRef.current, así el effect no se dispara con cada jugada.
  useEffect(() => {
    if (!winnerTeam) {
      savedRef.current = false;
      return;
    }
    if (savedRef.current) return;

    const { history: hist, limit: lim, nameA: nA, nameB: nB } = gameStateRef.current;
    if (hist.length === 0) return;

    savedRef.current = true;
    const startedAt = startedAtRef.current ?? Date.now();
    const endedAt = Date.now();
    const durationMin = Math.max(1, Math.round((endedAt - startedAt) / 60000));

    const game = {
      id: `g-${endedAt}`,
      date: endedAt,
      durationMin,
      meta: lim,
      teamA: nA,
      teamB: nB,
      rounds: buildRoundsFromEntries(hist),
      winner: winnerTeam.code,
    };

    if (game.rounds.length > 0) addGame(game);
  }, [winnerTeam, addGame]);

  const renderHistoryItem = useCallback(
    ({ item }) => (
      <HistoryEntryRow
        entry={item}
        teamName={item.team === 'A' ? nameA : nameB}
        onLongPress={confirmVoidEntry}
      />
    ),
    [nameA, nameB, confirmVoidEntry]
  );

  const winnerDisabled = !!winnerTeam;

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.limitBtn} onPress={() => openEdit('limit', limit)}>
          <Text style={styles.limitLabel}>META</Text>
          <Text style={styles.limitValue}>{limit}</Text>
          <Icon name="pencil" size={12} color={COLORS.textDim} style={styles.limitIcon} />
        </TouchableOpacity>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            onPress={onOpenHistory}
            style={styles.topIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Historial"
            hitSlop={HIT_SLOP}
          >
            <Icon name="time-outline" size={22} color={COLORS.textDim} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setResetModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Reiniciar"
            hitSlop={HIT_SLOP}
          >
            <Icon name="refresh-circle" size={30} color={COLORS.textDim} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SCOREBOARD */}
      <View style={styles.scoreboard}>
        <View style={styles.teamSection}>
          <TouchableOpacity style={styles.nameEditRow} onPress={() => openEdit('nameA', nameA)}>
            <Text style={[styles.teamName, { color: COLORS.primary }]} numberOfLines={1}>
              {nameA}
            </Text>
            <Icon name="create-outline" size={16} color={COLORS.textDim} />
          </TouchableOpacity>
          <Text style={styles.scoreText}>{scoreA}</Text>
          <TouchableOpacity
            disabled={winnerDisabled}
            style={[
              styles.addBtn,
              {
                backgroundColor: winnerDisabled ? COLORS.textDim : COLORS.primary,
                opacity: winnerDisabled ? 0.3 : 1,
              },
            ]}
            onPress={() => openAddScore('A')}
          >
            <Icon name="add" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.teamSection}>
          <TouchableOpacity style={styles.nameEditRow} onPress={() => openEdit('nameB', nameB)}>
            <Text style={[styles.teamName, { color: COLORS.secondary }]} numberOfLines={1}>
              {nameB}
            </Text>
            <Icon name="create-outline" size={16} color={COLORS.textDim} />
          </TouchableOpacity>
          <Text style={styles.scoreText}>{scoreB}</Text>
          <TouchableOpacity
            disabled={winnerDisabled}
            style={[
              styles.addBtn,
              {
                backgroundColor: winnerDisabled ? COLORS.textDim : COLORS.secondary,
                opacity: winnerDisabled ? 0.3 : 1,
              },
            ]}
            onPress={() => openAddScore('B')}
          >
            <Icon name="add" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* HISTORIAL IN-GAME */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyHeader}>HISTORIAL (Mantén presionado para anular)</Text>
        <FlatList
          data={history}
          keyExtractor={KEY_EXTRACTOR}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyList}
          removeClippedSubviews
          initialNumToRender={8}
          windowSize={5}
        />
      </View>

      {/* INPUT PUNTOS */}
      <Modal
        visible={inputVisible}
        animationType="slide"
        transparent
        onRequestClose={closeInputModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayBottom}
        >
          <View style={styles.inputCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Sumar a{' '}
                <Text
                  style={{ color: activeTeam === 'A' ? COLORS.primary : COLORS.secondary }}
                >
                  {activeTeam === 'A' ? nameA : nameB}
                </Text>
              </Text>
              <TouchableOpacity onPress={closeInputModal}>
                <Icon name="close" size={24} color={COLORS.textDim} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.mainInput}
              placeholder="0"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={textInput}
              onChangeText={setTextInput}
              onSubmitEditing={() => handleSubmitScore()}
              autoFocus
            />
            <View style={styles.quickButtons}>
              {QUICK_VALUES.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.qBtn}
                  onPress={() => handleSubmitScore(val)}
                >
                  <Text style={styles.qBtnText}>+{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => handleSubmitScore()}>
              <Text style={styles.confirmBtnText}>AGREGAR</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* EDITAR INFO */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.dialogCard, { paddingVertical: 30 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Editar {editTarget === 'limit' ? 'Meta' : 'Nombre'}
              </Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Icon name="close" size={24} color={COLORS.textDim} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.mainInput}
              value={tempEditValue}
              onChangeText={setTempEditValue}
              keyboardType={editTarget === 'limit' ? 'number-pad' : 'default'}
              autoFocus
              onSubmitEditing={saveSettings}
            />
            <TouchableOpacity style={[styles.confirmBtn, { marginTop: 10 }]} onPress={saveSettings}>
              <Text style={styles.confirmBtnText}>GUARDAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REINICIAR */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.dialogCard, { alignItems: 'center' }]}>
            <Icon name="warning-outline" size={50} color={COLORS.secondary} style={styles.dialogIcon} />
            <Text style={styles.dialogTitle}>¿Reiniciar Partida?</Text>
            <Text style={styles.dialogText}>Se borrarán todos los puntos.</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setResetModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDanger} onPress={handleResetConfirm}>
                <Text style={styles.btnDangerText}>Sí, Reiniciar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VICTORIA */}
      <Modal
        visible={victoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVictoryModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.dialogCard, { borderColor: COLORS.accent, borderWidth: 1 }]}>
            <Text style={styles.winnerLabel}>¡VICTORIA!</Text>
            <Text
              style={[
                styles.winnerName,
                { color: winnerTeam?.code === 'A' ? COLORS.primary : COLORS.secondary },
              ]}
            >
              {winnerTeam?.name}
            </Text>
            <Text style={styles.dialogText}>Han superado el límite de {limit} puntos.</Text>
            <TouchableOpacity
              style={[styles.confirmBtn, { width: '100%', marginTop: 20 }]}
              onPress={handleResetConfirm}
            >
              <Text style={styles.confirmBtnText}>Nueva Partida</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnCancel, styles.btnCancelFull]}
              onPress={() => setVictoryModalVisible(false)}
            >
              <Text style={styles.btnCancelText}>Cerrar y ver historial</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ANULAR JUGADA */}
      <Modal
        visible={voidModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVoidModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.dialogCard, { alignItems: 'center' }]}>
            <Icon
              name="alert-circle-outline"
              size={50}
              color={COLORS.secondary}
              style={styles.dialogIcon}
            />
            <Text style={styles.dialogTitle}>
              {selectedEntryToVoid?.voided ? '¿Restaurar?' : '¿Anular jugada?'}
            </Text>
            <Text style={styles.dialogText}>
              {selectedEntryToVoid?.voided
                ? 'Los puntos volverán a sumarse.'
                : 'Se restarán los puntos y se tachará la jugada.'}
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setVoidModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDanger} onPress={handleVoidAction}>
                <Text style={styles.btnDangerText}>
                  {selectedEntryToVoid?.voided ? 'Restaurar' : 'Anular'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const KEY_EXTRACTOR = (item) => item.id;

function EmptyList() {
  return <Text style={styles.emptyText}>Esperando primera jugada...</Text>;
}

const styles = StyleSheet.create({
  emptyText: { color: '#555', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  limitIcon: { marginLeft: 5 },
  limitLabel: { color: COLORS.textDim, fontSize: 12, marginRight: 5, fontWeight: 'bold' },
  limitValue: { color: COLORS.accent, fontSize: 16, fontWeight: 'bold' },
  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  teamSection: { alignItems: 'center', width: '45%' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  teamName: { fontSize: SIZES.fontSmall, fontWeight: '700', letterSpacing: 1, maxWidth: 100 },
  scoreText: { fontSize: 70, fontWeight: 'bold', color: COLORS.text, lineHeight: 80 },
  addBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  divider: { width: 1, height: 100, backgroundColor: '#333' },
  historyContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  historyHeader: {
    color: COLORS.textDim,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
    textAlign: 'center',
  },
  listContent: { paddingBottom: 20 },
  modalOverlayBottom: { flex: 1, backgroundColor: COLORS.modalOverlay, justifyContent: 'flex-end' },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputCard: {
    backgroundColor: '#222',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
    width: '100%',
  },
  dialogCard: { backgroundColor: '#222', borderRadius: 25, padding: 25, width: '100%', elevation: 10 },
  dialogIcon: { marginBottom: 10 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  mainInput: {
    backgroundColor: '#333',
    color: COLORS.text,
    fontSize: 40,
    textAlign: 'center',
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 20,
    fontWeight: 'bold',
    width: '100%',
  },
  confirmBtn: { backgroundColor: COLORS.text, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  quickButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  qBtn: {
    backgroundColor: '#333',
    paddingVertical: 15,
    width: '30%',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  qBtnText: { color: COLORS.accent, fontSize: 18, fontWeight: 'bold' },
  dialogTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  dialogText: { color: COLORS.textDim, fontSize: 16, textAlign: 'center', marginBottom: 25 },
  dialogActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  btnCancel: { flex: 1, padding: 15, marginRight: 10, backgroundColor: '#333', borderRadius: 12, alignItems: 'center' },
  btnCancelFull: { width: '100%', marginTop: 10, flex: 0, marginRight: 0 },
  btnCancelText: { color: COLORS.text, fontWeight: 'bold' },
  btnDanger: {
    flex: 1,
    padding: 15,
    marginLeft: 10,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDangerText: { color: COLORS.bg, fontWeight: 'bold' },
  winnerLabel: {
    color: COLORS.accent,
    fontSize: 16,
    letterSpacing: 4,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  winnerName: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
});
