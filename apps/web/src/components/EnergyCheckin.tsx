import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/Card';
import { Button } from '@repo/ui/Button';
import { useEnergyLog } from '../hooks/useEnergyLog';
import { useUserProfile } from '../hooks/useUserProfile';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../providers/AuthProvider';

const TAGS = ['Focused', 'Foggy', 'Jittery', 'Sluggish', 'Bloated', 'Hyper', 'Calm', 'Anxious'];

export function EnergyCheckin() {
  const { user } = useAuth();
  const { logEnergy, loading } = useEnergyLog();
  const [level, setLevel] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  
  // State for visibility logic
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [lastMealTime, setLastMealTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkEligibility = async () => {
      // 1. Get Last Meal
      const mealsRef = collection(db, 'users', user.uid, 'meal_logs');
      const mealQ = query(mealsRef, orderBy('loggedAt', 'desc'), limit(1));
      const mealSnap = await getDocs(mealQ);

      if (mealSnap.empty) {
        setCanCheckIn(false);
        return;
      }

      const mealData = mealSnap.docs[0].data();
      const mealTime = mealData.loggedAt?.toDate();
      const now = new Date();

      if (!mealTime) return;
      
      const diffMinutes = (now.getTime() - mealTime.getTime()) / (1000 * 60);

      // Rule: Can check in if meal was between 1 minute and 180 minutes ago (3 hours)
      // (Using 1 minute for testing purposes, realistically ~30 mins)
      if (diffMinutes > 1 && diffMinutes < 180) {
         // Optionally: Check if we already logged today? 
         // For now, let's just allow it if there's a recent meal.
         // A stricter check would be "Energy Log timestamp > Meal timestamp"
         
         const energyRef = collection(db, 'users', user.uid, 'energy_logs');
         // Check for any energy logs AFTER the meal time
         const energyQ = query(
             energyRef, 
             where('timestamp', '>', mealData.loggedAt), 
             limit(1)
         );
         const energySnap = await getDocs(energyQ);
         
         if (energySnap.empty) {
             setCanCheckIn(true);
             setLastMealTime(mealTime);
         } else {
             setCanCheckIn(false); // Already checked in for this meal
         }
      } else {
          setCanCheckIn(false);
      }
    };

    checkEligibility();
    
    // Poll every minute to see if a meal has "matured" enough to be checked on
    const interval = setInterval(checkEligibility, 60000);
    return () => clearInterval(interval);

  }, [user, submitted]); // Re-run when submission happens to hide it

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    const success = await logEnergy(level, selectedTags);
    if (success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setLevel(5);
        setSelectedTags([]);
      }, 3000); // Reset after 3s
    }
  };

  if (submitted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="flex flex-col items-center justify-center py-8 text-green-700">
          <div className="text-4xl mb-2">⚡</div>
          <p className="font-bold">Energy Logged!</p>
          <p className="text-sm">Great feedback.</p>
        </CardContent>
      </Card>
    );
  }

  // If not eligible, don't render anything (or could render placeholder)
  if (!canCheckIn) return null;

  return (
    <Card className="border-blue-200 shadow-md">
      <CardHeader className="bg-blue-50/50 pb-2">
        <CardTitle className="text-blue-900 flex items-center justify-between">
            <span>⚡ Energy Check-In</span>
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-normal border border-blue-200 rounded px-2 py-0.5 bg-white">
                Meal Feedback
            </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        
        {/* SLIDER SECTION */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-slate-500">Level</span>
            <span className={`text-2xl font-bold ${
              level >= 8 ? 'text-blue-600' : 
              level >= 4 ? 'text-slate-700' : 
              'text-orange-600'
            }`}>
              {level}/10
            </span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={level} 
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-slate-400 px-1">
            <span>Drained</span>
            <span>Neutral</span>
            <span>Peak</span>
          </div>
        </div>

        {/* TAGS SECTION */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-500 block">How do you feel?</span>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Logging...' : 'Log Energy'}
        </Button>
      </CardContent>
    </Card>
  );
}
