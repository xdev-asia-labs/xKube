/**
 * Clusters Page - Manage all clusters with dedicated layout
 */
import { ClusterList } from '@/features/clusters'
import { ClusterManagementLayout } from '@/components/layout/ClusterManagementLayout'

export function ClustersPage() {
    return (
        <ClusterManagementLayout showSidebar={true}>
            <ClusterList />
        </ClusterManagementLayout>
    )
}
