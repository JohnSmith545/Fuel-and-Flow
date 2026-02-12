import { useState, useEffect } from 'react';
import { useDailyStats, DailyStats } from '../hooks/useDailyStats';

export function HeroFocusStatus({ selectedDate }: { selectedDate: Date }) {
  const { loadDailyStats } = useDailyStats();
  const [yesterdayStats, setYesterdayStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const loadYesterdayData = async () => {
      setLoading(true);
      // Calculate yesterday relative to selectedDate
      const yesterday = new Date(selectedDate);
      yesterday.setDate(selectedDate.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      const stats = await loadDailyStats(yesterdayString);
      if (stats) {
        setYesterdayStats(stats);
        generateSuggestions(stats);
      }
      setLoading(false);
    };

    loadYesterdayData();
  }, [selectedDate.getTime(), loadDailyStats]); // Update when selectedDate changes

  const generateSuggestions = (stats: DailyStats) => {
    const sugg: string[] = [];

    // Hydration suggestions
    if (stats.hydrationGlasses >= 8) {
      sugg.push(`💧 Excellent hydration! You drank ${stats.hydrationGlasses} glasses yesterday. Keep it up today!`);
    } else if (stats.hydrationGlasses >= 6) {
      sugg.push(`💧 Good hydration yesterday (${stats.hydrationGlasses} glasses). Try to reach 8 glasses today.`);
    } else if (stats.hydrationGlasses > 0) {
      sugg.push(`💧 You logged ${stats.hydrationGlasses} glasses yesterday. Increase to at least 6-8 glasses today.`);
    } else {
      sugg.push(`💧 No hydration logged yesterday. Start tracking water intake today!`);
    }

    // Energy stability suggestions
    if (stats.metabolicStability >= 80) {
      sugg.push(`⭐ Exceptional energy stability yesterday (${Math.round(stats.metabolicStability)}%)! Keep your meal timing consistent today.`);
    } else if (stats.metabolicStability >= 60) {
      sugg.push(`📈 Good metabolic stability (${Math.round(stats.metabolicStability)}%). Try spacing meals 3-4 hours apart today.`);
    } else if (stats.metabolicStability >= 40) {
      sugg.push(`📊 Your energy fluctuated yesterday (${Math.round(stats.metabolicStability)}% stability). Add protein to each meal today.`);
    } else {
      sugg.push(`⚠️ Your energy was very variable. Focus on balanced meals with protein, carbs, and healthy fats today.`);
    }

    // Peak energy time insights
    if (stats.peakEnergyTime && stats.energyLogs.length > 0) {
      sugg.push(`🔥 Your peak energy was at ${stats.peakEnergyTime}. Schedule important work during this window today.`);
    }

    // Calorie insights
    if (stats.totalCalories > 0) {
      if (stats.totalCalories < 1200) {
        sugg.push(`🍽️ You logged ${stats.totalCalories} calories yesterday - quite low. Ensure you're eating enough.`);
      } else if (stats.totalCalories < 2000) {
        sugg.push(`🍽️ Good calorie intake: ${stats.totalCalories} calories. Maintain similar portions if it felt right.`);
      } else if (stats.totalCalories < 2500) {
        sugg.push(`✅ Solid intake: ${stats.totalCalories} calories. This supports your weekly goals.`);
      } else {
        sugg.push(`📈 High intake: ${stats.totalCalories} calories. Consider if this aligns with your goals.`);
      }
    } else {
      sugg.push(`🍽️ No meals logged yesterday. Start logging nutrition today!`);
    }

    // Macronutrient balance
    if (stats.totalCalories > 0 && stats.totalProtein > 0) {
      const proteinCalories = stats.totalProtein * 4;
      const proteinPercent = Math.round((proteinCalories / stats.totalCalories) * 100);
      
      if (proteinPercent >= 25) {
        sugg.push(`💪 Great protein intake (${proteinPercent}% yesterday)! Keep this up for muscle recovery.`);
      } else if (proteinPercent >= 15) {
        sugg.push(`💪 Adequate protein (${proteinPercent}%). Consider adding more for better muscle support (aim 20-25%).`);
      } else {
        sugg.push(`💪 Low protein (${proteinPercent}%). Add protein to each meal for better muscle support and satiety.`);
      }
    }

    setSuggestions(sugg.slice(0, 3)); // Show top 3 suggestions
  };

  // Calculate a focus score based on yesterday's metrics
  const calculateFocusScore = () => {
    if (!yesterdayStats) return 0;

    // Check if we have actual data (not just empty stats)
    const hasData = yesterdayStats.energyLogs.length > 0 || yesterdayStats.mealsLogged.length > 0;
    if (!hasData) return 0;

    let score = 50; // Base score
    score += Math.min(yesterdayStats.metabolicStability / 2, 25); // Stability contributes up to 25 points
    score += Math.min((yesterdayStats.averageEnergyScore / 10) * 15, 15); // Energy contributes up to 15 points
    score += Math.min((yesterdayStats.hydrationGlasses / 8) * 10, 10); // Hydration contributes up to 10 points

    return Math.round(score);
  };

  // Determine status color based on metabolic stability
  const getStatusInfo = () => {
    if (!yesterdayStats) return { label: 'Loading...', color: 'yellow' };

    if (yesterdayStats.metabolicStability > 75) {
      return { label: 'Metabolic Status: Optimal', color: 'green' };
    } else if (yesterdayStats.metabolicStability > 50) {
      return { label: 'Metabolic Status: Stable', color: 'blue' };
    } else {
      return { label: 'Metabolic Status: Variable', color: 'orange' };
    }
  };

  const status = getStatusInfo();
  const focusScore = calculateFocusScore();
  
  // Check if we have actual data
  const hasData = yesterdayStats && (yesterdayStats.energyLogs.length > 0 || yesterdayStats.mealsLogged.length > 0);
  
  const colorClass = {
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    orange: 'bg-orange-500/10 text-orange-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
  }[status.color] || 'bg-green-500/10 text-green-500';

  const statusDotClass = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
  }[status.color] || 'bg-green-500';

  return (
    <div className="lg:col-span-2 glass p-4 md:p-8 rounded-xl shadow-sm relative overflow-hidden group bg-white/70 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800">
      <div className="relative z-10">
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 ${colorClass} rounded-full mb-4`}>
          <span className={`flex h-2 w-2 rounded-full ${statusDotClass}`}></span>
          <span className="text-xs font-bold uppercase tracking-widest">{status.label}</span>
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl font-extrabold mb-2 text-slate-900 dark:text-white">Optimized for Focus</h2>

        {/* Suggestion/Description */}
        <p className="text-slate-600 dark:text-slate-400 max-w-lg mb-6">
          {loading
            ? 'Loading yesterday\'s data...'
            : yesterdayStats
            ? 'Here\'s what we learned from yesterday and what to focus on today:'
            : 'Log meals, energy, and hydration to receive personalized focus recommendations.'}
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {/* Focus Score */}
          <div className="glass dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-2 md:p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-xl md:text-2xl font-black text-primary">{hasData ? focusScore : '—'}</span>
            <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500 leading-tight">Focus Score</span>
          </div>

          {/* Energy Average */}
          <div className="glass dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-2 md:p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-xl md:text-2xl font-black text-primary">
              {hasData && yesterdayStats ? yesterdayStats.averageEnergyScore.toFixed(1) : '—'}
            </span>
            <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500 leading-tight">Avg Energy</span>
          </div>

          {/* Metabolic Stability */}
          <div className="glass dark:bg-white/5 border border-slate-200 dark:border-slate-800 p-2 md:p-4 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-xl md:text-2xl font-black text-primary">
              {hasData && yesterdayStats ? Math.round(yesterdayStats.metabolicStability) : '—'}%
            </span>
            <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500 leading-tight">Stability</span>
          </div>
        </div>

        {/* Additional Insights */}
        {yesterdayStats && (
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Peak Energy</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {yesterdayStats.peakEnergyLevel}/10 {yesterdayStats.peakEnergyTime ? `@ ${yesterdayStats.peakEnergyTime}` : ''}
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Hydration</p>
              <p className="font-bold text-slate-900 dark:text-white">{yesterdayStats.hydrationGlasses}/8 glasses</p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {!loading && yesterdayStats && suggestions.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
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
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
    </div>
  );
}
