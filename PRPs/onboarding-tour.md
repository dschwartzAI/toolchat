name: "Onboarding Tour Implementation - React Joyride Integration"
description: |

## Purpose
Implement a simple onboarding tour using React Joyride that highlights key features of the LibreChat platform. The tour will be manually triggered from settings and use a black/white theme matching the app design.

## Core Principles
1. **Minimal Integration**: Use React Joyride defaults where possible
2. **Theme Consistency**: Match existing black/white app aesthetic
3. **User Control**: Tour only runs when explicitly triggered
4. **Simple Steps**: 5-6 essential steps focusing on core features
5. **No Persistence**: No localStorage during development

---

## Goal
Create an intuitive onboarding tour that helps new users understand the platform's key features: tool selection, chat interface, conversation history, and tool switching capabilities.

## Why
- **User Onboarding**: Help new users quickly understand the platform
- **Feature Discovery**: Highlight the 6 available AI tools
- **Reduce Support**: Visual guide reduces confusion
- **Replay Anytime**: Tour button in settings for refresher

## What
A React Joyride-powered tour with:
- 5-6 step guided tour through main UI elements
- Black overlay with white tooltips
- Tour button in General settings tab
- Manual trigger only (no auto-start)
- Simple spotlight effect on elements

### Success Criteria
- [ ] Tour button visible in General settings tab
- [ ] All 6 tour steps highlight correct elements
- [ ] Tour works in both light and dark themes
- [ ] No console errors during tour
- [ ] Tour can be replayed multiple times

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://docs.react-joyride.com/
  why: Main documentation for React Joyride library
  
- url: https://docs.react-joyride.com/basic-usage
  why: Basic implementation patterns and setup
  
- url: https://docs.react-joyride.com/styling
  why: Styling customization for black/white theme
  
- file: LibreChat/client/src/components/Nav/Settings.tsx
  why: Main settings component where tour integration happens
  
- file: LibreChat/client/src/components/Nav/SettingsTabs/General/General.tsx
  why: General tab where tour button will be added
  
- file: LibreChat/client/src/components/Nav/SettingsTabs/General/ArchivedChats.tsx
  why: Example of button pattern in settings (using Button with variant="outline")
  
- file: LibreChat/client/src/style.css
  why: Theme variables for black/white styling
  
- file: LibreChat/client/src/components/ui/Button.tsx
  why: Button component API and variants

- file: LibreChat/client/src/hooks/ThemeContext.tsx
  why: Theme context for handling dark/light mode
```

### Current Codebase tree
```bash
LibreChat/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Nav/
│   │   │   │   ├── Settings.tsx
│   │   │   │   └── SettingsTabs/
│   │   │   │       ├── General/
│   │   │   │       │   ├── General.tsx
│   │   │   │       │   └── ArchivedChats.tsx
│   │   │   │       └── index.ts
│   │   │   ├── Chat/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── ChatView.tsx
│   │   │   └── SidePanel/
│   │   ├── hooks/
│   │   │   └── ThemeContext.tsx
│   │   └── style.css
│   └── package.json
```

### Desired Codebase tree with files to be added
```bash
LibreChat/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Tour/
│   │   │   │   ├── SimpleTour.tsx        # Main tour component
│   │   │   │   ├── TourButton.tsx        # Settings tour button
│   │   │   │   ├── tourSteps.ts          # Tour step definitions
│   │   │   │   └── index.ts              # Exports
│   │   │   └── Nav/
│   │   │       └── SettingsTabs/
│   │   │           └── General/
│   │   │               └── General.tsx    # MODIFIED: Add TourButton
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: React Joyride requires specific CSS for overlay
// The library uses fixed positioning - ensure z-index > modals (z-50 in Tailwind)

// GOTCHA: Theme switching requires updating Joyride styles dynamically
// Use ThemeContext to detect dark mode and adjust styles

// PATTERN: LibreChat uses Tailwind classes, not inline styles
// Convert Joyride default styles to Tailwind equivalents

// CRITICAL: data-tour attributes must be on rendered elements
// Some elements may be conditionally rendered - handle gracefully

// GOTCHA: Tour steps need stable element selectors
// Use data-tour attributes instead of classes that might change
```

## Implementation Blueprint

### Data models and structure

Create tour step definitions and types:
```typescript
// tourSteps.ts
export interface TourStep {
  target: string;  // CSS selector for element
  content: string; // Step description
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center';
  disableBeacon?: boolean;
}

// Complete tourSteps.ts content
export const tourSteps: TourStep[] = [
  {
    target: 'body',
    content: 'Welcome to SovereignAI! Let me show you around the platform.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="tool-selector"]',
    content: 'Choose from 6 powerful AI tools in the sidebar. Each tool has unique capabilities.',
    placement: 'right',
  },
  {
    target: '[data-tour="chat-interface"]',
    content: 'This is where you interact with your AI assistant. Type your questions or commands here.',
    placement: 'center',
  },
  {
    target: '[data-tour="conversation-history"]',
    content: 'Your conversations are saved here. You can revisit any previous session.',
    placement: 'right',
  },
  {
    target: '[data-tour="tool-switcher"]',
    content: 'Switch between tools here. Each tool maintains its own conversation context.',
    placement: 'bottom',
  },
  {
    target: 'body',
    content: 'You\'re all set! Select a tool and start your first conversation.',
    placement: 'center',
    disableBeacon: true,
  }
];
```

### List of tasks to be completed in order

```yaml
Task 1:
MODIFY client/package.json:
  - ADD dependency: "react-joyride": "^2.5.5"
  - RUN: npm install

Task 2:
CREATE client/src/components/Tour/tourSteps.ts:
  - DEFINE tour step configuration array
  - INCLUDE all 6 steps from requirements
  - USE data-tour selectors for targeting

Task 3:
CREATE client/src/components/Tour/SimpleTour.tsx:
  - IMPORT Joyride from 'react-joyride'
  - IMPORT useContext for ThemeContext
  - IMPLEMENT tour component with theme-aware styling
  - HANDLE tour state and callbacks

Task 4:
CREATE client/src/components/Tour/TourButton.tsx:
  - MIRROR pattern from ArchivedChats.tsx
  - USE Button component with variant="outline"
  - IMPLEMENT onClick to trigger tour

Task 5:
CREATE client/src/components/Tour/index.ts:
  - EXPORT SimpleTour and TourButton components

Task 6:
MODIFY client/src/components/Nav/SettingsTabs/General/General.tsx:
  - IMPORT TourButton from Tour components
  - ADD TourButton after ArchivedChats section
  - MAINTAIN existing layout pattern

Task 7 (expanded):
ADD data-tour attributes to UI elements:
  - MODIFY client/src/components/SidePanel/index.tsx
    ADD: data-tour="tool-selector" to tools container
  - MODIFY client/src/components/Chat/ChatView.tsx
    ADD: data-tour="chat-interface" to main chat div
  - MODIFY client/src/components/Conversations/index.tsx
    ADD: data-tour="conversation-history" to conversation list
  - MODIFY client/src/components/Nav/Endpoint.tsx
    ADD: data-tour="tool-switcher" to endpoint selector

Task 8:
MODIFY client/src/components/Nav/Settings.tsx:
  - IMPORT SimpleTour component
  - ADD SimpleTour at root level of Settings
  - PASS tour state management props
```

### Per task pseudocode

```typescript
// Task 3 - SimpleTour.tsx pseudocode
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useContext } from 'react';
import { ThemeContext } from '~/hooks';
import { tourSteps } from './tourSteps';

export default function SimpleTour({ run, onClose }) {
  const { theme } = useContext(ThemeContext);
  
  // PATTERN: Theme-aware styles
  const styles = {
    options: {
      backgroundColor: theme === 'dark' ? '#000' : '#fff',
      textColor: theme === 'dark' ? '#fff' : '#000',
      primaryColor: '#10b981', // green-500 from CSS vars
      zIndex: 10000, // Above modals (z-50 = 50 in Tailwind)
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    tooltip: {
      backgroundColor: theme === 'dark' ? '#000' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
    },
  };

  // PATTERN: Handle tour callbacks with error boundary
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action } = data;
    
    // Handle missing elements gracefully
    if (type === 'error:target_not_found') {
      console.warn('Tour target not found:', data);
      // Continue to next step instead of breaking
      return;
    }
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onClose();
    }
    
    // DEBUG: Log step transitions
    console.log('Tour step:', data);
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      styles={styles}
      callback={handleJoyrideCallback}
    />
  );
}

// Task 4 - TourButton.tsx pattern
function TourButton() {
  const localize = useLocalize();
  const [showTour, setShowTour] = useState(false);
  
  return (
    <>
      <div className="flex items-center justify-between">
        <div>{localize('com_nav_take_tour')}</div>
        <Button 
          variant="outline" 
          onClick={() => setShowTour(true)}
          aria-label="Start tour"
        >
          {localize('com_ui_start_tour')}
        </Button>
      </div>
      {showTour && (
        <SimpleTour 
          run={showTour} 
          onClose={() => setShowTour(false)} 
        />
      )}
    </>
  );
}
```

### Integration Points
```yaml
LOCALIZATION:
  - add to: client/src/locales/en/translation.json
  - keys: 
    - "com_nav_take_tour": "Platform Tour"
    - "com_ui_start_tour": "Start Tour"
    - "com_ui_tour_step_1": "Welcome message..."
    # ... other tour step texts

UI ELEMENTS:
  - Sidebar: Add data-tour="tool-selector" to tools list container
  - Chat: Add data-tour="chat-interface" to main chat container
  - History: Add data-tour="conversation-history" to conversation list
  - Header: Add data-tour="tool-switcher" to endpoint selector

STYLES:
  - Ensure z-index hierarchy works with existing modals
  - Use existing theme variables for consistency
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
cd LibreChat/client
npm run lint          # ESLint checks
npm run type-check    # TypeScript validation

# Expected: No errors. If errors, READ and fix.
```

### Level 2: Component Tests
```typescript
// Test tour button renders in settings
describe('TourButton', () => {
  it('renders in General settings tab', () => {
    render(<General />);
    expect(screen.getByText('Platform Tour')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start tour' })).toBeInTheDocument();
  });

  it('starts tour on button click', () => {
    render(<General />);
    fireEvent.click(screen.getByRole('button', { name: 'Start tour' }));
    expect(screen.getByText('Welcome to SovereignAI!')).toBeInTheDocument();
  });
});
```

### Level 3: Manual Testing
```bash
# Start dev server
cd LibreChat
npm run frontend:dev

# Manual test checklist:
1. Open Settings (gear icon)
2. Stay on General tab
3. Find "Platform Tour" section
4. Click "Start Tour" button
5. Verify each step:
   - Welcome overlay appears
   - Tool selector highlighted
   - Chat interface highlighted
   - Conversation history highlighted
   - Tool switching highlighted
   - Completion message
6. Test "Skip" button works
7. Test tour can be restarted
8. Switch theme and verify styling updates
```

## Final Validation Checklist
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No ESLint errors: `npm run lint`
- [ ] Tour button appears in General settings
- [ ] All 6 tour steps work correctly
- [ ] Theme switching updates tour colors
- [ ] No console errors during tour
- [ ] Tour can be completed and restarted
- [ ] Skip button works at any step
- [ ] Z-index properly layers over UI

---

## Anti-Patterns to Avoid
- ❌ Don't auto-start tour on page load
- ❌ Don't use localStorage for persistence (development phase)
- ❌ Don't create custom tooltip components (use Joyride defaults)
- ❌ Don't hardcode colors (use theme variables)
- ❌ Don't target elements by class names (use data-tour attributes)
- ❌ Don't forget to handle missing elements gracefully

## Additional Error Handling

### Handle Dynamic Elements
```typescript
// In SimpleTour.tsx - Add retry logic for dynamic elements
useEffect(() => {
  if (run) {
    // Ensure all tour elements are rendered
    const checkElements = () => {
      const selectors = [
        '[data-tour="tool-selector"]',
        '[data-tour="chat-interface"]',
        '[data-tour="conversation-history"]',
        '[data-tour="tool-switcher"]'
      ];
      
      const missingElements = selectors.filter(
        selector => !document.querySelector(selector)
      );
      
      if (missingElements.length > 0) {
        console.warn('Missing tour elements:', missingElements);
      }
    };
    
    // Check after a delay to allow for rendering
    setTimeout(checkElements, 500);
  }
}, [run]);
```

## Confidence Score: 9/10

High confidence due to:
- Clear library documentation (React Joyride)
- Simple integration pattern
- Existing UI patterns to follow
- Minimal custom code required
- Detailed task breakdown with specific file paths
- Complete tour step definitions
- Error handling for missing elements

Minimal uncertainty on:
- Exact component structure in some files (easily verified during implementation)