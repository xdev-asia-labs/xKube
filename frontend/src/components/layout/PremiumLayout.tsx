import {
    HStack,
    useXTheme,
    IconButton,
    Sidebar,
    SidebarHeader,
    SidebarNav,
    SidebarNavItem,
    SidebarFooter,
    SidebarToggle,
    SidebarUser,
    Sheet,
    SheetHeader,
    SheetContent
} from '@xdev-asia/x-ui-react'
import {
    LayoutDashboard,
    Box as BoxIcon,
    Layers,
    Network,
    FileText,
    Settings,
    Bell,
    Search,
    Menu,
    Sun,
    Moon,
    Server
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { XKubeLogo } from '@/components/Logo'
import { useAppSelector } from '@/store/hooks'
import { ClusterSelector } from '@/components/clusters'

// Types
export interface NavItem {
    id: string
    label: string
    icon: React.ElementType
    path: string
}

export interface PremiumLayoutProps {
    children: React.ReactNode
}

// Navigation Items
const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'clusters', label: 'Clusters', icon: Server, path: '/clusters' },
    { id: 'pods', label: 'Pods', icon: BoxIcon, path: '/pods' },
    { id: 'deployments', label: 'Deployments', icon: Layers, path: '/deployments' },
    { id: 'services', label: 'Services', icon: Network, path: '/services' },
    { id: 'logs', label: 'Logs', icon: FileText, path: '/logs' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]

// Theme Toggle
function ThemeToggle() {
    const { mode, toggleMode } = useXTheme()
    return (
        <IconButton
            icon={mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            aria-label="Toggle theme"
            className="text-[var(--x-foreground)]/70 hover:text-[var(--x-foreground)]"
        />
    )
}

// Header Component
function Header({ onMenuClick, onAddCluster, onManageClusters }: {
    onMenuClick: () => void;
    onAddCluster?: () => void;
    onManageClusters?: () => void;
}) {
    return (
        <HStack className="h-16 px-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-md justify-between items-center sticky top-0 z-10">
            <HStack spacing={4} className="items-center">
                <IconButton
                    icon={<Menu size={20} />}
                    variant="ghost"
                    size="sm"
                    onClick={onMenuClick}
                    className="lg:hidden text-[var(--x-foreground)]"
                    aria-label="Toggle menu"
                />

                {/* Cluster Selector */}
                <ClusterSelector
                    onAddCluster={onAddCluster}
                    onManageClusters={onManageClusters}
                />
            </HStack>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
                <div className="relative w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        className="w-full h-10 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors"
                    />
                </div>
            </div>

            <HStack spacing={2} className="items-center ml-auto">
                {/* Notification */}
                <IconButton
                    icon={
                        <div className="relative">
                            <Bell size={18} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                    }
                    variant="ghost"
                    size="sm"
                    className="text-[var(--x-foreground)]/70 hover:text-[var(--x-foreground)]"
                    aria-label="Notifications"
                />

                <ThemeToggle />
            </HStack>
        </HStack>
    )
}

// Main Layout using x-ui Sidebar
export function PremiumLayout({ children }: PremiumLayoutProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const user = useAppSelector(state => state.auth.user)

    // Determine active tab from current path
    const activeTab = navItems.find(item =>
        item.path === location.pathname ||
        location.pathname.startsWith(item.path + '/')
    )?.id || 'dashboard'

    const currentTitle = navItems.find(i => i.id === activeTab)?.label || 'Dashboard'

    const handleNavigation = (path: string) => {
        navigate(path)
    }

    return (
        <div className="flex h-screen overflow-hidden overflow-x-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            {/* Desktop Sidebar using x-ui component */}
            <div className="hidden lg:block h-full">
                <Sidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                    variant="glass"
                    className="border-white/10"
                >
                    <SidebarHeader
                        logo={<XKubeLogo size={32} />}
                        title="xKube"
                        subtitle="Platform"
                    />

                    <SidebarNav>
                        {navItems.map((item) => (
                            <SidebarNavItem
                                key={item.id}
                                icon={<item.icon size={20} />}
                                label={item.label}
                                isActive={activeTab === item.id}
                                onClick={() => handleNavigation(item.path)}
                            />
                        ))}
                    </SidebarNav>

                    <SidebarUser
                        avatar={user?.avatar_url}
                        name={user?.name || 'User'}
                        email={user?.email || ''}
                    />

                    <SidebarFooter>
                        <SidebarToggle
                            onToggle={() => setCollapsed(!collapsed)}
                            collapsed={collapsed}
                        />
                    </SidebarFooter>
                </Sidebar>
            </div>

            {/* Mobile Sheet Menu */}
            <Sheet open={mobileOpen} onClose={() => setMobileOpen(false)} side="left">
                <SheetHeader title="xKube" onClose={() => setMobileOpen(false)} />
                <SheetContent>
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    handleNavigation(item.path)
                                    setMobileOpen(false)
                                }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                                    ? 'bg-[var(--x-primary)] text-white'
                                    : 'text-[var(--x-mutedForeground)] hover:bg-[var(--x-muted)]'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <Header
                    onMenuClick={() => setMobileOpen(true)}
                    onAddCluster={() => navigate('/clusters?action=add')}
                    onManageClusters={() => navigate('/clusters')}
                />

                <main className="flex-1 overflow-auto p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
