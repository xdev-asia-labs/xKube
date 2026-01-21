/**
 * ClusterManagementPage - Full-page cluster management
 */
import { useState } from 'react';
import { HStack, Button, Card } from '@xdev-asia/x-ui-react';
import { ArrowLeft, Plus, List } from 'lucide-react';
import { SimplifiedClusterForm } from '@/components/clusters';
import { ClusterList } from '@/features/clusters';

interface ClusterManagementPageProps {
    onBack?: () => void;
    initialView?: 'list' | 'add';
}

export function ClusterManagementPage({ onBack, initialView = 'list' }: ClusterManagementPageProps) {
    const [view, setView] = useState<'list' | 'add'>(initialView);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <HStack spacing={4} className="items-center mb-4">
                        {onBack && (
                            <Button
                                variant="ghost"
                                leftIcon={<ArrowLeft size={20} />}
                                onClick={onBack}
                                className="text-slate-300 hover:text-white"
                            >
                                Back
                            </Button>
                        )}
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-white">
                                {view === 'list' ? 'Manage Clusters' : 'Add New Cluster'}
                            </h1>
                            <p className="text-slate-400 mt-1">
                                {view === 'list'
                                    ? 'View and manage your Kubernetes clusters'
                                    : 'Connect to a new Kubernetes cluster'
                                }
                            </p>
                        </div>

                        {view === 'list' && (
                            <Button
                                leftIcon={<Plus size={20} />}
                                onClick={() => setView('add')}
                                className="bg-indigo-500 hover:bg-indigo-600"
                            >
                                Add New Cluster
                            </Button>
                        )}

                        {view === 'add' && (
                            <Button
                                variant="outline"
                                leftIcon={<List size={20} />}
                                onClick={() => setView('list')}
                                className="border-white/20 text-white hover:bg-white/10"
                            >
                                View All Clusters
                            </Button>
                        )}
                    </HStack>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {view === 'list' ? (
                        <Card className="p-6 bg-slate-800/50 backdrop-blur-sm border-white/10">
                            <ClusterList />
                        </Card>
                    ) : (
                        <Card className="p-8 bg-slate-800/50 backdrop-blur-sm border-white/10 max-w-3xl">
                            <SimplifiedClusterForm
                                onSuccess={() => {
                                    setView('list');
                                    // Optionally show success message
                                }}
                                onCancel={() => setView('list')}
                            />
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
