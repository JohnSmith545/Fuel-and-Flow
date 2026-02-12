import { useState, useEffect } from 'react';
import { useDailyStats, DailyStats } from '../hooks/useDailyStats';

export function DailyAnalytics({ selectedDate }: { selectedDate: Date }) {
  const { loadDailyStats } = useDailyStats();
  const [yesterdayStats, setYesterdayStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const loadYesterdayData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calculate yesterday relative to selectedDate
        const yesterday = new Date(selectedDate);
        yesterday.setDate(selectedDate.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        console.log('Loading stats for:', yesterdayString);
        const stats = await loadDailyStats(yesterdayString);
        
        if (stats) {
          console.log('Stats loaded:', stats);
          setYesterdayStats(stats);
          generateSuggestions(stats);
        } else {
          console.log('No stats returned');
          setYesterdayStats(null);
        }
      } catch (err) {
        console.error('Error loading yesterday data:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadYesterdayData();
  }, [selectedDate.getTime(), loadDailyStats]); // Use timestamp to detect date changes by value, not reference

  const generateSuggestions = (stats: DailyStats) => {
    const suggestions: string[] = [];

    // Hydration suggestions
    if (stats.hydrationGlasses >= 8) {
      suggestions.push(`💧 Excellent hydration! You drank ${stats.hydrationGlasses} glasses yesterday. Keep it up today!`);
    } else if (stats.hydrationGlasses >= 6) {
      suggestions.push(`💧 Good hydration yesterday (${stats.hydrationGlasses} glasses). Try to reach 8 glasses today.`);
    } else if (stats.hydrationGlasses > 0) {
      suggestions.push(`💧 You logged ${stats.hydrationGlasses} glasses yesterday. Increase to at least 6-8 glasses today for better hydration.`);
    } else {
      suggestions.push(`💧 No hydration data logged yesterday. Start tracking your water intake today!`);
    }

    // Energy stability suggestions
    if (stats.metabolicStability >= 80) {
      suggestions.push(`⭐ Exceptional energy stability yesterday (${Math.round(stats.metabolicStability)}%)! Your meal timing and macros were well-balanced. Maintain this consistency today.`);
    } else if (stats.metabolicStability >= 60) {
      suggestions.push(`📈 Good metabolic stability (${Math.round(stats.metabolicStability)}%). Try spacing meals 3-4 hours apart today to maintain this level.`);
    } else if (stats.metabolicStability >= 40) {
      suggestions.push(`📊 Your energy fluctuated yesterday (${Math.round(stats.metabolicStability)}% stability). Add protein to each meal today for better energy balance.`);
    } else {
      suggestions.push(`⚠️ Your energy was very variable yesterday. Focus on eating balanced meals with protein, carbs, and healthy fats at regular intervals.`);
    }

    // Peak energy time insights
    if (stats.peakEnergyTime) {
      suggestions.push(`🔥 Your peak energy was at ${stats.peakEnergyTime}. Schedule your most important work during this window today.`);
    } else if (stats.energyLogs.length > 0) {
      suggestions.push(`⚡ Log energy readings at specific times today to identify your peak performance hours.`);
    }

    // Calorie insights
    if (stats.totalCalories > 0) {
      if (stats.totalCalories < 1200) {
        suggestions.push(`🍽️ You logged ${stats.totalCalories} calories yesterday - quite low. Ensure you're eating enough to fuel your body and activities.`);
      } else if (stats.totalCalories < 2000) {
        suggestions.push(`🍽️ Good calorie intake yesterday: ${stats.totalCalories} calories. Maintain similar portions today if that felt right.`);
      } else if (stats.totalCalories < 2500) {
        suggestions.push(`✅ Solid calorie intake: ${stats.totalCalories} calories logged. This may support your weekly goals.`);
      } else {
        suggestions.push(`📈 High calorie intake yesterday (${stats.totalCalories}). Consider if this aligns with your fitness goals.`);
      }
    } else {
      suggestions.push(`🍽️ No meals logged yesterday. Start logging your nutrition today for personalized recommendations!`);
    }

    // Macronutrient balance
    if (stats.totalCalories > 0 && stats.totalProtein > 0) {
      const proteinCalories = stats.totalProtein * 4;
      const proteinPercent = Math.round((proteinCalories / stats.totalCalories) * 100);
      
      if (proteinPercent >= 25) {
        suggestions.push(`💪 Great protein intake (${proteinPercent}% yesterday)! Keep this up for muscle recovery and satiety.`);
      } else if (proteinPercent >= 15) {
        suggestions.push(`💪 Adequate protein (${proteinPercent}%). Consider adding a bit more for better muscle support (aim for 20-25%).`);
      } else {
        suggestions.push(`💪 Low protein intake (${proteinPercent}%). Try adding protein to each meal - it supports muscle recovery and keeps you fuller longer.`);
      }
    }

    // Energy log frequency
    if (stats.energyLogs.length < 3) {
      suggestions.push(`📊 Log energy levels more frequently throughout the day to identify patterns and optimize your schedule.`);
    }

    setSuggestions(suggestions.slice(0, 5)); // Show top 5 suggestions to avoid overwhelming
  };

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800">
        <div className="text-sm text-slate-500">⏳ Loading yesterday's analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-6 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800">
        <div className="text-sm text-red-600 dark:text-red-400">❌ Error: {error}</div>
        <div className="text-xs text-slate-500 mt-2">Try refreshing the page or logging some data first.</div>
      </div>
    );
  }

  // Check if stats are truly empty (no meals, no energy logs, no hydration)
  const hasNoData = !yesterdayStats || 
    (yesterdayStats.mealsLogged.length === 0 && 
     yesterdayStats.energyLogs.length === 0 && 
     yesterdayStats.hydrationGlasses === 0);

  if (hasNoData) {
    return (
      <div className="glass p-6 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-4">
          Previous Day Analytics
        </h3>
        <div className="text-sm text-slate-400 italic">No data available yet. Log some activities to see yesterday's analytics!</div>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800">
      <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-6">
        Previous Day Analytics
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg p-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Hydration</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{yesterdayStats.hydrationGlasses}</p>
          <p className="text-xs text-slate-500">glasses</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-lg p-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Calories</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{yesterdayStats.totalCalories}</p>
          <p className="text-xs text-slate-500">kcal</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg p-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Energy Score</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {yesterdayStats.averageEnergyScore}/10
          </p>
          <p className="text-xs text-slate-500">average</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-lg p-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Stability</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {Math.round(yesterdayStats.metabolicStability)}%
          </p>
          <p className="text-xs text-slate-500">metabolic</p>
        </div>
      </div>

      {/* Macros */}
      {yesterdayStats.totalCalories > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Macronutrients</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">Protein</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{yesterdayStats.totalProtein}g</p>
            </div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">Carbs</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{yesterdayStats.totalCarbs}g</p>
            </div>
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">Fat</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{yesterdayStats.totalFat}g</p>
            </div>
          </div>
        </div>
      )}

      {/* Energy Insights */}
      {yesterdayStats.energyLogs.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Energy Insights</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded p-2">
              <p className="text-xs text-slate-600 dark:text-slate-400">Peak Energy</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {yesterdayStats.peakEnergyLevel}/10 at {yesterdayStats.peakEnergyTime || 'N/A'}
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded p-2">
              <p className="text-xs text-slate-600 dark:text-slate-400">Lowest Energy</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {yesterdayStats.lowestEnergyLevel}/10 at {yesterdayStats.lowestEnergyTime || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
            💡 Today's Tips
          </p>
          <ul className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/30 rounded p-2">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
