// Cluster types
export interface ClusterInfo {
    name: string
    connected: boolean
    version?: string
    nodes: number
    pods: number
    error?: string
}

// Pod types
export interface Pod {
    name: string
    namespace: string
    status: string
    ready: string
    restarts: number
    node: string
    ip: string
}

// Deployment types
export interface Deployment {
    name: string
    namespace: string
    replicas: number
    ready: number
    available: number
}

// Service types
export interface Service {
    name: string
    namespace: string
    type: string
    clusterIP: string
    ports: string
}

// Node types
export interface Node {
    name: string
    status: string
    roles: string
    version: string
    cpu: string
    memory: string
}
