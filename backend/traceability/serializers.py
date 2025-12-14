# traceability/serializers.py

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import (
    CustomUser, RegistrationRequest, Product, ProductStep, 
    ProductCategory, BlockchainRecord, Notification, AuditLog
)


# ==============================================
# SERIALIZERS D'AUTHENTIFICATION
# ==============================================
class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs"""
    
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'},
        help_text='Mot de passe (non affiché en lecture)'
    )
    
    role_display = serializers.CharField(
        source='get_role_display',
        read_only=True
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'company_name', 'address', 'phone', 'tax_id',
            'role', 'role_display', 'is_approved', 'is_active',
            'created_at', 'updated_at', 'password'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'role_display']
        extra_kwargs = {
            'email': {'required': True},
            'company_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'role': {'required': True}
        }
    
    def validate_email(self, value):
        """Valider l'unicité de l'email"""
        if self.instance and self.instance.email == value:
            return value
        
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value
    
    def validate_password(self, value):
        """Valider la force du mot de passe"""
        if value:
            validate_password(value)
        return value
    
    def create(self, validated_data):
        """Créer un utilisateur avec mot de passe hashé"""
        password = validated_data.pop('password', None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        """Mettre à jour un utilisateur"""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription initiale"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password],
        help_text='Mot de passe fort requis'
    )
    
    password_confirmation = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Confirmez le mot de passe'
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'company_name', 'address', 'phone', 'tax_id',
            'role', 'password', 'password_confirmation'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'company_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'role': {'required': True},
            'address': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'tax_id': {'required': False, 'allow_blank': True, 'allow_null': True}
        }
    
    def validate(self, data):
        """Validation globale"""
        # Vérifier la confirmation du mot de passe
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({
                'password_confirmation': 'Les mots de passe ne correspondent pas.'
            })
        
        # Vérifier l'unicité de l'email
        if CustomUser.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': 'Cet email est déjà utilisé.'
            })
        
        # Vérifier que le rôle est valide (pas ADMIN)
        if data['role'] == 'ADMIN':
            raise serializers.ValidationError({
                'role': 'Le rôle ADMIN ne peut pas être choisi à l\'inscription.'
            })
        
        return data
    
    def create(self, validated_data):
        """Créer l'utilisateur et la demande d'inscription"""
        from django.db import transaction, IntegrityError
        from django.utils import timezone
        
        validated_data.pop('password_confirmation')
        password = validated_data.pop('password')
        role = validated_data.get('role')
        email = validated_data.get('email')
        
        # Double-check email doesn't exist (safety check)
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'Cet email est déjà utilisé.'
            })
        
        # Auto-approve clients since they only have read-only access
        is_approved = (role == 'CLIENT')
        
        # Use atomic transaction to ensure both user and registration request are created together
        try:
            with transaction.atomic():
                # Créer l'utilisateur
                user = CustomUser.objects.create_user(
                    **validated_data,
                    password=password,
                    is_approved=is_approved
                )
                
                # Créer ou mettre à jour la demande d'inscription
                registration_status = 'APPROVED' if role == 'CLIENT' else 'PENDING'
                RegistrationRequest.objects.update_or_create(
                    email=user.email,
                    defaults={
                        'company_name': user.company_name,
                        'address': user.address or '',
                        'phone': user.phone or '',
                        'tax_id': user.tax_id or '',
                        'role': user.role,
                        'status': registration_status,
                        'user': user,
                        'processed_at': timezone.now() if role == 'CLIENT' else None
                    }
                )
            
            return user
        except IntegrityError as e:
            raise serializers.ValidationError({
                'email': 'Cet email est déjà utilisé.'
            })


class ClientRegistrationSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour l'inscription des clients"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password],
        help_text='Mot de passe fort requis'
    )
    
    password_confirmation = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Confirmez le mot de passe'
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'company_name', 'phone',
            'password', 'password_confirmation'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'company_name': {'required': False, 'allow_blank': True, 'allow_null': True, 'help_text': 'Votre nom ou nom de société (optionnel)'}
        }
    
    def validate(self, data):
        """Validation globale"""
        # Vérifier la confirmation du mot de passe
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({
                'password_confirmation': 'Les mots de passe ne correspondent pas.'
            })
        
        # Vérifier l'unicité de l'email
        if CustomUser.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                'email': 'Cet email est déjà utilisé.'
            })
        
        return data
    
    def create(self, validated_data):
        """Créer un compte client (auto-approuvé)"""
        from django.db import transaction, IntegrityError
        from django.utils import timezone
        
        validated_data.pop('password_confirmation')
        password = validated_data.pop('password')
        email = validated_data.get('email')
        
        # Double-check email doesn't exist (safety check)
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'Cet email est déjà utilisé.'
            })
        
        # Use atomic transaction
        try:
            with transaction.atomic():
                # Créer le client avec approbation automatique
                user = CustomUser.objects.create_user(
                    **validated_data,
                    password=password,
                    role='CLIENT',
                    is_approved=True,
                    address='',
                    tax_id=''
                )
                
                # Créer ou mettre à jour la demande d'inscription (déjà approuvée)
                RegistrationRequest.objects.update_or_create(
                    email=user.email,
                    defaults={
                        'company_name': user.company_name,
                        'address': '',
                        'phone': user.phone or '',
                        'tax_id': '',
                        'role': 'CLIENT',
                        'status': 'APPROVED',
                        'user': user,
                        'processed_at': timezone.now()
                    }
                )
            
            return user
        except IntegrityError as e:
            raise serializers.ValidationError({
                'email': 'Cet email est déjà utilisé.'
            })


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        write_only=True
    )


# ==============================================
# SERIALIZERS DEMANDES D'INSCRIPTION
# ==============================================
class RegistrationRequestSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes d'inscription"""
    
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    
    role_display = serializers.CharField(
        source='get_role_display',
        read_only=True
    )
    
    class Meta:
        model = RegistrationRequest
        fields = [
            'id', 'email', 'company_name', 'address', 'phone', 'tax_id',
            'role', 'role_display', 'message', 'status', 'status_display',
            'created_at', 'updated_at', 'processed_at', 'user_id'
        ]
        read_only_fields = [
            'id', 'status', 'status_display', 'created_at', 
            'updated_at', 'processed_at', 'user_id'
        ]
    
    def create(self, validated_data):
        """Créer une demande d'inscription"""
        # Vérifier si une demande existe déjà pour cet email
        if RegistrationRequest.objects.filter(email=validated_data['email']).exists():
            raise serializers.ValidationError(
                'Une demande est déjà en cours pour cet email.'
            )
        
        # Vérifier si un utilisateur existe déjà
        if CustomUser.objects.filter(email=validated_data['email']).exists():
            raise serializers.ValidationError(
                'Un utilisateur avec cet email existe déjà.'
            )
        
        return super().create(validated_data)


class RegistrationRequestActionSerializer(serializers.Serializer):
    """Serializer pour approuver/rejeter une demande"""
    
    action = serializers.ChoiceField(
        choices=['APPROVE', 'REJECT', 'CANCEL'],
        required=True
    )
    
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text='Raison du rejet ou de l\'annulation'
    )


# ==============================================
# SERIALIZERS PRODUITS
# ==============================================
class ProductCategorySerializer(serializers.ModelSerializer):
    """Serializer pour les catégories de produits"""
    
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'description', 'parent', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer pour les produits"""
    
    manufacturer_name = serializers.CharField(
        source='manufacturer.company_name',
        read_only=True
    )
    
    status_display = serializers.CharField(
        source='get_current_status_display',
        read_only=True
    )
    
    qr_code_url = serializers.SerializerMethodField()

    image_url = serializers.SerializerMethodField()

    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'batch_number',
            'category', 'category_name', 'manufacturer', 'manufacturer_name',
            'production_date', 'expiration_date', 'weight', 'dimensions',
            'unit_price', 'currency', 'current_status', 'status_display',
            'current_location', 'qr_code', 'qr_code_url', 'blockchain_hash',
            'created_at', 'updated_at','image','image_url'
        ]
        read_only_fields = [
            'id', 'sku', 'manufacturer', 'qr_code', 'qr_code_url', 'blockchain_hash',
            'created_at', 'updated_at', 'manufacturer_name', 'status_display', 'category_name'
        ]
    def get_qr_code_url(self, obj):
        """Retourne l'URL complète du QR code"""
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
        return None
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None
    def validate_batch_number(self, value):
        """Valider le numéro de lot"""
        if not value:
            raise serializers.ValidationError("Le numéro de lot est obligatoire.")
        return value
    
    def create(self, validated_data):
        """Créer un produit"""
        # Le fabricant est ajouté automatiquement par la vue
        return super().create(validated_data)


class ProductDetailSerializer(ProductSerializer):
    """Serializer détaillé pour les produits avec étapes"""
    serializers.ImageField(required=False)
    steps = serializers.SerializerMethodField()
    
    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ['steps']
    
    def get_steps(self, obj):
        """Récupérer les étapes du produit"""
        steps = obj.steps.all().order_by('timestamp')
        return ProductStepSerializer(steps, many=True, context=self.context).data


# ==============================================
# SERIALIZERS ÉTAPES DE PRODUIT
# ==============================================
class ProductStepSerializer(serializers.ModelSerializer):
    """Serializer pour les étapes de produit"""
    
    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )
    
    actor_name = serializers.CharField(
        source='actor.company_name',
        read_only=True
    )
    
    actor_role = serializers.CharField(
        source='actor.role',
        read_only=True
    )
    
    step_type_display = serializers.CharField(
        source='get_step_type_display',
        read_only=True
    )
    
    photo_url = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductStep
        fields = [
            'id', 'product', 'product_name', 'step_type', 'step_type_display',
            'actor', 'actor_name', 'actor_role', 'location', 'gps_coordinates',
            'details', 'photo', 'photo_url', 'document', 'document_url',
            'blockchain_transaction_id', 'blockchain_hash',
            'timestamp', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'product_name', 'actor_name', 'actor_role', 
            'step_type_display', 'photo_url', 'document_url',
            'blockchain_transaction_id', 'blockchain_hash',
            'created_at', 'updated_at'
        ]
    
    def get_photo_url(self, obj):
        """Retourne l'URL complète de la photo"""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
        return None
    
    def get_document_url(self, obj):
        """Retourne l'URL complète du document"""
        if obj.document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document.url)
        return None
    
    def validate(self, data):
        """Validation globale de l'étape"""
        # Vérifier que l'acteur a le bon rôle pour cette étape
        step_type = data.get('step_type')
        actor = data.get('actor')
        
        if actor and step_type:
            # Définir les rôles autorisés pour chaque type d'étape
            allowed_roles = {
                'CREATION': ['FABRICANT', 'ADMIN'],
                'QUALITY_CHECK': ['FABRICANT', 'ADMIN'],
                'TRANSPORT_START': ['TRANSPORT', 'ADMIN'],
                'TRANSPORT_END': ['TRANSPORT', 'ADMIN'],
                'WAREHOUSE_ENTRY': ['ENTREPOT', 'ADMIN'],
                'WAREHOUSE_EXIT': ['ENTREPOT', 'ADMIN'],
                'STORE_ENTRY': ['MAGASIN', 'ADMIN'],
                'SALE': ['MAGASIN', 'ADMIN'],
            }
            
            allowed = allowed_roles.get(step_type, [])
            if actor.role not in allowed:
                raise serializers.ValidationError({
                    'actor': f"Le rôle {actor.get_role_display()} n'est pas autorisé pour cette étape."
                })
        
        return data


class ClientProductListSerializer(serializers.ModelSerializer):
    """Serializer simplifi\u00e9 pour la liste des produits (vue client)"""
    
    manufacturer_name = serializers.CharField(
        source='manufacturer.company_name',
        read_only=True
    )
    
    status_display = serializers.CharField(
        source='get_current_status_display',
        read_only=True
    )
    
    qr_code_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'manufacturer_name',
            'category_name', 'production_date', 'unit_price', 'currency',
            'current_status', 'status_display', 'qr_code_url', 'created_at','image_url'
        ]
        read_only_fields = [
            'id', 'name', 'description', 'manufacturer_name',
            'category_name', 'production_date', 'unit_price', 'currency',
            'current_status', 'status_display', 'qr_code_url', 'created_at','image_url'
        ]
    
    def get_category_name(self, obj):
        """Retourne le nom de la catégorie"""
        return obj.category.name if obj.category else None
    
    def get_qr_code_url(self, obj):
        """Retourne l'URL complète du QR code"""
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            # Fallback si pas de request dans le contexte
            return obj.qr_code.url if obj.qr_code else None
        return None
    def get_image_url(self, obj):
        """Retourne l'URL complète de l'image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url if obj.image else None
        return None


class AddProductStepSerializer(serializers.Serializer):
    """Serializer pour ajouter une étape à un produit"""
    
    step_type = serializers.ChoiceField(
        choices=ProductStep.STEP_TYPES,
        required=True
    )
    
    location = serializers.CharField(
        max_length=255,
        required=True
    )
    
    gps_coordinates = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    
    details = serializers.JSONField(
        required=False,
        default=dict
    )
    
    photo = serializers.ImageField(
        required=False,
        allow_null=True
    )
    
    document = serializers.FileField(
        required=False,
        allow_null=True
    )


# ==============================================
# SERIALIZERS BLOCKCHAIN
# ==============================================
class BlockchainRecordSerializer(serializers.ModelSerializer):
    """Serializer pour les enregistrements blockchain"""
    
    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )
    
    class Meta:
        model = BlockchainRecord
        fields = [
            'id', 'product', 'product_name', 'step',
            'transaction_hash', 'stellar_account', 'memo',
            'created_at', 'verified_at', 'is_verified'
        ]
        read_only_fields = ['id', 'created_at', 'verified_at', 'is_verified']


# ==============================================
# SERIALIZERS NOTIFICATIONS
# ==============================================
class NotificationSerializer(serializers.ModelSerializer):
    """Serializer pour les notifications"""
    
    notification_type_display = serializers.CharField(
        source='get_notification_type_display',
        read_only=True
    )
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'notification_type', 'notification_type_display',
            'title', 'message', 'target_model', 'target_id',
            'is_read', 'created_at', 'read_at'
        ]
        read_only_fields = [
            'id', 'notification_type_display', 'created_at', 'read_at'
        ]


# ==============================================
# SERIALIZERS STATISTIQUES
# ==============================================
class DashboardStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques du dashboard"""
    
    total_users = serializers.IntegerField()
    pending_requests = serializers.IntegerField()
    total_products = serializers.IntegerField()
    products_by_status = serializers.DictField()
    recent_activities = serializers.ListField()
    
    def to_representation(self, instance):
        """Formatte les données pour l'API"""
        return {
            'total_users': instance.get('total_users', 0),
            'pending_requests': instance.get('pending_requests', 0),
            'total_products': instance.get('total_products', 0),
            'products_by_status': instance.get('products_by_status', {}),
            'recent_activities': instance.get('recent_activities', [])
        }