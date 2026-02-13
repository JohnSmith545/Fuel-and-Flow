// A custom hook that analyzes user nutrition and energy data to provide real-time dietary suggestions.
import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUserProfile } from './useUserProfile';

export interface Suggestion {
  id: string;
  type: 'warning' | 'tip' | 'success';
  message: string;
}

export function useDietaryEngine() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const analyzeData = async () => {
      // console.log("Dietary Engine: Analyzing data..."); // Debug: Check for loops
      setLoading(true);
      const newSuggestions: Suggestion[] = [];

      try {
        // Fetch last meal
        const mealsRef = collection(db, 'users', user.uid, 'meal_logs');
        const mealQ = query(mealsRef, orderBy('loggedAt', 'desc'), limit(1));
        const mealSnap = await getDocs(mealQ);

        // Fetch last energy log
        const energyRef = collection(db, 'users', user.uid, 'energy_logs');
        const energyQ = query(energyRef, orderBy('timestamp', 'desc'), limit(1));
        const energySnap = await getDocs(energyQ);

        // RULE 1: The Crash Analysis
        // If last energy log is LOW (< 4) AND recent, check last meal for sugar/carbs
        if (!energySnap.empty && !mealSnap.empty) {
            const energyData = energySnap.docs[0].data();
            const mealData = mealSnap.docs[0].data();
            
            // Check if energy log is "recent" (e.g., within 2 hours of meal)
            // Simplified for MVP: Just check if last log was low
            if (energyData.level <= 4) {
                 // Check if meal had high carbs (simplistic sugar proxy) or was a "sugar crash" candidate
                 // For MVP, enable this warning if carbs > 30g (arbitrary threshold for "high sugar" proxy without specific sugar field)
                 if (mealData.carbs > 30) {
                     newSuggestions.push({
                         id: 'sugar-crash',
                         type: 'warning',
                         message: `Low energy detected. Your last meal (${mealData.name}) had ${mealData.carbs}g of carbs. This might be a sugar crash. Try more fiber/protein next time.`
                     });
                 }
            }
        }

        // RULE 2: The Protein Gap (Evening Check)
        const now = new Date();
        const currentHour = now.getHours();
        
        // If it's after 6 PM (18:00)
        if (currentHour >= 18 && profile) {
            // Calculate total protein today
            const startOfDay = new Date();
            startOfDay.setHours(0,0,0,0);
            
            const todayQ = query(mealsRef, where('loggedAt', '>=', Timestamp.fromDate(startOfDay)));
            const todaySnap = await getDocs(todayQ);
            
            let totalProtein = 0;
            todaySnap.docs.forEach(doc => {
                totalProtein += (doc.data().protein || 0);
            });

            // Target Protein? Let's say 1.6g per kg of bodyweight, or simple 100g default
            const targetProtein = profile.weight ? profile.weight * 1.6 : 100;
            
            if (totalProtein < targetProtein * 0.8) { // If less than 80% of target
                const needed = Math.round(targetProtein - totalProtein);
                newSuggestions.push({
                    id: 'protein-gap',
                    type: 'tip',
                    message: `It's evening and you're low on protein (${totalProtein}g/${Math.round(targetProtein)}g). Try a high-protein dinner to aid recovery.`
                });
            }
        } else if (profile) {
            // Daytime Check: Are we on track?
            // Simple generic tip if not much data
            if (newSuggestions.length === 0 && Math.random() > 0.7) {
                 newSuggestions.push({
                     id: 'rec-hydration',
                     type: 'tip',
                     message: "Stay hydrated! Drink a glass of water before your next meal."
                 });
            }
        }

        // Success Check
        if (!energySnap.empty) {
             const energyData = energySnap.docs[0].data();
             if (energyData.level >= 8) {
                 newSuggestions.push({
                     id: 'doing-great',
                     type: 'success',
                     // message: "Your energy is high! Whatever you're doing is working."
                     message: "You're in the zone! Keep this momentum going."
                 });
             }
        }

        setSuggestions(newSuggestions);

      } catch (err) {
        console.error("Engine analysis failed", err);
      } finally {
        setLoading(false);
      }
    };

    analyzeData();
    
    // Poll for updates every minute
    const interval = setInterval(analyzeData, 60000);
    return () => clearInterval(interval);

  }, [user, profile]);

  return { suggestions, loading };
}
