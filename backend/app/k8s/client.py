"""Kubernetes client wrapper."""

import urllib3
from typing import Any
from kubernetes import client, config
from kubernetes.client.rest import ApiException

from app.core.config import settings

# Disable SSL warnings when using insecure mode
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class K8sClient:
    """Kubernetes API client wrapper."""
    
    _instance = None
    _current_context: str | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self, context: str | None = None) -> None:
        """Initialize Kubernetes client."""
        self._api_client: client.ApiClient | None = None
        self._core_v1: client.CoreV1Api | None = None
        self._apps_v1: client.AppsV1Api | None = None
        self._connected = False
        self._error: str | None = None
        self._load_config(context)

    def _load_config(self, context: str | None = None) -> None:
        """Load Kubernetes configuration."""
        try:
            try:
                config.load_incluster_config()
            except config.ConfigException:
                config.load_kube_config(
                    config_file=settings.kubeconfig_path,
                    context=context
                )
            
            configuration = client.Configuration.get_default_copy()
            if settings.k8s_insecure:
                configuration.verify_ssl = False
            
            self._api_client = client.ApiClient(configuration)
            self._core_v1 = client.CoreV1Api(self._api_client)
            self._apps_v1 = client.AppsV1Api(self._api_client)
            K8sClient._current_context = context
            self._connected = True
            self._error = None
        except Exception as e:
            self._connected = False
            self._error = str(e)

    def switch_context(self, context: str) -> bool:
        """Switch to a different context."""
        self._load_config(context)
        return self._connected

    @property
    def connected(self) -> bool:
        return self._connected

    @property
    def error(self) -> str | None:
        return self._error

    @staticmethod
    def get_contexts() -> list[dict[str, Any]]:
        """Get all available kubernetes contexts."""
        try:
            contexts, active = config.list_kube_config_contexts()
            active_name = active.get("name", "") if active else ""
            return [
                {
                    "name": ctx.get("name", ""),
                    "cluster": ctx.get("context", {}).get("cluster", ""),
                    "user": ctx.get("context", {}).get("user", ""),
                    "namespace": ctx.get("context", {}).get("namespace", "default"),
                    "active": ctx.get("name") == active_name,
                }
                for ctx in contexts
            ]
        except Exception:
            return []

    def get_cluster_info(self) -> dict[str, Any]:
        """Get cluster information."""
        if not self._connected or not self._core_v1:
            return {
                "name": "Not connected",
                "connected": False,
                "error": self._error,
                "nodes": 0,
                "pods": 0,
            }
        
        try:
            version = client.VersionApi(self._api_client).get_code()
            nodes = self._core_v1.list_node()
            pods = self._core_v1.list_pod_for_all_namespaces(limit=1000)
            
            return {
                "name": K8sClient._current_context or "default",
                "version": f"{version.major}.{version.minor}",
                "connected": True,
                "nodes": len(nodes.items),
                "pods": len(pods.items),
            }
        except Exception as e:
            return {
                "name": K8sClient._current_context or "Unknown",
                "connected": False,
                "error": str(e),
                "nodes": 0,
                "pods": 0,
            }

    def list_namespaces(self) -> list[dict[str, Any]]:
        """List all namespaces."""
        if not self._connected or not self._core_v1:
            return []
        try:
            result = self._core_v1.list_namespace()
            return [
                {
                    "name": ns.metadata.name,
                    "status": ns.status.phase,
                    "created": ns.metadata.creation_timestamp.isoformat() if ns.metadata.creation_timestamp else None,
                }
                for ns in result.items
            ]
        except Exception:
            return []

    def list_nodes(self) -> list[dict[str, Any]]:
        """List all cluster nodes."""
        if not self._connected or not self._core_v1:
            return []
        try:
            result = self._core_v1.list_node()
            nodes = []
            for node in result.items:
                # Get node status
                status = "Unknown"
                for condition in node.status.conditions or []:
                    if condition.type == "Ready":
                        status = "Ready" if condition.status == "True" else "NotReady"
                        break
                
                # Get roles
                roles = []
                for label, value in (node.metadata.labels or {}).items():
                    if label.startswith("node-role.kubernetes.io/"):
                        roles.append(label.split("/")[-1])
                if not roles:
                    roles = ["worker"]
                
                # Get capacity
                capacity = node.status.capacity or {}
                allocatable = node.status.allocatable or {}
                
                nodes.append({
                    "name": node.metadata.name,
                    "status": status,
                    "roles": roles,
                    "version": node.status.node_info.kubelet_version if node.status.node_info else "",
                    "os": node.status.node_info.operating_system if node.status.node_info else "",
                    "arch": node.status.node_info.architecture if node.status.node_info else "",
                    "cpu_capacity": capacity.get("cpu", "0"),
                    "memory_capacity": capacity.get("memory", "0"),
                    "pods_capacity": capacity.get("pods", "0"),
                    "internal_ip": self._get_node_internal_ip(node),
                    "cpu_usage_percent": 35,  # Mock data - would need metrics-server
                    "memory_usage_percent": 55,  # Mock data
                })
            return nodes
        except Exception:
            return []

    def _get_node_internal_ip(self, node) -> str:
        """Get node internal IP."""
        for addr in node.status.addresses or []:
            if addr.type == "InternalIP":
                return addr.address
        return ""

    def list_services(self, namespace: str = "default") -> list[dict[str, Any]]:
        """List services in a namespace."""
        if not self._connected or not self._core_v1:
            return []
        try:
            if namespace == "all":
                result = self._core_v1.list_service_for_all_namespaces(limit=200)
            else:
                result = self._core_v1.list_namespaced_service(namespace, limit=200)
            
            services = []
            for svc in result.items:
                ports = []
                for port in svc.spec.ports or []:
                    port_str = f"{port.port}"
                    if port.node_port:
                        port_str += f":{port.node_port}"
                    port_str += f"/{port.protocol}"
                    ports.append(port_str)
                
                # Calculate age
                created = svc.metadata.creation_timestamp
                age = ""
                if created:
                    from datetime import datetime, timezone
                    delta = datetime.now(timezone.utc) - created
                    if delta.days > 0:
                        age = f"{delta.days}d"
                    elif delta.seconds >= 3600:
                        age = f"{delta.seconds // 3600}h"
                    else:
                        age = f"{delta.seconds // 60}m"
                
                services.append({
                    "name": svc.metadata.name,
                    "namespace": svc.metadata.namespace,
                    "type": svc.spec.type,
                    "cluster_ip": svc.spec.cluster_ip or "",
                    "external_ip": self._get_external_ip(svc),
                    "ports": ports,
                    "selector": svc.spec.selector or {},
                    "age": age,
                })
            return services
        except Exception:
            return []

    def _get_external_ip(self, svc) -> str | None:
        """Get external IP for a service."""
        if svc.spec.type == "LoadBalancer" and svc.status.load_balancer.ingress:
            ingress = svc.status.load_balancer.ingress[0]
            return ingress.ip or ingress.hostname
        if svc.spec.external_i_ps:
            return svc.spec.external_i_ps[0]
        return None

    def list_pods(self, namespace: str = "default") -> list[dict[str, Any]]:
        """List pods in a namespace."""
        if not self._connected or not self._core_v1:
            return []
        try:
            if namespace == "all":
                result = self._core_v1.list_pod_for_all_namespaces(limit=200)
            else:
                result = self._core_v1.list_namespaced_pod(namespace, limit=200)
            
            return [
                {
                    "name": pod.metadata.name,
                    "namespace": pod.metadata.namespace,
                    "status": pod.status.phase,
                    "ready": self._get_pod_ready_count(pod),
                    "restarts": self._get_pod_restarts(pod),
                    "node": pod.spec.node_name,
                    "ip": pod.status.pod_ip,
                    "created": pod.metadata.creation_timestamp.isoformat() if pod.metadata.creation_timestamp else None,
                }
                for pod in result.items
            ]
        except Exception:
            return []

    def _get_pod_ready_count(self, pod) -> str:
        """Get ready container count."""
        if not pod.status.container_statuses:
            return "0/0"
        ready = sum(1 for c in pod.status.container_statuses if c.ready)
        total = len(pod.status.container_statuses)
        return f"{ready}/{total}"

    def _get_pod_restarts(self, pod) -> int:
        """Get total restart count."""
        if not pod.status.container_statuses:
            return 0
        return sum(c.restart_count for c in pod.status.container_statuses)

    def list_deployments(self, namespace: str = "default") -> list[dict[str, Any]]:
        """List deployments in a namespace."""
        if not self._connected or not self._apps_v1:
            return []
        try:
            if namespace == "all":
                result = self._apps_v1.list_deployment_for_all_namespaces(limit=200)
            else:
                result = self._apps_v1.list_namespaced_deployment(namespace, limit=200)
            
            return [
                {
                    "name": dep.metadata.name,
                    "namespace": dep.metadata.namespace,
                    "replicas": dep.spec.replicas or 0,
                    "ready": dep.status.ready_replicas or 0,
                    "available": dep.status.available_replicas or 0,
                    "created": dep.metadata.creation_timestamp.isoformat() if dep.metadata.creation_timestamp else None,
                }
                for dep in result.items
            ]
        except Exception:
            return []

    def get_pod_logs(self, name: str, namespace: str, tail_lines: int = 100) -> str:
        """Get logs for a pod."""
        if not self._connected or not self._core_v1:
            return "Not connected to cluster"
        try:
            return self._core_v1.read_namespaced_pod_log(
                name=name,
                namespace=namespace,
                tail_lines=tail_lines,
            )
        except Exception as e:
            return f"Error: {str(e)}"


# Singleton instance
k8s_client = K8sClient()
