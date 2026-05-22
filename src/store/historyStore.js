import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@domino_apuntes:history:v1';
const MAX_GAMES = 200; // tope blando para evitar crecimiento ilimitado

const listeners = new Set();

let gamesCache = [];
let loadedCache = false;
let loadPromise = null;
let storeVersion = 0;

const emit = () => {
  listeners.forEach((listener) => listener(gamesCache, loadedCache));
};

const applyUpdate = (nextGames) => {
  gamesCache = nextGames;
  loadedCache = true;
  storeVersion += 1;
  emit();
};

const ensureLoaded = async () => {
  if (loadedCache) return;
  if (loadPromise) return loadPromise;

  const versionAtStart = storeVersion;
  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (storeVersion === versionAtStart) {
        gamesCache = raw ? JSON.parse(raw) : [];
        loadedCache = true;
      }
    } catch {
      if (storeVersion === versionAtStart) {
        loadedCache = true;
      }
    } finally {
      loadPromise = null;
      emit();
    }
  })();

  return loadPromise;
};

// Hook minimal para gestionar el historial persistente de partidas.
// Carga al montar, persiste cada cambio. Sin librería externa para mantenerlo simple.
export function useHistory() {
  const [games, setGames] = useState(gamesCache);
  const [loaded, setLoaded] = useState(loadedCache);

  useEffect(() => {
    let cancelled = false;

    const listener = (nextGames, nextLoaded) => {
      if (cancelled) return;
      setGames(nextGames);
      setLoaded(nextLoaded);
    };

    listeners.add(listener);
    void ensureLoaded();

    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  const persist = useCallback(async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // En producción registraríamos esto en un logger; aquí lo silenciamos.
    }
  }, []);

  const addGame = useCallback(
    (game) => {
      const next = [game, ...gamesCache].slice(0, MAX_GAMES);
      applyUpdate(next);
      void persist(next);
    },
    [persist]
  );

  const removeGame = useCallback(
    (id) => {
      const next = gamesCache.filter((g) => g.id !== id);
      applyUpdate(next);
      void persist(next);
    },
    [persist]
  );

  const clearAll = useCallback(() => {
    applyUpdate([]);
    void persist([]);
  }, [persist]);

  return { games, loaded, addGame, removeGame, clearAll };
}
