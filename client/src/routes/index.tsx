import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import {
  Login,
  VerifyEmail,
  Registration,
  ResetPassword,
  ApiErrorWatcher,
  TwoFactorScreen,
  RequestPasswordReset,
} from '~/components/Auth';
import { OAuthSuccess, OAuthError } from '~/components/OAuth';
import { AuthContextProvider } from '~/hooks/AuthContext';
import { Spinner } from '~/components/svg';
import RouteErrorBoundary from './RouteErrorBoundary';
import StartupLayout from './Layouts/Startup';
import LoginLayout from './Layouts/Login';

// Lazy load heavy components
const ShareRoute = lazy(() => import('./ShareRoute'));
const ChatRoute = lazy(() => import('./ChatRoute'));
const Search = lazy(() => import('./Search'));
const Root = lazy(() => import('./Root'));

// Dashboard routes need to be imported normally as they're route configs
import dashboardRoutes from './Dashboard';

// Academy routes
const AcademyRoutes = lazy(() => import('./Academy'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center">
    <Spinner className="text-text-primary" />
  </div>
);

const AuthLayout = () => (
  <AuthContextProvider>
    <Outlet />
    <ApiErrorWatcher />
  </AuthContextProvider>
);

// Wrapper components for lazy loaded routes
const LazyRoot = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Root />
  </Suspense>
);

const LazyChatRoute = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <ChatRoute />
  </Suspense>
);

const LazySearch = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Search />
  </Suspense>
);

const LazyShareRoute = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <ShareRoute />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: 'share/:shareId',
    element: <LazyShareRoute />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: 'oauth',
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'success',
        element: <OAuthSuccess />,
      },
      {
        path: 'error',
        element: <OAuthError />,
      },
    ],
  },
  {
    path: 'verify',
    element: <VerifyEmail />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <StartupLayout />,
        children: [
          {
            path: 'register',
            element: <Registration />,
          },
          {
            path: 'forgot-password',
            element: <RequestPasswordReset />,
          },
          {
            path: 'reset-password',
            element: <ResetPassword />,
          },
        ],
      },
      {
        path: '/',
        element: <LoginLayout />,
        children: [
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: 'login/2fa',
            element: <TwoFactorScreen />,
          },
        ],
      },
      dashboardRoutes,
      {
        path: '/',
        element: <LazyRoot />,
        children: [
          {
            index: true,
            element: <Navigate to="/c/new" replace={true} />,
          },
          {
            path: 'c/:conversationId?',
            element: <LazyChatRoute />,
          },
          {
            path: 'search',
            element: <LazySearch />,
          },
          {
            path: 'academy/*',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <AcademyRoutes />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);
