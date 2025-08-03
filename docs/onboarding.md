FEATURE: Simple App Tour with React Joyride
Basic onboarding tour using React Joyride that highlights key features of the platform. Black/white theme matching the app design, with a Tour button in settings to replay the tour anytime.
EXAMPLES:
In the examples/ folder:

examples/tour/SimpleTour.jsx - Main tour component with basic steps highlighting tool selection, chat interface, and conversation history
examples/tour/tour-steps.js - Simple 5-6 step tour flow focusing on core features
examples/tour/TourButton.jsx - Settings menu tour button component for manual tour restart
examples/tour/integration.md - Quick integration guide for adding tour to existing LibreChat

DOCUMENTATION:

React Joyride: https://docs.react-joyride.com/
React Joyride Basic Usage: https://docs.react-joyride.com/basic-usage
React Joyride Styling: https://docs.react-joyride.com/styling
LibreChat Settings Component Location: Check existing settings panel implementation

OTHER CONSIDERATIONS:
Implementation Requirements:

Install react-joyride package
Create simple tour component with 5-6 essential steps
Add Tour button to settings menu
Black/white theme matching app design
No demo conversations or complex state management
Tour runs on button click (not automatically)

Tour Steps:

Welcome - Brief platform introduction
Tool Selection - Highlight sidebar with 6 available tools
Chat Interface - Where conversations happen
Conversation History - Saved conversations in sidebar
Tool Switching - How each tool maintains separate context
Getting Started - Encouragement to try first tool

Styling:

Black overlay with white tooltip
Minimal design matching app aesthetic
No custom tooltip component needed (use defaults)
Simple spotlight effect on highlighted elements

Integration Points:

Add data-tour attributes to key UI elements
Tour button in settings menu
No localStorage needed for development
Simple callback to close tour when finished

Development Workflow:

Click Tour button in settings to test
Tour resets on every button click
No persistence during development
Console logs for debugging step transitions