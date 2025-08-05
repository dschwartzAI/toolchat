import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, Eye, MoreVertical } from 'lucide-react';
import { cn } from '~/utils';
import { Button, Table, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui';
import { useLocalize } from '~/hooks';
import { useToastContext } from '~/Providers';
import { useGetAdminCoursesQuery, useDeleteCourseMutation, usePublishCourseMutation } from '~/data-provider/Academy';
import type { Course } from '~/data-provider/Academy/types';

export default function CourseManager() {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  
  const { data: courses, isLoading } = useGetAdminCoursesQuery();
  const deleteCourse = useDeleteCourseMutation();
  const publishCourse = usePublishCourseMutation();

  const handleCreateCourse = () => {
    navigate('/academy/admin/courses/create');
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/academy/admin/courses/${courseId}/edit`);
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/academy/courses/${courseId}`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm(localize('com_academy_confirm_delete_course'))) {
      return;
    }

    deleteCourse.mutate(
      { courseId },
      {
        onSuccess: () => {
          showToast({
            message: localize('com_academy_course_deleted'),
            status: 'success'
          });
        },
        onError: () => {
          showToast({
            message: localize('com_academy_delete_error'),
            status: 'error'
          });
        }
      }
    );
  };

  const handleTogglePublish = async (course: Course) => {
    publishCourse.mutate(
      { courseId: course._id, isPublished: !course.isPublished },
      {
        onSuccess: () => {
          showToast({
            message: course.isPublished 
              ? localize('com_academy_course_unpublished')
              : localize('com_academy_course_published'),
            status: 'success'
          });
        },
        onError: () => {
          showToast({
            message: localize('com_academy_publish_error'),
            status: 'error'
          });
        }
      }
    );
  };

  const columns = [
    {
      header: localize('com_academy_course_title'),
      accessorKey: 'title',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-text-primary">{row.original.title}</p>
          <p className="text-sm text-text-secondary line-clamp-1">{row.original.description}</p>
        </div>
      ),
      meta: { size: '40%' }
    },
    {
      header: localize('com_academy_author'),
      accessorKey: 'author.name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.author.avatar ? (
            <img
              src={row.original.author.avatar}
              alt={row.original.author.name}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-surface-tertiary flex items-center justify-center">
              <span className="text-xs">{row.original.author.name[0]}</span>
            </div>
          )}
          <span className="text-sm">{row.original.author.name}</span>
        </div>
      ),
      meta: { size: '20%' }
    },
    {
      header: localize('com_academy_enrolled'),
      accessorKey: 'enrolledCount',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.enrolledCount || 0}</span>
      ),
      meta: { size: '10%' }
    },
    {
      header: localize('com_academy_status'),
      accessorKey: 'isPublished',
      cell: ({ row }) => (
        <span className={cn(
          'px-2 py-1 text-xs rounded-full',
          row.original.isPublished
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
        )}>
          {row.original.isPublished ? localize('com_academy_published') : localize('com_academy_draft')}
        </span>
      ),
      meta: { size: '10%' }
    },
    {
      header: localize('com_academy_created'),
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
      meta: { size: '15%' }
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewCourse(row.original._id)}>
              <Eye className="h-4 w-4 mr-2" />
              {localize('com_ui_view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditCourse(row.original._id)}>
              <Edit className="h-4 w-4 mr-2" />
              {localize('com_ui_edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTogglePublish(row.original)}>
              {row.original.isPublished ? localize('com_academy_unpublish') : localize('com_academy_publish')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteCourse(row.original._id)}
              className="text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              {localize('com_ui_delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      meta: { size: '5%' }
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {localize('com_academy_manage_courses')}
        </h1>
        <Button onClick={handleCreateCourse} variant="submit" className="gap-2">
          <Plus className="h-4 w-4" />
          {localize('com_academy_create_course')}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left">{localize('com_academy_title')}</th>
              <th className="px-4 py-3 text-left">{localize('com_academy_instructor')}</th>
              <th className="px-4 py-3 text-left">{localize('com_academy_enrolled')}</th>
              <th className="px-4 py-3 text-left">{localize('com_academy_status')}</th>
              <th className="px-4 py-3 text-left">{localize('com_academy_created')}</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <span className="text-text-secondary">Loading...</span>
                </td>
              </tr>
            ) : courses && courses.length > 0 ? (
              courses.map((course) => (
                <tr key={course._id} className="border-b hover:bg-surface-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {course.thumbnail && (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-text-primary">{course.title}</div>
                        <div className="text-sm text-text-secondary line-clamp-1">{course.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {course.author?.avatar ? (
                        <img
                          src={course.author.avatar}
                          alt={course.author.name}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-surface-tertiary flex items-center justify-center">
                          <span className="text-xs">{course.author?.name?.[0]}</span>
                        </div>
                      )}
                      <span className="text-sm">{course.author?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{course.enrolledCount || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      course.isPublished
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    )}>
                      {course.isPublished ? localize('com_academy_published') : localize('com_academy_draft')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewCourse(course._id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {localize('com_ui_view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCourse(course._id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {localize('com_ui_edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(course)}>
                          {course.isPublished ? localize('com_academy_unpublish') : localize('com_academy_publish')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          {localize('com_ui_delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <span className="text-text-secondary">{localize('com_academy_no_courses')}</span>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}