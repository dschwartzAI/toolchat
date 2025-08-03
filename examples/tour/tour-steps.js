// Simple tour flow focusing on core features
export const tourSteps = [
  {
    target: 'body',
    content: 'Welcome to SovereignAI! This quick tour will show you the essential features to get started.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="tool-selector"]',
    content: 'Here you\'ll find 6 powerful AI tools. Each tool maintains its own conversation context, so you can switch between them without losing your work.',
    placement: 'right',
  },
  {
    target: '[data-tour="chat-interface"]',
    content: 'This is where you chat with your selected AI tool. Type your message below and press Enter to send.',
    placement: 'auto',
  },
  {
    target: '[data-tour="conversation-history"]',
    content: 'Your conversations are automatically saved here. Click any conversation to continue where you left off.',
    placement: 'right',
  },
  {
    target: '[data-tour="tool-switcher"]',
    content: 'Switch between different AI tools here. Each tool has unique capabilities - try them all to find what works best for your needs.',
    placement: 'bottom',
  },
  {
    target: 'body',
    content: 'That\'s it! You\'re ready to start using SovereignAI. Pick a tool from the sidebar and ask your first question!',
    placement: 'center',
  },
];