# AGENTS.md

This file provides essential guidelines for AI agents working in this repository.

## Build/Lint/Test Commands

**Development:**
- `npm run dev` - Start development server (port 5173)
- `npm run prod` - Start production server
- `npm run preview` - Preview production build (port 4173)

**Build:**
- `npm run build` - Build for production (optimized, minified)
- `npm run build-dev` - Build for development (with source maps)

**Lint/Quality:**
- `npm run lint` - Run ESLint (ESLint 9 with React Hooks and Refresh plugins)

**Testing:**
- No test framework is currently configured
- Before adding tests, verify with the user which framework to use (Jest, Vitest, React Testing Library, etc.)

## Project Overview

This is a React 19 + Vite frontend for a biogenetics management system. It uses:
- React 19 with hooks (useState, useEffect, useCallback, useMemo)
- React Router DOM v7 for routing
- Axios for API calls with interceptors and retry logic
- Bootstrap 5 for UI components and styling
- React Context API for global state management

## Code Style Guidelines

### File Organization
- `src/Api/` - API modules organized by domain (auth, bulls, users, etc.)
- `src/Components/` - Reusable components (ErrorBoundary, LoadingIndicator, etc.)
- `src/context/` - React contexts (AppContext for global state/cache)
- `src/hooks/` - Custom hooks (useApi for API calls with caching)
- `src/utils/` - Utility functions (errorHandler for centralized error handling)
- `src/view/` - Page/route components
- `src/config/` - Configuration files (environment variables)

### Imports
- Use ES6 imports
- Group imports: React imports, library imports, local imports
- Use named exports for API modules (e.g., `authApi`, `bullsApi`)
- Use default exports for main components when appropriate
- Use lazy loading for route components: `const Component = lazy(() => import('./view/Component'))`

### Naming Conventions
- Components: PascalCase (e.g., `Bulls`, `App`, `LoadingIndicator`)
- Hooks: camelCase with `use` prefix (e.g., `useApi`, `useAppContext`)
- Functions/Variables: camelCase (e.g., `handleFilterChange`, `fetchBullInputs`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_URL`, `TIMEOUT`)
- API modules: camelCase (e.g., `authApi`, `bullsApi`, `usersApi`)

### Formatting
- 2-space indentation
- Semicolons required
- Use single quotes for strings
- Max line length: not strictly enforced, but keep it readable
- ESLint enforces recommended rules + React Hooks rules

### Types
- JavaScript (no TypeScript) - use JSDoc comments for function documentation
- Validate types at runtime when necessary
- Use PropTypes-like patterns for component props if needed
- Type checking with `typeof` and `instanceof` operators

### State Management
- Use React hooks for local state (useState, useEffect)
- Use Context API for global state (AppContext provides cache and loading state)
- Use custom hooks for reusable logic (useApi for API calls with caching)
- Use refs for non-reactive values and cleanup functions
- Memoize expensive operations with useMemo and useCallback
- Use startTransition for non-urgent UI updates

### Error Handling
- Use centralized error handler from `src/utils/errorHandler.js`
- Try-catch blocks in async functions
- API errors handled via axios interceptors with user-friendly messages
- Use ErrorBoundary for catching component errors
- Log errors with logger utility (production vs development)
- Show user-friendly error messages, hide technical details in production

### API Calls
- Use Axios with configured instance from `src/Api/instance.js`
- Token automatically added via request interceptor
- Retry logic with exponential backoff for network errors
- Automatic logout on 401 errors
- Use API modules organized by domain in `src/Api/`
- Handle different response formats (array, items, results)
- Cache API responses with TTL using useApi hook

### Component Patterns
- Lazy load route components for better performance
- Use Suspense with loading indicators
- Use ErrorBoundary for error boundaries
- Conditional rendering based on loading/error states
- Extract reusable components to `src/Components/`
- Use Bootstrap classes for styling

### Performance
- Lazy load route components
- Memoize expensive computations with useMemo
- Memoize callbacks with useCallback
- Use React.memo for pure components if needed
- Implement debouncing for search inputs (500ms)
- Pagination for large lists (10 items per page)
- Optimize dependency arrays in useEffect and useCallback
- Use refs to avoid recreating timers/intervals

### Security
- Token stored in localStorage (consider alternatives for production)
- Token automatically added to requests
- Logout on 401 responses
- No sensitive data in console logs (except development)
- Validate user inputs before sending to API

### Environment
- Environment config in `src/config/environment.js`
- Vite environment variables with VITE_ prefix
- Three environments: development, production, staging
- Different API URLs per environment
- DEBUG flag for conditional logging

### Comments
- Use Spanish comments throughout the codebase
- JSDoc style for function documentation
- Comment complex logic
- Mark optimizations with ✅ (e.g., `// ✅ Optimization explanation`)

## Cursor Rules Integration

When working in this repository, follow these additional rules from `.cursor/rules/kluster-code-verify.mdc`:

**Automatic Code Review:**
- Run code verification after any file creation, modification, or code change
- Always inform user of issues found before fixing
- Complete all fixes from verification tools before running verification again

**Manual Code Review:**
- Only run when explicitly requested (trigger phrases: "verify with kluster", "verify this file", etc.)

**Chat ID Management:**
- Include chat_id in all subsequent verification tool calls after the first one
- Maintain context across verification chain

**End of Session:**
- If verification tools were used, provide a kluster.ai Review Summary before final response
- Include issues found and fixes implemented

## Common Patterns

**API Call with useApi Hook:**
```javascript
const { data, loading, error, execute } = useApi(apiFunction, {
  cacheKey: 'unique-key',
  ttl: 5 * 60 * 1000,
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error)
});
```

**Memoized Callback:**
```javascript
const handleSomething = useCallback(() => {
  // callback logic
}, [dependency]); // Only include stable dependencies
```

**Memoized Computation:**
```javascript
const computedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

**API Module Pattern:**
```javascript
export const functionName = async (param1, param2) => {
  const response = await axiosInstance.get(`/endpoint`, { params: { param1, param2 } });
  return response.data;
};
```

**Lazy Loading Component:**
```javascript
const Component = lazy(() => import('./view/Component'));

<Suspense fallback={<LoadingIndicator />}>
  <Route path="/route" element={<Component />} />
</Suspense>
```

## Important Notes

- No TypeScript - use JavaScript with JSDoc for documentation
- No test framework currently configured - verify with user before adding tests
- All comments are in Spanish - maintain this convention
- Bootstrap 5 for UI - use Bootstrap classes for styling
- Axios interceptors handle authentication and errors globally
- AppContext provides caching mechanism for API responses
- ErrorBoundary wraps the entire app for error catching
- Lazy loading is used for all route components
- The project uses Vite with React plugin for fast refresh
