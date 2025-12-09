# traceability/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Authentication
    RegisterView, ClientRegisterView, CustomTokenObtainPairView, LogoutView,
    
    # Viewsets
    UserViewSet, RegistrationRequestViewSet, ProductViewSet,
    ProductStepViewSet, ProductCategoryViewSet, BlockchainRecordViewSet,
    NotificationViewSet,
    
    # Public views
    PublicProductView, ClientProductListView,
    
    # Admin views
    AdminDashboardView,
    
    # Utility views
    HealthCheckView, api_root,
)

# ==============================================
# ROUTER PRINCIPAL
# ==============================================
router = DefaultRouter()

# Users
router.register(r'users', UserViewSet, basename='user')

# Registration requests
router.register(r'registration-requests', RegistrationRequestViewSet, basename='registrationrequest')

# Products
router.register(r'products', ProductViewSet, basename='product')

# Product steps
router.register(r'product-steps', ProductStepViewSet, basename='productstep')

# Product categories
router.register(r'product-categories', ProductCategoryViewSet, basename='productcategory')

# Blockchain records
router.register(r'blockchain-records', BlockchainRecordViewSet, basename='blockchainrecord')

# Notifications
router.register(r'notifications', NotificationViewSet, basename='notification')

# ==============================================
# URL PATTERNS
# ==============================================
urlpatterns = [
    # Root endpoint
    path('', api_root, name='api-root'),
    
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/client/register/', ClientRegisterView.as_view(), name='client-register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Public endpoints (no authentication required)
    path('public/product/<uuid:product_id>/', PublicProductView.as_view(), name='public-product'),
    path('public/qrcode/<uuid:product_id>/', PublicProductView.as_view(), name='qrcode-scan'),
    
    # Client endpoints (requires authentication as CLIENT)
    path('client/products/', ClientProductListView.as_view(), name='client-products'),
    
    # Admin endpoints
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    
    # Health check
    path('health/', HealthCheckView.as_view(), name='health-check'),
    
    # Include all router URLs
    path('', include(router.urls)),
]