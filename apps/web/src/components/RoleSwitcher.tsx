import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../providers/AuthProvider';
import { useUserProfile } from '../hooks/useUserProfile';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// REPLACE THIS WITH YOUR ACTUAL UID
const DEV_UID = '0bCWXroxotWC2LGRlgfiJFEkQFy2';

export function RoleSwitcher({ 
  onAnalyticsToggle, 
  isAnalyticsTesterOpen 
}: { 
  onAnalyticsToggle?: (isOpen: boolean) => void;
  isAnalyticsTesterOpen?: boolean;
}) {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !profile) return null;

  // Only the specific Dev/Admin user can see this
  if (user.uid !== DEV_UID) {
    return null;
  }

  const updateRole = async (role: 'free' | 'premium') => {
    if (!profile) return;
    try {
      await updateProfile({ role });
    } catch (err) {
      console.error("Failed to switch role", err);
      alert("Failed to switch role");
    }
  };

  const resetOnboarding = async () => {
    if (!profile) return;
    try {
        // Optimistic update makes this instant - no delay needed
        await updateProfile({ onboardingCompleted: false });
        navigate({ to: '/onboarding' });
    } catch (err) {
        console.error("Failed to reset onboarding", err);
        alert("Failed to reset onboarding");
    }
  };

  const generateMockEnergyData = async () => {
    if (!user) return;
    try {
        const logsRef = collection(db, 'users', user.uid, 'energy_logs');
        const now = new Date();
        
        // Generate points for the last 12 hours
        for (let i = 0; i < 10; i++) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000); // 1 hour intervals
            const level = Math.floor(Math.random() * 8) + 2; // Random level 2-9
            await addDoc(logsRef, {
                level,
                tags: ['Mock Data'],
                timestamp: Timestamp.fromDate(time)
            });
        }
        alert("Generated 10 mock energy logs!");
    } catch (err) {
        console.error("Error generating data", err);
        alert("Failed to generate data");
    }
  };

  return (

    <>
      {/* Mobile Toggle Button (Bottom Right) */}
      <div className="md:hidden fixed bottom-24 right-4 z-[60]">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-900 text-white p-3 rounded-full shadow-lg border border-yellow-500/50 hover:bg-slate-800 transition-all active:scale-95"
          title="Dev Tools"
        >
          <span className="material-icons-round text-xl text-yellow-500">{isOpen ? 'close' : 'build'}</span>
        </button>
      </div>

      {/* Desktop Toggle Button (Bottom Right) */}
      <div className="hidden md:block fixed bottom-4 right-20 z-[60]">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-900 text-white p-3 rounded-full shadow-lg border border-yellow-500/50 hover:bg-slate-800 transition-all active:scale-95"
          title="Dev Tools"
        >
          <span className="material-icons-round text-xl text-yellow-500">{isOpen ? 'close' : 'build'}</span>
        </button>
      </div>

      {/* Panel Content - Toggleable on both Mobile and Desktop */}
      <div className={`
        fixed z-50 bg-slate-900 text-white p-4 rounded-lg shadow-2xl border border-yellow-500/50
        transition-all duration-200 origin-bottom-right overflow-y-auto max-h-96 w-80
        ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}
        
        /* Mobile Positioning: Above the toggle button */
        bottom-40 right-4 
        
        /* Desktop Positioning: Above the toggle button at right */
        md:bottom-20 md:right-20 md:left-auto
      `}>
       <div className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wide flex items-center justify-between">
          🔧 Dev Role Switcher
          <span className="md:hidden text-[10px] bg-slate-800 text-yellow-500 px-1 rounded border border-yellow-500/30">Dev</span>
       </div>
       
       <div className="text-[10px] text-slate-400 mb-3 font-mono bg-slate-800 p-2 rounded border border-slate-700 select-all truncate">
          UID: <span className="text-slate-300">{user.uid}</span>
       </div>

       <div className="space-y-3">
         {/* Role Selection */}
         <div>
            <div className="text-xs font-semibold text-slate-300 mb-1">User Role:</div>
            <div className="flex gap-2">
                <button
                onClick={() => updateRole('free')}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors border ${
                    profile?.role === 'free' || !profile?.role
                    ? 'bg-slate-700 text-white border-slate-500' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
                >
                Free
                </button>
                <button
                onClick={() => updateRole('premium')}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors border ${
                    profile?.role === 'premium'
                    ? 'bg-yellow-600 text-white border-yellow-400' 
                    : 'bg-slate-800 text-yellow-600 border-slate-700 hover:bg-slate-700'
                }`}
                >
                Premium
                </button>
            </div>
         </div>

         <div className="border-t border-slate-700"></div>

         {/* Actions */}
         <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Actions:</div>
            <button
                onClick={resetOnboarding}
                className="w-full px-2 py-1 rounded text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors border border-slate-600"
            >
                ↺ Reset Onboarding
            </button>
            <button
                onClick={generateMockEnergyData}
                className="w-full px-2 py-1 rounded text-xs font-medium bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 transition-colors border border-blue-800"
            >
                ⚡ Gen Mock Energy (10x)
            </button>
            <button
                onClick={() => {
                onAnalyticsToggle?.(!isAnalyticsTesterOpen);
                }}
                className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors border ${
                isAnalyticsTesterOpen
                    ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700 hover:bg-yellow-900/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
            >
                {isAnalyticsTesterOpen ? '📊 Hide Analytics Tester' : '📊 Show Analytics Tester'}
            </button>
         </div>
       </div>
    </div>
    </>
  );
}
