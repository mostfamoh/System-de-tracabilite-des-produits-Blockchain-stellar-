# traceability/permissions.py

from rest_framework import permissions
from rest_framework.permissions import BasePermission


# ==============================================
# PERMISSIONS BASÉES SUR LES RÔLES
# ==============================================
class IsAdmin(BasePermission):
    """Vérifie si l'utilisateur est un administrateur"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )


class IsManufacturer(BasePermission):
    """Vérifie si l'utilisateur est un fabricant"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'FABRICANT' and
            request.user.is_approved
        )


class IsTransport(BasePermission):
    """Vérifie si l'utilisateur est une société de transport"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'TRANSPORT' and
            request.user.is_approved
        )


class IsWarehouse(BasePermission):
    """Vérifie si l'utilisateur est un entrepôt"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ENTREPOT' and
            request.user.is_approved
        )


class IsStore(BasePermission):
    """Vérifie si l'utilisateur est un magasin"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'MAGASIN' and
            request.user.is_approved
        )


class IsClient(BasePermission):
    """Vérifie si l'utilisateur est un client"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'CLIENT'
        )


class IsApprovedUser(BasePermission):
    """Vérifie si l'utilisateur est approuvé"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_approved
        )


class IsOwnerOrAdmin(BasePermission):
    """Vérifie si l'utilisateur est propriétaire ou admin"""
    
    def has_object_permission(self, request, view, obj):
        # Les admins peuvent tout faire
        if request.user.role == 'ADMIN':
            return True
        
        # Vérifier la propriété selon le type d'objet
        if hasattr(obj, 'manufacturer'):
            return obj.manufacturer == request.user
        elif hasattr(obj, 'actor'):
            return obj.actor == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'recipient'):
            return obj.recipient == request.user
        
        return False


# ==============================================
# PERMISSIONS SPÉCIFIQUES AUX ACTIONS
# ==============================================
class CanCreateProduct(BasePermission):
    """Vérifie si l'utilisateur peut créer un produit"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Seuls les fabricants approuvés peuvent créer des produits
        if request.user.role == 'FABRICANT' and request.user.is_approved:
            return True
        
        # Les admins peuvent aussi créer des produits
        if request.user.role == 'ADMIN':
            return True
        
        return False


class CanAddProductStep(BasePermission):
    """Vérifie si l'utilisateur peut ajouter une étape"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.is_approved:
            return False
        
        # Les règles dépendent du type d'étape
        # Cette logique sera complétée dans la vue
        return True
    
    def has_object_permission(self, request, view, obj):
        """Vérifie les permissions sur un produit spécifique"""
        if request.user.role == 'ADMIN':
            return True
        
        # Vérifier selon le statut actuel du produit
        product_status = obj.current_status
        user_role = request.user.role
        
        # Règles de transition
        allowed_transitions = {
            'CREATED': ['TRANSPORT', 'ADMIN'],  # Peut être pris en transport
            'IN_TRANSIT': ['ENTREPOT', 'ADMIN'],  # Peut arriver en entrepôt
            'IN_WAREHOUSE': ['TRANSPORT', 'MAGASIN', 'ADMIN'],  # Peut partir ou aller en magasin
            'IN_STORE': ['MAGASIN', 'ADMIN'],  # Peut être vendu
        }
        
        allowed_roles = allowed_transitions.get(product_status, [])
        return user_role in allowed_roles


class CanViewProduct(BasePermission):
    """Vérifie si l'utilisateur peut voir un produit"""
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        
        # Le fabricant peut voir ses produits
        if request.user.role == 'FABRICANT' and obj.manufacturer == request.user:
            return True
        
        # Les acteurs qui ont manipulé le produit peuvent le voir
        if obj.steps.filter(actor=request.user).exists():
            return True
        
        return False


class CanRegister(BasePermission):
    """Vérifie si l'utilisateur peut s'inscrire"""
    
    def has_permission(self, request, view):
        # Tout le monde peut s'inscrire (permission AllowAny gérée ailleurs)
        return True


# ==============================================
# PERMISSIONS COMBINÉES
# ==============================================
class IsAdminOrReadOnly(BasePermission):
    """
    Les admins peuvent tout faire, les autres peuvent seulement lire.
    """
    
    def has_permission(self, request, view):
        # Lecture autorisée pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        
        # Écriture réservée aux admins
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )


class IsOwnerOrReadOnly(BasePermission):
    """
    Le propriétaire peut modifier, les autres peuvent seulement lire.
    """
    
    def has_object_permission(self, request, view, obj):
        # Lecture autorisée pour tous
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        
        # Écriture réservée au propriétaire ou à l'admin
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.role == 'ADMIN'
        elif hasattr(obj, 'manufacturer'):
            return obj.manufacturer == request.user or request.user.role == 'ADMIN'
        
        return False


class CanManageRegistrationRequests(BasePermission):
    """Vérifie si l'utilisateur peut gérer les demandes d'inscription"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )


# ==============================================
# FONCTION POUR GÉNÉRER LES PERMISSIONS DANS LES VUES
# ==============================================
def get_permissions_for_role(user_role, action=None):
    """
    Retourne les permissions nécessaires selon le rôle et l'action.
    Utilisé dans les viewsets pour définir les permissions dynamiquement.
    """
    base_permissions = [permissions.IsAuthenticated]
    
    if user_role == 'ADMIN':
        return base_permissions + [IsAdmin]
    elif user_role == 'FABRICANT':
        return base_permissions + [IsManufacturer]
    elif user_role == 'TRANSPORT':
        return base_permissions + [IsTransport]
    elif user_role == 'ENTREPOT':
        return base_permissions + [IsWarehouse]
    elif user_role == 'MAGASIN':
        return base_permissions + [IsStore]
    elif user_role == 'CLIENT':
        return base_permissions + [IsClient]
    else:
        return base_permissions + [IsApprovedUser]