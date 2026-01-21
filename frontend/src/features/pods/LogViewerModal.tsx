/**
 * LogViewerModal - Modal for viewing pod logs
 */
import { useState, useEffect, useRef } from 'react';
import { Modal, VStack, HStack, Button } from '@xdev-asia/x-ui-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPodLogs, clearLogs } from '@/store/slices/podSlice';
import type { Pod } from '@/api/pods';

interface LogViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pod: Pod;
}

const DownloadIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const RefreshIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

export const LogViewerModal = ({ isOpen, onClose, pod }: LogViewerModalProps) => {
    const dispatch = useAppDispatch();
    const { logs, loading } = useAppSelector((state) => state.pods);
    const [selectedContainer, setSelectedContainer] = useState(pod.containers[0]?.name || '');
    const [tailLines, setTailLines] = useState(100);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && selectedContainer) {
            dispatch(fetchPodLogs({
                namespace: pod.namespace,
                name: pod.name,
                container: selectedContainer,
                tailLines
            }));
        }

        return () => {
            dispatch(clearLogs());
        };
    }, [isOpen, selectedContainer, tailLines, dispatch, pod.namespace, pod.name]);

    useEffect(() => {
        // Auto-scroll to bottom when logs update
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleRefresh = () => {
        if (selectedContainer) {
            dispatch(fetchPodLogs({
                namespace: pod.namespace,
                name: pod.name,
                container: selectedContainer,
                tailLines
            }));
        }
    };

    const handleDownload = () => {
        if (logs) {
            const blob = new Blob([logs], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${pod.name}-${selectedContainer}-logs.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleCopy = async () => {
        if (logs) {
            await navigator.clipboard.writeText(logs);
            // You could show a toast notification here
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="p-6">
                <VStack spacing={4} align="stretch">
                    {/* Header */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{pod.name} Logs</h2>
                        <p className="text-slate-400">Namespace: {pod.namespace}</p>
                    </div>

                    {/* Controls */}
                    <HStack spacing={4} className="flex-wrap">
                        {pod.containers.length > 1 && (
                            <select
                                value={selectedContainer}
                                onChange={(e) => setSelectedContainer(e.target.value)}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
                            >
                                {pod.containers.map((container) => (
                                    <option key={container.name} value={container.name}>
                                        {container.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select
                            value={tailLines}
                            onChange={(e) => setTailLines(Number(e.target.value))}
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500"
                        >
                            <option value={50}>Last 50 lines</option>
                            <option value={100}>Last 100 lines</option>
                            <option value={500}>Last 500 lines</option>
                            <option value={10000}>Last 10000 lines</option>
                        </select>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            isLoading={loading}
                            leftIcon={<RefreshIcon size={16} />}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            disabled={!logs}
                        >
                            Copy
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            disabled={!logs}
                            leftIcon={<DownloadIcon size={16} />}
                        >
                            Download
                        </Button>
                    </HStack>

                    {/* Logs Display */}
                    <div className="bg-slate-950 border border-white/10 rounded-lg overflow-hidden">
                        <div
                            className="p-4 overflow-auto font-mono text-sm text-slate-300 whitespace-pre-wrap break-words"
                            style={{ maxHeight: '500px' }}
                        >
                            {loading && !logs && (
                                <div className="text-slate-500">Loading logs...</div>
                            )}
                            {!loading && !logs && (
                                <div className="text-slate-500">No logs available</div>
                            )}
                            {logs && (
                                <>
                                    {logs}
                                    <div ref={logsEndRef} />
                                </>
                            )}
                        </div>
                    </div>
                </VStack>
            </div>
        </Modal>
    );
};
