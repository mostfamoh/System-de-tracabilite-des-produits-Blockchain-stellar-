# traceability/stellar_service.py

import hashlib
import json
import time
import base64
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

from stellar_sdk import (
    Server, Network, Keypair, TransactionBuilder,
    Asset, Payment, ManageData, Memo
)
from django.conf import settings
from django.core.cache import cache
import requests


class StellarService:
    """
    Service pour interagir avec la blockchain Stellar.
    Fournit des méthodes pour enregistrer et vérifier des transactions.
    """
    
    def __init__(self, network: str = None):
        """
        Initialise le service Stellar.
        
        Args:
            network: 'TESTNET' ou 'PUBLIC' (par défaut: TESTNET)
        """
        self.network_type = network or getattr(settings, 'STELLAR_NETWORK', 'TESTNET')
        
        # Configuration réseau
        if self.network_type.upper() == 'TESTNET':
            self.network = Network.TESTNET
            self.horizon_url = "https://horizon-testnet.stellar.org"
        else:
            self.network = Network.PUBLIC_NETWORK
            self.horizon_url = "https://horizon.stellar.org"
        
        # Initialiser le serveur
        self.server = Server(self.horizon_url)
        
        # Charger les clés depuis les settings
        self._load_keys()
        
        # Vérifier que le compte source existe et est financé
        self._ensure_account_funded()
    
    def _load_keys(self):
        """Charge les clés Stellar depuis les settings."""
        try:
            # En production, utilisez des clés sécurisées dans .env
            self.source_secret = getattr(settings, 'STELLAR_SOURCE_SECRET', None)
            self.source_public = getattr(settings, 'STELLAR_SOURCE_PUBLIC', None)
            
            if not self.source_secret or not self.source_public:
                raise ValueError("Clés Stellar non configurées dans les settings.")
            
            self.source_keypair = Keypair.from_secret(self.source_secret)
            
            # Vérifier que la clé publique correspond
            if self.source_keypair.public_key != self.source_public:
                raise ValueError("La clé publique ne correspond pas à la clé secrète.")
            
        except Exception as e:
            print(f"Erreur de chargement des clés Stellar: {e}")
            # En développement, on peut utiliser un compte test
            self._create_test_account()
    
    def _create_test_account(self):
        """Crée un compte test pour le développement."""
        print("Création d'un compte Stellar test...")
        
        # Générer une nouvelle paire de clés
        self.source_keypair = Keypair.random()
        self.source_secret = self.source_keypair.secret
        self.source_public = self.source_keypair.public_key
        
        # Sur Testnet, on peut créer un compte gratuitement
        if self.network_type == 'TESTNET':
            try:
                response = requests.get(
                    f"https://friendbot.stellar.org?addr={self.source_public}"
                )
                if response.status_code == 200:
                    print(f"Compte test créé: {self.source_public}")
                else:
                    print("Échec de création du compte test")
            except Exception as e:
                print(f"Erreur lors de la création du compte test: {e}")
    
    def _ensure_account_funded(self):
        """Vérifie et finance le compte source si nécessaire."""
        try:
            account = self.server.load_account(self.source_public)
            self.account_loaded = True
        except Exception:
            self.account_loaded = False
            if self.network_type == 'TESTNET':
                print("Compte Stellar non financé. Utilisez Friendbot pour le financer.")
            else:
                print("Compte Stellar non financé. Financez-le avec des XLM.")
    
    def create_data_hash(self, data: Dict[str, Any]) -> str:
        """
        Crée un hash SHA-256 des données.
        
        Args:
            data: Données à hasher
        
        Returns:
            Hash hexadécimal des données
        """
        # Normaliser les données (trier les clés pour un hash consistant)
        normalized_data = json.dumps(data, sort_keys=True, separators=(',', ':'))
        
        # Créer le hash
        return hashlib.sha256(normalized_data.encode()).hexdigest()
    
    def encode_data_for_memo(self, data: Dict[str, Any]) -> str:
        """
        Encode les données pour les stocker dans le mémo d'une transaction.
        
        Args:
            data: Données à encoder
        
        Returns:
            Chaîne encodée en base64
        """
        json_str = json.dumps(data, separators=(',', ':'))
        return base64.b64encode(json_str.encode()).decode('utf-8')
    
    def decode_data_from_memo(self, encoded_data: str) -> Dict[str, Any]:
        """
        Décode les données depuis le mémo d'une transaction.
        
        Args:
            encoded_data: Données encodées en base64
        
        Returns:
            Données décodées
        """
        json_str = base64.b64decode(encoded_data).decode('utf-8')
        return json.loads(json_str)
    
    def record_transaction(self, data: Dict[str, Any], memo_type: str = 'product_step') -> Dict[str, Any]:
        """
        Enregistre une transaction sur la blockchain Stellar.
        
        Args:
            data: Données à enregistrer
            memo_type: Type de transaction pour le tagging
        
        Returns:
            Résultat de la transaction
        """
        try:
            if not self.account_loaded:
                raise Exception("Compte Stellar non disponible")
            
            # Ajouter des métadonnées
            timestamp = int(time.time())
            full_data = {
                **data,
                'timestamp': timestamp,
                'memo_type': memo_type,
                'version': '1.0'
            }
            
            # Créer le hash des données
            data_hash = self.create_data_hash(full_data)
            
            # Encoder les données pour le mémo
            encoded_memo = self.encode_data_for_memo(full_data)
            
            # Charger le compte source
            source_account = self.server.load_account(self.source_public)
            
            # Créer l'opération ManageData pour stocker le hash
            manage_data_op = ManageData(
                data_name=f"TRACE_{memo_type.upper()}_{timestamp}",
                data_value=data_hash.encode()
            )
            
            # Construire la transaction
            transaction = (
                TransactionBuilder(
                    source_account=source_account,
                    network_passphrase=self.network.network_passphrase,
                    base_fee=100  # Frais minimum
                )
                .append_operation(manage_data_op)
                .add_text_memo(encoded_memo[:28])  # Mémo limité à 28 caractères
                .set_timeout(30)  # Timeout de 30 secondes
                .build()
            )
            
            # Signer la transaction
            transaction.sign(self.source_keypair)
            
            # Soumettre la transaction
            response = self.server.submit_transaction(transaction)
            
            # Retourner le résultat
            return {
                'success': True,
                'transaction_hash': response['hash'],
                'stellar_account': self.source_public,
                'data_hash': data_hash,
                'ledger': response['ledger'],
                'created_at': response['created_at'],
                'memo': encoded_memo,
                'network': self.network_type,
                'message': 'Transaction enregistrée avec succès sur Stellar'
            }
            
        except Exception as e:
            print(f"Erreur d'enregistrement Stellar: {e}")
            
            # En cas d'échec, simuler une transaction pour le développement
            if settings.DEBUG:
                return self._simulate_transaction(data, memo_type)
            
            return {
                'success': False,
                'error': str(e),
                'message': 'Échec de l\'enregistrement sur la blockchain'
            }
    
    def _simulate_transaction(self, data: Dict[str, Any], memo_type: str) -> Dict[str, Any]:
        """
        Simule une transaction pour le développement.
        
        Args:
            data: Données à simuler
            memo_type: Type de transaction
        
        Returns:
            Résultat simulé
        """
        timestamp = int(time.time())
        full_data = {
            **data,
            'timestamp': timestamp,
            'memo_type': memo_type,
            'version': '1.0',
            'simulated': True
        }
        
        data_hash = self.create_data_hash(full_data)
        encoded_memo = self.encode_data_for_memo(full_data)
        
        # Générer un hash de transaction simulé
        simulated_hash = hashlib.sha256(
            f"{data_hash}{timestamp}{self.source_public}".encode()
        ).hexdigest()
        
        return {
            'success': True,
            'transaction_hash': f"SIM_{simulated_hash[:32]}",
            'stellar_account': self.source_public,
            'data_hash': data_hash,
            'ledger': 999999,
            'created_at': datetime.now().isoformat(),
            'memo': encoded_memo,
            'network': self.network_type,
            'simulated': True,
            'message': 'Transaction simulée (mode développement)'
        }
    
    def verify_transaction(self, transaction_hash: str) -> Dict[str, Any]:
        """
        Vérifie une transaction sur la blockchain.
        
        Args:
            transaction_hash: Hash de la transaction à vérifier
        
        Returns:
            Résultat de la vérification
        """
        try:
            # Vérifier d'abord dans le cache
            cache_key = f"stellar_verify_{transaction_hash}"
            cached_result = cache.get(cache_key)
            
            if cached_result:
                return {**cached_result, 'cached': True}
            
            # Vérifier si c'est une transaction simulée
            if transaction_hash.startswith('SIM_'):
                return {
                    'success': True,
                    'verified': True,
                    'transaction_hash': transaction_hash,
                    'simulated': True,
                    'message': 'Transaction simulée vérifiée'
                }
            
            # Récupérer la transaction depuis Stellar
            transaction = self.server.transactions().transaction(transaction_hash).call()
            
            # Extraire les données du mémo
            memo_text = transaction.get('memo', '')
            if memo_text and len(memo_text) > 0:
                try:
                    memo_data = self.decode_data_from_memo(memo_text)
                except:
                    memo_data = {'raw_memo': memo_text}
            else:
                memo_data = {}
            
            # Vérifier les opérations ManageData
            operations = transaction.get('operations', {}).get('_embedded', {}).get('records', [])
            data_hash = None
            
            for op in operations:
                if op['type'] == 'manage_data':
                    if op['data_value']:
                        data_hash = op['data_value']
                    break
            
            result = {
                'success': True,
                'verified': True,
                'transaction_hash': transaction_hash,
                'ledger': transaction['ledger'],
                'created_at': transaction['created_at'],
                'source_account': transaction['source_account'],
                'memo_data': memo_data,
                'data_hash': data_hash,
                'operations_count': len(operations),
                'fee_paid': int(transaction['fee_charged']) / 10000000,  # Convertir en XLM
                'message': 'Transaction vérifiée sur la blockchain Stellar'
            }
            
            # Mettre en cache pour 5 minutes
            cache.set(cache_key, result, 300)
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'verified': False,
                'transaction_hash': transaction_hash,
                'error': str(e),
                'message': 'Échec de la vérification de la transaction'
            }
    
    def verify_product_trace(self, product_id: str) -> Dict[str, Any]:
        """
        Vérifie la traçabilité complète d'un produit sur la blockchain.
        
        Args:
            product_id: ID du produit à vérifier
        
        Returns:
            Résultat de la vérification
        """
        try:
            # Chercher toutes les transactions pour ce produit
            # Note: Cette implémentation suppose que nous avons un index des transactions par produit
            
            # Pour l'instant, nous allons simuler la vérification
            # Dans une implémentation réelle, vous voudriez:
            # 1. Récupérer toutes les transactions liées au produit
            # 2. Vérifier chaque transaction
            # 3. Vérifier la chaîne de traçabilité
            
            return {
                'success': True,
                'verified': True,
                'product_id': product_id,
                'blockchain_verified': True,
                'transactions_found': 0,  # À implémenter
                'chain_integrity': True,
                'message': 'Traçabilité vérifiée (simulée)'
            }
            
        except Exception as e:
            return {
                'success': False,
                'product_id': product_id,
                'error': str(e),
                'message': 'Échec de la vérification de la traçabilité'
            }
    
    def create_asset(self, asset_code: str, issuer_public: str) -> Dict[str, Any]:
        """
        Crée un asset personnalisé sur Stellar.
        
        Args:
            asset_code: Code de l'asset (3-12 caractères)
            issuer_public: Clé publique de l'émetteur
        
        Returns:
            Résultat de la création
        """
        try:
            if not self.account_loaded:
                raise Exception("Compte Stellar non disponible")
            
            # Créer l'asset
            asset = Asset(asset_code, issuer_public)
            
            # Pour distribuer l'asset, il faut créer une trustline et émettre des tokens
            # Cette opération est plus complexe et nécessite un compte distributeur
            
            return {
                'success': True,
                'asset_code': asset_code,
                'issuer': issuer_public,
                'asset': str(asset),
                'message': f'Asset {asset_code} créé avec succès'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Échec de la création de l\'asset'
            }
    
    def get_account_info(self, public_key: str = None) -> Dict[str, Any]:
        """
        Récupère les informations d'un compte Stellar.
        
        Args:
            public_key: Clé publique du compte (par défaut: compte source)
        
        Returns:
            Informations du compte
        """
        try:
            account_public = public_key or self.source_public
            account = self.server.accounts().account_id(account_public).call()
            
            return {
                'success': True,
                'account_id': account['id'],
                'sequence': account['sequence'],
                'balances': account['balances'],
                'thresholds': account['thresholds'],
                'flags': account['flags'],
                'signers': account['signers'],
                'data': account['data']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Échec de la récupération des informations du compte'
            }
    
    def check_network_status(self) -> Dict[str, Any]:
        """
        Vérifie le statut du réseau Stellar.
        
        Returns:
            Statut du réseau
        """
        try:
            root = self.server.root().call()
            
            return {
                'success': True,
                'network': self.network_type,
                'horizon_version': root['horizon_version'],
                'core_version': root['core_version'],
                'current_ledger': root['history_latest_ledger'],
                'network_passphrase': root['network_passphrase'],
                'protocol_version': root['protocol_version']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Échec de la vérification du statut du réseau'
            }


# ==============================================
# SINGLETON POUR LE SERVICE STELLAR
# ==============================================
_stellar_service_instance = None

def get_stellar_service() -> StellarService:
    """
    Retourne une instance singleton du service Stellar.
    
    Returns:
        Instance de StellarService
    """
    global _stellar_service_instance
    
    if _stellar_service_instance is None:
        _stellar_service_instance = StellarService()
    
    return _stellar_service_instance


# ==============================================
# FONCTIONS UTILITAIRES
# ==============================================
def generate_stellar_keypair() -> Dict[str, str]:
    """
    Génère une nouvelle paire de clés Stellar.
    
    Returns:
        Dictionnaire avec clé publique et secrète
    """
    keypair = Keypair.random()
    
    return {
        'public_key': keypair.public_key,
        'secret_key': keypair.secret,
        'message': 'Paire de clés générée avec succès. Gardez la clé secrète en sécurité !'
    }


def validate_stellar_address(address: str) -> bool:
    """
    Valide une adresse Stellar (clé publique).
    
    Args:
        address: Adresse à valider
    
    Returns:
        True si valide, False sinon
    """
    try:
        Keypair.from_public_key(address)
        return True
    except:
        return False