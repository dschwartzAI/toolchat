import React, { useState } from 'react';
import { Button } from '~/components';
import { useLocalize } from '~/hooks';
import SimpleTour from './SimpleTour';

const TourButton = () => {
  const localize = useLocalize();
  const [showTour, setShowTour] = useState(false);
  
  return (
    <>
      {/* Tour button section in settings */}
      <div className="flex items-center justify-between">
        <div>{localize('com_nav_platform_tour') || 'Platform Tour'}</div>
        <Button 
          variant="outline" 
          onClick={() => {
            console.log('Starting tour...');
            setShowTour(true);
          }}
          aria-label="Start platform tour"
        >
          {localize('com_ui_start_tour') || 'Start Tour'}
        </Button>
      </div>
      
      {/* Tour component - renders when showTour is true */}
      {showTour && (
        <SimpleTour 
          run={showTour} 
          onClose={() => {
            console.log('Tour closed');
            setShowTour(false);
          }} 
        />
      )}
    </>
  );
};

export default TourButton;