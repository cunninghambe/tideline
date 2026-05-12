import { Redirect } from 'expo-router';

import { db } from '@/db/client';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

function getOnboardingCompleted(): boolean {
  try {
    const row = db
      .select()
      .from(settings)
      .where(eq(settings.key, 'onboarding.completed'))
      .get();
    return row?.value === true;
  } catch {
    return false;
  }
}

export default function Index() {
  const onboardingCompleted = getOnboardingCompleted();

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
