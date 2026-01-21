/**
 * Pods API client
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8888/api';

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('access_token');
};

// Axios instance with auth header
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// TypeScript Interfaces
export interface PodCondition {
    type: string;
    status: string;
    reason?: string;
    message?: string;
}

export interface PodStatus {
    phase: string;
    conditions: PodCondition[];
    pod_ip?: string;
    host_ip?: string;
    start_time?: string;
}

export interface ContainerState {
    state: 'running' | 'waiting' | 'terminated' | 'unknown';
    reason?: string;
    message?: string;
    exit_code?: number;
    started_at?: string;
    finished_at?: string;
}

export interface Container {
    name: string;
    image: string;
    ready: boolean;
    restart_count: number;
    state: ContainerState;
}

export interface Pod {
    name: string;
    namespace: string;
    uid: string;
    created_at?: string;
    labels: Record<string, string>;
    status: PodStatus;
    containers: Container[];
    node_name?: string;
    restart_policy?: string;
}

export interface PodsListResponse {
    cluster_id: string;
    cluster_name: string;
    namespace: string;
    pods: Pod[];
    total_count: number;
}

export interface PodLogsResponse {
    namespace: string;
    pod: string;
    container?: string;
    tail_lines?: number;
    logs: string;
}

// API Functions
export const podApi = {
    /**
     * List all pods
     */
    listPods: async (namespace = '', labelSelector?: string): Promise<PodsListResponse> => {
        const params: Record<string, string> = {};
        if (namespace) params.namespace = namespace;
        if (labelSelector) params.label_selector = labelSelector;

        const response = await apiClient.get('/pods', { params });
        return response.data;
    },

    /**
     * Get a specific pod
     */
    getPod: async (namespace: string, name: string): Promise<Pod> => {
        const response = await apiClient.get(`/pods/${namespace}/${name}`);
        return response.data;
    },

    /**
     * Delete a pod
     */
    deletePod: async (namespace: string, name: string): Promise<{ status: string; message: string }> => {
        const response = await apiClient.delete(`/pods/${namespace}/${name}`);
        return response.data;
    },

    /**
     * Get pod logs
     */
    getPodLogs: async (
        namespace: string,
        name: string,
        container?: string,
        tailLines = 100
    ): Promise<PodLogsResponse> => {
        const params: Record<string, string | number> = { tail_lines: tailLines };
        if (container) params.container = container;

        const response = await apiClient.get(`/pods/${namespace}/${name}/logs`, { params });
        return response.data;
    },
};
