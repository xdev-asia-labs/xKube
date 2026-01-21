/**
 * PodList - Main view for listing pods
 */
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPods, deletePod } from '@/store/slices/podSlice';
import { VStack, HStack, Button, Spinner } from '@xdev-asia/x-ui-react';
import { PodCard, PodDetailsModal, LogViewerModal } from '@/features/pods';
import type { Pod } from '@/api/pods';

export const PodList = () => {
    const dispatch = useAppDispatch();
    const { pods, loading, error, namespace, clusterName } = useAppSelector((state) => state.pods);
    const [namespaceFilter, setNamespaceFilter] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [selectedPod, setSelectedPod] = useState<Pod | null>(null);

    useEffect(() => {
        dispatch(fetchPods({ namespace: namespaceFilter }));
    }, [dispatch, namespaceFilter]);

    const handleViewDetails = (pod: Pod) => {
        setSelectedPod(pod);
        setShowDetailsModal(true);
    };

    const handleViewLogs = (pod: Pod) => {
        setSelectedPod(pod);
        setShowLogsModal(true);
    };

    const handleDelete = async (pod: Pod) => {
        if (confirm(`Are you sure you want to delete pod "${pod.name}"?`)) {
            await dispatch(deletePod({ namespace: pod.namespace, name: pod.name }));
            dispatch(fetchPods({ namespace: namespaceFilter }));
        }
    };

    const handleRefresh = () => {
        dispatch(fetchPods({ namespace: namespaceFilter }));
    };

    if (loading && pods.length === 0) {
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
                    <Button onClick={handleRefresh}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <VStack spacing={6} align="stretch">
            {/* Header */}
            <HStack justify="between" align="center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Pods</h2>
                    <p className="text-slate-400 mt-1">
                        {clusterName && `Cluster: ${clusterName} | `}
                        {pods.length} pod{pods.length !== 1 ? 's' : ''}
                        {namespace && namespace !== 'all' && ` in ${namespace}`}
                    </p>
                </div>
                <HStack spacing={4}>
                    <select
                        value={namespaceFilter}
                        onChange={(e) => setNamespaceFilter(e.target.value)}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="">All Namespaces</option>
                        <option value="default">default</option>
                        <option value="kube-system">kube-system</option>
                        <option value="kube-public">kube-public</option>
                        <option value="kube-node-lease">kube-node-lease</option>
                    </select>
                    <Button onClick={handleRefresh} isLoading={loading}>
                        Refresh
                    </Button>
                </HStack>
            </HStack>

            {/* Pods Grid */}
            {pods.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-white/10 rounded-xl">
                    <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 mb-4">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <h3 className="text-xl font-bold text-slate-400 mb-2">No pods found</h3>
                    <p className="text-slate-500 mb-6">
                        {namespaceFilter ? `No pods in "${namespaceFilter}" namespace` : 'No pods in cluster'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pods.map((pod) => (
                        <PodCard
                            key={pod.uid}
                            pod={pod}
                            onViewDetails={handleViewDetails}
                            onViewLogs={handleViewLogs}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {selectedPod && (
                <>
                    <PodDetailsModal
                        isOpen={showDetailsModal}
                        onClose={() => setShowDetailsModal(false)}
                        pod={selectedPod}
                    />
                    <LogViewerModal
                        isOpen={showLogsModal}
                        onClose={() => setShowLogsModal(false)}
                        pod={selectedPod}
                    />
                </>
            )}
        </VStack>
    );
};
