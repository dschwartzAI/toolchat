import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from '~/components/svg';
import { useAuthContext } from '~/hooks';
import AcademyLayout from './AcademyLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load Academy components
const AcademyDashboard = lazy(() => import('./AcademyDashboard'));
const CourseViewer = lazy(() => import('./CourseViewer'));
const LessonViewer = lazy(() => import('./LessonViewer'));
const Forum = lazy(() => import('./Forum'));
const ForumPost = lazy(() => import('./ForumPost'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <Spinner className="h-8 w-8" />
  </div>
);

export default function AcademyRoutes() {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<AcademyLayout />}>
        {/* Main Academy Dashboard */}
        <Route
          index
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AcademyDashboard />
            </Suspense>
          }
        />

        {/* Course Routes */}
        <Route path="courses">
          <Route
            path=":courseId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <CourseViewer />
              </Suspense>
            }
          />
          <Route
            path=":courseId/lessons/:lessonId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LessonViewer />
              </Suspense>
            }
          />
        </Route>

        {/* Forum Routes */}
        <Route path="forum">
          <Route
            index
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Forum />
              </Suspense>
            }
          />
          <Route
            path="posts/:postId"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ForumPost />
              </Suspense>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}