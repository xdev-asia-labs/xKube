/**
 * AddClusterModal - Modal for adding/editing clusters
 */
import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { createCluster, updateCluster, fetchClusters } from '@/store/slices/clusterSlice';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    TextArea,
    VStack,
} from '@xdev-asia/x-ui-react';
import { Upload } from 'lucide-react';
import type { Cluster } from '@/api/clusters';

interface AddClusterModalProps {
    isOpen: boolean;
    onClose: () => void;
    cluster?: Cluster | null;
}

export const AddClusterModal = ({ isOpen, onClose, cluster }: AddClusterModalProps) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [kubeconfig, setKubeconfig] = useState('');
    const [context, setContext] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (cluster) {
            setName(cluster.name);
            setDescription(cluster.description || '');
            setContext(cluster.context);
            setTags(cluster.tags?.join(', ') || '');
        } else {
            // Reset form
            setName('');
            setDescription('');
            setKubeconfig('');
            setContext('');
            setTags('');
        }
        setError('');
    }, [cluster, isOpen]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setKubeconfig(content);

                // Try to extract context from kubeconfig
                try {
                    const yamlLines = content.split('\n');
                    const currentContextLine = yamlLines.find(line => line.startsWith('current-context:'));
                    if (currentContextLine) {
                        const extractedContext = currentContextLine.split(':')[1].trim();
                        setContext(extractedContext);
                    }
                } catch (err) {
                    console.error('Failed to extract context:', err);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleSubmit = async () => {
        setError('');

        // Validation
        if (!name.trim()) {
            setError('Cluster name is required');
            return;
        }
        if (!cluster && !kubeconfig.trim()) {
            setError('Kubeconfig is required');
            return;
        }
        if (!context.trim()) {
            setError('Context is required');
            return;
        }

        setLoading(true);

        try {
            const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);

            if (cluster) {
                // Update existing cluster
                await dispatch(updateCluster({
                    id: cluster.id,
                    data: {
                        name: name.trim(),
                        description: description.trim() || undefined,
                        context: context.trim(),
                        tags: tagArray.length > 0 ? tagArray : undefined,
                        ...(kubeconfig.trim() && { kubeconfig: kubeconfig.trim() }),
                    },
                })).unwrap();
            } else {
                // Create new cluster
                await dispatch(createCluster({
                    name: name.trim(),
                    kubeconfig: kubeconfig.trim(),
                    context: context.trim(),
                    description: description.trim() || undefined,
                    tags: tagArray.length > 0 ? tagArray : undefined,
                })).unwrap();
            }

            // Refresh cluster list
            dispatch(fetchClusters());

            // Close modal
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save cluster');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalHeader>{cluster ? 'Edit Cluster' : 'Add New Cluster'}</ModalHeader>
            <ModalBody>
                <VStack spacing={4} align="stretch">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {/* Cluster Name */}
                    <Input
                        label="Cluster Name"
                        placeholder="my-k8s-cluster"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    {/* Description */}
                    <TextArea
                        label="Description (optional)"
                        placeholder="Production cluster in us-east-1..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                    />

                    {/* Kubeconfig */}
                    {!cluster && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Kubeconfig <span className="text-red-400">*</span>
                            </label>

                            {/* File Upload */}
                            <div className="mb-3">
                                <input
                                    type="file"
                                    accept=".yaml,.yml,.conf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="kubeconfig-upload"
                                />
                                <label
                                    htmlFor="kubeconfig-upload"
                                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 rounded-lg hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer transition-colors"
                                >
                                    <Upload size={20} className="text-slate-400" />
                                    <span className="text-sm text-slate-400">
                                        Click to upload kubeconfig file or paste below
                                    </span>
                                </label>
                            </div>

                            {/* Manual Paste */}
                            <TextArea
                                placeholder="Paste your kubeconfig content here..."
                                value={kubeconfig}
                                onChange={(e) => setKubeconfig(e.target.value)}
                                rows={8}
                                className="font-mono text-xs"
                            />
                        </div>
                    )}

                    {/* Context */}
                    <Input
                        label="Context"
                        placeholder="e.g., kubernetes-admin@kubernetes"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        required
                        helperText="The Kubernetes context to use from your kubeconfig"
                    />

                    {/* Tags */}
                    <Input
                        label="Tags (optional)"
                        placeholder="production, us-east-1, aws"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        helperText="Comma-separated tags for organization"
                    />
                </VStack>
            </ModalBody>
            <ModalFooter>
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    isLoading={loading}
                    className="bg-indigo-500 hover:bg-indigo-600"
                >
                    {cluster ? 'Update Cluster' : 'Add Cluster'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};
