/**
 * Redux slice for pods state management
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { podApi, type Pod, type PodsListResponse, type PodLogsResponse } from '@/api/pods';

interface PodState {
    pods: Pod[];
    selectedPod: Pod | null;
    logs: string | null;
    loading: boolean;
    error: string | null;
    namespace: string;
    clusterName: string;
}

const initialState: PodState = {
    pods: [],
    selectedPod: null,
    logs: null,
    loading: false,
    error: null,
    namespace: '',
    clusterName: '',
};

// Async Thunks
export const fetchPods = createAsyncThunk<PodsListResponse, { namespace?: string; labelSelector?: string }>(
    'pods/fetchPods',
    async ({ namespace = '', labelSelector }) => {
        return await podApi.listPods(namespace, labelSelector);
    }
);

export const fetchPodDetails = createAsyncThunk<Pod, { namespace: string; name: string }>(
    'pods/fetchPodDetails',
    async ({ namespace, name }) => {
        return await podApi.getPod(namespace, name);
    }
);

export const deletePod = createAsyncThunk<void, { namespace: string; name: string }>(
    'pods/deletePod',
    async ({ namespace, name }) => {
        await podApi.deletePod(namespace, name);
    }
);

export const fetchPodLogs = createAsyncThunk<
    PodLogsResponse,
    { namespace: string; name: string; container?: string; tailLines?: number }
>(
    'pods/fetchPodLogs',
    async ({ namespace, name, container, tailLines }) => {
        return await podApi.getPodLogs(namespace, name, container, tailLines);
    }
);

// Slice
const podSlice = createSlice({
    name: 'pods',
    initialState,
    reducers: {
        clearSelectedPod: (state) => {
            state.selectedPod = null;
        },
        clearLogs: (state) => {
            state.logs = null;
        },
        setNamespace: (state, action) => {
            state.namespace = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Fetch Pods
        builder.addCase(fetchPods.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPods.fulfilled, (state, action) => {
            state.loading = false;
            state.pods = action.payload.pods;
            state.namespace = action.payload.namespace;
            state.clusterName = action.payload.cluster_name;
        });
        builder.addCase(fetchPods.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch pods';
        });

        // Fetch Pod Details
        builder.addCase(fetchPodDetails.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPodDetails.fulfilled, (state, action) => {
            state.loading = false;
            state.selectedPod = action.payload;
        });
        builder.addCase(fetchPodDetails.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch pod details';
        });

        // Delete Pod
        builder.addCase(deletePod.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(deletePod.fulfilled, (state) => {
            state.loading = false;
            // Pod will be removed when fetchPods is called again
        });
        builder.addCase(deletePod.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to delete pod';
        });

        // Fetch Pod Logs
        builder.addCase(fetchPodLogs.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPodLogs.fulfilled, (state, action) => {
            state.loading = false;
            state.logs = action.payload.logs;
        });
        builder.addCase(fetchPodLogs.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch pod logs';
        });
    },
});

export const { clearSelectedPod, clearLogs, setNamespace } = podSlice.actions;
export default podSlice.reducer;
