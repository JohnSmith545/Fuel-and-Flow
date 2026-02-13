import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { FoodLogger } from '../components/FoodLogger';
import { DailyFuel } from '../components/DailyFuel';
import { DateSelector } from '../components/DateSelector';
import { FoodItem, useLogMeal } from '../hooks/useLogMeal';
import { SafetyModal } from '../components/SafetyModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const Route = createFileRoute('/nutrition')({
  component: Nutrition,
})

function Nutrition() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // State for Food Logging Logic
  const { logMeal, checkSafety } = useLogMeal();
  const [safetyViolation, setSafetyViolation] = useState<{ food: FoodItem, reason: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "primary" | "danger" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info"
  });

  const handleAddFood = async (food: FoodItem, overrideSafety = false) => {
    // 1. Check safety (unless overriding)
    if (!overrideSafety) {
      const safety = checkSafety(food);
      if (!safety.safe && safety.conflict) {
        setSafetyViolation({ food, reason: safety.conflict });
        return;
      }
    }

    // 2. Attempt to log meal
    try {
      const success = await logMeal(food, overrideSafety, selectedDate);
      if (success) {
        setAlertModal({
            isOpen: true,
            title: "Meal Logged!",
            description: `Successfully added ${food.name} to your daily fuel.`,
            variant: "primary" // Success variant ideally, but using primary
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('UNLOGGED_MEAL')) {
         setAlertModal({
             isOpen: true,
             title: "Action Required",
             description: err.message.replace('UNLOGGED_MEAL: ', ''),
             variant: "info"
         });
      } else {
         console.error("Failed to log meal:", err);
         setAlertModal({
             isOpen: true,
             title: "Error",
             description: "Failed to log meal. Please try again.",
             variant: "danger"
         });
      }
    }
  };

  const handleSafetyOverride = () => {
    if (safetyViolation) {
      handleAddFood(safetyViolation.food, true);
      setSafetyViolation(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-3 md:space-y-6 p-1 sm:p-2 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          <div className="flex flex-col xs:flex-row items-center gap-2 md:gap-6 w-full md:w-auto">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white self-start xs:self-auto">Nutrition</h1>
            <div className="w-full xs:w-auto">
              <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>
          </div>
        </header>

        <FoodLogger onAddFood={handleAddFood} />
        
        <div className="mt-8">
          <DailyFuel selectedDate={selectedDate} />
        </div>

        {/* MODALS */}
        <SafetyModal
            violation={safetyViolation}
            onCancel={() => setSafetyViolation(null)}
            onOverride={handleSafetyOverride}
        />

        <ConfirmModal
            isOpen={alertModal.isOpen}
            onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
            title={alertModal.title}
            description={alertModal.description}
            variant={alertModal.variant}
            confirmText="OK"
            onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </Layout>
  )
}
