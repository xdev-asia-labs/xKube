/**
 * PodDetailsModal - Modal for viewing detailed pod information
 */
import { Modal, VStack, HStack, Badge } from '@xdev-asia/x-ui-react';
import type { Pod } from '@/api/pods';

interface PodDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pod: Pod;
}

const getStatusColor = (phase: string): 'solid' | 'outline' | 'glass' | 'subtle' => {
    switch (phase.toLowerCase()) {
        case 'running':
            return 'solid';
        case 'pending':
            return 'outline';
        case 'failed':
            return 'glass';
        default:
            return 'subtle';
    }
};

const getStatusClassName = (phase: string): string => {
    switch (phase.toLowerCase()) {
        case 'running':
            return 'bg-green-500/20 text-green-300 border-green-500/20';
        case 'pending':
            return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20';
        case 'failed':
            return 'bg-red-500/20 text-red-300 border-red-500/20';
        default:
            return 'bg-slate-500/20 text-slate-300 border-slate-500/20';
    }
};

const getContainerStateColor = (state: string): string => {
    switch (state) {
        case 'running':
            return 'text-green-400';
        case 'waiting':
            return 'text-yellow-400';
        case 'terminated':
            return 'text-red-400';
        default:
            return 'text-slate-400';
    }
};

export const PodDetailsModal = ({ isOpen, onClose, pod }: PodDetailsModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="p-6">
                <VStack spacing={6} align="stretch">
                    {/* Header */}
                    <div>
                        <HStack justify="between" align="center" className="mb-2">
                            <h2 className="text-2xl font-bold text-white">{pod.name}</h2>
                            <Badge variant={getStatusColor(pod.status.phase)} className={getStatusClassName(pod.status.phase)}>
                                {pod.status.phase}
                            </Badge>
                        </HStack>
                        <p className="text-slate-400">Namespace: {pod.namespace}</p>
                    </div>

                    {/* Metadata */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-3">Metadata</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 mb-1">UID</p>
                                <p className="text-white font-mono text-xs break-all">{pod.uid}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 mb-1">Created</p>
                                <p className="text-white">
                                    {pod.created_at ? new Date(pod.created_at).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            {pod.node_name && (
                                <div className="col-span-2">
                                    <p className="text-slate-500 mb-1">Node</p>
                                    <p className="text-white">{pod.node_name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-3">Status</h3>
                        <div className="space-y-3 text-sm">
                            {pod.status.pod_ip && (
                                <div>
                                    <p className="text-slate-500 mb-1">Pod IP</p>
                                    <p className="text-white font-mono">{pod.status.pod_ip}</p>
                                </div>
                            )}
                            {pod.status.host_ip && (
                                <div>
                                    <p className="text-slate-500 mb-1">Host IP</p>
                                    <p className="text-white font-mono">{pod.status.host_ip}</p>
                                </div>
                            )}
                            {pod.status.start_time && (
                                <div>
                                    <p className="text-slate-500 mb-1">Start Time</p>
                                    <p className="text-white">
                                        {new Date(pod.status.start_time).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Containers */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-3">
                            Containers ({pod.containers.length})
                        </h3>
                        <div className="space-y-3">
                            {pod.containers.map((container, idx) => (
                                <div
                                    key={idx}
                                    className="bg-slate-900/50 rounded-lg p-3 border border-white/5"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-white font-medium">{container.name}</p>
                                        <Badge variant={container.ready ? 'solid' : 'subtle'} className={container.ready ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'}>
                                            {container.ready ? 'Ready' : 'Not Ready'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-slate-400">
                                            <span className="text-slate-500">Image:</span> {container.image}
                                        </p>
                                        <p className="text-slate-400">
                                            <span className="text-slate-500">Restarts:</span>{' '}
                                            {container.restart_count}
                                        </p>
                                        <p>
                                            <span className="text-slate-500">State:</span>{' '}
                                            <span className={getContainerStateColor(container.state.state)}>
                                                {container.state.state}
                                            </span>
                                        </p>
                                        {container.state.reason && (
                                            <p className="text-slate-400">
                                                <span className="text-slate-500">Reason:</span>{' '}
                                                {container.state.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Labels */}
                    {Object.keys(pod.labels).length > 0 && (
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-3">Labels</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(pod.labels).map(([key, value]) => (
                                    <Badge key={key} variant="subtle" className="bg-indigo-500/20 text-indigo-300">
                                        {key}: {value}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </VStack>
            </div>
        </Modal>
    );
};
