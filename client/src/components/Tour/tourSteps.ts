import { Step } from 'react-joyride';

export const tourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Solo:OS. Think of this like James\' brain, available 24/7 for live coaching. The app remembers important info you tell it, so it gets smarter the more you use it.',
    placement: 'center',
    title: 'Welcome to Solo:OS',
    disableBeacon: true,
  },
  {
    target: '[data-tour="model-selector"]',
    content: 'Here you\'ll find 6 powerful AI tools. Each tool maintains its own conversation context, so you can switch between them without losing your work.',
    placement: 'bottom',
    title: 'AI Business Tools',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '[data-tour="tag-nav"]',
    content: 'Use tags to organize and quickly find past conversations. Your conversations are automatically saved and named (just click the three dots next to a chat to edit name). ',
    placement: 'right',
    title: 'Organize with Tags',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '[data-tour="feedback-button"]',
    content: 'Found a bug or have suggestions? Let us know through the feedback button.',
    placement: 'top',
    title: 'Share Feedback',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '[data-tour="account-settings"]',
    content: 'Click here to access Settings > Account > Image to change your profile picture.',
    placement: 'left',
    title: 'Customize Your Profile',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '[data-tour="academy-button"]',
    content: 'Access the Academy for community forums, courses, and training materials. Connect with other users and learn advanced strategies.',
    placement: 'left',
    title: 'Academy & Community',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: 'body',
    content: 'That\'s it! You\'re ready to start using Solo:OS. Pick a tool from the selector and ask your first question! We recommend starting with the Ideal Client Extractor to get in the minds of your prospects.',
    placement: 'center',
    title: 'Ready to Go!',
    disableBeacon: true,
  },
];