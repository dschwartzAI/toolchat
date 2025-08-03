// Custom Navigation Component for Business Users
// This is an example of how to customize LibreChat's navigation

import React from 'react';
import { useAuthContext } from '@librechat/ui';

// Example custom navigation that hides technical options
export const CustomBusinessNav = ({ children, ...props }) => {
  const { user } = useAuthContext();
  
  // Filter navigation items based on user tier
  const filterNavItems = (items) => {
    if (!user) return [];
    
    const allowedItems = {
      free: ['new-chat', 'conversations', 'settings', 'logout'],
      premium: ['new-chat', 'conversations', 'agents', 'settings', 'logout'],
      admin: ['new-chat', 'conversations', 'agents', 'settings', 'admin', 'logout']
    };
    
    const userTier = user.tier || 'free';
    const allowed = allowedItems[userTier] || allowedItems.free;
    
    return items.filter(item => allowed.includes(item.id));
  };
  
  // Custom nav items with business-friendly labels
  const businessNavItems = [
    {
      id: 'new-chat',
      label: 'New Session',
      icon: '➕',
      action: 'newChat'
    },
    {
      id: 'conversations',
      label: 'My Sessions',
      icon: '📋',
      action: 'conversations'
    },
    {
      id: 'agents',
      label: 'Business Tools',
      icon: '🛠️',
      action: 'agents',
      premiumOnly: true
    },
    {
      id: 'settings',
      label: 'Preferences',
      icon: '⚙️',
      action: 'settings'
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: '👤',
      action: 'admin',
      adminOnly: true
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: '🚪',
      action: 'logout'
    }
  ];
  
  // Filter items based on user tier
  const visibleItems = filterNavItems(businessNavItems);
  
  return (
    <nav className="business-nav">
      <div className="nav-header">
        <h1>AI Business Tools</h1>
        {user && (
          <span className={`user-tier tier-${user.tier}`}>
            {user.tier === 'premium' ? '⭐ Premium' : user.tier === 'admin' ? '👑 Admin' : 'Free'}
          </span>
        )}
      </div>
      
      <ul className="nav-items">
        {visibleItems.map(item => (
          <li key={item.id} className="nav-item">
            <button 
              className="nav-button"
              onClick={() => handleNavAction(item.action)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      
      {user?.tier === 'free' && (
        <div className="upgrade-prompt">
          <p>🚀 Unlock all business tools</p>
          <button className="upgrade-button">
            Upgrade to Premium
          </button>
        </div>
      )}
    </nav>
  );
};

// Helper function to handle navigation actions
const handleNavAction = (action) => {
  switch (action) {
    case 'newChat':
      // LibreChat's new chat action
      window.location.href = '/chat/new';
      break;
    case 'conversations':
      // Show conversations panel
      window.location.href = '/chat';
      break;
    case 'agents':
      // Show agents/business tools
      window.location.href = '/agents';
      break;
    case 'settings':
      // Show settings
      window.location.href = '/settings';
      break;
    case 'admin':
      // Admin panel
      window.location.href = '/admin';
      break;
    case 'logout':
      // Logout action
      window.location.href = '/logout';
      break;
    default:
      break;
  }
};

// Custom styles for business-friendly UI
export const customNavStyles = `
  .business-nav {
    background: #f8f9fa;
    padding: 20px;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .nav-header {
    margin-bottom: 30px;
    text-align: center;
  }
  
  .nav-header h1 {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 10px;
  }
  
  .user-tier {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .tier-free {
    background: #e3f2fd;
    color: #1976d2;
  }
  
  .tier-premium {
    background: #fff3e0;
    color: #f57c00;
  }
  
  .tier-admin {
    background: #f3e5f5;
    color: #7b1fa2;
  }
  
  .nav-items {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
  }
  
  .nav-item {
    margin-bottom: 8px;
  }
  
  .nav-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    color: #333;
  }
  
  .nav-button:hover {
    background: #f5f5f5;
    border-color: #2196f3;
    transform: translateX(4px);
  }
  
  .nav-icon {
    font-size: 1.25rem;
  }
  
  .upgrade-prompt {
    margin-top: auto;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    text-align: center;
  }
  
  .upgrade-prompt p {
    margin-bottom: 12px;
    font-weight: 500;
  }
  
  .upgrade-button {
    background: white;
    color: #667eea;
    border: none;
    padding: 8px 24px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .upgrade-button:hover {
    transform: scale(1.05);
  }
`;

export default CustomBusinessNav;