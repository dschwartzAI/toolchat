import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import store from '~/store';

export const useAcademyNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setActiveTab = useSetRecoilState(store.academy.activeTab);

  const navigateToCourses = useCallback(() => {
    setActiveTab('courses');
    navigate('/academy');
  }, [navigate, setActiveTab]);

  const navigateToCourse = useCallback((courseId: string) => {
    navigate(`/academy/courses/${courseId}`);
  }, [navigate]);

  const navigateToLesson = useCallback((courseId: string, lessonId: string) => {
    navigate(`/academy/courses/${courseId}/lessons/${lessonId}`);
  }, [navigate]);

  const navigateToForum = useCallback(() => {
    setActiveTab('community');
    navigate('/academy/forum');
  }, [navigate, setActiveTab]);

  const navigateToPost = useCallback((postId: string) => {
    navigate(`/academy/forum/posts/${postId}`);
  }, [navigate]);

  const navigateToCreatePost = useCallback((categoryId?: string) => {
    const params = categoryId ? `?category=${categoryId}` : '';
    navigate(`/academy/forum/create${params}`);
  }, [navigate]);

  const navigateToAdmin = useCallback(() => {
    navigate('/academy/admin');
  }, [navigate]);

  const navigateToAdminCourses = useCallback(() => {
    navigate('/academy/admin/courses');
  }, [navigate]);

  const navigateToAdminCourseEdit = useCallback((courseId: string) => {
    navigate(`/academy/admin/courses/${courseId}/edit`);
  }, [navigate]);

  const navigateToAdminCourseCreate = useCallback(() => {
    navigate('/academy/admin/courses/create');
  }, [navigate]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigateToCourses();
    }
  }, [navigate, navigateToCourses]);

  const isInAcademy = location.pathname.startsWith('/academy');
  const isInCourses = location.pathname.includes('/courses');
  const isInForum = location.pathname.includes('/forum');
  const isInAdmin = location.pathname.includes('/admin');

  return {
    // Navigation functions
    navigateToCourses,
    navigateToCourse,
    navigateToLesson,
    navigateToForum,
    navigateToPost,
    navigateToCreatePost,
    navigateToAdmin,
    navigateToAdminCourses,
    navigateToAdminCourseEdit,
    navigateToAdminCourseCreate,
    goBack,

    // Current location helpers
    isInAcademy,
    isInCourses,
    isInForum,
    isInAdmin,
    currentPath: location.pathname
  };
};