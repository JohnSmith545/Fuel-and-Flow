import { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../providers/AuthProvider';
import { Link } from '@tanstack/react-router';

interface SidebarProps {
  onSettingsClick: () => void;
}

export function Sidebar({ onSettingsClick }: SidebarProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const navItems = [
    { id: 'dashboard', to: '/dashboard', icon: 'dashboard', label: 'Dashboard', premium: false },
    { id: 'nutrition', to: '/nutrition', icon: 'restaurant', label: 'Nutrition', premium: false },
    { id: 'analytics', to: '/analytics', icon: 'insights', label: 'Analytics', premium: true },
  ] as const;

  const isPremium = profile?.role === 'premium';

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-20 lg:w-64 border-r border-primary/10 bg-white/50 dark:bg-background-dark/50 flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-icons-round">bolt</span>
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tight uppercase italic">Fuel&Flow</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isLocked = item.premium && !isPremium;
            
            if (isLocked) {
              return (
                <button
                  key={item.id}
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg transition-all relative text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                >
                  <span className="material-icons-round">{item.icon}</span>
                  <span className="hidden lg:flex items-center gap-2 font-medium">
                    {item.label}
                    <span className="material-icons-round text-sm text-yellow-600">lock</span>
                  </span>
                  <span className="lg:hidden material-icons-round text-sm text-yellow-600 absolute top-1 right-1">lock</span>
                </button>
              )
            }

            return (
              <Link
                key={item.id}
                to={item.to}
                className="w-full flex items-center gap-4 p-3 rounded-lg transition-all relative text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary"
                activeProps={{
                  className: 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary hover:text-white',
                }}
              >
                <span className="material-icons-round">{item.icon}</span>
                <span className="hidden lg:flex items-center gap-2 font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-primary/10">
          <button 
              onClick={onSettingsClick}
              className="w-full flex items-center gap-4 p-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <span className="material-icons-round">settings</span>
            <span className="hidden lg:block font-medium">Settings</span>
          </button>
          
          <div className="mt-4 flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                   {/* Placeholder for user avatar if not available */}
                   <img 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYCKTG15lGtEJLOk3zEO7cgl5sEQ_uB3sEncpJrzGW-y8uEDw2_PeuOOhoUhNLEQfNsbqwKcYj9f06pwq6scd_yLZUqdg7hMUdSmWUHzYv2cOJqSloI76Uy1Q87Tbc9Vgq1NHWFi052FgWDaI96eo0as9QIfz8u9v_5tf9YBPmM3-EOnYrHeQmOHt95Ey1xZsfw719uJ-1j3zO9FD5NXS3aY8DWcuu5ZqoVkmm-2uJCUvo8Tip_4impgHASUmR_qn7OWU0uJ7Z1Q"
                      alt="User Avatar"
                  />
            </div>
            <div className="hidden lg:block overflow-hidden text-left">
              <p className="text-sm font-semibold truncate">{profile?.displayName || user?.email}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.goal ? profile.goal.replace(/_/g, ' ') : 'User'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 px-6 py-3 grid grid-cols-4 pb-safe justify-items-center">
        {navItems.map((item) => {
          const isLocked = item.premium && !isPremium;

          if (isLocked) {
             return (
                <button
                  key={item.id}
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full flex flex-col items-center gap-1 transition-all relative text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50"
                >
                  <div className="p-1.5 rounded-xl transition-all relative">
                     <span className="material-icons-round text-2xl">{item.icon}</span>
                     <span className="material-icons-round text-xs text-yellow-600 absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">lock</span>
                  </div>
                </button>
             )
          }

          return (
            <Link
              key={item.id}
              to={item.to}
              className="w-full flex flex-col items-center gap-1 transition-all relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              activeProps={{
                className: 'text-primary',
              }}
            >
              {({ isActive }) => (
                  <div className={`p-1.5 rounded-xl transition-all relative ${isActive ? 'bg-primary/10' : ''}`}>
                     <span className="material-icons-round text-2xl">{item.icon}</span>
                  </div>
              )}
            </Link>
          );
        })}
        <button
          onClick={onSettingsClick}
          className="w-full flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
        >
          <div className="p-1.5">
             <span className="material-icons-round text-2xl">settings</span>
          </div>
        </button>
      </nav>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-4xl text-yellow-500">lock</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Premium Feature</h2>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
              Unlock in-depth energy analytics, personalized insights, and advanced tracking with Premium.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
