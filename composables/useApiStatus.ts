/**
 * Example composable: fetch the server health status.
 * Keeps data-fetching logic out of components (SOLID/DRY).
 */
export interface ApiStatus {
    status: string
    environment: string
    timestamp: string
}

export function useApiStatus() {
    return useFetch<ApiStatus>('/api/health', {
        key: 'api-health',
    })
}
