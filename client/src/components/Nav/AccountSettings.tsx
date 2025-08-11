import { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import * as Select from '@ariakit/react/select';
import { LogOut, Bookmark, Sparkles } from 'lucide-react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { LinkIcon, GearIcon, DropdownMenuSeparator } from '~/components';
import { useGetStartupConfig, useGetUserBalance } from '~/data-provider';
import { TagsView } from '~/components/Tags';
import { useAuthContext } from '~/hooks/AuthContext';
import useAvatar from '~/hooks/Messages/useAvatar';
import { UserIcon } from '~/components/svg';
import { useLocalize, useNewConvo } from '~/hooks';
import Settings from './Settings';
import store from '~/store';

function AccountSettings() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const balanceQuery = useGetUserBalance({
    enabled: !!isAuthenticated && startupConfig?.balance?.enabled,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { newConversation } = useNewConvo();

  const avatarSrc = useAvatar(user);
  const avatarSeed = user?.avatar || user?.name || user?.username || '';

  const handleStartOnboarding = useCallback(() => {
    // Close the dropdown
    setIsOpen(false);
    
    // Start a new conversation with SovereignJK (default assistant)
    // First create the conversation with the default spec
    newConversation({
      preset: {
        endpoint: 'assistants',
        assistant_id: 'asst_DNG0tQhg9fMNwz0pAmZyMOpB',
        model: 'gpt-4o',
        spec: 'SovereignJK',
      },
      template: {
        endpoint: 'assistants',
        assistant_id: 'asst_DNG0tQhg9fMNwz0pAmZyMOpB',
        model: 'gpt-4o',
        spec: 'SovereignJK',
      },
      keepLatestMessage: false,
      buildDefault: false,
      disableFocus: false,
    });
    
    // Navigate with initial onboarding text after a brief delay
    setTimeout(() => {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/c/')) {
        navigate(currentPath, {
          replace: true,
          state: { 
            focusChat: true,
            initialText: "I'm new here and would like to go through the onboarding process to set up my business profile and learn how to use this platform effectively."
          }
        });
      }
    }, 200);
  }, [newConversation, navigate]);

  return (
    <Select.SelectProvider>
      <Select.Select
        aria-label={localize('com_nav_account_settings')}
        data-testid="nav-user"
        data-tour="account-settings"
        className="mt-text-sm flex h-auto w-full items-center gap-2 rounded-xl border border-border-light p-2 text-sm shadow-sm transition-all duration-200 ease-in-out hover:bg-surface-hover"
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <div className="-ml-0.9 -mt-0.8 h-8 w-8 flex-shrink-0">
          <div className="relative flex">
            {avatarSeed.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'rgb(121, 137, 255)',
                  width: '32px',
                  height: '32px',
                  boxShadow: 'rgba(240, 246, 252, 0.1) 0px 0px 0px 1px',
                }}
                className="relative flex items-center justify-center rounded-full p-1 text-text-primary"
                aria-hidden="true"
              >
                <UserIcon />
              </div>
            ) : (
              <img
                className="rounded-full"
                src={(user?.avatar ?? '') || avatarSrc}
                alt={`${user?.name || user?.username || user?.email || ''}'s avatar`}
              />
            )}
          </div>
        </div>
        <div className="flex grow items-center justify-between">
          <div
            className="overflow-hidden text-ellipsis whitespace-nowrap text-left text-text-primary"
          >
            {user?.name ?? user?.username ?? localize('com_nav_user')}
          </div>
          <ChevronDownIcon 
            className={`ml-2 h-4 w-4 flex-shrink-0 text-text-secondary transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </Select.Select>
      <Select.SelectPopover
        className="popover-ui w-[235px]"
        style={{
          transformOrigin: 'bottom',
          marginRight: '0px',
          translate: '0px',
        }}
      >
        <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note">
          {user?.email ?? localize('com_nav_user')}
        </div>
        <DropdownMenuSeparator />
        {startupConfig?.balance?.enabled === true && balanceQuery.data != null && (
          <>
            <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note">
              {localize('com_nav_balance')}:{' '}
              {new Intl.NumberFormat().format(Math.round(balanceQuery.data.tokenCredits))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <Select.SelectItem
          value=""
          onClick={() => setShowBookmarks(true)}
          className="select-item text-sm"
        >
          <Bookmark className="icon-md" aria-hidden="true" />
          {localize('com_ui_tags')}
        </Select.SelectItem>
        <Select.SelectItem
          value=""
          onClick={handleStartOnboarding}
          className="select-item text-sm"
        >
          <Sparkles className="icon-md" aria-hidden="true" />
          {localize('com_nav_onboarding_assistant') || 'Onboarding Assistant'}
        </Select.SelectItem>
        <Select.SelectItem
          value=""
          onClick={() => setShowSettings(true)}
          className="select-item text-sm"
        >
          <GearIcon className="icon-md" aria-hidden="true" />
          {localize('com_nav_settings')}
        </Select.SelectItem>
        <DropdownMenuSeparator />
        <Select.SelectItem
          aria-selected={true}
          onClick={() => logout()}
          value="logout"
          className="select-item text-sm"
        >
          <LogOut className="icon-md" />
          {localize('com_nav_log_out')}
        </Select.SelectItem>
      </Select.SelectPopover>
      {showBookmarks && <TagsView open={showBookmarks} onOpenChange={setShowBookmarks} />}
      {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
    </Select.SelectProvider>
  );
}

export default memo(AccountSettings);
