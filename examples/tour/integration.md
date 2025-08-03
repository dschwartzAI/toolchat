# Quick Integration Guide for LibreChat Tour

## 1. Install React Joyride

```bash
cd LibreChat/client
npm install react-joyride@^2.5.5
```

## 2. Add Tour Components

Create the following files in `client/src/components/Tour/`:

- `SimpleTour.tsx` - Main tour component (copy from examples)
- `TourButton.tsx` - Settings button component (copy from examples)
- `tourSteps.ts` - Tour step definitions (copy from examples)
- `index.ts` - Export all components

## 3. Update General Settings Tab

In `client/src/components/Nav/SettingsTabs/General/General.tsx`:

```tsx
// Add import at top
import TourButton from '~/components/Tour/TourButton';

// Add after ArchivedChats section (around line 159)
<div className="pb-3">
  <TourButton />
</div>
```

## 4. Add data-tour Attributes

Add these attributes to key UI elements:

### Tool Selector (Sidebar)
In the sidebar component where tools are listed:
```tsx
<div data-tour="tool-selector" className="existing-classes">
  {/* Tool list */}
</div>
```

### Chat Interface
In the main chat view:
```tsx
<div data-tour="chat-interface" className="existing-classes">
  {/* Chat messages */}
</div>
```

### Conversation History
In the conversation list:
```tsx
<div data-tour="conversation-history" className="existing-classes">
  {/* Conversation items */}
</div>
```

### Tool Switcher
In the header endpoint selector:
```tsx
<div data-tour="tool-switcher" className="existing-classes">
  {/* Endpoint selector */}
</div>
```

## 5. Add Translations (Optional)

In `client/src/locales/en/translation.json`:

```json
{
  "com_nav_platform_tour": "Platform Tour",
  "com_ui_start_tour": "Start Tour"
}
```

## 6. Test the Integration

1. Run the development server
2. Open Settings (gear icon)
3. Look for "Platform Tour" in General tab
4. Click "Start Tour" button
5. Verify all steps work correctly

## Troubleshooting

### Tour not showing?
- Check browser console for errors
- Verify data-tour attributes are on rendered elements
- Ensure z-index is high enough (10000)

### Elements not highlighting?
- Make sure target elements are visible
- Check that data-tour attribute matches step target
- Elements might be lazy-loaded - add delays if needed

### Theme issues?
- Verify ThemeContext is properly imported
- Check that theme variables are applied to Joyride styles