# PurOstill Frontend

Frontend application for PurOstill WooCommerce store using a headless CMS approach with Next.js.

## Features

- **Headless CMS Architecture**: Decoupled frontend from WooCommerce backend
- **Public API Handler**: No authentication required for public data retrieval
- **WooCommerce API Handler**: Authenticated endpoints for full WooCommerce functionality
- **TypeScript**: Full type safety throughout the application
- **Next.js 14**: Latest Next.js with App Router

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env.local`. The file includes:
   - `WOOCOMMERCE_URL`: Your WooCommerce store URL
   - `WOOCOMMERCE_CONSUMER_KEY`: WooCommerce consumer key
   - `WOOCOMMERCE_CONSUMER_SECRET`: WooCommerce consumer secret

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Public API (No Authentication)

These endpoints are for public data retrieval and don't require authentication:

- `GET /api/public/products` - Get all products
  - Query params: `per_page`, `page`, `category`, `search`
- `GET /api/public/products/[id]` - Get single product by ID
- `GET /api/public/categories` - Get product categories
  - Query params: `per_page`, `page`

### WooCommerce API (Authenticated)

These endpoints use WooCommerce API authentication:

- `GET /api/woocommerce/products` - Get all products
  - Query params: `per_page`, `page`, `status`, `category`, `search`
- `GET /api/woocommerce/products/[id]` - Get single product by ID
- `GET /api/woocommerce/orders` - Get orders
  - Query params: `per_page`, `page`, `status`
- `GET /api/woocommerce/categories` - Get product categories
  - Query params: `per_page`, `page`

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── public/          # Public API handlers (no auth)
│   │   └── woocommerce/     # WooCommerce API handlers (authenticated)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── lib/
│   ├── public-api.ts        # Public API client
│   └── woocommerce.ts       # WooCommerce API client
├── .env.local               # Environment variables
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

## Usage Examples

### Fetching Products (Public)

```typescript
// In your component or page
const response = await fetch('/api/public/products?per_page=10');
const { data } = await response.json();
```

### Fetching Products (WooCommerce)

```typescript
// In your component or page
const response = await fetch('/api/woocommerce/products?per_page=10&status=publish');
const { data } = await response.json();
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Notes

- The `.env.local` file contains sensitive credentials and should not be committed to version control
- The `.env.local.example` file is provided as a template
- WooCommerce API uses Basic Authentication with consumer key and secret
- Public API uses WooCommerce Store API (wc/store/v1) which is read-only and doesn't require authentication

