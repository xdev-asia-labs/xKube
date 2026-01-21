/**
 * ClusterSelector - Header dropdown for switching clusters
 */
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchClusters, activateCluster } from '@/store/slices/clusterSlice';

const ChevronDownIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const ServerIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
);

const PlusIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const SettingsIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2" />
    </svg>
);

interface ClusterSelectorProps {
    onAddCluster?: () => void;
    onManageClusters?: () => void;
}

export function ClusterSelector({ onAddCluster, onManageClusters }: ClusterSelectorProps) {
    const dispatch = useAppDispatch();
    const { clusters, activeCluster } = useAppSelector((state) => state.clusters);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.cluster-selector')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen]);

    const handleSwitchCluster = async (clusterId: string) => {
        await dispatch(activateCluster(clusterId));
        setIsOpen(false);
        dispatch(fetchClusters()); // Refresh
    };

    const activeClusterName = activeCluster?.name || 'Select Cluster';

    return (
        <div className="relative cluster-selector">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
            >
                <ServerIcon size={18} />
                <span className="font-medium">{activeClusterName}</span>
                <ChevronDownIcon size={16} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-lg bg-slate-800 border border-white/10 shadow-xl z-50">
                    <div className="p-2">
                        {/* Cluster list */}
                        {clusters.length > 0 ? (
                            <>
                                {clusters.map((cluster) => (
                                    <button
                                        key={cluster.id}
                                        onClick={() => handleSwitchCluster(cluster.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${cluster.id === activeCluster?.id
                                            ? 'bg-indigo-500/20 text-white'
                                            : 'text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        {cluster.id === activeCluster?.id && (
                                            <span className="text-indigo-400">✓</span>
                                        )}
                                        <div className="flex-1">
                                            <div className="font-medium">{cluster.name}</div>
                                            {cluster.description && (
                                                <div className="text-xs text-slate-400 truncate">
                                                    {cluster.description}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}

                                <div className="my-2 border-t border-white/10" />
                            </>
                        ) : (
                            <div className="px-3 py-2 text-sm text-slate-400 text-center">
                                No clusters yet
                            </div>
                        )}

                        {/* Add New Cluster */}
                        <button
                            onClick={() => {
                                onAddCluster?.();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            <PlusIcon size={16} />
                            <span>Add New Cluster</span>
                        </button>

                        {/* Manage Clusters */}
                        <button
                            onClick={() => {
                                onManageClusters?.();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                        >
                            <SettingsIcon size={16} />
                            <span>Manage Clusters</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
