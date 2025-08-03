import React, { useContext } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { ThemeContext } from '~/hooks';
import { tourSteps } from './tour-steps';

const SimpleTour = ({ run, onClose }) => {
  const { theme } = useContext(ThemeContext);
  
  // Theme-aware styling for black/white design
  const joyrideStyles = {
    options: {
      backgroundColor: theme === 'dark' ? '#000' : '#fff',
      textColor: theme === 'dark' ? '#fff' : '#000',
      primaryColor: '#10b981', // Green accent for buttons
      zIndex: 10000, // Above all modals
      width: 380,
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    tooltip: {
      backgroundColor: theme === 'dark' ? '#000' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
      borderRadius: '8px',
      fontSize: '16px',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipContent: {
      padding: '20px',
    },
    buttonNext: {
      backgroundColor: '#10b981',
      color: '#fff',
    },
    buttonBack: {
      color: theme === 'dark' ? '#fff' : '#000',
    },
    buttonSkip: {
      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
    },
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    
    // Log for debugging
    console.log('Tour event:', type, data);
    
    // Close tour when finished or skipped
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onClose();
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling
      spotlightClicks
      styles={joyrideStyles}
      callback={handleJoyrideCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default SimpleTour;