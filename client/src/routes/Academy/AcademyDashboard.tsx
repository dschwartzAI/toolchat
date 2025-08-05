import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Search, Filter, TrendingUp, Clock, Award } from 'lucide-react';
import { cn } from '~/utils';
import { Button, Input } from '~/components/ui';
import CourseGrid from '~/components/Academy/CourseGrid';
import { useLocalize } from '~/hooks';
import { useGetCoursesQuery, useGetUserEnrollmentsQuery } from '~/data-provider/Academy';
import { useAuthContext } from '~/hooks';
import store from '~/store';

export default function AcademyDashboard() {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const activeTab = useRecoilValue(store.academy.activeTab);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'alphabetical'>('popular');

  const { data: courses, isLoading: coursesLoading } = useGetCoursesQuery({
    search: searchQuery,
    category: selectedCategory,
    sortBy
  });

  const { data: enrollments } = useGetUserEnrollmentsQuery(user?._id || '');

  const enrolledCourseIds = enrollments?.map(e => e.courseId) || [];
  const enrolledCourses = courses?.filter(course => enrolledCourseIds.includes(course._id)) || [];
  const availableCourses = courses?.filter(course => !enrolledCourseIds.includes(course._id)) || [];

  // Show courses or forum based on active tab
  if (activeTab === 'community') {
    // Forum is handled by separate route
    return null;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {localize('com_academy_title')}
          </h1>
          <p className="text-text-secondary">
            {localize('com_academy_description')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-secondary rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{localize('com_academy_enrolled_courses')}</p>
              <p className="text-2xl font-bold text-text-primary">{enrolledCourses.length}</p>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{localize('com_academy_completed_courses')}</p>
              <p className="text-2xl font-bold text-text-primary">
                {enrollments?.filter(e => e.progress?.percentComplete === 100).length || 0}
              </p>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{localize('com_academy_learning_hours')}</p>
              <p className="text-2xl font-bold text-text-primary">
                {Math.round((enrollments?.reduce((acc, e) => acc + (e.progress?.totalTimeSpent || 0), 0) || 0) / 3600)}
              </p>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={localize('com_academy_search_courses')}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('popular')}
            >
              {localize('com_academy_popular')}
            </Button>
            <Button
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('newest')}
            >
              {localize('com_academy_newest')}
            </Button>
            <Button
              variant={sortBy === 'alphabetical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('alphabetical')}
            >
              A-Z
            </Button>
          </div>
        </div>

        {/* My Courses */}
        {enrolledCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              {localize('com_academy_my_courses')}
            </h2>
            <CourseGrid
              courses={enrolledCourses}
              isLoading={coursesLoading}
              showProgress
            />
          </div>
        )}

        {/* Available Courses */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {localize('com_academy_available_courses')}
          </h2>
          <CourseGrid
            courses={availableCourses}
            isLoading={coursesLoading}
          />
        </div>
      </div>
    </div>
  );
}