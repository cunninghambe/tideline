import React from 'react';
import { View, Text, Switch } from 'react-native';

import { Stepper } from '@/components/ui/Stepper';
import { formatHHMM } from '../logic';

type TimeSectionProps = {
  startDate: string;
  startHour: number;
  startMinute: number;
  endDate: string;
  endHour: number;
  endMinute: number;
  stillGoing: boolean;
  onStartHour: (h: number) => void;
  onStartMinute: (m: number) => void;
  onEndHour: (h: number) => void;
  onEndMinute: (m: number) => void;
  onStillGoing: (v: boolean) => void;
};

export function TimeSection({
  startDate,
  startHour,
  startMinute,
  endDate,
  endHour,
  endMinute,
  stillGoing,
  onStartHour,
  onStartMinute,
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
        <Text className="text-text-muted text-xs">{startDate}</Text>
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
            <Text className="text-text-muted text-xs">{endDate}</Text>
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
