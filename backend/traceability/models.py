# traceability/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import qrcode
from io import BytesIO
from django.core.files import File
from django.conf import settings
from django.utils import timezone


# ==============================================
# MANAGER PERSONNALISÉ POUR LES UTILISATEURS
# ==============================================
class CustomUserManager(BaseUserManager):
    """
    Manager personnalisé pour gérer la création des utilisateurs
    sans utiliser le champ username.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Crée et sauvegarde un utilisateur avec l'email et le mot de passe.
        """
        if not email:
            raise ValueError('L\'adresse email est obligatoire')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crée et sauvegarde un superutilisateur.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_approved', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        return self.create_user(email, password, **extra_fields)


# ==============================================
# MODÈLE UTILISATEUR PERSONNALISÉ
# ==============================================
class CustomUser(AbstractUser):
    """
    Modèle d'utilisateur personnalisé qui utilise l'email comme identifiant
    au lieu du username.
    """
    
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('FABRICANT', 'Fabricant'),
        ('TRANSPORT', 'Société de Transport'),
        ('ENTREPOT', 'Entrepôt'),
        ('MAGASIN', 'Magasin'),
        ('CLIENT', 'Client'),
    ]
    #to do : client read only 
    # Supprimer le champ username
    username = None
    
    # Champs obligatoires
    email = models.EmailField(
        unique=True, 
        verbose_name='Adresse Email',
        help_text='Entrez une adresse email valide'
    )
    
    company_name = models.CharField(
        max_length=255,
        verbose_name='Nom de l\'entreprise',
        help_text='Nom officiel de votre entreprise'
    )
    
    # Informations supplémentaires
    address = models.TextField(
        verbose_name='Adresse complète',
        blank=True,
        null=True,
        help_text='Adresse postale de l\'entreprise'
    )
    
    phone = models.CharField(
        max_length=20,
        verbose_name='Téléphone',
        blank=True,
        null=True,
        help_text='Numéro de téléphone de contact'
    )
    
    tax_id = models.CharField(
        max_length=50,
        verbose_name='Numéro fiscal',
        blank=True,
        null=True,
        help_text='Numéro d\'identification fiscale'
    )
    
    # Rôle dans le système
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='CLIENT',
        verbose_name='Rôle',
        help_text='Rôle de l\'utilisateur dans la chaîne d\'approvisionnement'
    )
    
    # Statut d'approbation
    is_approved = models.BooleanField(
        default=False,
        verbose_name='Compte approuvé',
        help_text='Indique si le compte a été approuvé par l\'administrateur'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière mise à jour')
    
    # Configuration Django
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['company_name']
    
    objects = CustomUserManager()
    
    def __str__(self):
        return f"{self.company_name} ({self.email})"
    
    #to do  
    def get_full_name(self):
        """Retourne le nom complet (nom de l'entreprise)."""
        return self.company_name
    
    def get_short_name(self):
        """Retourne le nom court."""
        return self.company_name
    
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['company_name']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_approved']),
        ]


# ==============================================
# MODÈLE DEMANDE D'INSCRIPTION
# ==============================================
class RegistrationRequest(models.Model):
    """
    Modèle pour les demandes d'inscription en attente d'approbation.
    """
    
    STATUS_CHOICES = [
        ('PENDING', '⏳ En attente'),
        ('APPROVED', '✅ Approuvé'),
        ('REJECTED', '❌ Rejeté'),
        ('CANCELLED', '🚫 Annulé'),
    ]
    
    # Informations de l'entreprise
    email = models.EmailField(
        unique=True,
        verbose_name='Email de contact',
        help_text='Email utilisé pour la connexion'
    )
    
    company_name = models.CharField(
        max_length=255,
        verbose_name='Nom de l\'entreprise'
    )
    
    address = models.TextField(
        verbose_name='Adresse',
        help_text='Adresse complète de l\'entreprise'
    )
    
    phone = models.CharField(
        max_length=20,
        verbose_name='Téléphone'
    )
    
    tax_id = models.CharField(
        max_length=50,
        verbose_name='Numéro fiscal',
        blank=True,
        null=True
    )
    
    # Rôle demandé
    role = models.CharField(
        max_length=20,
        choices=CustomUser.ROLE_CHOICES,
        verbose_name='Rôle demandé'
    )
    
    # Message optionnel
    message = models.TextField(
        verbose_name='Message',
        blank=True,
        null=True,
        help_text='Message supplémentaire pour l\'administrateur'
    )
    
    # Statut de la demande
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        verbose_name='Statut'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de demande')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière mise à jour')
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de traitement'
    )
    
    # Référence à l'utilisateur créé (si approuvé)
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registration_request'
    )
    
    def __str__(self):
        return f"{self.company_name} - {self.get_role_display()} ({self.get_status_display()})"
    
    def approve(self):
        """Approuve la demande et crée ou met à jour l'utilisateur correspondant."""
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Vérifier si l'utilisateur existe déjà
        try:
            user = User.objects.get(email=self.email)
            # Mettre à jour l'utilisateur existant
            user.is_approved = True
            user.company_name = self.company_name
            user.address = self.address
            user.phone = self.phone
            user.tax_id = self.tax_id
            user.role = self.role
            user.save()
        except User.DoesNotExist:
            # Créer un nouvel utilisateur
            user = User.objects.create_user(
                email=self.email,
                password='temp_password',  # Le mot de passe sera réinitialisé
                company_name=self.company_name,
                address=self.address,
                phone=self.phone,
                tax_id=self.tax_id,
                role=self.role,
                is_approved=True
            )
        
        # Mettre à jour la demande
        self.status = 'APPROVED'
        self.processed_at = timezone.now()
        self.user = user
        self.save()
        
        return user
    
    def reject(self, reason=None):
        """Rejette la demande."""
        self.status = 'REJECTED'
        self.processed_at = timezone.now()
        if reason:
            self.message = f"{self.message}\n\nRaison du rejet: {reason}"
        self.save()
    
    class Meta:
        verbose_name = 'Demande d\'inscription'
        verbose_name_plural = 'Demandes d\'inscription'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['role']),
            models.Index(fields=['created_at']),
        ]


# ==============================================
# MODÈLE CATÉGORIE DE PRODUIT
# ==============================================
class ProductCategory(models.Model):
    """
    Catégorie pour organiser les produits.
    """
    
    name = models.CharField(
        max_length=100,
        verbose_name='Nom de la catégorie',
        unique=True
    )
    
    description = models.TextField(
        verbose_name='Description',
        blank=True,
        null=True
    )
    
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories',
        verbose_name='Catégorie parente'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    class Meta:
        verbose_name = 'Catégorie de produit'
        verbose_name_plural = 'Catégories de produits'
        ordering = ['name']


# ==============================================
# MODÈLE PRODUIT
# ==============================================
class Product(models.Model):
    """
    Modèle principal pour les produits à tracer.
    """
    
    STATUS_CHOICES = [
        ('CREATED', '🏭 Créé'),
        ('QUALITY_CHECK', '🔍 Contrôle qualité'),
        ('IN_TRANSIT', '🚚 En transit'),
        ('IN_WAREHOUSE', '📦 En entrepôt'),
        ('IN_STORE', '🏪 En magasin'),
        ('SOLD', '💰 Vendu'),
        ('RETURNED', '↩️ Retourné'),
        ('DESTROYED', '🗑️ Détruit'),
    ]
    
    # Identifiant unique
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name='ID Unique'
    )
    
    # Informations de base
    name = models.CharField(
        max_length=255,
        verbose_name='Nom du produit',
        help_text='Nom commercial du produit'
    )
    
    description = models.TextField(
        verbose_name='Description',
        help_text='Description détaillée du produit'
    )
    
    # Catégorisation
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name='Catégorie'
    )
    #P-SH-GRN-L-2025 (EXEMPLE : this segnified that the product is a man tesheart green Large made on 2025)
    sku = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='SKU',
        help_text='Stock Keeping Unit - Référence unique du produit'
    )
    
    batch_number = models.CharField(
        max_length=50,
        verbose_name='Numéro de lot',
        help_text='Numéro de lot de production'
    )
    
    # Fabrication
    manufacturer = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        limit_choices_to={'role': 'FABRICANT', 'is_approved': True},
        related_name='manufactured_products',
        verbose_name='Fabricant'
    )
    
    production_date = models.DateField(
        verbose_name='Date de production',
        help_text='Date de fabrication du produit'
    )
    
    expiration_date = models.DateField(
        verbose_name='Date d\'expiration',
        null=True,
        blank=True,
        help_text='Date de péremption si applicable'
    )
    
    # Spécifications
    weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Poids (kg)',
        null=True,
        blank=True
    )
    
    dimensions = models.CharField(
        max_length=100,
        verbose_name='Dimensions',
        blank=True,
        null=True,
        help_text='Format: Longueur x Largeur x Hauteur (cm)'
    )
    
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Prix unitaire',
        default=0.00
    )
    
    currency = models.CharField(
        max_length=3,
        default='DZ',
        verbose_name='Devise',
        choices=[('DZ', 'DZ'), ('EUR', 'EUR'), ('USD', 'USD')]
    )
    
    # Statut et traçabilité
    current_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CREATED',
        verbose_name='Statut actuel'
    )
    
    current_location = models.CharField(
        max_length=255,
        verbose_name='Localisation actuelle',
        blank=True,
        null=True
    )
    
    # QR Code et blockchain
    qr_code = models.ImageField(
        upload_to='qrcodes/',
        verbose_name='QR Code',
        blank=True,
        null=True
    )
    
    blockchain_hash = models.CharField(
        max_length=255,
        verbose_name='Hash Blockchain',
        blank=True,
        null=True,
        help_text='Dernier hash enregistré sur la blockchain'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière mise à jour')
    
    def __str__(self):
        return f"{self.name} - Lot: {self.batch_number} - {self.get_current_status_display()}"
    
    def generate_qr_code(self):
        """Génère un QR code pour le produit."""
        if self.qr_code:
            return
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # URL pour scanner le QR code
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        qr_data = f"{base_url}/product/{self.id}/verify"
        
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        
        file_name = f'qr_code_{self.id}.png'
        self.qr_code.save(file_name, File(buffer), save=False)
        buffer.close()
    
    def save(self, *args, **kwargs):
        """Surcharge de la méthode save pour générer le SKU et QR code."""
        is_new = self.pk is None
        
        if not self.sku:
            # Générer un SKU automatique si non fourni
            from django.template.defaultfilters import slugify
            self.sku = f"PROD-{slugify(self.name)[:20].upper()}-{self.batch_number}"
        
        # Save first to get the ID
        super().save(*args, **kwargs)
        
        # Generate QR code after save (when ID exists)
        if is_new and not self.qr_code:
            self.generate_qr_code()
            # Save again with QR code
            super().save(update_fields=['qr_code'])
    
    def get_absolute_url(self):
        """Retourne l'URL absolue du produit."""
        from django.urls import reverse
        return reverse('product-detail', kwargs={'pk': self.pk})
    
    def get_supply_chain_history(self):
        """Retourne l'historique complet de la chaîne d'approvisionnement."""
        return self.steps.all().order_by('timestamp')
    
    class Meta:
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['batch_number']),
            models.Index(fields=['current_status']),
            models.Index(fields=['manufacturer']),
            models.Index(fields=['production_date']),
        ]


# ==============================================
# MODÈLE ÉTAPE DU PRODUIT
# ==============================================
class ProductStep(models.Model):
    """
    Modèle pour enregistrer chaque étape du parcours du produit.
    """
    
    STEP_TYPES = [
        ('CREATION', '🏭 Création'),
        ('QUALITY_CHECK', '🔍 Contrôle qualité'),
        ('PACKAGING', '📦 Emballage'),
        ('TRANSPORT_START', '🚚 Début transport'),
        ('TRANSPORT_END', '✅ Fin transport'),
        ('WAREHOUSE_ENTRY', '📥 Entrée entrepôt'),
        ('WAREHOUSE_EXIT', '📤 Sortie entrepôt'),
        ('STORE_ENTRY', '🏪 Entrée magasin'),
        ('STORE_SHELF', '📋 Mise en rayon'),
        ('SALE', '💰 Vente'),
        ('RETURN', '↩️ Retour'),
        ('DESTRUCTION', '🗑️ Destruction'),
        ('OTHER', '📝 Autre'),
    ]
    
    # Référence au produit
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='steps',
        verbose_name='Produit'
    )
    
    # Type d'étape
    step_type = models.CharField(
        max_length=20,
        choices=STEP_TYPES,
        verbose_name='Type d\'étape'
    )
    
    # Acteur responsable
    actor = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name='performed_steps',
        verbose_name='Acteur responsable'
    )
    
    # Localisation
    location = models.CharField(
        max_length=255,
        verbose_name='Localisation',
        help_text='Lieu où l\'étape a été effectuée'
    )
    
    gps_coordinates = models.CharField(
        max_length=100,
        verbose_name='Coordonnées GPS',
        blank=True,
        null=True,
        help_text='Format: Latitude,Longitude'
    )
    
    # Détails de l'étape
    details = models.JSONField(
        default=dict,
        verbose_name='Détails',
        help_text='Informations supplémentaires au format JSON'
    )
    
    # Photos/Preuves
    photo = models.ImageField(
        upload_to='step_photos/',
        verbose_name='Photo',
        blank=True,
        null=True,
        help_text='Photo de preuve de l\'étape'
    )
    
    document = models.FileField(
        upload_to='step_documents/',
        verbose_name='Document',
        blank=True,
        null=True,
        help_text='Document associé (bon de livraison, etc.)'
    )
    
    # Blockchain
    blockchain_transaction_id = models.CharField(
        max_length=255,
        verbose_name='ID Transaction Blockchain',
        blank=True,
        null=True
    )
    
    blockchain_hash = models.CharField(
        max_length=255,
        verbose_name='Hash Blockchain',
        blank=True,
        null=True
    )
    
    # Métadonnées
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name='Date et heure'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.product.name} - {self.get_step_type_display()} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        """Surcharge pour mettre à jour le produit et enregistrer sur blockchain."""
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        if is_new:
            # Mettre à jour le statut du produit
            self._update_product_status()
            
            # Enregistrer sur blockchain (simulé pour l'instant)
            self._record_on_blockchain()
    
    def _update_product_status(self):
        """Met à jour le statut du produit en fonction de l'étape."""
        status_mapping = {
            'CREATION': 'CREATED',
            'QUALITY_CHECK': 'QUALITY_CHECK',
            'TRANSPORT_START': 'IN_TRANSIT',
            'TRANSPORT_END': 'IN_WAREHOUSE',
            'WAREHOUSE_ENTRY': 'IN_WAREHOUSE',
            'WAREHOUSE_EXIT': 'IN_TRANSIT',
            'STORE_ENTRY': 'IN_STORE',
            'SALE': 'SOLD',
            'RETURN': 'RETURNED',
            'DESTRUCTION': 'DESTROYED',
        }
        
        new_status = status_mapping.get(self.step_type)
        if new_status:
            self.product.current_status = new_status
            self.product.current_location = self.location
            self.product.save()
    
    def _record_on_blockchain(self):
        """Enregistre l'étape sur la blockchain (simulé)."""
        # Cette méthode sera implémentée avec Stellar plus tard
        import hashlib
        import json
        
        data_to_hash = {
            'product_id': str(self.product.id),
            'step_type': self.step_type,
            'actor_id': str(self.actor.id),
            'timestamp': self.timestamp.isoformat(),
            'location': self.location,
        }
        
        data_string = json.dumps(data_to_hash, sort_keys=True)
        self.blockchain_hash = hashlib.sha256(data_string.encode()).hexdigest()[:64]
        
        # Simuler un ID de transaction
        self.blockchain_transaction_id = f"STELLAR_TX_{hashlib.md5(data_string.encode()).hexdigest()[:32]}"
        
        # Sauvegarder sans déclencher save() à nouveau
        ProductStep.objects.filter(pk=self.pk).update(
            blockchain_hash=self.blockchain_hash,
            blockchain_transaction_id=self.blockchain_transaction_id
        )
    
    class Meta:
        verbose_name = 'Étape du produit'
        verbose_name_plural = 'Étapes des produits'
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['product', 'timestamp']),
            models.Index(fields=['step_type']),
            models.Index(fields=['actor']),
            models.Index(fields=['timestamp']),
        ]


# ==============================================
# MODÈLE ENREGISTREMENT BLOCKCHAIN
# ==============================================
class BlockchainRecord(models.Model):
    """
    Modèle pour suivre les enregistrements sur la blockchain Stellar.
    """
    
    # Références
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='blockchain_records',
        verbose_name='Produit'
    )
    
    step = models.ForeignKey(
        ProductStep,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='blockchain_records',
        verbose_name='Étape associée'
    )
    
    # Informations blockchain
    transaction_hash = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Hash de transaction',
        help_text='Hash unique de la transaction Stellar'
    )
    
    stellar_account = models.CharField(
        max_length=56,
        verbose_name='Compte Stellar',
        help_text='Compte Stellar qui a signé la transaction'
    )
    
    memo = models.TextField(
        verbose_name='Mémo',
        help_text='Données stockées dans le mémo de la transaction'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date d\'enregistrement'
    )
    
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de vérification'
    )
    
    is_verified = models.BooleanField(
        default=False,
        verbose_name='Vérifié'
    )
    
    def __str__(self):
        return f"Transaction: {self.transaction_hash[:20]}... pour {self.product.name}"
    
    def verify_on_blockchain(self):
        """
        Vérifie la transaction sur la blockchain Stellar.
        À implémenter avec le SDK Stellar.
        """
        # TODO: Implémenter la vérification avec Stellar SDK
        self.is_verified = True
        self.verified_at = timezone.now()
        self.save()
        
        return True
    
    class Meta:
        verbose_name = 'Enregistrement Blockchain'
        verbose_name_plural = 'Enregistrements Blockchain'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction_hash']),
            models.Index(fields=['product', 'created_at']),
            models.Index(fields=['is_verified']),
        ]


# ==============================================
# MODÈLE CONTRAT INTELLIGENT (SMART CONTRACT)
# ==============================================
class SmartContract(models.Model):
    """
    Modèle pour représenter les contrats intelligents déployés sur la blockchain.
    """
    
    STATUS_CHOICES = [
        ('DRAFT', '📝 Brouillon'),
        ('DEPLOYED', '🚀 Déployé'),
        ('ACTIVE', '✅ Actif'),
        ('PAUSED', '⏸️ En pause'),
        ('TERMINATED', '🔚 Terminé'),
    ]
    
    # Informations de base
    name = models.CharField(
        max_length=255,
        verbose_name='Nom du contrat'
    )
    
    description = models.TextField(
        verbose_name='Description',
        blank=True,
        null=True
    )
    
    # Adresse blockchain
    contract_address = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Adresse du contrat',
        help_text='Adresse du contrat sur la blockchain'
    )
    
    # Référence au produit
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='smart_contracts',
        verbose_name='Produit associé',
        null=True,
        blank=True
    )
    
    # Code source et ABI
    source_code = models.TextField(
        verbose_name='Code source',
        help_text='Code source du contrat intelligent'
    )
    
    abi = models.JSONField(
        verbose_name='ABI',
        help_text='Application Binary Interface du contrat'
    )
    
    # Statut
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        verbose_name='Statut'
    )
    
    # Métadonnées
    deployed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de déploiement'
    )
    
    deployed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deployed_contracts',
        verbose_name='Déployé par'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.contract_address[:20]}..."
    
    class Meta:
        verbose_name = 'Contrat Intelligent'
        verbose_name_plural = 'Contrats Intelligents'
        ordering = ['-deployed_at']


# ==============================================
# MODÈLE AUDIT/TRAÇABILITÉ
# ==============================================
class AuditLog(models.Model):
    """
    Modèle pour enregistrer les actions des utilisateurs (log d'audit).
    """
    
    ACTION_TYPES = [
        ('CREATE', 'Création'),
        ('UPDATE', 'Mise à jour'),
        ('DELETE', 'Suppression'),
        ('VIEW', 'Consultation'),
        ('LOGIN', 'Connexion'),
        ('LOGOUT', 'Déconnexion'),
        ('APPROVE', 'Approbation'),
        ('REJECT', 'Rejet'),
        ('SCAN', 'Scan QR Code'),
    ]
    
    # Utilisateur qui a effectué l'action
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Utilisateur'
    )
    
    # Action effectuée
    action_type = models.CharField(
        max_length=20,
        choices=ACTION_TYPES,
        verbose_name='Type d\'action'
    )
    
    # Objet concerné
    model_name = models.CharField(
        max_length=100,
        verbose_name='Modèle',
        help_text='Nom du modèle Django concerné'
    )
    
    object_id = models.CharField(
        max_length=255,
        verbose_name='ID de l\'objet',
        help_text='ID de l\'objet concerné'
    )
    
    # Détails
    details = models.JSONField(
        default=dict,
        verbose_name='Détails',
        help_text='Informations supplémentaires sur l\'action'
    )
    
    # Adresse IP et user agent
    ip_address = models.GenericIPAddressField(
        verbose_name='Adresse IP',
        null=True,
        blank=True
    )
    
    user_agent = models.TextField(
        verbose_name='User Agent',
        blank=True,
        null=True
    )
    
    # Métadonnées
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date et heure'
    )
    
    def __str__(self):
        return f"{self.user} - {self.get_action_type_display()} - {self.model_name} - {self.timestamp}"
    
    class Meta:
        verbose_name = 'Journal d\'audit'
        verbose_name_plural = 'Journaux d\'audit'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action_type']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['timestamp']),
        ]


# ==============================================
# MODÈLE NOTIFICATION
# ==============================================
class Notification(models.Model):
    """
    Modèle pour les notifications aux utilisateurs.
    """
    
    TYPE_CHOICES = [
        ('INFO', 'ℹ️ Information'),
        ('SUCCESS', '✅ Succès'),
        ('WARNING', '⚠️ Avertissement'),
        ('ERROR', '❌ Erreur'),
        ('APPROVAL', '👤 Demande d\'approbation'),
        ('PRODUCT_UPDATE', '📦 Mise à jour produit'),
    ]
    
    # Destinataire
    recipient = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinataire'
    )
    
    # Type et contenu
    notification_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='INFO',
        verbose_name='Type de notification'
    )
    
    title = models.CharField(
        max_length=255,
        verbose_name='Titre'
    )
    
    message = models.TextField(
        verbose_name='Message'
    )
    
    # Lien vers l'objet concerné
    target_model = models.CharField(
        max_length=100,
        verbose_name='Modèle cible',
        blank=True,
        null=True
    )
    
    target_id = models.CharField(
        max_length=255,
        verbose_name='ID cible',
        blank=True,
        null=True
    )
    
    # Statut de lecture
    is_read = models.BooleanField(
        default=False,
        verbose_name='Lu'
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.recipient.email} - {self.title}"
    
    def mark_as_read(self):
        """Marque la notification comme lue."""
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
    
    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]


# ==============================================
# SIGNAL POUR CRÉER LE JOURNAL D'AUDIT
# ==============================================
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import json

@receiver(post_save, sender=Product)
def log_product_save(sender, instance, created, **kwargs):
    """Enregistre les sauvegardes de produits dans le journal d'audit."""
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Trouver l'utilisateur actuel (à partir du request)
    # Pour l'instant, on utilise un utilisateur par défaut
    try:
        user = User.objects.filter(is_superuser=True).first()
    except:
        user = None
    
    action_type = 'CREATE' if created else 'UPDATE'
    
    AuditLog.objects.create(
        user=user,
        action_type=action_type,
        model_name=sender.__name__,
        object_id=str(instance.id),
        details={
            'product_name': instance.name,
            'status': instance.current_status,
            'manufacturer': str(instance.manufacturer),
            'changes': 'Créé' if created else 'Mis à jour'
        }
    )


@receiver(post_save, sender=ProductStep)
def log_product_step_save(sender, instance, created, **kwargs):
    """Enregistre les étapes de produit dans le journal d'audit."""
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        user = instance.actor
    except:
        user = User.objects.filter(is_superuser=True).first()
    
    if created:
        AuditLog.objects.create(
            user=user,
            action_type='CREATE',
            model_name=sender.__name__,
            object_id=str(instance.id),
            details={
                'product': instance.product.name,
                'step_type': instance.step_type,
                'location': instance.location,
                'actor': str(instance.actor)
            }
        )