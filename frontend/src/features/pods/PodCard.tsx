/**
 * PodCard - Individual pod card component
 */
import { Card, Badge, HStack, VStack } from '@xdev-asia/x-ui-react';
import type { Pod } from '@/api/pods';

interface PodCardProps {
    pod: Pod;
    onViewDetails: (pod: Pod) => void;
    onViewLogs: (pod: Pod) => void;
    onDelete: (pod: Pod) => void;
}

const getStatusColor = (phase: string): 'solid' | 'outline' | 'glass' | 'subtle' => {
    switch (phase.toLowerCase()) {
        case 'running':
            return 'solid';  // Green for running
        case 'pending':
            return 'outline';  // Yellow for pending
        case 'failed':
        case 'crashloopbackoff':
            return 'glass';  // Red for failed
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
        case 'crashloopbackoff':
            return 'bg-red-500/20 text-red-300 border-red-500/20';
        default:
            return 'bg-slate-500/20 text-slate-300 border-slate-500/20';
    }
};

const EyeIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const FileTextIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const TrashIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

export const PodCard = ({ pod, onViewDetails, onViewLogs, onDelete }: PodCardProps) => {
    const readyContainers = pod.containers.filter(c => c.ready).length;
    const totalContainers = pod.containers.length;
    const totalRestarts = pod.containers.reduce((sum, c) => sum + c.restart_count, 0);

    return (
        <Card className="bg-slate-800/50 border-white/10 hover:border-white/20 transition-all">
            <VStack spacing={4} align="stretch">
                {/* Header */}
                <HStack justify="between" align="start">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                            {pod.name}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">
                            {pod.namespace}
                        </p>
                    </div>
                    <Badge variant={getStatusColor(pod.status.phase)} className={getStatusClassName(pod.status.phase)}>
                        {pod.status.phase}
                    </Badge>
                </HStack>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/10">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Containers</p>
                        <p className="text-white font-medium">
                            {readyContainers}/{totalContainers} Ready
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Restarts</p>
                        <p className="text-white font-medium">{totalRestarts}</p>
                    </div>
                </div>

                {/* Node */}
                {pod.node_name && (
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Node</p>
                        <p className="text-sm text-slate-300 truncate">{pod.node_name}</p>
                    </div>
                )}

                {/* Actions */}
                <HStack spacing={2} className="pt-2">
                    <button
                        onClick={() => onViewDetails(pod)}
                        aria-label="View details"
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <EyeIcon size={16} />
                    </button>
                    <button
                        onClick={() => onViewLogs(pod)}
                        aria-label="View logs"
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <FileTextIcon size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(pod)}
                        aria-label="Delete pod"
                        className="p-2 rounded-lg hover:bg-white/5 text-red-400 hover:text-red-300 transition-colors"
                    >
                        <TrashIcon size={16} />
                    </button>
                </HStack>
            </VStack>
        </Card>
    );
};
