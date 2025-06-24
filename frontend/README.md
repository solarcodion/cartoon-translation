# ManhwaTrans - Manhwa Translation Admin Panel

A React + TypeScript + Vite application with Supabase authentication for managing manhwa translations.

## 🚀 Tech Stack

- **React 19** - Latest React with modern features
- **TypeScript** - Full type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Supabase Auth UI** - Authentication components
- **React Icons** - Beautiful icon library

## 🔐 Authentication with Supabase UI Library

This project implements authentication using the **Supabase UI Library** for login and register functionality, with backend API integration for user management.

### 🚀 Features

- **Pure Supabase Auth UI** - Uses `@supabase/auth-ui-react` components
- **Social Login** - Google and GitHub providers configured
- **Custom Styling** - Tailwind CSS integration with ThemeSupa
- **Protected Routes** - Automatic redirection based on auth state
- **Session Management** - Real-time auth state updates
- **TypeScript** - Full type safety
- **Backend Integration** - Automatic user creation in database after signup
- **User Management** - Complete CRUD operations for user administration
- **Role-based Access** - Admin, Editor, and Translator roles

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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

The application will be available at `http://localhost:5173` (or next available port).

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

## Expanding the ESLint configuration

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
