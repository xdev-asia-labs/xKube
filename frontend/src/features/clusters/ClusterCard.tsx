/**
 * ClusterCard - Display individual cluster information
 */
import { Card, CardContent, Badge, HStack, VStack, IconButton } from '@xdev-asia/x-ui-react';
import { Server, Activity, Trash2, Edit, Power } from 'lucide-react';
import type { Cluster } from '@/api/clusters';

interface ClusterCardProps {
    cluster: Cluster;
    onActivate: (id: string) => void;
    onEdit: (cluster: Cluster) => void;
    onDelete: (id: string) => void;
    onTest: (id: string) => void;
    onSelect?: (id: string) => void;
}


export const ClusterCard = ({ cluster, onActivate, onEdit, onDelete, onTest, onSelect }: ClusterCardProps) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <Card
            className={`group hover:-translate-y-1 transition-all duration-200 border ${cluster.is_active
                ? 'border-indigo-500/50 bg-indigo-500/5'
                : 'border-white/10 hover:border-white/20'
                } ${onSelect ? 'cursor-pointer' : ''}`}
            onClick={() => onSelect?.(cluster.id)}
        >
            <CardContent className="p-6">
                <VStack spacing={4} align="stretch">
                    {/* Header */}
                    <HStack justify="between" align="start">
                        <HStack spacing={3} align="center">
                            <div className={`p-3 rounded-xl ${cluster.is_active
                                ? 'bg-indigo-500/20 ring-2 ring-indigo-500/50'
                                : 'bg-blue-500/10 ring-1 ring-blue-500/30'
                                }`}>
                                <Server size={24} className={cluster.is_active ? 'text-indigo-400' : 'text-blue-400'} />
                            </div>
                            <VStack spacing={1} align="start">
                                <h3 className="text-lg font-bold text-white">{cluster.name}</h3>
                                <p className="text-sm text-slate-400">{cluster.context}</p>
                            </VStack>
                        </HStack>

                        {/* Actions */}
                        <HStack spacing={2}>
                            <IconButton
                                icon={<Power size={18} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTest(cluster.id);
                                }}
                                aria-label="Test connection"
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            <IconButton
                                icon={<Edit size={18} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(cluster);
                                }}
                                aria-label="Edit cluster"
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                            <IconButton
                                icon={<Trash2 size={18} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(cluster.id);
                                }}
                                aria-label="Delete cluster"
                                size="sm"
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                            />
                        </HStack>
                    </HStack>

                    {/* Description */}
                    {cluster.description && (
                        <p className="text-sm text-slate-400">{cluster.description}</p>
                    )}

                    {/* Status Badges */}
                    <HStack spacing={2} className="flex-wrap">
                        {cluster.is_active && (
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                Active
                            </Badge>
                        )}
                        <Badge
                            className={cluster.is_connected
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border-red-500/30"
                            }
                        >
                            <Activity size={12} className="mr-1" />
                            {cluster.is_connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                        {cluster.version && (
                            <Badge className="bg-slate-500/20 text-slate-300">
                                v{cluster.version}
                            </Badge>
                        )}
                        {cluster.tags && cluster.tags.map(tag => (
                            <Badge key={tag} className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                                {tag}
                            </Badge>
                        ))}
                    </HStack>

                    {/* Stats */}
                    <HStack spacing={6} className="pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-slate-500">Nodes</p>
                            <p className="text-lg font-bold text-white">{cluster.node_count}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Pods</p>
                            <p className="text-lg font-bold text-white">{cluster.pod_count}</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500">Last Connected</p>
                            <p className="text-sm text-slate-400">{formatDate(cluster.last_connected_at)}</p>
                        </div>
                    </HStack>

                    {/* Activate Button */}
                    {!cluster.is_active && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onActivate(cluster.id);
                            }}
                            className="w-full py-2 px-4 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors text-sm font-medium"
                        >
                            Set as Active
                        </button>
                    )}
                </VStack>
            </CardContent>
        </Card>
    );
};
