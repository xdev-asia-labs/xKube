/**
 * Cluster API client
 */
import api from '@/services/api';

const API_BASE = '/clusters';

export interface Cluster {
  id: string;
  name: string;
  description?: string;
  context: string;
  is_active: boolean;
  is_connected: boolean;
  version?: string;
  node_count: number;
  pod_count: number;
  tags: string[];
  owner_id: string;
  created_at: string;
  updated_at: string;
  last_connected_at?: string;
}

export interface ClusterCreate {
  name: string;
  kubeconfig: string;
  context: string;
  description?: string;
  tags?: string[];
}

export interface ClusterUpdate {
  name?: string;
  description?: string;
  kubeconfig?: string;
  context?: string;
  tags?: string[];
  is_active?: boolean;
}

export interface ConnectionTestResult {
  connected: boolean;
  version?: string;
  error?: string;
}

export interface KubeContext {
  name: string;
  cluster: string;
  user: string;
  namespace: string;
  server: string;
  is_current: boolean;
}

export interface AutoDetectResponse {
  success: boolean;
  message: string;
  contexts: KubeContext[];
  current_context?: string;
  kubeconfig_path: string;
}

export const clusterApi = {
  /**
   * Auto-detect clusters from local kubeconfig
   */
  async autoDetect(): Promise<AutoDetectResponse> {
    const response = await api.get(`${API_BASE}/auto-detect`);
    return response.data;
  },

  /**
   * List all clusters
   */
  async listClusters(): Promise<Cluster[]> {
    const response = await api.get(`${API_BASE}/`);
    return response.data;
  },

  /**
   * Get cluster by ID
   */
  async getCluster(clusterId: string): Promise<Cluster> {
    const response = await api.get(`${API_BASE}/${clusterId}`);
    return response.data;
  },

  /**
   * Create new cluster
   */
  async createCluster(data: ClusterCreate): Promise<Cluster> {
    const response = await api.post(`${API_BASE}/`, data);
    return response.data;
  },

  /**
   * Update cluster
   */
  async updateCluster(clusterId: string, data: ClusterUpdate): Promise<Cluster> {
    const response = await api.put(`${API_BASE}/${clusterId}`, data);
    return response.data;
  },

  /**
   * Delete cluster
   */
  async deleteCluster(clusterId: string): Promise<void> {
    await api.delete(`${API_BASE}/${clusterId}`);
  },

  /**
   * Test cluster connection
   */
  async testConnection(clusterId: string): Promise<ConnectionTestResult> {
    const response = await api.post(`${API_BASE}/${clusterId}/connect`);
    return response.data;
  },

  /**
   * Activate cluster (set as active)
   */
  async activateCluster(clusterId: string): Promise<Cluster> {
    const response = await api.put(`${API_BASE}/${clusterId}/activate`);
    return response.data;
  }
};
