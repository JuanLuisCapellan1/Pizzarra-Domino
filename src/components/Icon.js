import React, { memo } from 'react';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';

// Componente único que dibuja todos los íconos de la app como SVG inline.
// Reemplaza @expo/vector-icons (Ionicons) que cargaba la font completa.
// API compatible: <Icon name="..." size={N} color="#..." style={...} />.

const STROKE = 2.2;

const ICONS = {
  'pencil': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill={p.color}>
      <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </Svg>
  ),
  'create-outline': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </Svg>
  ),
  'time-outline': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Polyline points="12 7 12 12 15.5 13.5" />
    </Svg>
  ),
  'refresh-circle': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill={p.color}>
      <Path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.5 11.5a4.5 4.5 0 01-8.32 1.78l-.94.93a.75.75 0 01-1.28-.53V12.5a.75.75 0 01.75-.75h3.18a.75.75 0 01.53 1.28l-.92.92a3 3 0 005.5-1.45.75.75 0 011.5 0zm.79-5.18a.75.75 0 01-.53 1.28h-3.18a.75.75 0 01-.53-1.28l.92-.92a3 3 0 00-5.5 1.45.75.75 0 11-1.5 0 4.5 4.5 0 018.32-1.78l.94-.93a.75.75 0 011.28.53V8.32z" />
    </Svg>
  ),
  'add': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  ),
  'close': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="6" y1="6" x2="18" y2="18" />
      <Line x1="18" y1="6" x2="6" y2="18" />
    </Svg>
  ),
  'close-circle': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill={p.color}>
      <Path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.3 13.3a1 1 0 11-1.4 1.4L12 13.4l-2.9 3.3a1 1 0 11-1.4-1.4l3-3-3-3a1 1 0 011.4-1.4l2.9 3 2.9-3a1 1 0 011.4 1.4l-3 3 3 3z" />
    </Svg>
  ),
  'warning-outline': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <Line x1="12" y1="9" x2="12" y2="13" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  ),
  'alert-circle-outline': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="8" x2="12" y2="12" />
      <Line x1="12" y1="16" x2="12.01" y2="16" />
    </Svg>
  ),
  'chevron-back': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="15 18 9 12 15 6" />
    </Svg>
  ),
  'share-outline': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <Polyline points="16 6 12 2 8 6" />
      <Line x1="12" y1="2" x2="12" y2="15" />
    </Svg>
  ),
  'trash-outline': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6l-1.5 14a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8L5 6" />
      <Line x1="10" y1="11" x2="10" y2="17" />
      <Line x1="14" y1="11" x2="14" y2="17" />
    </Svg>
  ),
  'trophy': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill={p.color}>
      <Path d="M19 5h-2V3H7v2H5a2 2 0 00-2 2v2a4 4 0 004 4 5 5 0 004 4v2H8v2h8v-2h-3v-2a5 5 0 004-4 4 4 0 004-4V7a2 2 0 00-2-2zM5 9V7h2v4a2 2 0 01-2-2zm14 0a2 2 0 01-2 2V7h2v2z" />
    </Svg>
  ),
  'search': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="7" />
      <Line x1="21" y1="21" x2="16.5" y2="16.5" />
    </Svg>
  ),
  'calendar-outline': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  ),
  'chevron-forward': (p) => (
    <Svg {...p} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="9 6 15 12 9 18" />
    </Svg>
  ),
};

function Icon({ name, size = 18, color = '#fff', style }) {
  const Glyph = ICONS[name];
  if (!Glyph) {
    if (__DEV__) console.warn(`[Icon] Nombre desconocido: ${name}`);
    return null;
  }
  return <Glyph width={size} height={size} color={color} style={style} />;
}

export default memo(Icon);
