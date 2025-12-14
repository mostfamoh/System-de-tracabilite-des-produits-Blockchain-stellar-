# traceability/views.py

from rest_framework import viewsets, status, generics, mixins, filters
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, F
from django.utils import timezone
from django.contrib.auth import authenticate

import json
from datetime import datetime, timedelta

from .models import (
    CustomUser, RegistrationRequest, Product, ProductStep,
    ProductCategory, BlockchainRecord, Notification, AuditLog
)
from .serializers import (
    UserSerializer, UserRegistrationSerializer, LoginSerializer,
    RegistrationRequestSerializer, RegistrationRequestActionSerializer,
    ProductSerializer, ProductDetailSerializer, ProductCategorySerializer,
    ProductStepSerializer, AddProductStepSerializer,
    BlockchainRecordSerializer, NotificationSerializer,
    DashboardStatsSerializer
)
from .permissions import (
    IsAdmin, IsManufacturer, IsTransport, IsWarehouse,
    IsStore, IsClient, IsApprovedUser, CanCreateProduct,
    CanAddProductStep, CanViewProduct, IsOwnerOrAdmin,
    CanManageRegistrationRequests, get_permissions_for_role
)
from traceability import serializers


# ==============================================
# PAGINATION PERSONNALISÉE
# ==============================================
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==============================================
# VUES D'AUTHENTIFICATION
# ==============================================
class RegisterView(generics.CreateAPIView):
    """
    Vue pour l'inscription des nouveaux utilisateurs.
    Crée une demande d'inscription qui doit être approuvée par l'admin.
    """
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"Registration request data: {request.data}")  # Debug
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")  # Debug
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = serializer.save()
            
            # Only notify admin if not a client (clients are auto-approved)
            if user.role != 'CLIENT':
                # Créer une notification pour l'admin
                admin_user = CustomUser.objects.filter(role='ADMIN').first()
                if admin_user:
                    Notification.objects.create(
                        recipient=admin_user,
                        notification_type='APPROVAL',
                        title='Nouvelle demande d\'inscription',
                        message=f"{user.company_name} ({user.get_role_display()}) a demandé à s'inscrire.",
                        target_model='RegistrationRequest',
                        target_id=str(RegistrationRequest.objects.get(email=user.email).id)
                    )
            
            if user.role == 'CLIENT':
                message = 'Inscription réussie ! Vous pouvez maintenant vous connecter.'
            else:
                message = 'Inscription réussie ! Votre compte est en attente d\'approbation par l\'administrateur.'
            
            return Response({
                'message': message,
                'user_id': user.id,
                'email': user.email,
                'is_approved': user.is_approved
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Exception during save: {str(e)}")  # Debug
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ClientRegisterView(generics.CreateAPIView):
    """
    Vue simplifiée pour l'inscription des clients.
    Les comptes clients sont automatiquement approuvés.
    """
    permission_classes = [AllowAny]
    serializer_class = serializers.ClientRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = serializer.save()
            
            # Générer les tokens pour connexion automatique
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Compte client créé avec succès ! Vous êtes maintenant connecté.',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'company_name': user.company_name,
                    'role': user.role,
                    'role_display': user.get_role_display(),
                    'is_approved': user.is_approved
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token)
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vue personnalisée pour l'obtention des tokens JWT.
    Vérifie que l'utilisateur est approuvé.
    """
    
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            return Response({
                'error': 'Email ou mot de passe incorrect.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Clients are auto-approved, so we exclude them from approval check
        if not user.is_approved and user.role not in ['ADMIN', 'CLIENT']:
            return Response({
                'error': 'Votre compte n\'est pas encore approuvé par l\'administrateur.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if not user.is_active:
            return Response({
                'error': 'Votre compte est désactivé.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Générer les tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'company_name': user.company_name,
                'role': user.role,
                'role_display': user.get_role_display(),
                'is_approved': user.is_approved
            }
        })


class LogoutView(APIView):
    """
    Vue pour la déconnexion.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Enregistrer l'action dans le journal d'audit
            AuditLog.objects.create(
                user=request.user,
                action_type='LOGOUT',
                model_name='CustomUser',
                object_id=str(request.user.id),
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Déconnexion réussie.'
            }, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# ==============================================
# VUES UTILISATEURS
# ==============================================
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des utilisateurs.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'company_name', 'phone']
    ordering_fields = ['company_name', 'created_at', 'role']
    ordering = ['company_name']
    
    def get_permissions(self):
        """
        Override permissions to allow all authenticated users to access me() and update_me()
        """
        if self.action in ['me', 'update_me']:
            return [IsAuthenticated()]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            # L'admin voit tous les utilisateurs
            return CustomUser.objects.all()
        else:
            # Les autres voient seulement leur propre compte
            return CustomUser.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Retourne les informations de l'utilisateur connecté."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def update_me(self, request):
        """Met à jour les informations de l'utilisateur connecté."""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change le mot de passe de l'utilisateur connecté."""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({
                'error': 'Ancien mot de passe incorrect.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Mot de passe mis à jour avec succès.'
        })


# ==============================================
# VUES DEMANDES D'INSCRIPTION
# ==============================================
class RegistrationRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des demandes d'inscription.
    """
    serializer_class = RegistrationRequestSerializer
    permission_classes = [IsAuthenticated, CanManageRegistrationRequests]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'company_name', 'phone']
    ordering_fields = ['created_at', 'status', 'role']
    ordering = ['-created_at']
    
    def get_queryset(self):
        status_filter = self.request.query_params.get('status', None)
        queryset = RegistrationRequest.objects.all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Traite une demande d'inscription (approuver/rejeter)."""
        print("="*50)
        print(f"PROCESS ENDPOINT HIT - PK: {pk}")
        print(f"Request user: {request.user}")
        print(f"Request data: {request.data}")
        print("="*50)
        
        try:
            registration_request = self.get_object()
            print(f"Got registration request: {registration_request.id} - {registration_request.email}")
        except Exception as e:
            print(f"Error getting object: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = RegistrationRequestActionSerializer(data=request.data)
        print(f"Serializer created, validating...")
        
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Validation passed! Action: {serializer.validated_data['action']}")
        
        action = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '')
        
        try:
            if action == 'APPROVE':
                print(f"Calling approve() method...")
                user = registration_request.approve()
                print(f"Approve returned user: {user.id} - {user.email}")
                
                # Envoyer une notification à l'utilisateur
                Notification.objects.create(
                    recipient=user,
                    notification_type='SUCCESS',
                    title='Compte approuvé',
                    message='Votre compte a été approuvé par l\'administrateur. Vous pouvez maintenant vous connecter.',
                    target_model='CustomUser',
                    target_id=str(user.id)
                )
                print(f"Notification created")
                
                return Response({
                    'message': 'Demande approuvée avec succès.',
                    'user_id': user.id
                })
                
            elif action == 'REJECT':
                registration_request.reject(reason)
                
                # Envoyer une notification à l'utilisateur
                if registration_request.user:
                    Notification.objects.create(
                        recipient=registration_request.user,
                        notification_type='ERROR',
                        title='Demande rejetée',
                        message=f'Votre demande d\'inscription a été rejetée. Raison: {reason}',
                        target_model='RegistrationRequest',
                        target_id=str(registration_request.id)
                    )
                
                return Response({
                    'message': 'Demande rejetée avec succès.'
                })
                
            elif action == 'CANCEL':
                registration_request.status = 'CANCELLED'
                registration_request.processed_at = timezone.now()
                registration_request.save()
                
                return Response({
                    'message': 'Demande annulée avec succès.'
                })
                
        except Exception as e:
            print(f"ERROR IN PROCESS: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retourne les statistiques des demandes."""
        total = RegistrationRequest.objects.count()
        pending = RegistrationRequest.objects.filter(status='PENDING').count()
        approved = RegistrationRequest.objects.filter(status='APPROVED').count()
        rejected = RegistrationRequest.objects.filter(status='REJECTED').count()
        
        return Response({
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected
        })


# ==============================================
# VUES PRODUITS
# ==============================================
class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des produits.
    """
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsApprovedUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku', 'batch_number', 'description']
    ordering_fields = ['name', 'created_at', 'production_date', 'current_status']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.all()
        
        # Filtres par paramètres de requête
        status_filter = self.request.query_params.get('status', None)
        manufacturer_filter = self.request.query_params.get('manufacturer', None)
        batch_filter = self.request.query_params.get('batch', None)
        
        if status_filter:
            queryset = queryset.filter(current_status=status_filter)
        
        if manufacturer_filter:
            queryset = queryset.filter(manufacturer__id=manufacturer_filter)
        
        if batch_filter:
            queryset = queryset.filter(batch_number=batch_filter)
        
        # Filtrage selon le rôle
        if user.role == 'ADMIN':
            return queryset
        
        elif user.role == 'FABRICANT':
            # Fabricants voient seulement leurs produits
            return queryset.filter(manufacturer=user)
        
        elif user.role == 'TRANSPORT':
            # Transporteurs voient:
            # 1. Les produits qu'ils ont transportés
            # 2. Les produits en statut CREATED ou IN_WAREHOUSE (disponibles pour transport)
            product_ids = ProductStep.objects.filter(
                actor=user,
                step_type__in=['TRANSPORT_START', 'TRANSPORT_END']
            ).values_list('product_id', flat=True).distinct()
            return queryset.filter(
                Q(id__in=product_ids) | 
                Q(current_status__in=['CREATED', 'IN_WAREHOUSE'])
            ).distinct()
        
        elif user.role == 'ENTREPOT':
            # Entrepôts voient:
            # 1. Les produits qu'ils ont stockés
            # 2. Les produits en statut IN_TRANSIT (disponibles pour réception)
            product_ids = ProductStep.objects.filter(
                actor=user,
                step_type__in=['WAREHOUSE_ENTRY', 'WAREHOUSE_EXIT']
            ).values_list('product_id', flat=True).distinct()
            return queryset.filter(
                Q(id__in=product_ids) | 
                Q(current_status='IN_TRANSIT')
            ).distinct()
        
        elif user.role == 'MAGASIN':
            # Magasins voient:
            # 1. Les produits qu'ils ont reçus/vendus
            # 2. Les produits en statut IN_WAREHOUSE (disponibles pour transfert au magasin)
            product_ids = ProductStep.objects.filter(
                actor=user,
                step_type__in=['STORE_ENTRY', 'SALE']
            ).values_list('product_id', flat=True).distinct()
            return queryset.filter(
                Q(id__in=product_ids) | 
                Q(current_status='IN_WAREHOUSE')
            ).distinct()
        
        else:
            # Clients et autres ne voient rien par défaut
            return Product.objects.none()
    
    def get_permissions(self):
        """
        Permissions dynamiques selon l'action.
        """
        if self.action == 'create':
            return [IsAuthenticated(), CanCreateProduct()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        elif self.action == 'add_step':
            return [IsAuthenticated(), CanAddProductStep()]
        else:
            return super().get_permissions()
    
    def perform_create(self, serializer):
        """Créer un produit avec le fabricant comme créateur."""
        print(f"[PRODUCT CREATE] User: {self.request.user}, Role: {self.request.user.role}")
        print(f"[PRODUCT CREATE] Data: {serializer.validated_data}")
        
        if self.request.user.role != 'FABRICANT':
            raise serializers.ValidationError(
                "Seuls les fabricants peuvent créer des produits."
            )
        
        try:
            product = serializer.save(manufacturer=self.request.user)
            print(f"[PRODUCT CREATE] Product created: {product.id} - {product.name}")
            
            # Générer le QR code
            product.generate_qr_code()
            product.save()
            print(f"[PRODUCT CREATE] QR code generated")
            
            # Créer automatiquement la première étape (création)
            step = ProductStep.objects.create(
                product=product,
                step_type='CREATION',
                actor=self.request.user,
                location='Usine de fabrication',
                details={
                    'action': 'Produit créé',
                    'manufacturer': self.request.user.company_name or self.request.user.email,
                    'production_date': product.production_date.isoformat() if product.production_date else None
                }
            )
            print(f"[PRODUCT CREATE] Step created: {step.id}")
            
            # Envoyer une notification
            Notification.objects.create(
                recipient=self.request.user,
                notification_type='SUCCESS',
                title='Produit créé',
                message=f'Le produit "{product.name}" a été créé avec succès.',
                target_model='Product',
                target_id=str(product.id)
            )
            print(f"[PRODUCT CREATE] Notification sent")
        except Exception as e:
            print(f"[PRODUCT CREATE] Error: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def retrieve(self, request, *args, **kwargs):
        """Récupère les détails d'un produit avec ses étapes."""
        instance = self.get_object()
        serializer = ProductDetailSerializer(instance, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_step(self, request, pk=None):
        """Ajoute une étape au parcours du produit."""
        product = self.get_object()
        serializer = AddProductStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Vérifier les permissions spécifiques
        if not self._can_add_step(request.user, product, serializer.validated_data['step_type']):
            return Response({
                'error': 'Vous n\'êtes pas autorisé à effectuer cette action.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Créer l'étape
            step_data = serializer.validated_data.copy()
            step_data['product'] = product
            step_data['actor'] = request.user
            
            step = ProductStep.objects.create(**step_data)
            
            # Envoyer des notifications aux parties concernées
            self._send_step_notifications(product, step)
            
            return Response(
                ProductStepSerializer(step, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _can_add_step(self, user, product, step_type):
        """Vérifie si l'utilisateur peut ajouter cette étape."""
        if user.role == 'ADMIN':
            return True
        
        # Définir les transitions autorisées
        allowed_transitions = {
            'CREATED': {
                'step_types': ['QUALITY_CHECK', 'TRANSPORT_START'],
                'roles': ['FABRICANT', 'TRANSPORT']
            },
            'QUALITY_CHECK': {
                'step_types': ['TRANSPORT_START'],
                'roles': ['FABRICANT', 'TRANSPORT']
            },
            'IN_TRANSIT': {
                'step_types': ['TRANSPORT_END', 'WAREHOUSE_ENTRY'],
                'roles': ['TRANSPORT', 'ENTREPOT']
            },
            'IN_WAREHOUSE': {
                'step_types': ['WAREHOUSE_EXIT', 'STORE_ENTRY'],
                'roles': ['ENTREPOT', 'MAGASIN']
            },
            'IN_STORE': {
                'step_types': ['SALE'],
                'roles': ['MAGASIN']
            }
        }
        
        current_status = product.current_status
        if current_status not in allowed_transitions:
            return False
        
        allowed = allowed_transitions[current_status]
        return (
            step_type in allowed['step_types'] and
            user.role in allowed['roles']
        )
    
    def _send_step_notifications(self, product, step):
        """Envoie des notifications pour une nouvelle étape."""
        # Notifier le fabricant
        if product.manufacturer != step.actor:
            Notification.objects.create(
                recipient=product.manufacturer,
                notification_type='PRODUCT_UPDATE',
                title='Nouvelle étape pour votre produit',
                message=f'L\'étape "{step.get_step_type_display()}" a été ajoutée au produit "{product.name}" par {step.actor.company_name}.',
                target_model='Product',
                target_id=str(product.id)
            )
        
        # Notifier l'admin
        admin = CustomUser.objects.filter(role='ADMIN').first()
        if admin and admin != step.actor:
            Notification.objects.create(
                recipient=admin,
                notification_type='INFO',
                title='Nouvelle étape ajoutée',
                message=f'{step.actor.company_name} a ajouté l\'étape "{step.get_step_type_display()}" au produit "{product.name}".',
                target_model='ProductStep',
                target_id=str(step.id)
            )
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Retourne les produits groupés par statut."""
        status_counts = Product.objects.values('current_status').annotate(
            count=Count('id')
        ).order_by('current_status')
        
        return Response(status_counts)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Retourne les produits récemment créés."""
        recent_products = Product.objects.order_by('-created_at')[:10]
        serializer = self.get_serializer(recent_products, many=True)
        return Response(serializer.data)


# ==============================================
# VUES ÉTAPES DE PRODUIT
# ==============================================
class ProductStepViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour la consultation des étapes de produit.
    """
    serializer_class = ProductStepSerializer
    permission_classes = [IsAuthenticated, IsApprovedUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'created_at']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'ADMIN':
            return ProductStep.objects.all()
        
        # Filtrer selon le rôle
        queryset = ProductStep.objects.all()
        
        product_id = self.request.query_params.get('product', None)
        step_type = self.request.query_params.get('step_type', None)
        actor_id = self.request.query_params.get('actor', None)
        
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        if step_type:
            queryset = queryset.filter(step_type=step_type)
        
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)
        
        if user.role == 'FABRICANT':
            # Fabricants voient les étapes de leurs produits
            return queryset.filter(product__manufacturer=user)
        
        elif user.role in ['TRANSPORT', 'ENTREPOT', 'MAGASIN']:
            # Voir les étapes où l'utilisateur est l'acteur
            return queryset.filter(actor=user)
        
        else:
            # Clients ne voient rien
            return ProductStep.objects.none()
    
    @action(detail=True, methods=['get'])
    def verify_blockchain(self, request, pk=None):
        """Vérifie l'étape sur la blockchain."""
        step = self.get_object()
        
        if not step.blockchain_hash:
            return Response({
                'verified': False,
                'message': 'Cette étape n\'a pas été enregistrée sur la blockchain.'
            })
        
        # TODO: Implémenter la vérification réelle avec Stellar
        # Pour l'instant, simulation
        is_verified = True  # Simulé
        
        return Response({
            'verified': is_verified,
            'blockchain_hash': step.blockchain_hash,
            'transaction_id': step.blockchain_transaction_id,
            'message': 'Vérification blockchain (simulée)'
        })


# ==============================================
# VUES CATÉGORIES
# ==============================================
class ProductCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des catégories de produits.
    """
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated, IsApprovedUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        return ProductCategory.objects.all()
    
    def get_permissions(self):
        """Seuls les admins peuvent modifier les catégories."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()


# ==============================================
# VUES BLOCKCHAIN
# ==============================================
class BlockchainRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour la consultation des enregistrements blockchain.
    """
    serializer_class = BlockchainRecordSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = BlockchainRecord.objects.all()
        
        product_id = self.request.query_params.get('product', None)
        verified = self.request.query_params.get('verified', None)
        
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        if verified is not None:
            queryset = queryset.filter(is_verified=verified.lower() == 'true')
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Vérifie un enregistrement sur la blockchain."""
        record = self.get_object()
        
        try:
            # TODO: Implémenter la vérification réelle avec Stellar
            # record.verify_on_blockchain()
            record.is_verified = True
            record.verified_at = timezone.now()
            record.save()
            
            return Response({
                'message': 'Enregistrement vérifié avec succès.',
                'verified': True,
                'verified_at': record.verified_at
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# ==============================================
# VUES NOTIFICATIONS
# ==============================================
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour la gestion des notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Retourne les notifications non lues."""
        unread_notifications = self.get_queryset().filter(is_read=False)
        page = self.paginate_queryset(unread_notifications)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marque toutes les notifications comme lues."""
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'{updated} notifications marquées comme lues.',
            'updated_count': updated
        })
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marque une notification spécifique comme lue."""
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marquée comme lue.'
        })


# ==============================================
# VUES PUBLIQUES
# ==============================================
class ClientProductListView(generics.ListAPIView):
    """
    Vue pour les clients pour lister tous les produits disponibles.
    Accessible aux clients authentifiés.
    """
    permission_classes = [AllowAny]
    serializer_class = serializers.ClientProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'sku', 'batch_number', 'manufacturer__company_name']
    ordering_fields = ['name', 'production_date', 'unit_price', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Retourne tous les produits"""
        return Product.objects.select_related('manufacturer', 'category').all()


class PublicProductView(APIView):
    """
    Vue publique pour vérifier un produit via QR code.
    Accessible sans authentification.
    Retourne des informations complètes sur le produit et sa chaîne d'approvisionnement.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, product_id):
        try:
            product = Product.objects.select_related('manufacturer', 'category').get(id=product_id)
            
            # Generate QR code if it doesn't exist
            if not product.qr_code:
                product.generate_qr_code()
                product.save()
            
            # Récupérer l'historique complet
            steps = product.steps.select_related('actor').all().order_by('timestamp')
            
            # URL du QR code
            qr_code_url = None
            if product.qr_code:
                qr_code_url = request.build_absolute_uri(product.qr_code.url)
            
            data = {
                'product': {
                    'id': str(product.id),
                    'name': product.name,
                    'description': product.description,
                    'category': product.category.name if product.category else None,
                    'manufacturer': {
                        'name': product.manufacturer.company_name,
                        'contact': product.manufacturer.email,
                        'phone': product.manufacturer.phone,
                        'address': product.manufacturer.address
                    },
                    'sku': product.sku,
                    'batch_number': product.batch_number,
                    'production_date': product.production_date.isoformat() if product.production_date else None,
                    'expiration_date': product.expiration_date.isoformat() if product.expiration_date else None,
                    'weight': float(product.weight) if product.weight else None,
                    'dimensions': product.dimensions,
                    'unit_price': float(product.unit_price),
                    'currency': product.currency,
                    'current_status': product.current_status,
                    'current_status_display': product.get_current_status_display(),
                    'current_location': product.current_location,
                    'qr_code_url': qr_code_url,
                    'verification_date': timezone.now().isoformat()
                },
                'supply_chain': {
                    'total_steps': steps.count(),
                    'steps': []
                },
                'verification': {
                    'is_genuine': True,
                    'blockchain_verified': bool(product.blockchain_hash),
                    'blockchain_hash': product.blockchain_hash,
                    'last_update': product.updated_at.isoformat(),
                    'scan_date': timezone.now().isoformat()
                }
            }
            
            # Ajouter l'historique détaillé de la chaîne d'approvisionnement
            for idx, step in enumerate(steps, 1):
                step_data = {
                    'step_number': idx,
                    'step_type': step.step_type,
                    'step_type_display': step.get_step_type_display(),
                    'actor': {
                        'name': step.actor.company_name,
                        'role': step.actor.get_role_display(),
                        'contact': step.actor.email
                    },
                    'location': step.location,
                    'gps_coordinates': step.gps_coordinates,
                    'timestamp': step.timestamp.isoformat(),
                    'details': step.details,
                    'blockchain_verified': bool(step.blockchain_hash),
                    'blockchain_hash': step.blockchain_hash,
                }
                
                # Ajouter les URLs des photos et documents si disponibles
                if step.photo:
                    step_data['photo_url'] = request.build_absolute_uri(step.photo.url)
                if step.document:
                    step_data['document_url'] = request.build_absolute_uri(step.document.url)
                
                data['supply_chain']['steps'].append(step_data)
            
            # Enregistrer le scan dans les logs
            AuditLog.objects.create(
                action_type='SCAN',
                model_name='Product',
                object_id=str(product.id),
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={
                    'scan_type': 'public_qr_code',
                    'product_name': product.name,
                    'manufacturer': product.manufacturer.company_name
                }
            )
            
            return Response(data)
            
        except Product.DoesNotExist:
            return Response({
                'error': 'Produit non trouvé. Le QR code pourrait être invalide ou le produit a été supprimé.',
                'is_genuine': False,
                'scan_date': timezone.now().isoformat()
            }, status=status.HTTP_404_NOT_FOUND)


# ==============================================
# VUES ADMIN / DASHBOARD
# ==============================================
class AdminDashboardView(APIView):
    """
    Vue pour le tableau de bord administrateur.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get(self, request):
        # Statistiques des utilisateurs
        total_users = CustomUser.objects.count()
        users_by_role = CustomUser.objects.values('role').annotate(
            count=Count('id')
        ).order_by('role')
        
        # Statistiques des demandes
        pending_requests = RegistrationRequest.objects.filter(status='PENDING').count()
        
        # Statistiques des produits
        total_products = Product.objects.count()
        products_by_status = Product.objects.values('current_status').annotate(
            count=Count('id')
        ).order_by('current_status')
        
        # Activités récentes
        recent_activities = AuditLog.objects.all().order_by('-timestamp')[:10]
        activities_list = []
        for activity in recent_activities:
            activities_list.append({
                'user': activity.user.company_name if activity.user else 'Système',
                'action': activity.get_action_type_display(),
                'model': activity.model_name,
                'timestamp': activity.timestamp.isoformat(),
                'details': activity.details
            })
        
        # Formater les données
        products_status_dict = {}
        for item in products_by_status:
            products_status_dict[item['current_status']] = item['count']
        
        users_role_dict = {}
        for item in users_by_role:
            users_role_dict[item['role']] = item['count']
        
        stats = {
            'total_users': total_users,
            'users_by_role': users_role_dict,
            'pending_requests': pending_requests,
            'total_products': total_products,
            'products_by_status': products_status_dict,
            'recent_activities': activities_list,
            'generated_at': timezone.now().isoformat()
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


# ==============================================
# VUES UTILITAIRES
# ==============================================
class HealthCheckView(APIView):
    """
    Vue pour vérifier la santé de l'API.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'service': 'Blockchain Traceability API',
            'version': '1.0.0'
        })


# ==============================================
# VUE RACINE DE L'API
# ==============================================
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    Point d'entrée de l'API avec la documentation des endpoints.
    """
    base_url = request.build_absolute_uri('/')
    
    endpoints = {
        'authentication': {
            'register': f'{base_url}api/auth/register/',
            'login': f'{base_url}api/auth/login/',
            'logout': f'{base_url}api/auth/logout/',
            'token_refresh': f'{base_url}api/auth/token/refresh/',
        },
        'users': {
            'users': f'{base_url}api/users/',
            'me': f'{base_url}api/users/me/',
        },
        'registration_requests': {
            'requests': f'{base_url}api/registration-requests/',
            'stats': f'{base_url}api/registration-requests/stats/',
        },
        'products': {
            'products': f'{base_url}api/products/',
            'recent': f'{base_url}api/products/recent/',
            'by_status': f'{base_url}api/products/by_status/',
        },
        'product_steps': {
            'steps': f'{base_url}api/product-steps/',
        },
        'public': {
            'product_verification': f'{base_url}api/public/product/<uuid:product_id>/',
        },
        'admin': {
            'dashboard': f'{base_url}api/admin/dashboard/',
        },
        'health': {
            'check': f'{base_url}api/health/',
        }
    }
    
    return Response({
        'message': 'Bienvenue sur l\'API de Traçabilité Blockchain',
        'version': '1.0.0',
        'documentation': 'Consultez les endpoints disponibles ci-dessous:',
        'endpoints': endpoints
    })