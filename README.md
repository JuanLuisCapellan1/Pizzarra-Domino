# DominoApuntes

> **Propiedad exclusiva de Juan Luis Capellán Aramboles. Todos los derechos reservados.**

Aplicación móvil para llevar la puntuación y el registro de partidas de dominó. Desarrollada con React Native y Expo (managed workflow).

---

## Funcionalidades

### Pantalla de Juego
- Marcador en tiempo real para dos equipos (NOSOTROS / ELLOS)
- Meta personalizable (por defecto 200 puntos)
- Nombres de equipos editables
- Botones de acceso rápido (+25, +50, +75) e ingreso manual de puntos
- Historial in-game con opción de anular/restaurar jugadas (mantener presionado)
- Modal de victoria al alcanzar la meta
- Guardado automático de la partida al finalizar

### Historial de Partidas
- Agrupación automática: Hoy · Ayer · Esta Semana · Anterior
- Filtros rápidos: Todas / Ganamos / Perdimos / Meta 200 / 150 / 100
- Búsqueda por nombre de equipo
- Máximo de 200 partidas almacenadas

### Detalle de Partida
- Resumen con marcadores finales, meta, fecha y duración
- Tabla completa de rondas con el marcador acumulado en cada jugada
- Compartir partida por cualquier app del sistema
- Eliminar partida con confirmación

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React Native 0.81.5 · React 19 |
| Plataforma | Expo SDK 54 (managed) |
| Persistencia | AsyncStorage |
| UI | StyleSheet nativo · React Native SVG |
| Safe Area | react-native-safe-area-context |
| Build / Deploy | EAS Build · EAS Submit |

La app tiene la **New Architecture habilitada** (`newArchEnabled: true`) y corre sobre el motor Hermes.

---

## Estructura del Proyecto

```
DominoApuntes/
├── App.js                        # Router de 3 pantallas (sin librería de navegación)
├── app.json                      # Configuración Expo
├── eas.json                      # Perfiles de EAS Build y Submit
├── src/
│   ├── screens/
│   │   ├── GameScreen.js         # Pantalla principal de puntuación
│   │   ├── HistoryScreen.js      # Listado de partidas guardadas
│   │   └── GameDetailScreen.js   # Vista detallada de una partida
│   ├── components/
│   │   ├── GameCard.js           # Tarjeta de partida para el historial
│   │   ├── HistoryEntryRow.js    # Fila de jugada del historial in-game
│   │   └── Icon.js               # Íconos SVG inline (reemplaza fuentes de iconos)
│   ├── store/
│   │   └── historyStore.js       # Hook useHistory — carga y persiste en AsyncStorage
│   ├── utils/
│   │   └── gameHelpers.js        # Helpers: ganador, agrupación, formateo de fechas
│   └── constants/
│       └── theme.js              # Colores y tamaños globales (Dark Mode)
└── assets/                       # Íconos y splash screens
```

---

## Modelo de Datos

### Partida guardada

```js
{
  id: string,           // ej: "g-1716123456789"
  date: number,         // timestamp epoch ms
  durationMin: number,
  meta: number,         // objetivo de puntos (100, 150, 200…)
  teamA: string,        // nombre equipo A
  teamB: string,        // nombre equipo B
  winner: 'A' | 'B',
  rounds: [
    {
      team: 'A' | 'B',
      points: number,
      after: { A: number, B: number }  // marcador acumulado tras la jugada
    }
  ]
}
```

### Jugada in-game (estado local mientras se juega)

```js
{
  id: string,
  team: 'A' | 'B',
  points: number,
  voided: boolean
}
```

---

## Navegación

La app usa un router manual con estado en `App.js` — sin dependencia de React Navigation ni expo-router. Con tres pantallas es suficiente; si la app crece, el siguiente paso natural sería migrar a `expo-router`.

```
game  ──onOpenHistory──▶  history  ──onOpenGame──▶  detail
  ◀──────onBack──────────────────────◀──onBack──────────────
```

`GameScreen` permanece siempre montada (aunque invisible) para que el estado de la partida en curso no se pierda al navegar al historial.

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

---

## Build con EAS

```bash
# Build de desarrollo (dev client)
eas build --profile development --platform android

# APK interno para pruebas
eas build --profile preview --platform android

# Build de producción (App Bundle)
eas build --profile production --platform android

# Publicar en Play Store (internal track)
eas submit --platform android
```

### Perfiles de build

| Perfil | Tipo de salida | Distribución |
|--------|---------------|-------------|
| `development` | Dev client | Internal |
| `preview` | APK | Internal |
| `production` | App Bundle | Play Store (internal track, draft) |

---

## Configuración

| Propiedad | Valor |
|-----------|-------|
| Bundle ID Android | `com.juanluiscapellan.DominoApuntes` |
| Versión | `1.0.0` |
| Orientación | Portrait (bloqueado) |
| Tema | Dark Mode forzado |
| New Architecture | Habilitada |
| ProGuard | Activado en producción |

---

## Decisiones de Diseño

- **Íconos SVG inline:** El componente `Icon.js` dibuja todos los íconos como SVG puro, evitando cargar una fuente de íconos completa en el bundle.
- **Sin librería de estado global:** El estado de la partida vive en `GameScreen` con `useState`; el historial persistente se gestiona con un hook propio sobre AsyncStorage. El scope actual no justifica Zustand o Redux.
- **Memoización selectiva:** `GameCard`, `HistoryEntryRow` e `Icon` están envueltos en `memo()`; los callbacks críticos usan `useCallback`. No se aplica memoización indiscriminada.
- **`GameScreen` siempre montada:** Al navegar al historial, el componente se oculta con `display: 'none'` en vez de desmontarse, preservando el estado de la partida en curso.
