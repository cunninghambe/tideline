import React, { useCallback, useState } from 'react';
import { View, Text, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
import { severityColorForLevel } from '@/features/calendar/utils';

type SliderProps = {
  value: number;
  onValueChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Reserved — value is always shown inside the thumb. Kept for API compatibility. */
  showValue?: boolean;
  ariaLabel: string;
  testID?: string;
};

const THUMB_SIZE = 32;
const TRACK_HEIGHT = 6;
const TICK_HEIGHT = 10;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function snap(raw: number, min: number, max: number, step: number): number {
  const stepped = Math.round((raw - min) / step) * step + min;
  return clamp(stepped, min, max);
}

/**
 * Severity slider — custom RN implementation matching the design system.
 *
 *   - 6px track on a 1px border
 *   - Fill colour tracks the live severity tier (mild / moderate / severe)
 *   - Tick marks at every step
 *   - 32px circular thumb whose border colour matches fill and which shows
 *     the current numeric value (Geist Mono 12px)
 *   - Bottom NONE / MILD / MOD / SEVERE labels
 *
 * Pan + tap drive value changes via gesture-handler.
 */
export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  ariaLabel,
  testID,
}: SliderProps) {
  const palette = usePalette();
  const density = useDensity();
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  const fillColor = severityColorForLevel(value, palette) ?? palette.accentPrimary;
  const range = Math.max(1, max - min);
  const pct = (value - min) / range;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const updateFromX = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const ratio = clamp(x / trackWidth, 0, 1);
      const raw = min + ratio * range;
      const next = snap(raw, min, max, step);
      if (next !== value) onValueChange(next);
    },
    [trackWidth, min, max, range, step, value, onValueChange],
  );

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      runOnJS(updateFromX)(e.x);
    });

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => runOnJS(setDragging)(true))
    .onUpdate((e) => runOnJS(updateFromX)(e.x))
    .onFinalize(() => runOnJS(setDragging)(false));

  const gesture = Gesture.Race(pan, tap);

  const onAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      const name = event.nativeEvent.actionName;
      if (name === 'increment') onValueChange(clamp(value + step, min, max));
      else if (name === 'decrement') onValueChange(clamp(value - step, min, max));
    },
    [value, step, min, max, onValueChange],
  );

  const trackInnerHeight = Math.max(THUMB_SIZE + 16, 48 * density.typeScale);

  return (
    <View testID={testID} style={{ width: '100%' }}>
      <GestureDetector gesture={gesture}>
        <View
          onLayout={onLayout}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={ariaLabel}
          accessibilityValue={{ min, max, now: value }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={onAccessibilityAction}
          style={{
            height: trackInnerHeight,
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Track */}
          <View
            style={{
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT / 2,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.surface,
            }}
          />
          {/* Fill */}
          {trackWidth > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: (trackInnerHeight - TRACK_HEIGHT) / 2,
                left: 0,
                height: TRACK_HEIGHT,
                width: pct * trackWidth,
                backgroundColor: fillColor,
                borderRadius: TRACK_HEIGHT / 2,
              }}
            />
          )}
          {/* Tick marks */}
          {trackWidth > 0 &&
            Array.from({ length: Math.floor(range / step) + 1 }, (_, i) => {
              const tickValue = min + i * step;
              const tickPct = (tickValue - min) / range;
              const isPast = tickValue <= value;
              return (
                <View
                  key={i}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: (trackInnerHeight - TICK_HEIGHT) / 2,
                    left: tickPct * trackWidth - 1,
                    width: 2,
                    height: TICK_HEIGHT,
                    backgroundColor: isPast ? fillColor : palette.border,
                    opacity: 0.4,
                    borderRadius: 1,
                  }}
                />
              );
            })}
          {/* Thumb */}
          {trackWidth > 0 && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: (trackInnerHeight - THUMB_SIZE) / 2,
                left: pct * trackWidth - THUMB_SIZE / 2,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: palette.surface,
                borderWidth: 2,
                borderColor: fillColor,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: dragging ? 1.08 : 1 }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: dragging ? 4 : 2 },
                shadowOpacity: dragging ? 0.2 : 0.1,
                shadowRadius: dragging ? 12 : 6,
                elevation: dragging ? 6 : 3,
              }}
            >
              <Text
                style={{
                  fontFamily: FONT_FAMILY.monoMedium,
                  fontSize: 12,
                  color: palette.textPrimary,
                }}
              >
                {value}
              </Text>
            </View>
          )}
        </View>
      </GestureDetector>
      {/* NONE / MILD / MODERATE / SEVERE labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
        accessibilityElementsHidden
      >
        {['none', 'mild', 'moderate', 'severe'].map((l) => (
          <Text
            key={l}
            style={{
              fontFamily: FONT_FAMILY.mono,
              fontSize: 10,
              color: palette.textMuted,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
            }}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}
