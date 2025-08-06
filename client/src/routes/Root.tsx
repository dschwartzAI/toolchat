import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import type { ContextType } from '~/common';
import {
  useAuthContext,
  useAssistantsMap,
  useAgentsMap,
  useFileMap,
  useSearchEnabled,
} from '~/hooks';
import {
  AgentsMapContext,
  AssistantsMapContext,
  FileMapContext,
  SetConvoProvider,
} from '~/Providers';
import TermsAndConditionsModal from '~/components/ui/TermsAndConditionsModal';
import { useUserTermsQuery, useGetStartupConfig } from '~/data-provider';
import { Nav, MobileNav } from '~/components/Nav';
import AcademySidebar from '~/components/Academy/AcademySidebar';
import { useHealthCheck } from '~/data-provider';
import { Banner } from '~/components/Banners';
import { migrateLocalStorage } from '~/utils/localStorage';

export default function Root() {
  const [showTerms, setShowTerms] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [navVisible, setNavVisible] = useState(() => {
    const savedNavVisible = localStorage.getItem('navVisible');
    return savedNavVisible !== null ? JSON.parse(savedNavVisible) : true;
  });
  const [academyVisible, setAcademyVisible] = useState(() => {
    const savedAcademyVisible = localStorage.getItem('academyVisible');
    return savedAcademyVisible !== null ? JSON.parse(savedAcademyVisible) : false;
  });

  const { isAuthenticated, logout } = useAuthContext();

  // Global health check - runs once per authenticated session
  useHealthCheck(isAuthenticated);

  const assistantsMap = useAssistantsMap({ isAuthenticated });
  const agentsMap = useAgentsMap({ isAuthenticated });
  const fileMap = useFileMap({ isAuthenticated });

  const { data: config } = useGetStartupConfig();
  const { data: termsData } = useUserTermsQuery({
    enabled: isAuthenticated && config?.interface?.termsOfService?.modalAcceptance === true,
  });

  useSearchEnabled(isAuthenticated);

  // Run migration on mount
  useEffect(() => {
    migrateLocalStorage();
  }, []);

  // Save academy visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('academyVisible', JSON.stringify(academyVisible));
  }, [academyVisible]);

  useEffect(() => {
    if (termsData) {
      setShowTerms(!termsData.termsAccepted);
    }
  }, [termsData]);

  const handleAcceptTerms = () => {
    setShowTerms(false);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
    logout('/login?redirect=false');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SetConvoProvider>
      <FileMapContext.Provider value={fileMap}>
        <AssistantsMapContext.Provider value={assistantsMap}>
          <AgentsMapContext.Provider value={agentsMap}>
            <Banner onHeightChange={setBannerHeight} />
            <div className="flex" style={{ height: `calc(100dvh - ${bannerHeight}px)` }}>
              <div className="relative z-0 flex h-full w-full overflow-hidden">
                <Nav 
                  navVisible={navVisible} 
                  setNavVisible={setNavVisible}
                  academyVisible={academyVisible}
                  setAcademyVisible={setAcademyVisible}
                />
                {academyVisible && (
                  <div className="border-r border-border-light">
                    <AcademySidebar onClose={() => setAcademyVisible(false)} />
                  </div>
                )}
                <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
                  <MobileNav setNavVisible={setNavVisible} />
                  <Outlet context={{ navVisible, setNavVisible } satisfies ContextType} />
                </div>
              </div>
            </div>
          </AgentsMapContext.Provider>
          {config?.interface?.termsOfService?.modalAcceptance === true && (
            <TermsAndConditionsModal
              open={showTerms}
              onOpenChange={setShowTerms}
              onAccept={handleAcceptTerms}
              onDecline={handleDeclineTerms}
              title={config.interface.termsOfService.modalTitle}
              modalContent={config.interface.termsOfService.modalContent}
            />
          )}
        </AssistantsMapContext.Provider>
      </FileMapContext.Provider>
    </SetConvoProvider>
  );
}
