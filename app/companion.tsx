import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Slider } from '@/components/ui/Slider';
import { companionCopy } from '@/copy';
import { usePalette } from '@/theme/useTheme';
import { useDensity } from '@/theme/calendarTokenHooks';
import { FONT_FAMILY } from '@/theme/fonts';
import { useActiveMigraineStore } from '@/stores/useActiveMigraineStore';
import { DuringSection } from '@/features/companion/components/DuringSection';
import { TipBlock } from '@/features/companion/components/TipBlock';
import { EmergencyBlock } from '@/features/companion/components/EmergencyBlock';
import { CompanionDivider } from '@/features/companion/components/CompanionBlock';
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
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
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
              variant="duringPrimary"
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
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 24 }}>
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
  const palette = usePalette();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 24,
      }}
    >
      <Text
        style={{
          color: palette.textPrimary,
          fontFamily: FONT_FAMILY.serif,
          fontSize: 22,
          textAlign: 'center',
        }}
      >
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
  const density = useDensity();
  const insets = useSafeAreaInsets();
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
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: palette.bg }}>
      {/* Companion mode is the dimmest surface — heavy during-tint per design */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: palette.duringTint,
          opacity: 0.5,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: density.headerPad * 1.4,
          paddingTop: density.headerPad * 1.5,
          paddingBottom: density.headerPad * 1.4,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Centred fading Newsreader title */}
        <View style={{ alignItems: 'center', opacity: 0.78, marginBottom: 28 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: FONT_FAMILY.serif,
              fontSize: 26 * density.typeScale,
              lineHeight: 29 * density.typeScale,
              letterSpacing: -0.26,
              color: palette.textPrimary,
              textAlign: 'center',
            }}
          >
            Tideline{'\n'}is here.
          </Text>
        </View>

        {migraine ? (
          <DuringSection
            migraineId={migraine.id}
            loggedAgoText={companionCopy.loggedAgo(minutesAgo)}
            severity={severity}
          />
        ) : null}

        <CompanionDivider />

        <TipBlock helpers={helpers} completedCount={completedCount} />

        <CompanionDivider />

        <EmergencyBlock />

        {/* Bottom CTAs — duringPrimary muted */}
        <View style={{ marginTop: 24, gap: 8 }}>
          <Button
            label={companionCopy.ctas.tookSomething}
            onPress={() => setMedsSheetOpen(true)}
            variant="duringPrimary"
            size="xl"
            fullWidth
            testID="cta-took-something"
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={companionCopy.ctas.gettingWorse}
                onPress={() => setWorseSheetOpen(true)}
                variant="duringPrimary"
                size="lg"
                fullWidth
                testID="cta-getting-worse"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={companionCopy.ctas.ended}
                onPress={() => router.push('/log/end')}
                variant="duringPrimary"
                size="lg"
                fullWidth
                testID="cta-ended"
              />
            </View>
          </View>
        </View>
      </ScrollView>

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
