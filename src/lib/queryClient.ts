import { QueryClient } from '@tanstack/react-query';

// Singleton instance — shared between providers.tsx and page components.
// Using the singleton directly avoids needing `useQueryClient()` in pages,
// which would cause SSR prerender failures when providers aren't mounted yet.
export const queryClient = new QueryClient();
