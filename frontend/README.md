# Product Traceability System - Frontend

A modern React-based frontend application for the Product Traceability System, featuring client registration, product browsing, and QR code scanning capabilities.

## 🚀 Features

### For Clients
- ✅ **Instant Registration** - Create account and start browsing immediately
- ✅ **Product Browsing** - View all products with search and filter
- ✅ **QR Code Scanning** - Verify product authenticity
- ✅ **Supply Chain History** - Complete product journey visualization

### For Manufacturers
- 🏭 **Product Management** - Create and manage products
- 📊 **Dashboard** - View statistics and insights
- 🔗 **QR Code Generation** - Generate unique product codes

### For Admins
- 👥 **User Management** - Manage all system users
- ✅ **Approval System** - Approve/reject registration requests
- 📈 **System Overview** - Monitor system statistics

## 📋 Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:8000`

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
frontend/
├── public/                 # Static files
├── src/
│   ├── components/         # Reusable components
│   │   ├── Layout.jsx     # Main layout with navigation
│   │   └── PrivateRoute.jsx # Protected route wrapper
│   │
│   ├── context/           # React Context
│   │   └── AuthContext.jsx # Authentication context
│   │
│   ├── pages/             # Page components
│   │   ├── Auth/          # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   ├── ClientRegister.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── Client/        # Client pages
│   │   │   ├── Dashboard.jsx
│   │   │   └── Products.jsx
│   │   │
│   │   ├── Manufacturer/  # Manufacturer pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateProduct.jsx
│   │   │   └── ManageProducts.jsx
│   │   │
│   │   ├── Admin/         # Admin pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ManageUsers.jsx
│   │   │   └── RegistrationRequests.jsx
│   │   │
│   │   ├── Public/        # Public pages
│   │   │   ├── QRScanner.jsx
│   │   │   └── ProductVerification.jsx
│   │   │
│   │   └── Home.jsx       # Landing page
│   │
│   ├── services/          # API services
│   │   ├── api.js         # Axios instance with interceptors
│   │   ├── authService.js # Authentication API
│   │   ├── productService.js # Product API
│   │   └── adminService.js # Admin API
│   │
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
│
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🔗 API Integration

All API calls are handled through service files in `src/services/`:

### Authentication Service (`authService.js`)
```javascript
import authService from './services/authService';

// Client registration
await authService.registerClient(data);

// Standard registration  
await authService.register(data);

// Login
await authService.login({ email, password });

// Logout
await authService.logout();
```

### Product Service (`productService.js`)
```javascript
import productService from './services/productService';

// Get products (client view)
await productService.getClientProducts({ search, ordering, page });

// Get public product (QR scan)
await productService.getPublicProduct(productId);

// Create product (manufacturer)
await productService.createProduct(formData);
```

### Admin Service (`adminService.js`)
```javascript
import adminService from './services/adminService';

// Get dashboard stats
await adminService.getDashboardStats();

// Manage users
await adminService.getUsers();

// Handle registration requests
await adminService.approveRequest(id);
await adminService.rejectRequest(id, reason);
```

## 🎨 Styling

The application uses **Tailwind CSS** for styling with custom utility classes:

```css
/* Button styles */
.btn-primary    /* Primary button */
.btn-secondary  /* Secondary button */
.btn-danger     /* Danger button */

/* Form inputs */
.input-field    /* Standard input field */

/* Badges */
.badge          /* Base badge */
.badge-success  /* Success badge */
.badge-warning  /* Warning badge */
.badge-error    /* Error badge */

/* Status classes */
.status-created
.status-in-transit
.status-in-warehouse
.status-in-store
.status-sold
```

## 🛣️ Routing

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register/client` - Client registration
- `/register` - Standard registration
- `/scan` - QR code scanner
- `/product/:id/verify` - Product verification

### Client Routes (Requires CLIENT role)
- `/client/dashboard` - Client dashboard
- `/client/products` - Browse products

### Manufacturer Routes (Requires FABRICANT role)
- `/manufacturer/dashboard` - Manufacturer dashboard
- `/manufacturer/products` - Manage products
- `/manufacturer/products/create` - Create new product

### Admin Routes (Requires ADMIN role)
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - Manage users
- `/admin/requests` - Registration requests

## 🔐 Authentication Flow

### 1. Client Registration
```javascript
// Simplified registration for clients
const formData = {
  email: 'client@example.com',
  company_name: 'John Doe',
  phone: '+213555123456',
  password: 'SecurePass123!',
  password_confirmation: 'SecurePass123!'
};

await authService.registerClient(formData);
// Returns user data and JWT tokens
// User is logged in automatically
```

### 2. Login
```javascript
const credentials = {
  email: 'user@example.com',
  password: 'password123'
};

const response = await authService.login(credentials);
// Stores tokens in localStorage
// Redirects based on user role
```

### 3. Token Management
The API service automatically:
- Adds access token to all requests
- Refreshes tokens when they expire
- Logs out user if refresh fails

## 📱 Key Components

### Layout Component
Main application layout with:
- Responsive navigation
- User menu
- Role-based menu items
- Footer

### PrivateRoute Component
Protects routes based on:
- Authentication status
- User role
- Auto-redirects to appropriate dashboard

### AuthContext
Provides authentication state and methods throughout the app:
```javascript
const { user, login, logout, registerClient } = useAuth();
```

## 🎯 Client Features Implementation

### Product Browsing
```javascript
// Features:
- Search by name, SKU, manufacturer
- Sort by price, date, name
- Pagination (20 items/page)
- View product details
- Click to verify
```

### QR Code Scanning
```javascript
// Two methods:
1. Manual entry - Enter product UUID
2. Camera scanner - Use device camera (requires HTTPS)

// Both lead to ProductVerification page
```

### Product Verification Page
Shows:
- ✅ Verification status
- 📦 Complete product information
- 🏭 Manufacturer details
- 📍 Supply chain history with:
  - Step-by-step journey
  - Timestamps
  - Locations
  - Actors
  - Documents/photos
  - Blockchain verification

## 🌐 Environment Variables

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🧪 Testing the Frontend

### 1. Test Client Registration
```bash
# Navigate to http://localhost:3000/register/client
# Fill form and submit
# Should be logged in immediately
```

### 2. Test Product Browsing
```bash
# Navigate to http://localhost:3000/client/products
# Should see paginated product list
# Test search and filters
```

### 3. Test QR Scanning
```bash
# Navigate to http://localhost:3000/scan
# Enter a valid product UUID
# Should show verification page
```

## 🐛 Troubleshooting

### Issue: API calls fail
**Solution:** Ensure backend is running on `http://localhost:8000`

### Issue: CORS errors
**Solution:** Backend must allow requests from `http://localhost:3000`

### Issue: Token refresh not working
**Solution:** Check that refresh tokens are properly stored in localStorage

### Issue: Routes not working
**Solution:** Ensure React Router is properly configured in App.jsx

## 📦 Dependencies

### Core
- `react` ^18.2.0 - UI library
- `react-dom` ^18.2.0 - DOM rendering
- `react-router-dom` ^6.20.0 - Routing

### HTTP Client
- `axios` ^1.6.2 - API requests

### UI Components & Icons
- `react-icons` ^4.12.0 - Icon library
- `react-toastify` ^9.1.3 - Toast notifications
- `qrcode.react` ^3.1.0 - QR code generation

### Utilities
- `date-fns` ^2.30.0 - Date formatting

### Styling
- `tailwindcss` ^3.3.6 - CSS framework
- `postcss` ^8.4.32 - CSS processing
- `autoprefixer` ^10.4.16 - CSS prefixing

### Build Tool
- `vite` ^5.0.8 - Fast build tool
- `@vitejs/plugin-react` ^4.2.1 - Vite React plugin

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Deploy Options
1. **Vercel**: `vercel --prod`
2. **Netlify**: Drag `dist/` folder to Netlify
3. **AWS S3**: Upload `dist/` contents
4. **Docker**: Use provided Dockerfile

## 🔧 Configuration

### Vite Config (`vite.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### Tailwind Config (`tailwind.config.js`)
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { /* custom colors */ }
      }
    },
  },
}
```

## 📝 Next Steps

### Enhance Features
1. Implement camera-based QR scanning
2. Add advanced product filters
3. Implement real-time notifications
4. Add product favorites/watchlist
5. Implement order history for clients

### Manufacturer Features
1. Complete product creation form
2. Add product step management
3. Implement batch operations
4. Add product analytics

### Admin Features
1. Complete user management interface
2. Implement registration request workflow
3. Add system statistics dashboard
4. Implement audit logs view

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

[Add your license information here]

## 🆘 Support

For issues or questions:
- Check API documentation
- Review browser console for errors
- Verify backend API is running
- Check network tab for failed requests

---

**Built with ❤️ using React, Vite, and Tailwind CSS**
