/**
 * ClusterList - Display list of all clusters
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchClusters,
    deleteCluster,
    activateCluster,
    testConnection,
} from '@/store/slices/clusterSlice';
import { Grid, VStack, HStack, Button, Spinner } from '@xdev-asia/x-ui-react';
import { ClusterCard } from './ClusterCard';
import { AddClusterModal } from './AddClusterModal';
import type { Cluster } from '@/api/clusters';

// Inline SVG Icons
const PlusIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ServerIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
);

export const ClusterList = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { clusters, loading, error } = useAppSelector((state) => state.clusters);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);

    useEffect(() => {
        dispatch(fetchClusters());
    }, [dispatch]);

    // Auto-open add modal if no clusters exist
    useEffect(() => {
        if (!loading && clusters.length === 0 && !showAddModal) {
            setShowAddModal(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, clusters.length]);

    const handleActivate = (id: string) => {
        dispatch(activateCluster(id));
    };

    const handleEdit = (cluster: Cluster) => {
        setEditingCluster(cluster);
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this cluster?')) {
            await dispatch(deleteCluster(id));
        }
    };

    const handleTest = (id: string) => {
        dispatch(testConnection(id));
    };

    const handleSelect = (id: string) => {
        navigate(`/clusters/${id}`);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingCluster(null);
    };

    if (loading && clusters.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button onClick={() => dispatch(fetchClusters())}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <VStack spacing={6} align="stretch">
            {/* Header */}
            <HStack justify="between" align="center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Kubernetes Clusters</h2>
                    <p className="text-slate-400 mt-1">
                        Manage your Kubernetes cluster connections
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    leftIcon={<PlusIcon size={20} />}
                    className="bg-indigo-500 hover:bg-indigo-600"
                >
                    Add Cluster
                </Button>
            </HStack>

            {/* Cluster Grid */}
            {clusters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-white/10 rounded-xl">
                    <ServerIcon size={64} className="text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400 mb-2">No clusters yet</h3>
                    <p className="text-slate-500 mb-6">Add your first Kubernetes cluster to get started</p>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        leftIcon={<PlusIcon size={20} />}
                        className="bg-indigo-500 hover:bg-indigo-600"
                    >
                        Add Your First Cluster
                    </Button>
                </div>
            ) : (
                <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                    {clusters.map((cluster) => (
                        <ClusterCard
                            key={cluster.id}
                            cluster={cluster}
                            onActivate={handleActivate}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onTest={handleTest}
                            onSelect={handleSelect}
                        />
                    ))}
                </Grid>
            )}

            {/* Add/Edit Cluster Modal */}
            <AddClusterModal
                isOpen={showAddModal}
                onClose={handleCloseModal}
                cluster={editingCluster}
            />
        </VStack>
    );
};
