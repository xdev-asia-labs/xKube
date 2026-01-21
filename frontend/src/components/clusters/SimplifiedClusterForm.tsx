/**
 * SimplifiedClusterForm - Add cluster with auto-detect or manual input
 */
import { useState, useEffect } from 'react';
import { VStack, HStack, Button, Spinner } from '@xdev-asia/x-ui-react';
import { useAppDispatch } from '@/store/hooks';
import { createCluster } from '@/store/slices/clusterSlice';
import { clusterApi, type KubeContext } from '@/api/clusters';

interface SimplifiedClusterFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function SimplifiedClusterForm({ onSuccess, onCancel }: SimplifiedClusterFormProps) {
    const dispatch = useAppDispatch();
    const [autoDetect, setAutoDetect] = useState(true);
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [contexts, setContexts] = useState<KubeContext[]>([]);
    const [selectedContext, setSelectedContext] = useState<string>('');
    const [manualConfig, setManualConfig] = useState('');
    const [clusterName, setClusterName] = useState('');
    const [error, setError] = useState('');

    // Auto-detect on mount if enabled
    useEffect(() => {
        if (autoDetect) {
            detectClusters();
        }
    }, [autoDetect]);

    const detectClusters = async () => {
        setDetecting(true);
        setError('');
        try {
            const data = await clusterApi.autoDetect();

            if (data.success && data.contexts.length > 0) {
                setContexts(data.contexts);
                // Auto-select current context
                const current = data.contexts.find((c) => c.is_current);
                if (current) {
                    setSelectedContext(current.name);
                    setClusterName(current.name);
                }
            } else {
                setError(data.message || 'No contexts found in ~/.kube/config');
                setAutoDetect(false); // Switch to manual mode
            }
        } catch (err: any) {
            setError('Failed to auto-detect clusters. Please paste kubeconfig manually.');
            setAutoDetect(false);
        } finally {
            setDetecting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload: any = {
                name: clusterName || selectedContext || 'My Cluster',
                description: autoDetect ? `Imported from ${selectedContext}` : 'Manually added cluster',
            };

            if (autoDetect) {
                payload.context_name = selectedContext;
            } else {
                payload.kubeconfig = manualConfig;
                // Try to parse context from kubeconfig
                try {
                    const config = JSON.parse(manualConfig);
                    payload.context = config['current-context'] || 'default';
                } catch {
                    // Not JSON, assume YAML - backend will handle
                    payload.context = 'default';
                }
            }

            await dispatch(createCluster(payload)).unwrap();
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || 'Failed to add cluster');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
                {/* Auto-detect toggle */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="auto-detect"
                        checked={autoDetect}
                        onChange={(e) => setAutoDetect(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    />
                    <label htmlFor="auto-detect" className="text-sm text-slate-300">
                        Auto-detect from ~/.kube/config
                    </label>
                    {detecting && <Spinner size="sm" />}
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {autoDetect ? (
                    <>
                        {/* Context selector */}
                        {contexts.length > 0 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Select Context
                                    </label>
                                    <div className="space-y-2">
                                        {contexts.map((ctx) => (
                                            <label
                                                key={ctx.name}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedContext === ctx.name
                                                    ? 'bg-indigo-500/20 border-indigo-500/50'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="context"
                                                    value={ctx.name}
                                                    checked={selectedContext === ctx.name}
                                                    onChange={(e) => {
                                                        setSelectedContext(e.target.value);
                                                        setClusterName(ctx.name);
                                                    }}
                                                    className="w-4 h-4 text-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-medium">{ctx.name}</span>
                                                        {ctx.is_current && (
                                                            <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300 border border-green-500/20">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        {ctx.server} • {ctx.namespace}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Cluster name override */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Cluster Name (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={clusterName}
                                        onChange={(e) => setClusterName(e.target.value)}
                                        placeholder={selectedContext}
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {/* Manual kubeconfig input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Cluster Name
                            </label>
                            <input
                                type="text"
                                value={clusterName}
                                onChange={(e) => setClusterName(e.target.value)}
                                placeholder="my-cluster"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Kubeconfig Content
                            </label>
                            <textarea
                                value={manualConfig}
                                onChange={(e) => setManualConfig(e.target.value)}
                                placeholder="Paste your kubeconfig YAML here..."
                                rows={12}
                                required
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        </div>
                    </>
                )}

                {/* Actions */}
                <HStack justify="end" spacing={3}>
                    {onCancel && (
                        <Button variant="ghost" onClick={onCancel} type="button">
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={loading || (autoDetect && !selectedContext) || (!autoDetect && !manualConfig)}
                    >
                        {loading ? <Spinner size="sm" /> : autoDetect ? 'Import Cluster' : 'Add Cluster'}
                    </Button>
                </HStack>
            </VStack>
        </form>
    );
}
