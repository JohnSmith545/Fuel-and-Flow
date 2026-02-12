// This is the DailyFuel component.
// It is used to display the daily fuel of the user.
// It is used in the App.tsx file.

import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useUserProfile } from '../hooks/useUserProfile';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LoggedMeal, useLogMeal } from '../hooks/useLogMeal';
import { ConfirmModal } from './ConfirmModal';
import { MacroSummary } from './MacroSummary';

export function DailyFuel({ selectedDate }: { selectedDate: Date }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { deleteLog } = useLogMeal();
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    variant?: "danger" | "primary";
    onConfirm?: () => void;
  }>({ title: "", description: "" });

  const handleDelete = async (id: string) => {
    // 1. Configure the modal for confirmation
    setModalConfig({
        title: "Delete Meal Log",
        description: "Are you sure you want to delete this log? This action cannot be undone.",
        variant: "danger",
        onConfirm: async () => {
             try {
                await deleteLog(id);
                // Optional: Success toast
             } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '';
                if (errorMessage && errorMessage.includes('CANNOT_DELETE')) {
                    // Update modal to show error
                    setModalConfig({
                        title: "Cannot Delete Meal",
                        description: errorMessage.replace('CANNOT_DELETE: ', ''),
                        variant: "primary",
                        onConfirm: undefined // Remove confirm action to turn into alert
                    });
                    // Re-open modal (it might close if ConfirmModal auto-closes on confirm, but since this is async inside onConfirm, we might need to manage it)
                    // The ConfirmModal implementation closes on button click. 
                    // If we want to intercept the close, we'd need to change ConfirmModal or how we use it.
                    // The current ConfirmModal calls onConfirm(); onClose();
                    // So the modal WILL close. We need to re-open it with the new config.
                    setTimeout(() => setModalOpen(true), 100); 
                }
             }
        }
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Create start and end of day timestamps
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logsRef = collection(db, 'users', user.uid, 'meal_logs');
    
    // Query filtering by date range
    const q = query(
      logsRef, 
      where('loggedAt', '>=', Timestamp.fromDate(startOfDay)),
      where('loggedAt', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('loggedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mealData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LoggedMeal[];
      setMeals(mealData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  // Calculate Totals
  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fat: acc.fat + meal.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  if (loading) return <div className="text-sm text-slate-500">Loading logs...</div>;

  return (
    <div className="space-y-8">
      {/* 1. Macro Summary Cards */}
      <MacroSummary 
        calories={totals.calories} 
        protein={totals.protein} 
        carbs={totals.carbs} 
        fat={totals.fat} 
        targets={profile?.targets} // Pass user targets if available
      />

      {/* 2. Meal Log List - Updated Design */}
      <div className="glass rounded-xl overflow-hidden bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-sm">
        <div className="p-6 border-b border-primary/10 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Daily Fuel Intake</h3>
            <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-slate-500"><span className="material-icons-round">filter_list</span></button>
                <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-slate-500"><span className="material-icons-round">search</span></button>
            </div>
        </div>
        
        <div className="divide-y divide-primary/5">
            {meals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No meals logged for this day.</div>
            ) : (
                meals.map((meal) => (
                    <div key={meal.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-white/50 dark:hover:bg-white/5 transition-all group relative min-h-[100px] sm:min-h-0">
                         {/* Time - Mobile: Top Right, Desktop: Left */}
                        <div className="text-slate-400 font-mono text-[10px] sm:text-sm absolute top-3 right-3 sm:static sm:w-16">
                            {meal.loggedAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>

                        {/* Image Placeholder & Info */}
                        <div className="flex-1 flex items-start gap-4 w-full pr-8 sm:pr-0">
                            <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
                                {meal.image ? (
                                    <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-icons-round">restaurant</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2 text-sm sm:text-base">
                                    <span className="truncate">{meal.name}</span>
                                    {meal.safetyOverride && (
                                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold text-white bg-red-500 rounded-full shrink-0">
                                            Unsafe Override
                                        </span>
                                    )}
                                    {meal.isRecommended && (
                                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold text-green-700 bg-green-100 rounded-full flex items-center gap-1 shrink-0">
                                            <span className="material-icons-round text-[10px]">stars</span>
                                            Recommended
                                        </span>
                                    )}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                                    <span>P: {meal.protein}g</span>
                                    <span>C: {meal.carbs}g</span>
                                    <span>F: {meal.fat}g</span>
                                    <span className="text-primary font-bold">{meal.calories} kcal</span>
                                </div>
                            </div>
                        </div>

                        {/* Delete Action - Mobile: specific button, Desktop: Hover */}
                         <button 
                            onClick={() => handleDelete(meal.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 absolute bottom-2 right-2 sm:static"
                            title="Delete Log"
                         >
                            <span className="material-icons-round text-lg">delete</span>
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        description={modalConfig.description}
        variant={modalConfig.variant}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.onConfirm ? "Yes, Delete" : "I Understand"}
      />
    </div>
  );
}
