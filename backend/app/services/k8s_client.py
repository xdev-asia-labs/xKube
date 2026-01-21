"""
Kubernetes client service for interacting with K8s clusters
"""
from typing import Optional, Dict, Any, List
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import yaml
import tempfile
import os
from app.services.encryption import encryption_service


class KubernetesClientService:
    """Service for managing Kubernetes API clients"""
    
    def __init__(self):
        self._clients: Dict[str, client.CoreV1Api] = {}
    
    def get_client(self, kubeconfig: str, context: Optional[str] = None) -> client.CoreV1Api:
        """
        Get or create a Kubernetes client for the given kubeconfig
        
        Args:
            kubeconfig: Encrypted kubeconfig content
            context: Optional context name to use
            
        Returns:
            CoreV1Api client instance
        """
        # Decrypt kubeconfig
        decrypted_config = encryption_service.decrypt(kubeconfig)
        
        # Create a cache key
        cache_key = f"{hash(decrypted_config)}:{context or 'default'}"
        
        if cache_key in self._clients:
            return self._clients[cache_key]
        
        # Write kubeconfig to temporary file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.yaml') as f:
            f.write(decrypted_config)
            temp_path = f.name
        
        try:
            # Load kubeconfig
            config.load_kube_config(
                config_file=temp_path,
                context=context
            )
            
            # Create client
            v1_client = client.CoreV1Api()
            
            # Cache the client
            self._clients[cache_key] = v1_client
            
            return v1_client
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def get_apps_client(self, kubeconfig: str, context: Optional[str] = None) -> client.AppsV1Api:
        """Get AppsV1Api client for deployments, statefulsets, etc."""
        decrypted_config = encryption_service.decrypt(kubeconfig)
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.yaml') as f:
            f.write(decrypted_config)
            temp_path = f.name
        
        try:
            config.load_kube_config(config_file=temp_path, context=context)
            return client.AppsV1Api()
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    async def list_pods(
        self,
        kubeconfig: str,
        context: Optional[str] = None,
        namespace: str = "default",
        label_selector: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List pods in a namespace
        
        Args:
            kubeconfig: Encrypted kubeconfig
            context: K8s context
            namespace: Namespace to query (default: "default", use "" for all namespaces)
            label_selector: Optional label selector
            
        Returns:
            List of pod dictionaries
        """
        try:
            v1 = self.get_client(kubeconfig, context)
            
            if namespace:
                pods = v1.list_namespaced_pod(
                    namespace=namespace,
                    label_selector=label_selector
                )
            else:
                pods = v1.list_pod_for_all_namespaces(
                    label_selector=label_selector
                )
            
            return [self._pod_to_dict(pod) for pod in pods.items]
        except ApiException as e:
            raise Exception(f"Failed to list pods: {e}")
    
    async def get_pod(
        self,
        kubeconfig: str,
        namespace: str,
        name: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get a specific pod"""
        try:
            v1 = self.get_client(kubeconfig, context)
            pod = v1.read_namespaced_pod(name=name, namespace=namespace)
            return self._pod_to_dict(pod)
        except ApiException as e:
            raise Exception(f"Failed to get pod: {e}")
    
    async def delete_pod(
        self,
        kubeconfig: str,
        namespace: str,
        name: str,
        context: Optional[str] = None
    ) -> Dict[str, str]:
        """Delete a pod"""
        try:
            v1 = self.get_client(kubeconfig, context)
            v1.delete_namespaced_pod(name=name, namespace=namespace)
            return {"status": "success", "message": f"Pod {name} deleted"}
        except ApiException as e:
            raise Exception(f"Failed to delete pod: {e}")
    
    async def get_pod_logs(
        self,
        kubeconfig: str,
        namespace: str,
        name: str,
        container: Optional[str] = None,
        tail_lines: Optional[int] = None,
        context: Optional[str] = None
    ) -> str:
        """Get pod logs"""
        try:
            v1 = self.get_client(kubeconfig, context)
            logs = v1.read_namespaced_pod_log(
                name=name,
                namespace=namespace,
                container=container,
                tail_lines=tail_lines
            )
            return logs
        except ApiException as e:
            raise Exception(f"Failed to get pod logs: {e}")
    
    def _pod_to_dict(self, pod) -> Dict[str, Any]:
        """Convert K8s pod object to dictionary"""
        return {
            "name": pod.metadata.name,
            "namespace": pod.metadata.namespace,
            "uid": pod.metadata.uid,
            "created_at": pod.metadata.creation_timestamp.isoformat() if pod.metadata.creation_timestamp else None,
            "labels": pod.metadata.labels or {},
            "status": {
                "phase": pod.status.phase,
                "conditions": [
                    {
                        "type": c.type,
                        "status": c.status,
                        "reason": c.reason,
                        "message": c.message
                    }
                    for c in (pod.status.conditions or [])
                ],
                "pod_ip": pod.status.pod_ip,
                "host_ip": pod.status.host_ip,
                "start_time": pod.status.start_time.isoformat() if pod.status.start_time else None,
            },
            "containers": [
                {
                    "name": c.name,
                    "image": c.image,
                    "ready": self._is_container_ready(pod, c.name),
                    "restart_count": self._get_container_restart_count(pod, c.name),
                    "state": self._get_container_state(pod, c.name)
                }
                for c in (pod.spec.containers or [])
            ],
            "node_name": pod.spec.node_name,
            "restart_policy": pod.spec.restart_policy,
        }
    
    def _is_container_ready(self, pod, container_name: str) -> bool:
        """Check if a container is ready"""
        if not pod.status.container_statuses:
            return False
        for status in pod.status.container_statuses:
            if status.name == container_name:
                return status.ready
        return False
    
    def _get_container_restart_count(self, pod, container_name: str) -> int:
        """Get container restart count"""
        if not pod.status.container_statuses:
            return 0
        for status in pod.status.container_statuses:
            if status.name == container_name:
                return status.restart_count
        return 0
    
    def _get_container_state(self, pod, container_name: str) -> Dict[str, Any]:
        """Get container state"""
        if not pod.status.container_statuses:
            return {"state": "unknown"}
        
        for status in pod.status.container_statuses:
            if status.name == container_name:
                if status.state.running:
                    return {
                        "state": "running",
                        "started_at": status.state.running.started_at.isoformat() if status.state.running.started_at else None
                    }
                elif status.state.waiting:
                    return {
                        "state": "waiting",
                        "reason": status.state.waiting.reason,
                        "message": status.state.waiting.message
                    }
                elif status.state.terminated:
                    return {
                        "state": "terminated",
                        "reason": status.state.terminated.reason,
                        "exit_code": status.state.terminated.exit_code,
                        "finished_at": status.state.terminated.finished_at.isoformat() if status.state.terminated.finished_at else None
                    }
        
        return {"state": "unknown"}


# Singleton instance
k8s_client_service = KubernetesClientService()
