/**
 * Cluster slice - Redux state management for clusters
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clusterApi, type Cluster, type ClusterCreate, type ClusterUpdate } from '@/api/clusters';

interface ClusterState {
    clusters: Cluster[];
    activeCluster: Cluster | null;
    loading: boolean;
    error: string | null;
}

const initialState: ClusterState = {
    clusters: [],
    activeCluster: null,
    loading: false,
    error: null,
};

// Async thunks
export const fetchClusters = createAsyncThunk(
    'clusters/fetchAll',
    async () => {
        const clusters = await clusterApi.listClusters();
        return clusters;
    }
);

export const createCluster = createAsyncThunk(
    'clusters/create',
    async (data: ClusterCreate) => {
        const cluster = await clusterApi.createCluster(data);
        return cluster;
    }
);

export const updateCluster = createAsyncThunk(
    'clusters/update',
    async ({ id, data }: { id: string; data: ClusterUpdate }) => {
        const cluster = await clusterApi.updateCluster(id, data);
        return cluster;
    }
);

export const deleteCluster = createAsyncThunk(
    'clusters/delete',
    async (id: string) => {
        await clusterApi.deleteCluster(id);
        return id;
    }
);

export const testConnection = createAsyncThunk(
    'clusters/testConnection',
    async (id: string) => {
        const result = await clusterApi.testConnection(id);
        return { id, result };
    }
);

export const activateCluster = createAsyncThunk(
    'clusters/activate',
    async (id: string) => {
        const cluster = await clusterApi.activateCluster(id);
        return cluster;
    }
);

// Slice
const clusterSlice = createSlice({
    name: 'clusters',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch clusters
        builder.addCase(fetchClusters.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchClusters.fulfilled, (state, action) => {
            state.loading = false;
            state.clusters = action.payload;
            // Set active cluster if exists
            const active = action.payload.find(c => c.is_active);
            if (active) {
                state.activeCluster = active;
            }
        });
        builder.addCase(fetchClusters.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch clusters';
        });

        // Create cluster
        builder.addCase(createCluster.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(createCluster.fulfilled, (state, action) => {
            state.loading = false;
            state.clusters.push(action.payload);
        });
        builder.addCase(createCluster.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to create cluster';
        });

        // Update cluster
        builder.addCase(updateCluster.fulfilled, (state, action) => {
            const index = state.clusters.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.clusters[index] = action.payload;
                if (action.payload.is_active) {
                    state.activeCluster = action.payload;
                }
            }
        });

        // Delete cluster
        builder.addCase(deleteCluster.fulfilled, (state, action) => {
            state.clusters = state.clusters.filter(c => c.id !== action.payload);
            if (state.activeCluster?.id === action.payload) {
                state.activeCluster = null;
            }
        });

        // Test connection
        builder.addCase(testConnection.fulfilled, (state, action) => {
            const { id, result } = action.payload;
            const cluster = state.clusters.find(c => c.id === id);
            if (cluster) {
                cluster.is_connected = result.connected;
                if (result.version) {
                    cluster.version = result.version;
                }
            }
        });

        // Activate cluster
        builder.addCase(activateCluster.fulfilled, (state, action) => {
            // Deactivate all others
            state.clusters.forEach(c => {
                c.is_active = false;
            });
            // Activate this one
            const index = state.clusters.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.clusters[index] = action.payload;
                state.activeCluster = action.payload;
            }
        });
    },
});

export const { clearError } = clusterSlice.actions;
export default clusterSlice.reducer;
