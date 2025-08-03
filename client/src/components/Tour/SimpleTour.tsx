import React, { useState, useEffect, useCallback, useContext } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { ThemeContext } from '~/hooks/ThemeContext';
import { tourSteps } from './tourSteps';

const TOUR_KEY = 'librechat-tour-completed';

export default function SimpleTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    // Check if this is a new user
    const isNewUser = document.cookie.includes('isNewUser=true');
    
    // Check if user has completed the tour
    const tourCompleted = localStorage.getItem(TOUR_KEY);
    
    // Start tour for new users or if tour hasn't been completed
    if (isNewUser || !tourCompleted) {
      // Clear the new user cookie if it exists
      if (isNewUser) {
        document.cookie = 'isNewUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Also clear the tour completed flag to ensure it runs
        localStorage.removeItem(TOUR_KEY);
      }
      
      // Start tour after a short delay to ensure UI is loaded
      const timer = setTimeout(() => {
        setRun(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      // Mark tour as completed
      localStorage.setItem(TOUR_KEY, 'true');
      setRun(false);
      setStepIndex(0);
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Update step index for controlled tour
      // If target not found, skip to next step
      setStepIndex(index + 1);
    } else if (action === 'close' || type === EVENTS.TOUR_END) {
      // Mark tour as completed if user closes it
      localStorage.setItem(TOUR_KEY, 'true');
      setRun(false);
      setStepIndex(0);
    }
  }, []);

  const joyrideStyles = {
    options: {
      primaryColor: theme === 'dark' ? '#10b981' : '#059669',
      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      textColor: theme === 'dark' ? '#f3f4f6' : '#111827',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      width: undefined as unknown as number,
      zIndex: 10000,
    },
    spotlight: {
      borderRadius: 8,
    },
    tooltip: {
      borderRadius: 8,
      fontSize: 16,
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    tooltipTitle: {
      fontSize: 20,
      fontWeight: 600,
      marginBottom: 8,
    },
    tooltipContent: {
      fontSize: 16,
      lineHeight: 1.5,
    },
    buttonNext: {
      backgroundColor: theme === 'dark' ? '#10b981' : '#059669',
      color: '#ffffff',
      borderRadius: 6,
      fontSize: 14,
      padding: '8px 16px',
    },
    buttonBack: {
      color: theme === 'dark' ? '#f3f4f6' : '#6b7280',
      fontSize: 14,
      marginRight: 10,
    },
    buttonSkip: {
      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
      fontSize: 14,
    },
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton={false}
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      steps={tourSteps}
      styles={joyrideStyles}
      disableOverlayClose={false}
      spotlightClicks={true}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}