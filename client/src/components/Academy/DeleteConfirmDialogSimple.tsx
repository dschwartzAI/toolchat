import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X, Trash2, Calendar, CalendarDays } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  isDeleting?: boolean;
  showSeriesOption?: boolean;
  deleteMode?: 'single' | 'series';
  onDeleteModeChange?: (mode: 'single' | 'series') => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialogSimple: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  isDeleting = false,
  showSeriesOption = false,
  deleteMode = 'single',
  onDeleteModeChange,
  onConfirm,
  onCancel,
}) => {
  console.log('[DeleteConfirmDialog] Render with props:', { 
    isOpen, 
    showSeriesOption, 
    deleteMode,
    hasOnDeleteModeChange: !!onDeleteModeChange 
  });
  
  if (!isOpen) return null;

  const isDarkMode = document.documentElement.classList.contains('dark');

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    console.log('[DeleteConfirmDialog] Confirm clicked with deleteMode:', deleteMode);
    onConfirm();
  };

  const handleCancel = () => {
    console.log('[DeleteConfirmDialog] Cancel clicked');
    onCancel();
  };

  const handleModeChange = (mode: 'single' | 'series') => {
    console.log('[DeleteConfirmDialog] Mode changed to:', mode);
    if (onDeleteModeChange) {
      onDeleteModeChange(mode);
    }
  };

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
      onClick={handleBackdropClick}
    >
      <div 
        className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg p-6 max-w-md w-[90%] m-4 shadow-2xl relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {!isDeleting && (
          <button
            type="button"
            onClick={handleCancel}
            className={`absolute top-4 right-4 p-1 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'} flex items-center justify-center`}>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} mb-1`}>
              Delete Event
            </h3>
            {!showSeriesOption && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {message || `Are you sure you want to delete "${title}"? This action cannot be undone.`}
              </p>
            )}
            {showSeriesOption && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose whether to delete just this occurrence or all events in the series.
              </p>
            )}
          </div>
        </div>

        {/* Recurring event options with radio buttons */}
        {showSeriesOption && (
          <div className={`mb-6 p-4 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-lg space-y-3`}>
            <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>
              Delete option for "{title}":
            </h4>
            
            <div 
              onClick={() => handleModeChange('single')}
              className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <input
                type="radio"
                name="deleteMode"
                checked={deleteMode === 'single'}
                onChange={() => handleModeChange('single')}
                className="mt-1 cursor-pointer"
                disabled={isDeleting}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    This occurrence only
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  Delete only this specific event. Other events in the series will remain.
                </p>
              </div>
            </div>

            <div 
              onClick={() => handleModeChange('series')}
              className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <input
                type="radio"
                name="deleteMode"
                checked={deleteMode === 'series'}
                onChange={() => handleModeChange('series')}
                className="mt-1 cursor-pointer"
                disabled={isDeleting}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    All events in series
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  Delete all occurrences of this recurring event.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning message based on selection */}
        {showSeriesOption && (
          <div className={`mb-4 p-3 rounded-lg ${
            deleteMode === 'series' 
              ? (isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')
              : (isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200')
          } border`}>
            <p className={`text-xs ${
              deleteMode === 'series'
                ? (isDarkMode ? 'text-red-400' : 'text-red-700')
                : (isDarkMode ? 'text-blue-400' : 'text-blue-700')
            }`}>
              {deleteMode === 'series'
                ? '⚠️ This will permanently delete ALL events in this series and cannot be undone.'
                : 'ℹ️ Only this specific occurrence will be deleted. Future events will remain scheduled.'}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors ${
              deleteMode === 'series' && showSeriesOption
                ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400'
                : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
            } disabled:cursor-not-allowed`}
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {showSeriesOption 
                  ? (deleteMode === 'series' ? 'Delete All Events' : 'Delete This Event')
                  : 'Delete Event'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmDialogSimple;