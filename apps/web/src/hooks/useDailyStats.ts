import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { doc, setDoc, getDoc, collection, query, where, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  hydrationGlasses: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealsLogged: Array<{
    name: string;
    calories: number;
    timestamp: string;
  }>;
  energyLogs: Array<{
    level: number;
    tags: string[];
    timestamp: string;
  }>;
  averageEnergyScore: number;
  peakEnergyLevel: number;
  peakEnergyTime: string | null;
  lowestEnergyLevel: number;
  lowestEnergyTime: string | null;
  metabolicStability: number; // 0-100: lower variance = more stable
  energyVariance: number;
  recommendedCalories?: number;
  calorieAdherence: number; // percentage of goal met
}

export function useDailyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  // Save daily stats to Firebase
  const saveDailyStats = async (dailyStats: DailyStats) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'daily_stats', dailyStats.date);
      await setDoc(docRef, dailyStats, { merge: true });
      setStats(dailyStats);
      return true;
    } catch (err) {
      console.error('Error saving daily stats:', err);
      setError('Failed to save daily stats');
      return false;
    }
  };

  // Load stats for a specific date
  const loadDailyStats = async (dateString: string = getTodayDateString()) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Try to get from Firebase first
      const docRef = doc(db, 'users', user.uid, 'daily_stats', dateString);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStats(docSnap.data() as DailyStats);
        return docSnap.data() as DailyStats;
      }

      // If not found in Firebase, try to aggregate from subcollections
      const aggregatedStats = await aggregateDailyData(dateString);
      setStats(aggregatedStats);
      return aggregatedStats;
    } catch (err) {
      console.error('Error loading daily stats:', err);
      setError('Failed to load daily stats');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Aggregate data from meals and energy logs
  const aggregateDailyData = async (dateString: string): Promise<DailyStats> => {
    if (!user) {
      return createEmptyStats(dateString);
    }

    const [startOfDay, endOfDay] = getDateRange(dateString);

    try {
      // Get energy logs
      const energyLogsRef = collection(db, 'users', user.uid, 'energy_logs');
      const energyQuery = query(
        energyLogsRef,
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay)
      );
      const energySnapshot = await getDocs(energyQuery);

      const energyLogs = energySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          level: data.level,
          tags: data.tags || [],
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
        };
      });

      // Get meals
      const mealsRef = collection(db, 'users', user.uid, 'meal_logs');
      const mealsQuery = query(
        mealsRef,
        where('loggedAt', '>=', startOfDay),
        where('loggedAt', '<=', endOfDay)
      );
      const mealsSnapshot = await getDocs(mealsQuery);

      const mealsLogged = mealsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          name: data.name,
          calories: data.calories,
          timestamp: data.loggedAt?.toDate().toISOString() || new Date().toISOString(),
        };
      });

      // Calculate aggregates
      const totalCalories = mealsLogged.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = mealsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().protein || 0), 0);
      const totalCarbs = mealsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().carbs || 0), 0);
      const totalFat = mealsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().fat || 0), 0);

      // Calculate energy metrics
      const energyLevels = energyLogs.map(log => log.level);
      const averageEnergyScore = energyLevels.length > 0
        ? Math.round((energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length) * 10) / 10
        : 0;

      const peakEnergyLevel = energyLevels.length > 0 ? Math.max(...energyLevels) : 0;
      const peakEnergyIndex = energyLogs.findIndex(log => log.level === peakEnergyLevel);
      const peakEnergyTime = peakEnergyIndex >= 0 ? new Date(energyLogs[peakEnergyIndex].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

      const lowestEnergyLevel = energyLevels.length > 0 ? Math.min(...energyLevels) : 0;
      const lowestEnergyIndex = energyLogs.findIndex(log => log.level === lowestEnergyLevel);
      const lowestEnergyTime = lowestEnergyIndex >= 0 ? new Date(energyLogs[lowestEnergyIndex].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

      // Calculate metabolic stability (inverse of variance)
      // Only calculate if we have enough data points
      const energyVariance = calculateVariance(energyLevels);
      const metabolicStability = energyLevels.length >= 2 
        ? Math.max(0, 100 - energyVariance * 2.5) // Normalize to 0-100
        : 0; // Not enough data to determine stability

      // Get hydration from localStorage ONLY if it's today
      let hydrationGlasses = 0;
      const today = new Date().toISOString().split('T')[0];
      if (dateString === today) {
        const hydrationData = localStorage.getItem('hydrationData');
        hydrationGlasses = hydrationData ? JSON.parse(hydrationData).count : 0;
      }

      return {
        date: dateString,
        hydrationGlasses,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        mealsLogged,
        energyLogs,
        averageEnergyScore,
        peakEnergyLevel,
        peakEnergyTime,
        lowestEnergyLevel,
        lowestEnergyTime,
        metabolicStability,
        energyVariance,
        calorieAdherence: 0, // Will be calculated based on user goal
      };
    } catch (err) {
      console.error('Error aggregating daily data:', err);
      return createEmptyStats(dateString);
    }
  };

  return {
    stats,
    loading,
    error,
    saveDailyStats,
    loadDailyStats,
    getTodayDateString,
    aggregateDailyData,
  };
}

// Helper functions
function getDateRange(dateString: string) {
  const date = new Date(dateString);
  const startOfDay = Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  const endOfDay = Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));
  return [startOfDay, endOfDay];
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length < 2) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squareDiffs = numbers.map(value => Math.pow(value - mean, 2));
  return squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

function createEmptyStats(dateString: string): DailyStats {
  return {
    date: dateString,
    hydrationGlasses: 0,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealsLogged: [],
    energyLogs: [],
    averageEnergyScore: 0,
    peakEnergyLevel: 0,
    peakEnergyTime: null,
    lowestEnergyLevel: 0,
    lowestEnergyTime: null,
    metabolicStability: 0,
    energyVariance: 0,
    calorieAdherence: 0,
  };
}
