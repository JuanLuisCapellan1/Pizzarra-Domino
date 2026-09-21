import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Share,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { COLORS, HIT_SLOP } from '../constants/theme';
import { useHistory } from '../store/historyStore';
import { gameFinal, gameWinner, formatTime, formatDateLong } from '../utils/gameHelpers';

const roundKeyExtractor = (item, index) =>
  `${index}-${item.team}-${item.points}-${item.after.A}-${item.after.B}`;

function RoundRow({ item, index, teamA, teamB }) {
  const isA = item.team === 'A';
  return (
    <View style={styles.roundRow}>
      <Text style={styles.roundNum}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.roundTeam}>
        <View
          style={[styles.dot, { backgroundColor: isA ? COLORS.primary : COLORS.secondary }]}
        />
        <Text style={styles.roundTeamText}>{(isA ? teamA : teamB).toUpperCase()}</Text>
      </View>
      <Text style={[styles.roundPts, { color: isA ? COLORS.primary : COLORS.secondary }]}>
        +{item.points}
      </Text>
      <View style={styles.roundRunning}>
        <Text style={[styles.runningNum, { color: isA ? COLORS.primary : COLORS.textMuted }]}>
          {item.after.A}
        </Text>
        <Text style={styles.runningSep}>·</Text>
        <Text style={[styles.runningNum, { color: !isA ? COLORS.secondary : COLORS.textMuted }]}>
          {item.after.B}
        </Text>
      </View>
    </View>
  );
}

export default function GameDetailScreen({ game, onBack }) {
  const { removeGame } = useHistory();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const final = gameFinal(game);
  const winner = gameWinner(game);

  const handleShare = async () => {
    const lines = [
      `Partida — ${formatDateLong(game.date)} · ${formatTime(game.date)}`,
      `${game.teamA}: ${final.A}  vs  ${game.teamB}: ${final.B}  (Meta ${game.meta})`,
      `Ganador: ${winner === 'A' ? game.teamA : game.teamB}`,
    ];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // ignorar cancelación
    }
  };

  const handleDelete = () => {
    setConfirmVisible(false);
    removeGame(game.id);
    onBack();
  };

  const renderRound = useCallback(
    ({ item, index }) => (
      <RoundRow item={item} index={index} teamA={game.teamA} teamB={game.teamB} />
    ),
    [game.teamA, game.teamB]
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (confirmVisible) {
        setConfirmVisible(false);
        return true;
      }
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [confirmVisible, onBack]);

  const winnerName = winner === 'A' ? game.teamA : game.teamB;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={HIT_SLOP}
        >
          <Icon name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Partida</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Compartir"
          hitSlop={HIT_SLOP}
        >
          <Icon name="share-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={game.rounds}
        keyExtractor={roundKeyExtractor}
        renderItem={renderRound}
        ListHeaderComponent={
          <View>
            <View style={styles.summaryMeta}>
              <Text style={styles.summaryMetaText}>
                {formatDateLong(game.date)} · {formatTime(game.date)}
                {game.durationMin ? ` · ${game.durationMin} min` : ''}
              </Text>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>META {game.meta}</Text>
              </View>
            </View>

            <View style={styles.finalRow}>
              <View style={styles.finalSide}>
                <View style={styles.finalLabelRow}>
                  {winner === 'A' && (
                    <Icon name="trophy" size={14} color={COLORS.accent} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.finalLabel, { color: COLORS.primary }]} numberOfLines={1}>
                    {game.teamA.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.finalScore, winner !== 'A' && styles.finalScoreLose]}>
                  {final.A}
                </Text>
              </View>

              <View style={styles.finalDivider} />

              <View style={styles.finalSide}>
                <View style={styles.finalLabelRow}>
                  {winner === 'B' && (
                    <Icon name="trophy" size={14} color={COLORS.accent} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.finalLabel, { color: COLORS.secondary }]} numberOfLines={1}>
                    {game.teamB.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.finalScore, winner !== 'B' && styles.finalScoreLose]}>
                  {final.B}
                </Text>
              </View>
            </View>

            <View style={styles.winnerBanner}>
              <Icon name="trophy" size={14} color={COLORS.accent} />
              <Text style={styles.winnerBannerText}>
                Ganó <Text style={{ color: COLORS.text, fontWeight: '800' }}>{winnerName}</Text>
              </Text>
            </View>

            <View style={styles.roundsHeader}>
              <Text style={styles.roundsHeaderText}>RONDA · EQUIPO · PUNTOS</Text>
              <View style={styles.runningHeaderWrap}>
                <Text style={[styles.runningHeader, { color: COLORS.primary }]}>N</Text>
                <Text style={[styles.runningHeader, { color: COLORS.secondary }]}>E</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyRounds}>Sin jugadas registradas.</Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnSecondary} onPress={handleShare}>
          <Icon name="share-outline" size={16} color={COLORS.text} />
          <Text style={styles.btnSecondaryText}>Compartir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnSecondary, styles.btnDanger]}
          onPress={() => setConfirmVisible(true)}
        >
          <Icon name="trash-outline" size={16} color={COLORS.secondary} />
          <Text style={[styles.btnSecondaryText, { color: COLORS.secondary }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Icon
              name="warning-outline"
              size={44}
              color={COLORS.secondary}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.dialogTitle}>¿Eliminar partida?</Text>
            <Text style={styles.dialogText}>Esta acción no se puede deshacer.</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDangerSolid} onPress={handleDelete}>
                <Text style={styles.btnDangerSolidText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  listContent: {
    paddingBottom: 20,
  },
  summaryMeta: {
    paddingHorizontal: 18,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryMetaText: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 10,
  },
  metaPill: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  metaPillText: {
    color: COLORS.accent,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  finalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  finalSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  finalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  finalScore: {
    fontSize: 60,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -2,
    lineHeight: 64,
  },
  finalScoreLose: {
    color: '#5a5a62',
  },
  finalDivider: {
    width: 1,
    height: 80,
    backgroundColor: COLORS.dividerStrong,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    marginHorizontal: 18,
    marginBottom: 4,
  },
  winnerBannerText: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  roundsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 10,
  },
  roundsHeaderText: {
    color: '#5a5a62',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  runningHeaderWrap: {
    flexDirection: 'row',
    gap: 18,
  },
  runningHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  roundNum: {
    width: 26,
    color: '#5a5a62',
    fontSize: 11,
    fontWeight: '700',
  },
  roundTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roundTeamText: {
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 0.4,
    fontSize: 14,
  },
  roundPts: {
    width: 56,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '800',
  },
  roundRunning: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  runningNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  runningSep: {
    color: '#5a5a62',
    marginHorizontal: 6,
  },
  emptyRounds: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 30,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSecondaryText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  btnDanger: {
    backgroundColor: COLORS.card,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: '#222',
    borderRadius: 25,
    padding: 25,
    width: '100%',
    alignItems: 'center',
  },
  dialogTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  dialogText: {
    color: COLORS.textDim,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    padding: 14,
    backgroundColor: '#333',
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  btnDangerSolid: {
    flex: 1,
    padding: 14,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDangerSolidText: {
    color: COLORS.bg,
    fontWeight: '800',
  },
});
