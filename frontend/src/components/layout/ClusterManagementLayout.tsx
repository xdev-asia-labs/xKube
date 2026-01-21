/**
 * ClusterManagement Layout - Separate layout for cluster management pages
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    HStack,
    VStack,
    IconButton,
    Button,
} from '@xdev-asia/x-ui-react';
import {
    ArrowLeft,
    Server,
    Settings as SettingsIcon,
    Shield,
    FileText,
    Menu,
} from 'lucide-react';
import { XKubeLogo } from '@/components/Logo';
import { useAppSelector } from '@/store/hooks';

interface ClusterManagementLayoutProps {
    children: React.ReactNode;
    showSidebar?: boolean;
}

// Sidebar menu items for cluster management
const sidebarItems = [
    { id: 'clusters', label: 'Clusters', icon: Server, path: '/clusters' },
    { id: 'credentials', label: 'Cloud Credentials', icon: Shield, path: '/clusters/credentials' },
    { id: 'drivers', label: 'Drivers', icon: FileText, path: '/clusters/drivers' },
    { id: 'config', label: 'RKE1 Configuration', icon: SettingsIcon, path: '/clusters/config' },
];

export function ClusterManagementLayout({ children, showSidebar = true }: ClusterManagementLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const user = useAppSelector(state => state.auth.user);

    const activeItem = sidebarItems.find(item => location.pathname === item.path)?.id || 'clusters';

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
            {/* Sidebar - Only show on cluster list page */}
            {showSidebar && (
                <div className={`${sidebarOpen ? 'w-64' : 'w-16'} border-r border-white/10 bg-slate-900/50 backdrop-blur-md transition-all duration-300 flex flex-col`}>
                    {/* Logo */}
                    <div className="p-4 border-b border-white/10">
                        <HStack spacing={3} className="items-center">
                            <XKubeLogo size={32} />
                            {sidebarOpen && (
                                <div>
                                    <h1 className="text-white font-bold">xKube</h1>
                                    <p className="text-xs text-slate-400">Cluster Management</p>
                                </div>
                            )}
                        </HStack>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeItem === item.id
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                            </button>
                        ))}
                    </nav>

                    {/* Toggle */}
                    <div className="p-3 border-t border-white/10">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="w-full px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="h-16 px-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
                    <HStack spacing={4} className="items-center">
                        <IconButton
                            icon={<ArrowLeft size={20} />}
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/')}
                            className="text-slate-300 hover:text-white"
                            aria-label="Back to Dashboard"
                        />
                        <div>
                            <h2 className="text-lg font-bold text-white">Cluster Management</h2>
                            <p className="text-xs text-slate-400">Manage your Kubernetes clusters</p>
                        </div>
                    </HStack>

                    <HStack spacing={3} className="items-center">
                        <div className="text-right">
                            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-400">{user?.email || ''}</p>
                        </div>
                    </HStack>
                </div>

                {/* Content */}
                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
