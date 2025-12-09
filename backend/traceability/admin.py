# traceability/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import (
    CustomUser, RegistrationRequest, Product, ProductStep,
    ProductCategory, BlockchainRecord, Notification, AuditLog
)

# ==============================================
# ADMIN PERSONNALISÉ POUR LES UTILisateurs
# ==============================================
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Interface admin pour les utilisateurs personnalisés."""
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Informations entreprise'), {
            'fields': ('company_name', 'address', 'phone', 'tax_id')
        }),
        (_('Rôle et permissions'), {
            'fields': ('role', 'is_approved', 'is_active', 'is_staff', 'is_superuser')
        }),
        (_('Dates importantes'), {
            'fields': ('last_login', 'created_at', 'updated_at')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'company_name', 'role', 'password1', 'password2'),
        }),
    )
    
    list_display = (
        'email', 'company_name', 'role', 'is_approved', 
        'is_active', 'created_at', 'actions_column'
    )
    
    list_filter = ('role', 'is_approved', 'is_active', 'created_at')
    search_fields = ('email', 'company_name', 'phone')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    
    def actions_column(self, obj):
        """Colonne d'actions personnalisées."""
        approve_url = reverse('admin:traceability_customuser_approve', args=[obj.pk])
        
        if not obj.is_approved:
            return format_html(
                '<a class="button" href="{}">Approuver</a>',
                approve_url
            )
        return "✓ Approuvé"
    
    actions_column.short_description = 'Actions'
    actions_column.allow_tags = True
    
    def get_urls(self):
        """Ajoute des URLs personnalisées."""
        from django.urls import path
        
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/approve/',
                self.admin_site.admin_view(self.approve_user),
                name='traceability_customuser_approve',
            ),
        ]
        return custom_urls + urls
    
    def approve_user(self, request, object_id):
        """Approuve un utilisateur."""
        from django.shortcuts import redirect
        
        user = CustomUser.objects.get(pk=object_id)
        user.is_approved = True
        user.save()
        
        self.message_user(request, f"L'utilisateur {user.email} a été approuvé.")
        return redirect('admin:traceability_customuser_changelist')


# ==============================================
# ADMIN POUR LES DEMANDES D'INSCRIPTION
# ==============================================
@admin.register(RegistrationRequest)
class RegistrationRequestAdmin(admin.ModelAdmin):
    """Interface admin pour les demandes d'inscription."""
    
    list_display = (
        'company_name', 'email', 'role', 'status', 
        'created_at', 'processed_at', 'action_buttons'
    )
    
    list_filter = ('status', 'role', 'created_at')
    search_fields = ('email', 'company_name', 'phone')
    readonly_fields = ('created_at', 'updated_at', 'processed_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('email', 'company_name', 'address', 'phone', 'tax_id')
        }),
        (_('Rôle et statut'), {
            'fields': ('role', 'status', 'message')
        }),
        (_('Dates'), {
            'fields': ('created_at', 'updated_at', 'processed_at')
        }),
        (_('Utilisateur associé'), {
            'fields': ('user',)
        }),
    )
    
    def action_buttons(self, obj):
        """Boutons d'action pour approuver/rejeter."""
        if obj.status == 'PENDING':
            approve_url = reverse('admin:traceability_registrationrequest_approve', args=[obj.pk])
            reject_url = reverse('admin:traceability_registrationrequest_reject', args=[obj.pk])
            
            return format_html(
                '''
                <a class="button" href="{}" style="background-color: #4CAF50; color: white; padding: 5px 10px; margin-right: 5px;">Approuver</a>
                <a class="button" href="{}" style="background-color: #f44336; color: white; padding: 5px 10px;">Rejeter</a>
                ''',
                approve_url, reject_url
            )
        return obj.get_status_display()
    
    action_buttons.short_description = 'Actions'
    action_buttons.allow_tags = True
    
    def get_urls(self):
        """Ajoute des URLs personnalisées."""
        from django.urls import path
        
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/approve/',
                self.admin_site.admin_view(self.approve_request),
                name='traceability_registrationrequest_approve',
            ),
            path(
                '<path:object_id>/reject/',
                self.admin_site.admin_view(self.reject_request),
                name='traceability_registrationrequest_reject',
            ),
        ]
        return custom_urls + urls
    
    def approve_request(self, request, object_id):
        """Approuve une demande."""
        from django.shortcuts import redirect
        
        registration_request = RegistrationRequest.objects.get(pk=object_id)
        
        try:
            user = registration_request.approve()
            self.message_user(
                request, 
                f"La demande de {registration_request.company_name} a été approuvée. Utilisateur créé: {user.email}"
            )
        except Exception as e:
            self.message_user(request, f"Erreur: {str(e)}", level='error')
        
        return redirect('admin:traceability_registrationrequest_changelist')
    
    def reject_request(self, request, object_id):
        """Rejette une demande."""
        from django.shortcuts import redirect
        
        registration_request = RegistrationRequest.objects.get(pk=object_id)
        registration_request.status = 'REJECTED'
        registration_request.processed_at = timezone.now()
        registration_request.save()
        
        self.message_user(
            request, 
            f"La demande de {registration_request.company_name} a été rejetée."
        )
        
        return redirect('admin:traceability_registrationrequest_changelist')


# ==============================================
# ADMIN POUR LES PRODUITS
# ==============================================
class ProductStepInline(admin.TabularInline):
    """Inline pour afficher les étapes d'un produit."""
    model = ProductStep
    extra = 0
    readonly_fields = ('timestamp', 'blockchain_transaction_id', 'blockchain_verified')
    fields = ('step_type', 'actor', 'location', 'timestamp', 'blockchain_transaction_id')
    
    def blockchain_verified(self, obj):
        """Indique si l'étape est vérifiée sur la blockchain."""
        return bool(obj.blockchain_hash)
    
    blockchain_verified.boolean = True
    blockchain_verified.short_description = 'Blockchain'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Interface admin pour les produits."""
    
    list_display = (
        'name', 'sku', 'manufacturer', 'batch_number', 
        'current_status', 'created_at', 'qr_code_preview'
    )
    
    list_filter = ('current_status', 'category', 'manufacturer', 'production_date')
    search_fields = ('name', 'sku', 'batch_number', 'description')
    readonly_fields = (
        'id', 'sku', 'qr_code', 'blockchain_hash', 
        'created_at', 'updated_at', 'qr_code_image'
    )
    ordering = ('-created_at',)
    
    fieldsets = (
        (_('Informations de base'), {
            'fields': ('name', 'description', 'sku', 'batch_number', 'category')
        }),
        (_('Fabrication'), {
            'fields': ('manufacturer', 'production_date', 'expiration_date')
        }),
        (_('Spécifications'), {
            'fields': ('weight', 'dimensions', 'unit_price', 'currency')
        }),
        (_('Traçabilité'), {
            'fields': ('current_status', 'current_location', 'blockchain_hash')
        }),
        (_('QR Code'), {
            'fields': ('qr_code_image',)
        }),
        (_('Métadonnées'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
    
    inlines = [ProductStepInline]
    
    def qr_code_preview(self, obj):
        """Aperçu du QR code dans la liste."""
        if obj.qr_code:
            return format_html(
                '<img src="{}" width="50" height="50" />',
                obj.qr_code.url
            )
        return "—"
    
    qr_code_preview.short_description = 'QR Code'
    
    def qr_code_image(self, obj):
        """Image du QR code en grand."""
        if obj.qr_code:
            return format_html(
                '<img src="{}" width="200" height="200" /><br>'
                '<a href="{}" target="_blank">Scanner ce QR code</a>',
                obj.qr_code.url,
                reverse('public-product', args=[obj.id])
            )
        return "Non généré"
    
    qr_code_image.short_description = 'QR Code'
    
    def save_model(self, request, obj, form, change):
        """Génère le QR code à la sauvegarde."""
        if not obj.sku:
            from django.template.defaultfilters import slugify
            obj.sku = f"PROD-{slugify(obj.name)[:20].upper()}-{obj.batch_number}"
        
        super().save_model(request, obj, form, change)
        
        # Générer le QR code si nécessaire
        if not obj.qr_code:
            obj.generate_qr_code()
            obj.save()


# ==============================================
# ADMIN POUR LES ÉTAPES DE PRODUIT
# ==============================================
@admin.register(ProductStep)
class ProductStepAdmin(admin.ModelAdmin):
    """Interface admin pour les étapes de produit."""
    
    list_display = (
        'product', 'step_type', 'actor', 'location', 
        'timestamp', 'blockchain_verified'
    )
    
    list_filter = ('step_type', 'actor', 'timestamp')
    search_fields = ('product__name', 'actor__company_name', 'location')
    readonly_fields = ('blockchain_hash', 'blockchain_transaction_id', 'created_at', 'updated_at')
    ordering = ('-timestamp',)
    
    fieldsets = (
        (_('Étape'), {
            'fields': ('product', 'step_type')
        }),
        (_('Acteur'), {
            'fields': ('actor', 'location', 'gps_coordinates')
        }),
        (_('Détails'), {
            'fields': ('details', 'photo', 'document')
        }),
        (_('Blockchain'), {
            'fields': ('blockchain_transaction_id', 'blockchain_hash')
        }),
        (_('Dates'), {
            'fields': ('timestamp', 'created_at', 'updated_at')
        }),
    )
    
    def blockchain_verified(self, obj):
        """Indique si l'étape est vérifiée sur la blockchain."""
        return bool(obj.blockchain_hash)
    
    blockchain_verified.boolean = True
    blockchain_verified.short_description = 'Blockchain'


# ==============================================
# ADMIN POUR LES CATÉGORIES
# ==============================================
@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    """Interface admin pour les catégories de produits."""
    
    list_display = ('name', 'parent', 'product_count', 'created_at')
    list_filter = ('parent',)
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    def product_count(self, obj):
        """Compte les produits dans cette catégorie."""
        return obj.products.count()
    
    product_count.short_description = 'Nombre de produits'


# ==============================================
# ADMIN POUR LES ENREGISTREMENTS BLOCKCHAIN
# ==============================================
@admin.register(BlockchainRecord)
class BlockchainRecordAdmin(admin.ModelAdmin):
    """Interface admin pour les enregistrements blockchain."""
    
    list_display = (
        'transaction_short', 'product', 'stellar_account', 
        'is_verified', 'created_at'
    )
    
    list_filter = ('is_verified', 'created_at')
    search_fields = ('transaction_hash', 'stellar_account', 'product__name')
    readonly_fields = ('transaction_hash', 'stellar_account', 'memo', 'created_at', 'verified_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        (_('Transaction'), {
            'fields': ('transaction_hash', 'stellar_account', 'memo')
        }),
        (_('Associations'), {
            'fields': ('product', 'step')
        }),
        (_('Vérification'), {
            'fields': ('is_verified', 'verified_at')
        }),
        (_('Dates'), {
            'fields': ('created_at',)
        }),
    )
    
    def transaction_short(self, obj):
        """Affiche un hash de transaction raccourci."""
        if obj.transaction_hash:
            return f"{obj.transaction_hash[:16]}..."
        return "—"
    
    transaction_short.short_description = 'Transaction'


# ==============================================
# ADMIN POUR LES NOTIFICATIONS
# ==============================================
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Interface admin pour les notifications."""
    
    list_display = ('recipient', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__email', 'title', 'message')
    readonly_fields = ('created_at', 'read_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('recipient', 'notification_type', 'title', 'message')
        }),
        (_('Cible'), {
            'fields': ('target_model', 'target_id')
        }),
        (_('Statut'), {
            'fields': ('is_read', 'read_at')
        }),
        (_('Dates'), {
            'fields': ('created_at',)
        }),
    )
    
    actions = ['mark_as_read']
    
    def mark_as_read(self, request, queryset):
        """Marque les notifications sélectionnées comme lues."""
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f"{updated} notifications marquées comme lues.")
    
    mark_as_read.short_description = "Marquer comme lu"


# ==============================================
# ADMIN POUR LE JOURNAL D'AUDIT
# ==============================================
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Interface admin pour le journal d'audit."""
    
    list_display = ('action_type', 'user', 'model_name', 'object_id', 'timestamp', 'ip_short')
    list_filter = ('action_type', 'model_name', 'timestamp')
    search_fields = ('user__email', 'model_name', 'object_id', 'ip_address')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
    
    fieldsets = (
        (_('Action'), {
            'fields': ('action_type', 'user')
        }),
        (_('Cible'), {
            'fields': ('model_name', 'object_id')
        }),
        (_('Détails'), {
            'fields': ('details', 'ip_address', 'user_agent')
        }),
        (_('Dates'), {
            'fields': ('timestamp',)
        }),
    )
    
    def ip_short(self, obj):
        """Affiche une adresse IP raccourcie."""
        if obj.ip_address:
            return obj.ip_address[:15] + '...' if len(obj.ip_address) > 15 else obj.ip_address
        return "—"
    
    ip_short.short_description = 'IP'


# ==============================================
# CONFIGURATION DU SITE ADMIN
# ==============================================
admin.site.site_header = "Administration Traçabilité Blockchain"
admin.site.site_title = "Système de Traçabilité"
admin.site.index_title = "Tableau de bord"

# Réorganiser l'ordre des apps dans l'admin
from django.apps import apps

def get_app_list(self, request):
    """
    Retourne la liste des apps dans l'ordre souhaité.
    """
    app_dict = self._build_app_dict(request)
    
    # Définir l'ordre des apps
    app_order = [
        'traceability',
        'auth',
    ]
    
    # Définir l'ordre des modèles dans chaque app
    model_order = {
        'traceability': [
            'CustomUser',
            'RegistrationRequest',
            'Product',
            'ProductStep',
            'ProductCategory',
            'BlockchainRecord',
            'Notification',
            'AuditLog',
        ],
        'auth': [
            'Group',
        ],
    }
    
    # Construire la liste finale
    app_list = []
    
    for app_label in app_order:
        if app_label in app_dict:
            app = app_dict[app_label]
            
            # Trier les modèles selon l'ordre défini
            if app_label in model_order:
                models = []
                for model_name in model_order[app_label]:
                    for model in app['models']:
                        if model['object_name'] == model_name:
                            models.append(model)
                            break
                app['models'] = models
            
            app_list.append(app)
    
    return app_list

# Appliquer la personnalisation
admin.AdminSite.get_app_list = get_app_list