# PharmaCare POS - React Web Application

A modern React-based web application for the PharmaCare pharmacy point-of-sale system.

## Project Structure

```
web/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Auth/           # Authentication components
│   │   ├── Common/         # Common/shared components
│   │   ├── Inventory/      # Inventory management components
│   │   ├── Layout/         # Layout components (Header, Sidebar, etc.)
│   │   └── POS/            # Point of Sale components
│   ├── pages/              # Page components (routes)
│   ├── services/           # API service layer
│   ├── store/              # State management (Zustand stores)
│   ├── styles/             # Global styles
│   ├── utils/              # Utility functions and helpers
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Running PharmaCare API server (on `http://localhost:5000`)

### Installation

1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your API configuration if needed

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

### Deploying to Vercel

Import this `web` directory as a Vercel project. Vercel detects the Vite configuration; the repository includes `vercel.json` for the production build and React Router fallback.

Add these environment variables in the Vercel project settings for the Production environment:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-api.example.com/api
```

`VITE_API_BASE_URL` must point to a publicly deployed API. Do not use `localhost` in Vercel, and never add a Supabase service-role key to frontend environment variables.

After saving the variables, redeploy the project. The deployment URL can then be added to Supabase Authentication URL configuration if password authentication redirects need to return to the hosted app.

### Deploying to Cloudflare Pages

Import the GitHub repository into Cloudflare Pages. Because the repository contains the contents of the `web` directory at its root, use these settings:

```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

Add the same `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and deployed `VITE_API_BASE_URL` variables under the Pages project settings for the Production environment. The `public/_redirects` file is included so direct links to React routes work correctly.

### Linting and Type Checking

Check for linting errors:
```bash
npm run lint
```

Type check without emitting:
```bash
npm run type-check
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Zustand** - State management
- **React Query** - Server state management
- **Axios** - HTTP client
- **Material-UI** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Features

- [x] Project structure setup
- [ ] Authentication system
- [ ] Dashboard
- [ ] Point of Sale (POS)
- [ ] Inventory management
- [ ] User management
- [ ] Sales reports
- [ ] Medicine management
- [ ] Customer management
- [ ] Prescription management

## API Integration

The application communicates with the PharmaCare API backend. Configure the API base URL in `.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

For Supabase, add the project URL and browser-safe anon key to `web/.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The client is available from `src/lib/supabaseClient.ts`. Never expose a Supabase service-role key in the frontend.

## Development Guidelines

### Component Structure
- Functional components with hooks
- Props with TypeScript interfaces
- Zustand stores for global state
- React Query for API data

### File Naming
- Components: PascalCase (e.g., `LoginForm.tsx`)
- Pages: PascalCase (e.g., `Dashboard.tsx`)
- Utilities: camelCase (e.g., `apiClient.ts`)
- Stores: camelCase (e.g., `authStore.ts`)

### Import Aliases
Use configured path aliases for cleaner imports:
```typescript
// Instead of:
import Button from '../../../components/Common/Button'

// Use:
import Button from '@components/Common/Button'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API server URL | `http://localhost:5000/api` |
| `VITE_APP_NAME` | Application name | `PharmaCare POS` |
| `VITE_ENABLE_LOGGING` | Enable console logging | `true` |

## Next Steps

1. Implement authentication service
2. Create API service layer
3. Set up state management stores
4. Build core pages and components
5. Integrate with backend API
6. Add unit and integration tests
7. Set up CI/CD pipeline
8. Deploy to production

## Contributing

Please follow the development guidelines and maintain consistent code style.

## License

Proprietary - PharmaCare POS System
