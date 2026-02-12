import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { ProfileSettings } from './ProfileSettings';
import { RoleSwitcher } from './RoleSwitcher';
import { DevDailyAnalyticsTest } from './DevDailyAnalyticsTest';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAnalyticsTester, setShowAnalyticsTester] = useState(false);

  return (
    <div className="flex flex-col md:flex-row bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen">
      <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} />
      {/* Mobile: content takes remaining height minus bottom nav. Desktop: content takes full height */}
      <main className="flex-1 flex flex-col h-[calc(100vh-80px)] md:h-screen overflow-y-auto pb-20 md:pb-0 relative">
        {children}

        {/* Role Switcher - Self-positioned */}
        <RoleSwitcher 
          onAnalyticsToggle={setShowAnalyticsTester} 
          isAnalyticsTesterOpen={showAnalyticsTester} 
        />

        {/* Dev Testing Component - Only shows in dev mode */}
        <DevDailyAnalyticsTest isOpen={showAnalyticsTester} />
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="relative w-full max-w-2xl bg-transparent">
               <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2"
               >
                   Close <span className="material-icons-round">close</span>
               </button>
               <ProfileSettings />
           </div>
        </div>
      )}
    </div>
  );
}
