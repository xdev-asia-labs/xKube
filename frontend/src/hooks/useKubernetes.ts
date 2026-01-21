import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { ClusterInfo, Pod, Deployment } from '../types'

// Cluster hooks
export function useClusterInfo() {
    return useQuery<ClusterInfo>({
        queryKey: ['cluster'],
        queryFn: () => api.get('/clusters/info').then(r => r.data),
        refetchInterval: 10000,
    })
}

// Pods hooks
export function usePods(namespace?: string) {
    return useQuery<{ pods: Pod[] }>({
        queryKey: ['pods', namespace],
        queryFn: () => api.get(namespace ? `/pods/${namespace}` : '/pods/all').then(r => r.data),
    })
}

// Deployments hooks
export function useDeployments(namespace?: string) {
    return useQuery<{ deployments: Deployment[] }>({
        queryKey: ['deployments', namespace],
        queryFn: () => api.get(namespace ? `/deployments/${namespace}` : '/deployments/all').then(r => r.data),
    })
}

// Namespaces hook
export function useNamespaces() {
    return useQuery<{ namespaces: string[] }>({
        queryKey: ['namespaces'],
        queryFn: () => api.get('/namespaces').then(r => r.data),
    })
}
