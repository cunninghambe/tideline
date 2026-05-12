export const FEATURE_FLAGS = {
  cloudSync: false,           // Supabase per-user sync
  communityFeed: false,       // Central pool ingest + feed
  monthlyAINarrative: false,  // Claude Haiku narrative
  cycleTracking: true,        // On but data stays local always
  notificationsLocal: true,   // Daily check-in + refill local notifications
} as const;
