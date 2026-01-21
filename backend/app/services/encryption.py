"""
Encryption service for sensitive data (kubeconfig)
Uses Fernet (AES-128-CBC) from cryptography library
"""
from cryptography.fernet import Fernet
import os


class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""
    
    def __init__(self):
        # Get encryption key from environment or generate one
        key_str = os.getenv("ENCRYPTION_KEY")
        
        if not key_str:
            # Generate a new key for development
            # In production, this should be stored securely (e.g., Kubernetes Secret, Vault)
            print("WARNING: No ENCRYPTION_KEY found in environment. Generating a new one.")
            print("In production, set ENCRYPTION_KEY environment variable!")
            self.key = Fernet.generate_key()
            print(f"Generated key (base64): {self.key.decode()}")
        else:
            # Use existing key
            self.key = key_str.encode() if isinstance(key_str, str) else key_str
        
        self.fernet = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """
        Encrypt string data
        
        Args:
            data: Plain text string to encrypt
            
        Returns:
            Base64-encoded encrypted string
        """
        if not data:
            return ""
        
        encrypted_bytes = self.fernet.encrypt(data.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt encrypted data
        
        Args:
            encrypted_data: Base64-encoded encrypted string
            
        Returns:
            Decrypted plain text string
        """
        if not encrypted_data:
            return ""
        
        decrypted_bytes = self.fernet.decrypt(encrypted_data.encode('utf-8'))
        return decrypted_bytes.decode('utf-8')
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new Fernet key
        
        Returns:
            Base64-encoded key string
        """
        return Fernet.generate_key().decode('utf-8')


# Global instance
encryption_service = EncryptionService()


# Helper functions
def encrypt_kubeconfig(kubeconfig: str) -> str:
    """Encrypt kubeconfig content"""
    return encryption_service.encrypt(kubeconfig)


def decrypt_kubeconfig(encrypted_kubeconfig: str) -> str:
    """Decrypt kubeconfig content"""
    return encryption_service.decrypt(encrypted_kubeconfig)
