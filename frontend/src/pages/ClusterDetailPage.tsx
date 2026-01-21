/**
 * ClusterDetailPage - Detailed management view for a single cluster
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { activateCluster, testConnection } from '@/store/slices/clusterSlice';
import {
    Card,
    Button,
    Badge,
    Spinner,
    Box,
    VStack,
    HStack,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    Grid,
    Col
} from '@xdev-asia/x-ui-react';
import {
    ArrowLeft,
    Server,
    Wifi,
    Activity,
    RefreshCw,
    Box as BoxIcon,
    Layers,
    Network,
    FileText,
    BarChart3,
    Clock
} from 'lucide-react';
import { PodList } from '@/features/pods';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { ClusterManagementLayout } from '@/components/layout/ClusterManagementLayout';

interface ClusterInfo {
    name: string;
    connected: boolean;
    version?: string;
    nodes: number;
    pods: number;
    error?: string;
}

// Stat Card Component
function StatCard({ label, value, icon, colorClass, trend, trendUp }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass: string;
    trend?: string;
    trendUp?: boolean;
}) {
    return (
        <Card
            padding="none"
            className="p-5 group hover:-translate-y-1 transition-transform duration-300 border-white/10 relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`} />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-sm font-medium text-slate-400 mb-1 tracking-wide uppercase text-[10px]">{label}</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <span className={`text-xs font-bold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {trendUp ? '+' : ''}{trend}
                            </span>
                            <span className="text-[10px] text-slate-500">vs last hour</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${colorClass} shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}

// Placeholder for tabs
function PlaceholderView({ title, icon: Icon }: { title: string; icon: any }) {
    return (
        <Card className="p-12 border-white/10 flex flex-col items-center justify-center min-h-[40vh] text-center">
            <div className="p-6 rounded-3xl bg-white/5 mb-6 ring-1 ring-white/10">
                <Icon size={64} className="text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-400 max-w-sm">
                This view is currently under development.
            </p>
        </Card>
    );
}

export function ClusterDetailPage() {
    const { clusterId } = useParams<{ clusterId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const cluster = useAppSelector(state =>
        state.clusters.clusters.find(c => c.id === clusterId)
    );
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch cluster info
    const { data: clusterInfo, isLoading, refetch } = useQuery<ClusterInfo>({
        queryKey: ['cluster-info', clusterId],
        queryFn: () => api.get('/contexts/info').then(r => r.data),
        refetchInterval: 10000,
        enabled: !!cluster,
    });

    // Activate this cluster when viewing
    useEffect(() => {
        if (cluster && !cluster.is_active && clusterId) {
            dispatch(activateCluster(clusterId));
        }
    }, [cluster, clusterId, dispatch]);

    if (!cluster) {
        return (
            <Box className="flex items-center justify-center h-[50vh]">
                <VStack spacing={4}>
                    <p className="text-slate-400">Cluster not found</p>
                    <Button onClick={() => navigate('/clusters')} leftIcon={<ArrowLeft size={20} />}>
                        Back to Clusters
                    </Button>
                </VStack>
            </Box>
        );
    }

    return (
        <ClusterManagementLayout showSidebar={false}>
            <VStack spacing={8} align="stretch">
                {/* Header with Back Button */}
                <HStack spacing={4} className="items-center">
                    <Button
                        variant="ghost"
                        leftIcon={<ArrowLeft size={20} />}
                        onClick={() => navigate('/clusters')}
                        className="text-slate-300 hover:text-white"
                    >
                        Back to Clusters
                    </Button>
                </HStack>

                {/* Cluster Status Header */}
                <Card className="p-6 border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-slate-700/[0.1] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)]" />

                    <HStack spacing={6} className="relative z-10">
                        <Box className={`p-4 rounded-2xl ${cluster.is_connected ? 'bg-emerald-500/10 ring-1 ring-emerald-500/50' : 'bg-red-500/10 ring-1 ring-red-500/50'}`}>
                            {cluster.is_connected
                                ? <Wifi size={32} className="text-emerald-400" />
                                : <Activity size={32} className="text-red-400" />
                            }
                        </Box>
                        <VStack spacing={1} align="start" className="flex-1">
                            <HStack spacing={3}>
                                <h2 className="text-3xl font-bold text-white tracking-tight">{cluster.name}</h2>
                                <Badge
                                    className={cluster.is_connected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' : 'bg-red-500/20 text-red-300 border-red-500/20'}
                                >
                                    {cluster.is_connected ? 'Connected' : 'Disconnected'}
                                </Badge>
                                {cluster.is_active && (
                                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/20">
                                        Active
                                    </Badge>
                                )}
                            </HStack>
                            <p className="text-slate-400 text-sm font-medium">
                                Version {cluster.version || clusterInfo?.version || 'Unknown'} • {cluster.description || 'Kubernetes Cluster'}
                            </p>
                        </VStack>

                        <Button
                            className="hidden sm:flex bg-white/5 hover:bg-white/10 text-white border-white/10"
                            variant="outline"
                            leftIcon={<RefreshCw size={16} />}
                            onClick={() => {
                                refetch();
                                if (clusterId) {
                                    dispatch(testConnection(clusterId));
                                }
                            }}
                        >
                            Refresh Data
                        </Button>
                    </HStack>
                </Card>

                {/* Stats Grid */}
                {isLoading ? (
                    <Box className="flex items-center justify-center h-32">
                        <Spinner size="lg" />
                    </Box>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                        <StatCard
                            label="Total Nodes"
                            value={cluster.node_count || clusterInfo?.nodes || 0}
                            icon={<Server size={24} className="text-white" />}
                            colorClass="from-blue-500 to-indigo-600"
                        />
                        <StatCard
                            label="Active Pods"
                            value={cluster.pod_count || clusterInfo?.pods || 0}
                            icon={<BoxIcon size={24} className="text-white" />}
                            colorClass="from-violet-500 to-purple-600"
                        />
                        <StatCard
                            label="Uptime"
                            value="12d 4h"
                            icon={<Clock size={24} className="text-white" />}
                            colorClass="from-emerald-500 to-teal-600"
                        />
                        <StatCard
                            label="Health Score"
                            value="98%"
                            icon={<Activity size={24} className="text-white" />}
                            colorClass="from-amber-500 to-orange-600"
                            trend="Stable"
                            trendUp={true}
                        />
                    </div>
                )}

                {/* Resource Management Tabs */}
                <Card className="border-white/10 p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabList className="mb-6">
                            <Tab value="overview">
                                <BarChart3 size={16} className="mr-2" />
                                Overview
                            </Tab>
                            <Tab value="pods">
                                <BoxIcon size={16} className="mr-2" />
                                Pods
                            </Tab>
                            <Tab value="deployments">
                                <Layers size={16} className="mr-2" />
                                Deployments
                            </Tab>
                            <Tab value="services">
                                <Network size={16} className="mr-2" />
                                Services
                            </Tab>
                            <Tab value="logs">
                                <FileText size={16} className="mr-2" />
                                Logs
                            </Tab>
                        </TabList>

                        <TabPanel value="overview">
                            {/* Overview/Dashboard for this cluster */}
                            <Grid columns={{ base: 1, lg: 3 }} gap={10}>
                                <Col span={{ base: 1, lg: 2 }}>
                                    <Card className="h-full border-white/10 p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Resource Usage</h3>
                                        <div className="h-full flex items-center justify-center text-slate-500 bg-white/5 rounded-xl border border-white/5 border-dashed min-h-[300px]">
                                            Chart Placeholder
                                        </div>
                                    </Card>
                                </Col>
                                <Col span={1}>
                                    <Card className="h-full border-white/10 p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">Events</h3>
                                        <VStack spacing={4} align="stretch">
                                            {[1, 2, 3, 4].map(i => (
                                                <HStack key={i} spacing={3} className="p-3 rounded-lg bg-white/5 border border-white/5">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-white">Pod Created</p>
                                                        <p className="text-xs text-slate-500">2 mins ago</p>
                                                    </div>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </Card>
                                </Col>
                            </Grid>
                        </TabPanel>

                        <TabPanel value="pods">
                            <PodList />
                        </TabPanel>

                        <TabPanel value="deployments">
                            <PlaceholderView title="Deployments" icon={Layers} />
                        </TabPanel>

                        <TabPanel value="services">
                            <PlaceholderView title="Services" icon={Network} />
                        </TabPanel>

                        <TabPanel value="logs">
                            <PlaceholderView title="Logs" icon={FileText} />
                        </TabPanel>
                    </Tabs>
                </Card>
            </VStack>
        </ClusterManagementLayout>
    );
}
