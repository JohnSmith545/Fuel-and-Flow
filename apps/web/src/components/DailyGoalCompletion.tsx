import { useState, useEffect } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDailyStats } from '../hooks/useDailyStats';

export function DailyGoalCompletion() {
  const { profile } = useUserProfile();
  const { saveDailyStats, getTodayDateString, aggregateDailyData } = useDailyStats();
  const [glassesConsumed, setGlassesConsumed] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Calculate recommended glasses based on weight (35ml per kg of body weight)
  // 1 glass = 250ml, so recommended liters * 4 = glasses
  const recommendedGlasses = profile?.weight
    ? Math.round((profile.weight * 0.035) / 0.25)
    : 8; // Default to 8 glasses if weight not available

  // Load from localStorage on mount and handle daily reset
  useEffect(() => {
    const storedData = localStorage.getItem('hydrationData');
    const today = new Date().toDateString();

    if (storedData) {
      const { lastDate, count } = JSON.parse(storedData);
      // If it's a new day, reset to 0; otherwise, restore the saved count
      if (lastDate === today) {
        setGlassesConsumed(count);
      } else {
        setGlassesConsumed(0);
        localStorage.setItem('hydrationData', JSON.stringify({ lastDate: today, count: 0 }));
      }
    } else {
      // First time or localStorage cleared
      localStorage.setItem('hydrationData', JSON.stringify({ lastDate: today, count: 0 }));
      setGlassesConsumed(0);
    }
    setHasLoaded(true);
  }, []);

  // Save to localStorage whenever glassesConsumed changes
  useEffect(() => {
    if (hasLoaded) {
      const today = new Date().toDateString();
      localStorage.setItem('hydrationData', JSON.stringify({ lastDate: today, count: glassesConsumed }));

      // Also save to daily stats
      aggregateDailyData(getTodayDateString()).then(stats => {
        saveDailyStats({ ...stats, hydrationGlasses: glassesConsumed });
      });
    }
  }, [glassesConsumed, hasLoaded, getTodayDateString, saveDailyStats, aggregateDailyData]);

  const handleAddGlass = () => {
    setGlassesConsumed(prev => prev + 1);
  };

  const handleRemoveGlass = () => {
    setGlassesConsumed(prev => (prev > 0 ? prev - 1 : 0));
  };

  const progressPercentage = Math.min((glassesConsumed / recommendedGlasses) * 100, 100);

  return (
    <div className="glass p-4 md:p-6 rounded-xl flex flex-col justify-between bg-white/70 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800">
      <div>
        <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-4">
          Daily Hydration Check
        </h3>
        <div className="flex items-center justify-center py-6">
          {/* Water Glass Counter */}
          <div className="flex flex-col items-center">
            <div className="text-5xl font-black text-blue-500 mb-2">{glassesConsumed}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              of {recommendedGlasses} glasses
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mb-6">
              (8 oz per glass)
            </div>
            
            {/* +/- Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleRemoveGlass}
                className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold text-2xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                aria-label="Remove glass"
              >
                −
              </button>
              <button
                onClick={handleAddGlass}
                className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-2xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                aria-label="Add glass"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Hydration Goal</span>
          <span className={`font-bold ${progressPercentage >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
