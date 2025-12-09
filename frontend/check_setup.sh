#!/bin/bash

# Frontend Setup Validation Script
# This script verifies that the frontend is properly configured

echo "================================================"
echo "  Product Traceability System - Frontend Check"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the frontend directory"
    exit 1
fi

echo -e "${GREEN}✓${NC} In correct directory"

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm version
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules directory exists"
else
    echo -e "${YELLOW}⚠${NC} node_modules not found, run: npm install"
fi

echo ""
echo "Checking project structure..."
echo ""

# Check critical files
FILES=(
    "index.html"
    "vite.config.js"
    "tailwind.config.js"
    "postcss.config.js"
    "src/main.jsx"
    "src/App.jsx"
    "src/index.css"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}❌${NC} $file missing"
    fi
done

echo ""
echo "Checking core directories..."
echo ""

DIRS=(
    "src/components"
    "src/context"
    "src/pages"
    "src/services"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FILE_COUNT=$(find "$dir" -name "*.jsx" -o -name "*.js" | wc -l)
        echo -e "${GREEN}✓${NC} $dir ($FILE_COUNT files)"
    else
        echo -e "${RED}❌${NC} $dir missing"
    fi
done

echo ""
echo "Checking key components..."
echo ""

COMPONENTS=(
    "src/components/Layout.jsx"
    "src/components/PrivateRoute.jsx"
    "src/context/AuthContext.jsx"
    "src/services/api.js"
    "src/services/authService.js"
    "src/services/productService.js"
    "src/pages/Auth/Login.jsx"
    "src/pages/Client/Dashboard.jsx"
    "src/pages/Public/QRScanner.jsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        echo -e "${GREEN}✓${NC} $component"
    else
        echo -e "${RED}❌${NC} $component missing"
    fi
done

echo ""
echo "Checking dependencies..."
echo ""

# Check if key packages are installed
PACKAGES=(
    "react"
    "react-router-dom"
    "axios"
    "tailwindcss"
    "react-toastify"
    "react-icons"
)

for package in "${PACKAGES[@]}"; do
    if npm list "$package" > /dev/null 2>&1; then
        VERSION=$(npm list "$package" --depth=0 2>/dev/null | grep "$package" | cut -d '@' -f 2)
        echo -e "${GREEN}✓${NC} $package@$VERSION"
    else
        echo -e "${RED}❌${NC} $package not installed"
    fi
done

echo ""
echo "================================================"
echo ""

# Count files by type
TOTAL_JSX=$(find src -name "*.jsx" | wc -l)
TOTAL_JS=$(find src -name "*.js" | wc -l)
TOTAL_CSS=$(find src -name "*.css" | wc -l)

echo "Project Statistics:"
echo "  - JSX files: $TOTAL_JSX"
echo "  - JS files: $TOTAL_JS"
echo "  - CSS files: $TOTAL_CSS"

echo ""
echo "Available scripts:"
echo "  npm run dev      - Start development server"
echo "  npm run build    - Build for production"
echo "  npm run preview  - Preview production build"
echo ""

echo "Backend Requirements:"
echo "  - Backend API must be running on: http://localhost:8000"
echo "  - CORS must allow: http://localhost:3000"
echo ""

echo "Next Steps:"
echo "  1. Make sure backend is running"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:3000"
echo ""

echo -e "${GREEN}✓ Frontend setup verification complete!${NC}"
