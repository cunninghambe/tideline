import { formatDuration } from '@/lib/format';
import type { HelperTag, PostState, SymptomTag } from '@/db/schema/migraines';
import type { PaletteName } from '@/theme/palettes';

// ---------------------------------------------------------------------------
// Onboarding (spec section 0)
// ---------------------------------------------------------------------------

export const onboardingCopy = {
  welcome: {
    title: 'Hi. Tideline helps you understand your migraines.',
    body: "Log attacks. Track what you ate, how you slept, how the weather felt. Over time, patterns appear.\n\nYour data lives on your phone. Nothing leaves it unless you choose to share it.",
    cta: 'Continue',
  },
  location: {
    title: 'One quick ask: your location.',
    body: 'The app pulls weather data — temperature, humidity, barometric pressure — from where you actually are. Pressure changes in particular show up as triggers for many people.\n\nYour exact location stays on your phone. We never upload it.',
    primary: 'Allow location',
    secondary: 'Maybe later',
  },
  notifications: {
    title: 'Want a daily nudge to log?',
    body: "A 30-second daily check-in (sleep, water, how you're feeling) is what makes the patterns work.",
    primary: 'Yes, remind me',
    secondary: 'No thanks',
    timeLabel: 'Reminder time',
    defaultTime: '09:00',
  },
  theme: {
    title: 'Pick a palette.',
    body: 'You can change this any time in Settings.',
  },
  done: {
    title: "You're set.",
    body: "Tap the + to log your first migraine, or just go about your day — we'll be here when you need us.",
    cta: 'Get started',
  },
} as const;

// ---------------------------------------------------------------------------
// Active migraine logging (spec section 3.2)
// ---------------------------------------------------------------------------

export const activeLogCopy = {
  title: "You're having a migraine.",
  subtitle: "Started just now. We'll keep counting.",
  severityLabel: "How bad? (slide later if you can't tell)",
  symptomsLabel: 'Feeling? (tap any that apply)',
  notesLabel: 'Notes (optional)',
  saveCta: 'Save',
  companionCta: 'Open companion mode →',
} as const;

// ---------------------------------------------------------------------------
// In-migraine companion (spec section 6)
// ---------------------------------------------------------------------------

export const companionCopy = {
  title: 'Tideline is here.',
  rightNowHeading: 'Right now:',
  loggedAgo: (mins: number) => `You logged this migraine ${formatDuration(mins)} ago.`,
  severityLine: (n: number) => `Severity: ${n} (tap to update)`,
  helpedHistoryHeading: 'Things that have helped you before:',
  emptyHelpedHistory:
    "We'll start learning what helps you specifically once you've logged a few attacks.",
  generalTipsHeading: 'General things to try:',
  generalTips: [
    "Hydrate slowly. Sip, don't gulp.",
    'Dim the lights. Close curtains. Phone brightness all the way down.',
    'Cold compress on the forehead or back of the neck.',
    'If you have a triptan, the earlier you take it the better it works.',
  ] as readonly string[],
  emergencyHeading: 'When to seek help:',
  emergencyBody:
    'Sudden "worst headache of your life," vision loss, weakness on one side, confusion, or stiff neck with fever — this could be more than a migraine. Call emergency services.',
  ctas: {
    tookSomething: 'I took something',
    gettingWorse: "It's getting worse",
    ended: 'It ended',
  },
} as const;

// ---------------------------------------------------------------------------
// Daily check-in (spec section 7)
// ---------------------------------------------------------------------------

export const checkinCopy = {
  title: 'Yesterday — quick check-in',
  sleep: {
    label: 'Sleep',
    hoursLabel: 'Hours',
    qualityLabel: 'Quality',
    qualityOptions: [
      { value: 1, label: '😣' },
      { value: 2, label: '😐' },
      { value: 3, label: '🙂' },
      { value: 4, label: '😊' },
    ],
  },
  stress: { label: 'Stress', helper: '1 = calm, 5 = very stressed' },
  water: { label: 'Water', unit: 'cups' },
  food: { label: 'Food', addCta: '+ Add' },
  caffeine: { label: 'Caffeine', unit: 'cups' },
  cycle: {
    label: 'Cycle',
    options: [
      { value: 'period_start', label: 'Period started today' },
      { value: 'period_end', label: 'Period ended today' },
      { value: 'no_change', label: 'No change' },
    ],
  },
  notes: { label: 'Anything else?', placeholder: 'Optional notes' },
  saveCta: 'Save',
} as const;

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

export const emptyCopy = {
  calendarFirstUse:
    'Log your first migraine to start seeing patterns. Daily check-ins help us learn faster — try the + button.',
  insightsNotEnoughData:
    "We need a bit more data before patterns are meaningful. Keep logging — we'll show you what we find once there's enough to be honest about.",
  communityNotEnoughContributors: (count: number) =>
    `We need at least 50 active contributors in your region to show meaningful trends. Right now there are ${count}. Tideline gets smarter as more people in your area opt in.`,
  noMigraineForDay: 'No migraine logged for this day',
  noCheckinForDay: 'No daily check-in',
  helpersHistoryEmpty:
    "We'll start learning what helps you specifically once you've logged a few attacks.",
} as const;

// ---------------------------------------------------------------------------
// Spec-gap G2: Symptom chips (ordered for UI)
// ---------------------------------------------------------------------------

export const SYMPTOM_TAGS_ALL: SymptomTag[] = [
  'throbbing',
  'aura',
  'nausea',
  'light_sensitive',
  'sound_sensitive',
  'smell_sensitive',
  'behind_eyes',
  'one_sided',
  'whole_head',
];

export const SYMPTOM_CHIPS_UI: { value: SymptomTag; label: string }[] = [
  { value: 'throbbing', label: 'Throbbing' },
  { value: 'aura', label: 'Aura' },
  { value: 'nausea', label: 'Nausea' },
  { value: 'light_sensitive', label: 'Light hurts' },
  { value: 'sound_sensitive', label: 'Sound hurts' },
  { value: 'smell_sensitive', label: 'Smell hurts' },
  { value: 'behind_eyes', label: 'Behind eyes' },
  { value: 'one_sided', label: 'One side' },
];

// ---------------------------------------------------------------------------
// Spec-gap G3: Helper chips canonical order
// ---------------------------------------------------------------------------

export const HELPER_TAGS_DEFAULT_ORDER: { value: HelperTag; label: string }[] = [
  { value: 'sleep', label: 'Sleep' },
  { value: 'dark_room', label: 'Dark room' },
  { value: 'hydration', label: 'Hydration' },
  { value: 'cold_compress', label: 'Cold compress' },
  { value: 'hot_shower', label: 'Hot shower' },
  { value: 'medication', label: 'The medication' },
  { value: 'eating', label: 'Eating' },
  { value: 'caffeine', label: 'Caffeine' },
  { value: 'massage', label: 'Massage' },
  { value: 'nothing', label: 'Nothing helped' },
];

// ---------------------------------------------------------------------------
// Spec-gap G12: Post-state chips
// ---------------------------------------------------------------------------

export const POST_STATE_CHIPS: { value: PostState; label: string }[] = [
  { value: 'drained', label: 'Drained' },
  { value: 'fragile', label: 'Better but fragile' },
  { value: 'almost_normal', label: 'Almost normal' },
  { value: 'fine', label: 'Fine' },
];

// ---------------------------------------------------------------------------
// Palette picker options (for theme picker UI)
// ---------------------------------------------------------------------------

export const PALETTE_PICKER_OPTIONS: {
  value: PaletteName;
  displayName: string;
  swatchColors: string[];
}[] = [
  {
    value: 'calm_sand',
    displayName: 'Calm Sand',
    swatchColors: ['#F5EFE6', '#B85C38', '#8B2E1F'],
  },
  {
    value: 'soft_storm',
    displayName: 'Soft Storm',
    swatchColors: ['#EEF1F5', '#3B6BA5', '#1F3A5C'],
  },
  {
    value: 'quiet_night',
    displayName: 'Quiet Night',
    swatchColors: ['#0F1419', '#7EB8D4', '#D4654A'],
  },
  {
    value: 'forest_pale',
    displayName: 'Forest Pale',
    swatchColors: ['#F2F4EE', '#5C7A4B', '#3D5230'],
  },
];
