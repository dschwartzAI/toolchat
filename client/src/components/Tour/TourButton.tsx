import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '~/components/ui/Button';

interface TourButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

const TOUR_KEY = 'librechat-tour-completed';

export default function TourButton({ 
  className = '', 
  variant = 'ghost', 
  size = 'sm' 
}: TourButtonProps) {
  const handleRestartTour = () => {
    // Clear the tour completion flag
    localStorage.removeItem(TOUR_KEY);
    // Reload the page to restart the tour
    window.location.reload();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRestartTour}
      className={className}
      title="Take a tour of the platform"
    >
      <HelpCircle className="mr-2 h-4 w-4" />
      Take Tour
    </Button>
  );
}