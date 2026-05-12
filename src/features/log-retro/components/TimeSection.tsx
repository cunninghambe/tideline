import React from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, addDays, subDays } from 'date-fns';

import { Stepper } from '@/components/ui/Stepper';
import { usePalette } from '@/theme/useTheme';
import { formatHHMM } from '../logic';

type TimeSectionProps = {
  startDate: string;
  startHour: number;
  startMinute: number;
  endDate: string;
  endHour: number;
  endMinute: number;
  stillGoing: boolean;
  onStartDate: (date: string) => void;
  onStartHour: (h: number) => void;
  onStartMinute: (m: number) => void;
  onEndDate: (date: string) => void;
  onEndHour: (h: number) => void;
  onEndMinute: (m: number) => void;
  onStillGoing: (v: boolean) => void;
};

function shiftDate(d: string, deltaDays: number): string {
  const date = parseISO(d);
  const shifted = deltaDays > 0 ? addDays(date, deltaDays) : subDays(date, Math.abs(deltaDays));
  return format(shifted, 'yyyy-MM-dd');
}

function prettyDate(d: string): string {
  try {
    return format(parseISO(d), 'EEE, MMM d');
  } catch {
    return d;
  }
}

type DateChooserProps = {
  date: string;
  onChange: (date: string) => void;
  testIDPrefix: string;
};

function DateChooser({ date, onChange, testIDPrefix }: DateChooserProps) {
  const palette = usePalette();
  const today = format(new Date(), 'yyyy-MM-dd');
  return (
    <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-3 py-2">
      <Pressable
        onPress={() => onChange(shiftDate(date, -1))}
        accessibilityRole="button"
        accessibilityLabel="Previous day"
        hitSlop={12}
        style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
        testID={`${testIDPrefix}-prev`}
      >
        <Ionicons name="chevron-back" size={20} color={palette.textPrimary} />
      </Pressable>
      <Text
        className="text-text-primary text-base font-medium"
        testID={`${testIDPrefix}-label`}
      >
        {prettyDate(date)}
      </Text>
      <Pressable
        onPress={() => onChange(shiftDate(date, 1))}
        disabled={date >= today}
        accessibilityRole="button"
        accessibilityLabel="Next day"
        accessibilityState={{ disabled: date >= today }}
        hitSlop={12}
        style={{
          minHeight: 44,
          minWidth: 44,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: date >= today ? 0.3 : 1,
        }}
        testID={`${testIDPrefix}-next`}
      >
        <Ionicons name="chevron-forward" size={20} color={palette.textPrimary} />
      </Pressable>
    </View>
  );
}

export function TimeSection({
  startDate,
  startHour,
  startMinute,
  endDate,
  endHour,
  endMinute,
  stillGoing,
  onStartDate,
  onStartHour,
  onStartMinute,
  onEndDate,
  onEndHour,
  onEndMinute,
  onStillGoing,
}: TimeSectionProps) {
  return (
    <View className="gap-4">
      <Text className="text-text-primary text-xl font-semibold">When</Text>

      {/* Start time */}
      <View className="gap-2">
        <Text className="text-text-secondary text-sm font-medium">Started</Text>
        <DateChooser date={startDate} onChange={onStartDate} testIDPrefix="start-date" />
        <View className="flex-row items-center gap-4">
          <View className="flex-1">
            <Text className="text-text-secondary text-xs mb-1">Hour</Text>
            <Stepper
              value={startHour}
              onValueChange={onStartHour}
              min={0}
              max={23}
              testID="start-hour-stepper"
            />
          </View>
          <Text className="text-text-primary font-semibold text-xl">
            {formatHHMM(startHour, startMinute)}
          </Text>
          <View className="flex-1">
            <Text className="text-text-secondary text-xs mb-1">Minute</Text>
            <Stepper
              value={startMinute}
              onValueChange={onStartMinute}
              min={0}
              max={59}
              step={5}
              testID="start-minute-stepper"
            />
          </View>
        </View>
      </View>

      {/* End time */}
      <View className="gap-2">
        <Text className="text-text-secondary text-sm font-medium">Ended</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-text-primary text-base">Still going</Text>
          <Switch
            value={stillGoing}
            onValueChange={onStillGoing}
            accessibilityLabel="Still going"
            accessibilityRole="switch"
          />
        </View>
        {!stillGoing && (
          <>
            <DateChooser date={endDate} onChange={onEndDate} testIDPrefix="end-date" />
            <View className="flex-row items-center gap-4">
              <View className="flex-1">
                <Text className="text-text-secondary text-xs mb-1">Hour</Text>
                <Stepper
                  value={endHour}
                  onValueChange={onEndHour}
                  min={0}
                  max={23}
                  testID="end-hour-stepper"
                />
              </View>
              <Text className="text-text-primary font-semibold text-xl">
                {formatHHMM(endHour, endMinute)}
              </Text>
              <View className="flex-1">
                <Text className="text-text-secondary text-xs mb-1">Minute</Text>
                <Stepper
                  value={endMinute}
                  onValueChange={onEndMinute}
                  min={0}
                  max={59}
                  step={5}
                  testID="end-minute-stepper"
                />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
