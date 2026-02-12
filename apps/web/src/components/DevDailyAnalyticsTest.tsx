import { useState } from 'react';
import { useDailyStats, DailyStats } from '../hooks/useDailyStats';
import { useAuth } from '../providers/AuthProvider';
import { collection, addDoc, serverTimestamp, Timestamp, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Dev Testing Component for Daily Analytics
 * Only visible in development - shows current day stats and allows test data generation
 * Pass isOpen prop from RoleSwitcher to toggle visibility
 */
export function DevDailyAnalyticsTest({ isOpen }: { isOpen: boolean }) {
  const { user } = useAuth();
  const { aggregateDailyData, saveDailyStats, getTodayDateString, loadDailyStats } = useDailyStats();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) {
    return null; // Don't render when closed
  }

  const handleAggregateToday = async () => {
    setLoading(true);
    setMessage('Aggregating today\'s data...');
    try {
      const todayStats = await aggregateDailyData(getTodayDateString());
      setStats(todayStats);
      setMessage('✅ Aggregation complete');
    } catch (err) {
      setMessage('❌ Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToday = async () => {
    if (!stats) {
      setMessage('⚠️ No stats to save. Aggregate first.');
      return;
    }
    setLoading(true);
    setMessage('Saving to Firebase...');
    try {
      await saveDailyStats(stats);
      setMessage('✅ Saved to Firebase');
    } catch (err) {
      setMessage('❌ Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadToday = async () => {
    setLoading(true);
    setMessage('Loading today\'s stats from Firebase...');
    try {
      const loaded = await loadDailyStats(getTodayDateString());
      if (loaded) {
        setStats(loaded);
        setMessage('✅ Loaded from Firebase');
      } else {
        setMessage('⚠️ No saved stats found');
      }
    } catch (err) {
      setMessage('❌ Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestMeal = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('Creating test meal...');
    try {
      const mealsRef = collection(db, 'users', user.uid, 'meals');
      await addDoc(mealsRef, {
        name: 'Test Meal - ' + new Date().toLocaleTimeString(),
        calories: Math.floor(Math.random() * 500) + 300,
        protein: Math.floor(Math.random() * 30) + 20,
        carbs: Math.floor(Math.random() * 60) + 30,
        fat: Math.floor(Math.random() * 20) + 10,
        loggedAt: serverTimestamp(),
      });
      setMessage('✅ Test meal created');
    } catch (err) {
      setMessage('❌ Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestEnergyLog = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('Creating test energy log...');
    try {
      const energyRef = collection(db, 'users', user.uid, 'energy_logs');
      const level = Math.floor(Math.random() * 8) + 3; // 3-10
      await addDoc(energyRef, {
        level,
        tags: ['test', level > 7 ? 'high' : 'normal'],
        timestamp: serverTimestamp(),
      });
      setMessage('✅ Test energy log created');
    } catch (err) {
      setMessage('❌ Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestHydration = () => {
    setMessage('Testing hydration data...');
    const today = new Date().toDateString();
    const testData = { lastDate: today, count: Math.floor(Math.random() * 8) + 2 };
    localStorage.setItem('hydrationData', JSON.stringify(testData));
    setMessage(`✅ Hydration set to ${testData.count} glasses`);
  };

  const handleCreateTestYesterdayData = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('Clearing old test data...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const [startOfDay, endOfDay] = getDateRange(yesterday);

      // Delete old meals for yesterday
      const mealsRef = collection(db, 'users', user.uid, 'meals');
      const mealsQuery = query(
        mealsRef,
        where('loggedAt', '>=', startOfDay),
        where('loggedAt', '<=', endOfDay)
      );
      const oldMeals = await getDocs(mealsQuery);
      for (const doc of oldMeals.docs) {
        await deleteDoc(doc.ref);
      }

      // Delete old energy logs for yesterday
      const energyRef = collection(db, 'users', user.uid, 'energy_logs');
      const energyQuery = query(
        energyRef,
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay)
      );
      const oldEnergy = await getDocs(energyQuery);
      for (const doc of oldEnergy.docs) {
        await deleteDoc(doc.ref);
      }

      setMessage('Creating fresh test data for yesterday...');

      // Create 2 meals at specific times
      const mealTimes = [8, 12]; // 8am and 12pm
      for (let i = 0; i < mealTimes.length; i++) {
        const mealTime = new Date(yesterday);
        mealTime.setHours(mealTimes[i], Math.floor(Math.random() * 60), 0);
        await addDoc(mealsRef, {
          name: `Yesterday's Test Meal ${i + 1}`,
          calories: Math.floor(Math.random() * 500) + 300,
          protein: Math.floor(Math.random() * 30) + 20,
          carbs: Math.floor(Math.random() * 60) + 30,
          fat: Math.floor(Math.random() * 20) + 10,
          loggedAt: Timestamp.fromDate(mealTime),
        });

        // Create energy log right after each meal
        const energyTime = new Date(mealTime);
        energyTime.setMinutes(energyTime.getMinutes() + 30); // 30 minutes after meal
        const level = Math.floor(Math.random() * 8) + 3;
        await addDoc(energyRef, {
          level,
          tags: ['test', level > 7 ? 'high' : level < 5 ? 'low' : 'normal'],
          timestamp: Timestamp.fromDate(energyTime),
        });
      }

      // Aggregate and save yesterday's stats
      const yesterdayString = yesterday.toISOString().split('T')[0];
      const yesterdayStats = await aggregateDailyData(yesterdayString);
      
      // Add hydration for yesterday
      const yesterdayWithHydration = { 
        ...yesterdayStats, 
        hydrationGlasses: Math.floor(Math.random() * 8) + 2 
      };
      
      await saveDailyStats(yesterdayWithHydration);
      setMessage(`✅ Fresh test data created: ${yesterdayStats.mealsLogged.length} meals, ${yesterdayStats.energyLogs.length} energy logs`);
      setStats(yesterdayWithHydration);
    } catch (err) {
      setMessage('❌ Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogsToday = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('Clearing all logs for today...');
    try {
      const today = new Date();
      const [startOfDay, endOfDay] = getDateRange(today);

      // Delete all meals for today
      const mealsRef = collection(db, 'users', user.uid, 'meals');
      const mealsQuery = query(
        mealsRef,
        where('loggedAt', '>=', startOfDay),
        where('loggedAt', '<=', endOfDay)
      );
      const todayMeals = await getDocs(mealsQuery);
      for (const doc of todayMeals.docs) {
        await deleteDoc(doc.ref);
      }

      // Delete all energy logs for today
      const energyRef = collection(db, 'users', user.uid, 'energy_logs');
      const energyQuery = query(
        energyRef,
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay)
      );
      const todayEnergy = await getDocs(energyQuery);
      for (const doc of todayEnergy.docs) {
        await deleteDoc(doc.ref);
      }

      // Clear hydration from localStorage
      localStorage.removeItem('hydrationData');

      setMessage(`✅ Cleared all logs for today (${todayMeals.docs.length} meals, ${todayEnergy.docs.length} energy logs)`);
      setStats(null);
    } catch (err) {
      setMessage('❌ Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (date: Date) => {
    const startOfDay = Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
    const endOfDay = Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));
    return [startOfDay, endOfDay];
  };

  return (
    <div className="fixed top-4 right-4 w-96 max-h-96 bg-slate-900 text-white rounded-lg shadow-2xl border border-yellow-500/50 p-4 overflow-y-auto z-50">
      <div className="text-xs font-bold text-yellow-500 mb-3">🔧 DEV: Daily Analytics Tester</div>

      {/* Status Message */}
      {message && (
        <div className="mb-3 p-2 bg-slate-800 rounded text-xs text-yellow-300">
          {message}
        </div>
      )}

      {/* Test Data Generation */}
      <div className="mb-3 space-y-2">
        <div className="text-xs font-semibold text-slate-300 mb-2">Generate Test Data:</div>
        <button
          onClick={handleTestHydration}
          disabled={loading}
          className="w-full px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
        >
          🚰 Random Hydration
        </button>
        <button
          onClick={handleCreateTestMeal}
          disabled={loading}
          className="w-full px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
        >
          🍽️ Random Meal
        </button>
        <button
          onClick={handleCreateTestEnergyLog}
          disabled={loading}
          className="w-full px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50"
        >
          ⚡ Random Energy Log
        </button>
        <button
          onClick={handleCreateTestYesterdayData}
          disabled={loading}
          className="w-full px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50"
        >
          📅 Full Yesterday Data
        </button>
        <button
          onClick={handleClearLogsToday}
          disabled={loading}
          className="w-full px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
        >
          🗑️ Clear Logs Today
        </button>
      </div>

      <div className="border-t border-slate-700 my-2"></div>

      {/* Aggregation & Saving */}
      <div className="mb-3 space-y-2">
        <div className="text-xs font-semibold text-slate-300 mb-2">Process Today's Data:</div>
        <button
          onClick={handleAggregateToday}
          disabled={loading}
          className="w-full px-2 py-1 text-xs bg-amber-600 hover:bg-amber-700 rounded disabled:opacity-50"
        >
          📊 Aggregate Today
        </button>
        <button
          onClick={handleLoadToday}
          disabled={loading}
          className="w-full px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 rounded disabled:opacity-50"
        >
          🔄 Load from Firebase
        </button>
        <button
          onClick={handleSaveToday}
          disabled={loading || !stats}
          className="w-full px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
        >
          💾 Save to Firebase
        </button>
      </div>

      <div className="border-t border-slate-700 my-2"></div>

      {/* Load Yesterday */}
      <div className="mb-3 space-y-2">
        <div className="text-xs font-semibold text-slate-300 mb-2">Load Yesterday's Stats:</div>
        <button
          onClick={async () => {
            setLoading(true);
            setMessage('Loading yesterday...');
            try {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayString = yesterday.toISOString().split('T')[0];
              const loaded = await loadDailyStats(yesterdayString);
              if (loaded) {
                setStats(loaded);
                setMessage(`✅ Loaded yesterday (${yesterdayString}): ${loaded.mealsLogged.length} meals, ${loaded.energyLogs.length} energy logs`);
              } else {
                setMessage('⚠️ No data for yesterday');
              }
            } catch (err) {
              setMessage('❌ Error: ' + (err as Error).message);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full px-2 py-1 text-xs bg-teal-600 hover:bg-teal-700 rounded disabled:opacity-50"
        >
          📆 Load Yesterday Stats
        </button>
      </div>

      {/* Stats Display */}
      {stats && (
        <div className="text-xs space-y-1">
          <div className="font-semibold text-slate-300 mb-2">Current Daily Stats:</div>
          <div className="bg-slate-800 rounded p-2 space-y-1 max-h-32 overflow-y-auto">
            <div>📅 Date: <span className="text-yellow-300">{stats.date}</span></div>
            <div>💧 Hydration: <span className="text-blue-300">{stats.hydrationGlasses} glasses</span></div>
            <div>🍽️ Meals: <span className="text-green-300">{stats.mealsLogged.length}</span></div>
            <div>⚡ Energy Logs: <span className="text-purple-300">{stats.energyLogs.length}</span></div>
            <div>Calories: <span className="text-orange-300">{stats.totalCalories}</span></div>
            <div>Avg Energy: <span className="text-purple-300">{stats.averageEnergyScore}/10</span></div>
            <div>Stability: <span className="text-amber-300">{Math.round(stats.metabolicStability)}%</span></div>
            <div>Peak Energy: <span className="text-red-300">{stats.peakEnergyLevel} @ {stats.peakEnergyTime || 'N/A'}</span></div>
            <div>Lowest Energy: <span className="text-blue-300">{stats.lowestEnergyLevel} @ {stats.lowestEnergyTime || 'N/A'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
