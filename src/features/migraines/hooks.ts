import { useQuery } from '@tanstack/react-query';

import { getAll } from './repo';

/** Returns all migraine events for cross-feature use (e.g. insights). */
export function useAllMigraineEvents() {
  return useQuery({
    queryKey: ['migraines', 'all'],
    queryFn: () => {
      const result = getAll();
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    staleTime: 30_000,
  });
}
