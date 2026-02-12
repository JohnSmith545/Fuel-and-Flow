// This is the useLogMeal hook.
// It is used to log meals to the database.
// Refactored to use TanStack Query Mutation.

import { useAuth } from '../providers/AuthProvider';
import { useUserProfile } from './useUserProfile';
import { collection, addDoc, doc, deleteDoc, serverTimestamp, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkSafety as checkSafetyPure } from './checkSafety';
export type { SafetyCheckResult } from './checkSafety';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  recipe?: string;
  isCustom?: boolean;
  image?: string;
  isRecommended?: boolean;
}

export interface LoggedMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: any; // Timestamp
  safetyOverride?: boolean;
  image?: string;
  isRecommended?: boolean;
}

export function useLogMeal() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  const checkSafety = (food: FoodItem) => checkSafetyPure(food, profile?.allergens);

  const logMealMutation = useMutation({
    mutationFn: async ({ food, overrideSafety = false }: { food: FoodItem, overrideSafety?: boolean }) => {
      if (!user) throw new Error('No user');

      // Run Safety Check
      const safety = checkSafety(food);
      if (!safety.safe && !overrideSafety) {
        throw new Error(`SAFETY_VIOLATION: ${safety.conflict}`);
      }

      // CHECK: Cannot log a new meal if previous meal doesn't have an energy level
      try {
        const mealsRef = collection(db, 'users', user.uid, 'meal_logs');
        const mealsSnapshot = await getDocs(mealsRef);
        
        const now = new Date();
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

        // Find meals logged in the last 3 hours that don't have energy logs
        for (const mealDoc of mealsSnapshot.docs) {
          const meal = mealDoc.data();
          const mealTime = meal.loggedAt?.toDate();
          
          if (mealTime && mealTime > threeHoursAgo) {
            // This meal is recent, check if it has an energy log
            const energyRef = collection(db, 'users', user.uid, 'energy_logs');
            const energyQuery = query(
              energyRef,
              where('timestamp', '>', Timestamp.fromDate(mealTime))
            );
            const energySnapshot = await getDocs(energyQuery);
            
            if (energySnapshot.empty) {
              // Found an unlogged meal
              throw new Error(`UNLOGGED_MEAL: Please log your energy level for your previous meal (${meal.name}) before logging a new meal.`);
            }
          }
        }
      } catch (err: any) {
        if (err.message?.includes('UNLOGGED_MEAL')) {
          throw err;
        }
        console.error("Error checking for unlogged meals:", err);
      }

      const logsRef = collection(db, 'users', user.uid, 'meal_logs');
      await addDoc(logsRef, {
        foodId: food.id,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        loggedAt: serverTimestamp(),
        safetyOverride: overrideSafety, // Track if user overrode a warning
        image: food.image || null,
        isRecommended: food.isRecommended || false
      });
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyFuel'] }); // Invalidate if we switch DailyFuel to useQuery
    }
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      if (!user) throw new Error('No user');
      
      // CHECK: Cannot delete a meal if an energy level has been logged for that meal
      const logRef = doc(db, 'users', user.uid, 'meal_logs', logId);
      const mealsRef = collection(db, 'users', user.uid, 'meal_logs');
      const mealsSnapshot = await getDocs(mealsRef);
      
      let mealTimestamp: Date | null = null;
      for (const mealDoc of mealsSnapshot.docs) {
        if (mealDoc.id === logId) {
          mealTimestamp = mealDoc.data().loggedAt?.toDate();
          break;
        }
      }

      if (mealTimestamp) {
        // Check if there's an energy log after this meal
        const energyRef = collection(db, 'users', user.uid, 'energy_logs');
        const energyQuery = query(
          energyRef,
          where('timestamp', '>', Timestamp.fromDate(mealTimestamp))
        );
        const energySnapshot = await getDocs(energyQuery);
        
        if (!energySnapshot.empty) {
          // Energy has been logged for this meal, cannot delete
          throw new Error(`CANNOT_DELETE: You've already logged your energy level for this meal. Energy logs are locked to their meals.`);
        }
      }

      await deleteDoc(logRef);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyFuel'] });
    }
  });

  return { 
    logMeal: (food: FoodItem, overrideSafety?: boolean) => logMealMutation.mutateAsync({ food, overrideSafety }), 
    deleteLog: deleteLogMutation.mutateAsync, 
    checkSafety, 
    loading: logMealMutation.isPending || deleteLogMutation.isPending, 
    error: (logMealMutation.error as Error)?.message || (deleteLogMutation.error as Error)?.message || null 
  };
}
