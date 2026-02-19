import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient shared across providers.tsx and direct imports.
 * This avoids the need for useQueryClient() in page.tsx, which would fail
 * if QueryClientProvider hasn't mounted yet (e.g. during wallet dynamic load).
 */
export const queryClient = new QueryClient();
