import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

// Add spinner animation CSS
const spinnerStyle = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('delete-confirm-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'delete-confirm-spinner-style';
  style.textContent = spinnerStyle;
  document.head.appendChild(style);
}

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  isDeleting?: boolean;
  showSeriesOption?: boolean;
  deleteSeries?: boolean;
  onDeleteSeriesChange?: (value: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  isDeleting = false,
  showSeriesOption = false,
  deleteSeries = false,
  onDeleteSeriesChange,
  onConfirm,
  onCancel,
}) => {
  console.log('[DeleteConfirmDialog] Render state:', { isOpen, title, isDeleting });
  
  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Create stable event handlers
  const handleConfirmClick = useCallback(() => {
    console.log('[DeleteConfirmDialog] Confirm button clicked!');
    console.log('[DeleteConfirmDialog] Calling onConfirm callback...');
    if (onConfirm) {
      onConfirm();
    } else {
      console.error('[DeleteConfirmDialog] onConfirm callback is not defined!');
    }
  }, [onConfirm]);
  
  const handleCancelClick = useCallback(() => {
    console.log('[DeleteConfirmDialog] Cancel button clicked!');
    console.log('[DeleteConfirmDialog] Calling onCancel callback...');
    if (onCancel) {
      onCancel();
    } else {
      console.error('[DeleteConfirmDialog] onCancel callback is not defined!');
    }
  }, [onCancel]);
  
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    console.log('[DeleteConfirmDialog] Backdrop clicked, target:', e.target, 'currentTarget:', e.currentTarget);
    if (e.target === e.currentTarget) {
      console.log('[DeleteConfirmDialog] Backdrop click confirmed, calling cancel');
      handleCancelClick();
    }
  }, [handleCancelClick]);
  
  const handleSeriesChange = useCallback((checked: boolean) => {
    console.log('[DeleteConfirmDialog] Series checkbox changed:', checked);
    if (onDeleteSeriesChange) {
      onDeleteSeriesChange(checked);
    }
  }, [onDeleteSeriesChange]);
  
  if (!isOpen) {
    console.log('[DeleteConfirmDialog] Not open, returning null');
    return null;
  }
  
  console.log('[DeleteConfirmDialog] Rendering dialog, dark mode:', isDarkMode);

  return ReactDOM.createPortal(
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        pointerEvents: 'auto'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '448px',
          width: '90%',
          margin: '0 16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          pointerEvents: 'auto',
          border: isDarkMode ? '1px solid #374151' : 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleCancelClick}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            pointerEvents: 'auto'
          }}
        >
          <X className="w-5 h-5" />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            flexShrink: 0,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: isDarkMode ? '#f3f4f6' : '#111827',
              marginBottom: '4px',
              margin: 0,
              paddingBottom: '4px'
            }}>
              Delete Event
            </h3>
            <p style={{
              fontSize: '14px',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              margin: 0
            }}>
              {message || `Are you sure you want to delete "${title}"? This action cannot be undone.`}
            </p>
          </div>
        </div>

        {/* Recurring event option */}
        {showSeriesOption && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: isDarkMode ? '#78350f' : '#fef3c7',
            borderRadius: '8px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={deleteSeries}
                onChange={(e) => handleSeriesChange(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: isDarkMode ? '#fbbf24' : '#92400e' }}>
                Delete all events in this series
              </span>
            </label>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={isDeleting}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
              color: isDarkMode ? '#e5e7eb' : '#374151',
              pointerEvents: 'auto'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isDeleting}
            style={{
              padding: '8px 16px',
              backgroundColor: isDeleting ? '#9ca3af' : '#dc2626',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'auto'
            }}
          >
            {isDeleting ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 style={{ width: '16px', height: '16px' }} />
                Delete {deleteSeries && showSeriesOption ? 'Series' : 'Event'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmDialog;