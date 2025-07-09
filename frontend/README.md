# ManhwaTrans Frontend - AI-Powered Manhwa Translation Platform

A modern React + TypeScript + Vite application for managing manhwa translations with advanced OCR, AI-powered translation, and collaborative workflow management.

## 🌟 Overview

The ManhwaTrans frontend provides an intuitive and powerful interface for translators, editors, and administrators to manage manhwa translation projects. It features real-time collaboration, advanced image processing, AI-powered translation tools, and comprehensive project management capabilities.

## 🚀 Tech Stack

### Core Technologies

- **React 19** - Latest React with modern features and concurrent rendering
- **TypeScript** - Full type safety and enhanced developer experience
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **React Router** - Declarative client-side routing
- **Zustand** - Lightweight state management for global application state

### UI & Authentication

- **Supabase Auth UI** - Pre-built authentication components
- **React Icons** - Comprehensive icon library
- **Custom Components** - Reusable UI components with consistent design
- **Responsive Design** - Mobile-first approach with Tailwind CSS

### Integration & Services

- **Supabase Client** - Real-time database and authentication
- **WebSocket** - Real-time notifications and updates
- **File Upload** - Multi-image upload with progress tracking
- **API Services** - Comprehensive service layer for backend integration

## 🔐 Authentication with Supabase UI Library

This project implements authentication using the **Supabase UI Library** for login and register functionality, with backend API integration for user management.

## ✨ Key Features

### 🔐 Authentication & User Management

- **Pure Supabase Auth UI** - Uses `@supabase/auth-ui-react` components
- **Social Login** - Google and GitHub providers configured
- **Custom Styling** - Tailwind CSS integration with ThemeSupa
- **Protected Routes** - Automatic redirection based on auth state
- **Session Management** - Real-time auth state updates
- **Role-based Access** - Admin, Editor, and Translator roles with specific permissions
- **User Administration** - Complete user management interface
- **Profile Management** - User profile editing and avatar upload

### 📚 Content Management Workflow

- **Series Dashboard** - Organize and manage manhwa series with metadata
- **Chapter Management** - Track translation progress with status indicators
- **Page Organization** - Multi-image upload with automatic page numbering
- **Progress Tracking** - Visual progress indicators and status management
- **Batch Operations** - Efficient handling of multiple items
- **Search & Filter** - Advanced filtering and search capabilities

### 🔍 Advanced OCR & Text Processing

- **Interactive Image Viewer** - Zoom, pan, and navigate through manhwa pages
- **Bounding Box Editor** - Drag-and-drop text area selection and editing
- **Multi-language OCR** - Support for Korean, Japanese, Chinese, Vietnamese, English
- **Real-time Text Detection** - Automatic text region identification
- **OCR Confidence Scoring** - Visual indicators for text detection quality
- **Text Region Management** - Add, edit, and delete text boxes with precision

### 🌐 AI-Powered Translation

- **Context-Aware Translation** - Series-specific context and character preservation
- **Translation Memory Integration** - Smart suggestions from previous translations
- **Real-time Translation** - Instant translation with progress indicators
- **Quality Assurance** - Confidence scoring and validation tools
- **Batch Translation** - Translate multiple text elements efficiently
- **Translation History** - Track and revert translation changes

### 🤖 AI Analysis & Glossary

- **Character Analysis** - Automatic identification of people across series
- **Terminology Extraction** - AI-powered extraction of manhwa-specific terms
- **Smart Glossary** - Categorized terminology database (characters, places, items, etc.)
- **Context Building** - Series-wide context for consistent translations
- **AI Insights Panel** - Visual analytics and recommendations

### 📊 Dashboard & Analytics

- **Real-time Statistics** - Live counts and progress metrics
- **Activity Timeline** - Recent actions and updates
- **Progress Visualization** - Charts and graphs for project status
- **User Analytics** - Role distribution and activity monitoring
- **Performance Metrics** - Translation speed and accuracy tracking

### 🎨 User Experience

- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Dark/Light Mode** - Theme switching for user preference
- **Keyboard Shortcuts** - Efficient navigation and actions
- **Drag & Drop** - Intuitive file upload and organization
- **Real-time Updates** - WebSocket-powered live collaboration
- **Loading States** - Skeleton components and progress indicators
- **Error Handling** - User-friendly error messages and recovery options

### 📦 Authentication Packages

```json
{
  "@supabase/auth-ui-react": "^0.4.7",
  "@supabase/auth-ui-shared": "^0.1.8",
  "@supabase/supabase-js": "^2.45.4"
}
```

### 🛠 Implementation

#### Auth Page (`/auth`)

- Uses `Auth` component from `@supabase/auth-ui-react`
- Configured with ThemeSupa theme
- Custom styling with Tailwind CSS classes
- Social providers: Google, GitHub
- Localized labels and messages

#### Authentication Context

- Listens to Supabase auth state changes
- Manages user session and localStorage
- Provides auth state to the entire app
- Handles logout functionality
- Login/register are handled entirely by Supabase Auth UI

#### Protected Routes

- Automatically redirects unauthenticated users to `/auth`
- Shows loading state during auth checks
- Protects the main dashboard and other pages

### 🎨 Customization

The Supabase Auth UI is customized with:

```tsx
<Auth
  supabaseClient={supabase}
  appearance={{
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: "#3b82f6",
          brandAccent: "#2563eb",
          brandButtonText: "white",
        },
      },
    },
    className: {
      container: "w-full",
      button: "w-full px-4 py-2 rounded-md font-medium transition-colors",
      input:
        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      label: "block text-sm font-medium text-gray-700 mb-1",
    },
  }}
  providers={["google", "github"]}
  localization={{
    variables: {
      sign_in: {
        email_label: "Email address",
        password_label: "Password",
        button_label: "Sign in",
        link_text: "Don't have an account? Sign up",
      },
      sign_up: {
        email_label: "Email address",
        password_label: "Create a password",
        button_label: "Create account",
        link_text: "Already have an account? Sign in",
      },
    },
  }}
/>
```

### 🔧 Configuration

1. **Supabase Client** - Configure in `src/lib/supabase.ts`
2. **Environment Variables** - Add your Supabase URL and anon key
3. **Social Providers** - Configure in Supabase dashboard
4. **Styling** - Modify appearance object in Auth component

### 📱 Usage

1. Visit `/auth` to access login/register
2. Use email/password or social login
3. Automatic redirect to dashboard after authentication
4. Logout from navbar when authenticated

### 🎯 Benefits

- **No Custom Forms** - Leverages battle-tested Supabase Auth UI
- **Built-in Features** - Password reset, email verification, social login
- **Consistent UX** - Professional authentication flow
- **Easy Maintenance** - Updates handled by Supabase team
- **Accessibility** - Built-in a11y features
- **Responsive** - Mobile-friendly out of the box
- **Clean Context** - Auth context only handles logout and state management

## 📁 Application Structure

### Page Components

- **Homepage** (`/`) - Dashboard with series overview and quick navigation
- **Series** (`/series`) - Series management with creation, editing, and organization
- **Chapters** (`/chapters/:seriesId`) - Chapter management for specific series
- **Pages** (`/pages/:chapterId`) - Page management with image upload and OCR
- **Users** (`/users`) - User administration (admin only)
- **Profile** (`/profile`) - User profile management and settings
- **Auth** (`/auth`) - Authentication page with login/register

### Component Architecture

```
src/
├── components/
│   ├── AIInsightPanel/          # AI analysis and insights
│   ├── Auth/                    # Authentication components
│   ├── Dashboard/               # Dashboard widgets and stats
│   ├── Dropdown/                # Reusable dropdown components
│   ├── Header/                  # Page headers and navigation
│   ├── Layouts/                 # Layout components
│   ├── Lists/                   # List and table components
│   ├── Modals/                  # Modal dialogs and forms
│   ├── Navbar/                  # Navigation bar
│   ├── Tabs/                    # Tab navigation components
│   └── common/                  # Shared utility components
├── pages/                       # Page components
├── services/                    # API service layer
├── stores/                      # Zustand state management
├── types/                       # TypeScript type definitions
├── hooks/                       # Custom React hooks
├── contexts/                    # React contexts
├── providers/                   # Context providers
├── routes/                      # Route definitions
├── constants/                   # Application constants
├── utils/                       # Utility functions
└── lib/                         # External library configurations
```

### State Management (Zustand Stores)

- **seriesStore** - Series data and operations
- **chaptersStore** - Chapter management and status
- **pagesStore** - Page data and image handling
- **textBoxesStore** - Text box management and OCR data
- **dashboardStore** - Dashboard statistics and activities
- **aiGlossaryStore** - AI glossary and terminology
- **tmStore** - Translation memory management

### Service Layer

- **api.ts** - Base API client with authentication
- **userService.ts** - User management operations
- **seriesService.ts** - Series CRUD operations
- **chapterService.ts** - Chapter management
- **pageService.ts** - Page and image handling
- **textBoxService.ts** - Text box operations
- **ocrService.ts** - OCR and text detection
- **translationService.ts** - AI translation services
- **translationMemoryService.ts** - Translation memory
- **aiGlossaryService.ts** - AI glossary management
- **dashboardService.ts** - Dashboard analytics
- **websocketService.ts** - Real-time notifications

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and yarn/npm
- **Backend API** running on localhost:8000
- **Supabase** project with authentication configured

### Installation

```bash
# Install dependencies
yarn install
# or
npm install

# Start development server
yarn dev
# or
npm run dev

# Build for production
yarn build
# or
npm run build

# Preview production build
yarn preview
# or
npm run preview
```

### Development

The application will be available at `http://localhost:5173` (or next available port).

### Development Workflow

1. **Setup Environment**: Configure `.env` with Supabase credentials
2. **Start Backend**: Ensure backend API is running on port 8000
3. **Run Frontend**: Start development server with `yarn dev`
4. **Access Application**: Navigate to `http://localhost:5173`
5. **Authentication**: Use `/auth` page to login or register
6. **Development**: Use browser dev tools and React DevTools for debugging

## 🔗 Backend Integration

This frontend integrates with a FastAPI backend for user management:

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
```

### User Management Flow

1. **Registration**: When users sign up via Supabase Auth UI, the AuthProvider automatically calls the backend API to create a user record in the database with fields: `id`, `email`, `name`, `role`, `avatar_url`, `created_at`, `updated_at`.

2. **Authentication**: All API requests use Supabase JWT tokens for authentication.

3. **User Administration**: The Users page (`/users`) provides a complete interface for:
   - Viewing all users
   - Editing user roles (admin, editor, translator)
   - Deleting users
   - Real-time updates

### API Services

The frontend includes a complete API service layer:

- `src/services/api.ts` - Base API client with authentication
- `src/services/userService.ts` - User management operations

### Backend Requirements

Make sure the backend is running on `http://localhost:8000` with the following endpoints:

- `POST /api/users/` - Create user after signup
- `GET /api/users/` - Get all users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/{id}/role` - Update user role
- `DELETE /api/users/{id}` - Delete user

See the backend README for setup instructions.

## 🔧 Development

### Key Development Features

- **Hot Module Replacement** - Instant updates during development
- **TypeScript Integration** - Full type checking and IntelliSense
- **ESLint Configuration** - Code quality and consistency enforcement
- **Tailwind CSS** - Utility-first styling with JIT compilation
- **React DevTools** - Component debugging and state inspection
- **Zustand DevTools** - State management debugging

### Code Quality

- **TypeScript** - Strict type checking for better code quality
- **ESLint** - Linting rules for consistent code style
- **Prettier** - Code formatting (when configured)
- **Component Testing** - Unit tests for critical components
- **Type Safety** - Comprehensive TypeScript types for all data structures

### Performance Optimizations

- **Code Splitting** - Automatic route-based code splitting
- **Lazy Loading** - Dynamic imports for better performance
- **Image Optimization** - Efficient image loading and caching
- **State Management** - Optimized Zustand stores with selectors
- **Memoization** - React.memo and useMemo for expensive operations

### Development Tools

```bash
# Linting
yarn lint
npm run lint

# Type checking
yarn tsc --noEmit
npx tsc --noEmit

# Build analysis
yarn build --analyze
npm run build -- --analyze
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build the Docker image
docker build -t manhwatrans-frontend .

# Run the container
docker run -d \
  --name manhwatrans-frontend \
  -p 80:80 \
  manhwatrans-frontend
```

### Production Build

```bash
# Create production build
yarn build

# Preview production build locally
yarn preview

# Serve with static file server
npx serve -s dist
```

### Environment Configuration

**Production (.env.production)**:

```env
# Production Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Production Backend API
VITE_API_BASE_URL=https://api.yourdomain.com/api

# Production Settings
VITE_APP_ENV=production
```

### Deployment Platforms

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Static Hosting

- Build the project with `yarn build`
- Upload the `dist` folder to your static hosting provider
- Configure environment variables in your hosting platform

### Performance Considerations

- **CDN Configuration** - Serve static assets from CDN
- **Gzip Compression** - Enable compression for better load times
- **Caching Strategy** - Configure proper cache headers
- **Bundle Analysis** - Monitor bundle size and optimize imports
- **Image Optimization** - Use WebP format and responsive images

## 🧪 Testing

### Testing Strategy

```bash
# Run unit tests (when implemented)
yarn test

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn test:coverage

# Run E2E tests (when implemented)
yarn test:e2e
```

### Testing Tools

- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **MSW** - API mocking for tests
- **Playwright** - End-to-end testing (when implemented)

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**

   - Check TypeScript errors with `yarn tsc --noEmit`
   - Verify all dependencies are installed
   - Clear node_modules and reinstall if needed

2. **Authentication Issues**

   - Verify Supabase URL and anon key in `.env`
   - Check Supabase project configuration
   - Ensure backend is running and accessible

3. **API Connection Issues**

   - Verify backend API URL in `.env`
   - Check CORS configuration in backend
   - Ensure backend is running on correct port

4. **State Management Issues**
   - Use Zustand DevTools for debugging
   - Check store subscriptions and selectors
   - Verify data flow between components

### Debug Mode

Enable development mode features:

```env
# Enable debug logging
VITE_DEBUG=true

# Enable React DevTools
VITE_REACT_DEVTOOLS=true
```

## 📝 Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

## 🤝 Contributing

### Development Guidelines

1. **Code Style** - Follow TypeScript and React best practices
2. **Component Structure** - Use functional components with hooks
3. **State Management** - Use Zustand stores for global state
4. **Styling** - Use Tailwind CSS utility classes
5. **Type Safety** - Maintain strict TypeScript typing
6. **Testing** - Write tests for critical functionality

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Test your changes thoroughly
5. Update documentation if needed
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Components are responsive and accessible
- [ ] State management follows established patterns
- [ ] Error handling is implemented
- [ ] Loading states are handled
- [ ] Code is properly documented

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing React framework
- **Vite Team** for the lightning-fast build tool
- **Supabase** for the excellent backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **TypeScript** for bringing type safety to JavaScript
- **Zustand** for simple and effective state management

## 📞 Support

For frontend-specific support:

- Check the [troubleshooting section](#-troubleshooting)
- Review the [development guidelines](#-development)
- Open an issue on GitHub with detailed information
- Contact the development team

---

**ManhwaTrans Frontend** - Building the future of manhwa translation with modern web technologies 🚀
