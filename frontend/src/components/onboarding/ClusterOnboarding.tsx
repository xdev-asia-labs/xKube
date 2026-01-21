/**
 * ClusterOnboarding - Welcome screen for first-time users
 */
import { VStack, Card } from '@xdev-asia/x-ui-react';
import { SimplifiedClusterForm } from '../clusters/SimplifiedClusterForm';

const RocketIcon = () => (
    <svg className="w-16 h-16 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2m11.5-4.5c.5-2 1-7 4-10-3 3-8 3.5-10 4m0 0c-1.5.5-2.5 1-3.5 2s-1.5 2-2 3.5c0 0 3.5 0 5.5-2s-2-5.5-2-5.5" />
        <path d="M12 20s1.5-1.5 0-3-3 0-3 0" />
    </svg>
);

export function ClusterOnboarding() {

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <VStack spacing={8} align="center" className="max-w-4xl w-full">
                {/* Hero section */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                            <RocketIcon />
                        </div>
                    </div>

                    <h1 className="text-5xl font-bold text-white">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">xKube</span>
                    </h1>

                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Modern Kubernetes Management Platform
                    </p>
                </div>

                {/* Main card */}
                <Card className="w-full max-w-2xl p-8 bg-slate-800/50 backdrop-blur-sm border-white/10">
                    <VStack spacing={6} align="stretch">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-white mb-2">
                                Add Your First Cluster
                            </h2>
                            <p className="text-slate-400">
                                Get started by connecting to your Kubernetes cluster
                            </p>
                        </div>

                        <SimplifiedClusterForm
                            onSuccess={() => {
                                // Reload to show dashboard with the new cluster
                                // Backend ensures duplicate imports return existing cluster
                                window.location.reload();
                            }}
                        />
                    </VStack>
                </Card>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
                    {[
                        {
                            icon: '🚀',
                            title: 'Fast & Modern',
                            desc: 'Built with latest technologies for optimal performance'
                        },
                        {
                            icon: '🔒',
                            title: 'Secure',
                            desc: 'Your kubeconfig is encrypted and stored safely'
                        },
                        {
                            icon: '🎯',
                            title: 'Intuitive',
                            desc: 'Manage multiple clusters with ease'
                        }
                    ].map((feature, idx) => (
                        <div
                            key={idx}
                            className="p-6 rounded-xl bg-white/5 border border-white/10 text-center"
                        >
                            <div className="text-4xl mb-3">{feature.icon}</div>
                            <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </VStack>
        </div>
    );
}
