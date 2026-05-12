import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Slider } from '@/components/ui/Slider';
import { companionCopy } from '@/copy';
import { usePalette } from '@/theme/useTheme';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { DuringSection } from '@/features/companion/components/DuringSection';
import { TipBlock } from '@/features/companion/components/TipBlock';
import { EmergencyBlock } from '@/features/companion/components/EmergencyBlock';
import {
  useActiveMigraine,
  useMinutesSince,
  useTopHelpersFallback,
  useMedsList,
  useRecordDose,
  useUpdateSeverity,
} from '@/features/companion/hooks';

// ---------------------------------------------------------------------------
// MedsSheet — "I took something"
// ---------------------------------------------------------------------------

type MedsSheetProps = {
  open: boolean;
  onClose: () => void;
  migraineId: string;
};

function MedsSheet({ open, onClose, migraineId }: MedsSheetProps) {
  const { data: meds } = useMedsList();
  const recordDose = useRecordDose();

  function handleTakeMed(medId: string, defaultDose: string) {
    recordDose.mutate(
      { medicationId: medId, migraineEventId: migraineId, takenAt: new Date(), doseAmount: defaultDose },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="What did you take?">
      <View className="px-6 pb-8 gap-3">
        {!meds || meds.length === 0 ? (
          <Text className="text-text-secondary text-base">
            No medications in your list yet. Add some in the Meds tab.
          </Text>
        ) : (
          meds.map((med) => (
            <Button
              key={med.id}
              label={`${med.brandName} ${med.defaultDose}`}
              onPress={() => handleTakeMed(med.id, med.defaultDose)}
              variant="secondary"
              size="xl"
              fullWidth
              loading={recordDose.isPending}
            />
          ))
        )}
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// WorseSeveritySheet — "It's getting worse"
// ---------------------------------------------------------------------------

type WorseSeveritySheetProps = {
  open: boolean;
  onClose: () => void;
  migraineId: string;
  currentSeverity: number;
};

function WorseSeveritySheet({
  open,
  onClose,
  migraineId,
  currentSeverity,
}: WorseSeveritySheetProps) {
  const [draft, setDraft] = useState(currentSeverity);
  const updateSeverity = useUpdateSeverity(migraineId);

  useEffect(() => {
    if (open) setDraft(currentSeverity);
  }, [open, currentSeverity]);

  function saveAndClose() {
    updateSeverity.mutate(draft, { onSuccess: onClose });
  }

  return (
    <Sheet open={open} onClose={onClose} title="Update peak severity">
      <View className="px-6 pb-8 gap-6">
        <Slider
          value={draft}
          onValueChange={setDraft}
          min={1}
          max={10}
          ariaLabel="Peak severity 1 to 10"
          testID="worse-severity-slider"
        />
        <Button
          label="Save"
          onPress={saveAndClose}
          size="xl"
          fullWidth
          loading={updateSeverity.isPending}
        />
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// No-active-migraine guard
// ---------------------------------------------------------------------------

function NoActiveMigraineScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-bg items-center justify-center px-8 gap-6">
      <Text className="text-text-primary text-xl text-center">
        No migraine active right now.
      </Text>
      <Button
        label="Go back"
        onPress={() => router.replace('/(tabs)')}
        variant="secondary"
        size="xl"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// CompanionScreen
// ---------------------------------------------------------------------------

export default function CompanionScreen() {
  const router = useRouter();
  const palette = usePalette();
  const activeMigraineId = useActiveMigraineStore((s) => s.activeMigraineId);

  const [medsSheetOpen, setMedsSheetOpen] = useState(false);
  const [worseSheetOpen, setWorseSheetOpen] = useState(false);

  const { data: migraine } = useActiveMigraine();
  const minutesAgo = useMinutesSince(migraine?.startedAt ?? null);
  const { helpers, completedCount } = useTopHelpersFallback(3);

  if (!activeMigraineId) {
    return <NoActiveMigraineScreen />;
  }

  const severity = migraine?.peakSeverity ?? 1;

  return (
    <View className="flex-1" style={{ backgroundColor: palette.bg }}>
      {/* Low-opacity during-tint overlay (~7%) */}
      <View
        className="absolute inset-0"
        style={{ backgroundColor: palette.duringTint, opacity: 0.07 }}
        pointerEvents="none"
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-12 pb-8 gap-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Title — softly faded */}
        <Text
          className="text-text-primary text-4xl font-medium"
          style={{ opacity: 0.7 }}
          accessibilityRole="header"
        >
          {companionCopy.title}
        </Text>

        {/* Right now */}
        {migraine ? (
          <DuringSection
            migraineId={migraine.id}
            loggedAgoText={companionCopy.loggedAgo(minutesAgo)}
            severity={severity}
          />
        ) : null}

        {/* Personalized helpers + general tips */}
        <TipBlock helpers={helpers} completedCount={completedCount} />

        {/* Emergency guidance */}
        <EmergencyBlock />

        {/* Three big CTAs */}
        <View className="gap-4 pt-4">
          <Button
            label={companionCopy.ctas.tookSomething}
            onPress={() => setMedsSheetOpen(true)}
            variant="secondary"
            size="xl"
            fullWidth
            testID="cta-took-something"
          />
          <Button
            label={companionCopy.ctas.gettingWorse}
            onPress={() => setWorseSheetOpen(true)}
            variant="secondary"
            size="xl"
            fullWidth
            testID="cta-getting-worse"
          />
          <Button
            label={companionCopy.ctas.ended}
            onPress={() => router.push('/log/end')}
            variant="primary"
            size="xl"
            fullWidth
            testID="cta-ended"
          />
        </View>
      </ScrollView>

      {/* Sheets */}
      <MedsSheet
        open={medsSheetOpen}
        onClose={() => setMedsSheetOpen(false)}
        migraineId={activeMigraineId}
      />
      <WorseSeveritySheet
        open={worseSheetOpen}
        onClose={() => setWorseSheetOpen(false)}
        migraineId={activeMigraineId}
        currentSeverity={severity}
      />
    </View>
  );
}
