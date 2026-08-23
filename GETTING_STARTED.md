/**
 * Quick start guide for development
 */

# Getting Started with PharmaCare Web

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- PharmaCare API server running on `http://localhost:5000`

## Initial Setup

### 1. Install Dependencies

\`\`\`bash
cd web
npm install
\`\`\`

### 2. Environment Configuration

Copy the environment template:
\`\`\`bash
cp .env.example .env
\`\`\`

Update `.env` with your API configuration if needed.

### 3. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:3000`

## Project Structure

\`\`\`
web/
├── src/
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── store/            # Zustand stores
│   ├── styles/           # Global styles
│   ├── utils/            # Utilities & helpers
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── [config files]        # Build & linting config
\`\`\`

## Key Commands

| Command | Description |
|---------|-------------|
| \`npm run dev\` | Start development server |
| \`npm run build\` | Build for production |
| \`npm run preview\` | Preview production build |
| \`npm run lint\` | Check for linting errors |
| \`npm run type-check\` | Type check TypeScript |

## Development Guidelines

### Component Creation

All components should be created as functional components using TypeScript:

\`\`\`tsx
interface ComponentProps {
  title: string
  onAction?: () => void
}

export default function Component({ title, onAction }: ComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  )
}
\`\`\`

### Using Path Aliases

Import paths use configured aliases for cleaner imports:

\`\`\`tsx
// Instead of:
import Button from '../../../components/Common/Button'

// Use:
import Button from '@components/Common/Button'
```

Available aliases:
- `@/` - src directory
- `@components/` - src/components
- `@pages/` - src/pages
- `@services/` - src/services
- `@store/` - src/store
- `@styles/` - src/styles
- `@utils/` - src/utils

### State Management

Use Zustand stores for global state:

\`\`\`tsx
import { useAuthStore } from '@store/authStore'

export default function MyComponent() {
  const { user, logout } = useAuthStore()
  // ...
}
\`\`\`

### API Calls

Use service files for API calls:

\`\`\`tsx
import { medicineService } from '@services/medicineService'

const medicines = await medicineService.getAll()
\`\`\`

## Common Tasks

### Adding a New Page

1. Create file in `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/Layout/Sidebar.tsx`

### Adding a New Component

1. Create directory `src/components/MyComponent/`
2. Create `MyComponent.tsx` with component
3. Create `index.ts` for exports (optional)
4. Use in pages with import alias

### Adding a New API Service

1. Create file `src/services/myService.ts`
2. Define interfaces and functions
3. Use `apiClient` from `apiClient.ts`
4. Export service

## Styling

The project uses:
- **Tailwind CSS** for utility classes
- **CSS Modules** for component-specific styles (optional)
- Color scheme defined in `tailwind.config.js`

Primary colors are defined in Tailwind config and can be used as:
- \`bg-primary-500\` - Primary color
- \`text-primary-600\` - Dark primary
- \`bg-primary-50\` - Light primary

## Testing

Run tests with:
\`\`\`bash
npm test
\`\`\`

## Deployment

Build production bundle:
\`\`\`bash
npm run build
\`\`\`

Output will be in the \`dist/\` directory. Deploy this folder to your hosting service.

## Troubleshooting

### API Connection Issues
- Ensure backend API is running on \`http://localhost:5000\`
- Check \`VITE_API_BASE_URL\` in \`.env\`
- Check browser console for CORS errors

### Login Not Working
- Default credentials: admin / Admin@123
- Check that backend is running
- Look at network tab in browser dev tools

### Port Already in Use
- Default dev port is 3000
- Change in \`vite.config.ts\` if needed
- Or use: \`npm run dev -- --port 3001\`

## Need Help?

Refer to:
- [React Documentation](https://react.dev)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Zustand Docs](https://github.com/pmndrs/zustand)
