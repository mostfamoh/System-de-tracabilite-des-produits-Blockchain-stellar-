# Product Traceability System - Backend

A comprehensive blockchain-based product traceability system built with Django REST Framework and Stellar blockchain integration. This system enables tracking products through their entire supply chain lifecycle, from manufacturing to end customers.

## 🌟 Features

- **User Management & Authentication**
  - JWT-based authentication
  - Role-based access control (Admin, Manufacturer, Transport, Warehouse, Store, Client)
  - Registration approval workflow
  - User profile management

- **Product Tracking**
  - QR code generation for products
  - Multi-step product journey tracking
  - Photo and document uploads for each step
  - Real-time status updates

- **Blockchain Integration**
  - Stellar blockchain for immutable record keeping
  - Transaction verification
  - Transparent audit trail

- **Notifications System**
  - Real-time notifications for important events
  - Approval requests
  - Product status updates

- **Admin Dashboard**
  - Statistics and analytics
  - User approval management
  - System-wide monitoring

- **Public Product Verification**
  - QR code scanning for product authenticity
  - Complete product journey visualization
  - No authentication required for viewing

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)
- Stellar account (for blockchain features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- Generate a new `SECRET_KEY`
- Configure Stellar credentials
- Set up email settings (optional)

### 5. Database Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## 📁 Project Structure

```
backend/
├── core/                      # Django project settings
│   ├── settings.py           # Main settings
│   ├── urls.py               # Root URL configuration
│   └── wsgi.py               # WSGI configuration
├── traceability/             # Main application
│   ├── models.py             # Database models
│   ├── serializers.py        # DRF serializers
│   ├── views.py              # API views
│   ├── urls.py               # URL routing
│   ├── permissions.py        # Custom permissions
│   ├── signals.py            # Django signals
│   ├── admin.py              # Admin configuration
│   └── stellar_service/      # Blockchain integration
│       └── stellar_service.py
├── media/                     # Uploaded files
│   ├── qrcodes/              # Generated QR codes
│   ├── step_photos/          # Product step photos
│   └── step_documents/       # Product documents
├── db.sqlite3                # SQLite database
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
└── .env.example              # Environment variables template
```

## 🔑 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | System administrator | Full system access, user approval, analytics |
| **FABRICANT** | Manufacturer | Create products, add initial steps |
| **TRANSPORT** | Transport company | Add transport steps |
| **ENTREPOT** | Warehouse | Add storage/warehouse steps |
| **MAGASIN** | Store/Retailer | Add retail steps, mark as sold |
| **CLIENT** | End customer | View products, track orders |

## 🛠️ API Endpoints Overview

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product
- `GET /api/products/{id}/journey/` - Get product journey
- `POST /api/products/{id}/add_step/` - Add tracking step

### Public
- `GET /api/public/product/{id}/` - Public product details (no auth)

### Admin
- `GET /api/admin/dashboard/` - Admin statistics
- `GET /api/registration-requests/` - Pending registrations
- `POST /api/registration-requests/{id}/approve/` - Approve user
- `POST /api/registration-requests/{id}/reject/` - Reject user

### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/{id}/mark_as_read/` - Mark as read
- `POST /api/notifications/mark_all_as_read/` - Mark all as read

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control (RBAC)
- Password validation and hashing
- CORS configuration
- Admin approval for new users
- Audit logging for critical operations

## 🧪 Testing

Run tests with pytest:

```bash
pytest
```

Run tests with coverage:

```bash
pytest --cov=traceability
```

## 📝 Common Tasks

### Create Superuser
```bash
python manage.py createsuperuser
```

### Reset Database
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Generate Stellar Keys
```python
from stellar_sdk import Keypair

keypair = Keypair.random()
print(f"Public Key: {keypair.public_key}")
print(f"Secret Key: {keypair.secret}")
```

### Collect Static Files (Production)
```bash
python manage.py collectstatic
```

## 🔧 Configuration

### Stellar Blockchain

1. Create a Stellar account at https://laboratory.stellar.org/
2. For testnet, use the friendbot to fund your account
3. Add your keys to `.env`:
   ```
   STELLAR_SOURCE_PUBLIC=your_public_key
   STELLAR_SOURCE_SECRET=your_secret_key
   ```

### CORS Settings

Configure allowed origins in `settings.py` or `.env`:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
]
```

## 📊 Database Models

### CustomUser
- Email-based authentication
- Company information
- Role assignment
- Approval status

### Product
- Unique identifier
- QR code generation
- Status tracking
- Supply chain linkage

### ProductStep
- Step-by-step tracking
- Photos and documents
- Location and timestamp
- Actor information

### BlockchainRecord
- Stellar transaction hash
- Immutable audit trail
- Verification status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API documentation

## 🔄 Version History

- **v1.0.0** - Initial release
  - Basic product tracking
  - User management
  - Blockchain integration
  - QR code generation

## 📞 Contact

For more information, please contact the development team.

---

**Made with ❤️ for transparent supply chains**
