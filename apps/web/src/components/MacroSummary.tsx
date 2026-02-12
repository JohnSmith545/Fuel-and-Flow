import { Card } from '@repo/ui/Card';

interface MacroSummaryProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function MacroSummary({ 
  calories, 
  protein, 
  carbs, 
  fat, 
  targets = { calories: 2400, protein: 180, carbs: 120, fat: 80 } 
}: MacroSummaryProps) {

  const calculatePercentage = (current: number, target: number) => Math.min(100, (current / target) * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {/* Calories */}
      <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-3 md:p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex flex-row items-center gap-2 mb-2">
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg text-primary shrink-0">
            <span className="material-icons-round text-lg md:text-2xl">local_fire_department</span>
          </div>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Calories</span>
        </div>
        <div className="space-y-0.5">
          <p className="text-lg md:text-2xl font-black truncate">{calories.toLocaleString()}</p>
          <p className="text-[10px] md:text-xs text-slate-500 truncate">Goal: {targets.calories.toLocaleString()}</p>
        </div>
        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${calculatePercentage(calories, targets.calories)}%` }}></div>
        </div>
      </div>

      {/* Protein */}
      <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-3 md:p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex flex-row items-center gap-2 mb-2">
          <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
            <span className="material-icons-round text-lg md:text-2xl">fitness_center</span>
          </div>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Protein</span>
        </div>
        <div className="space-y-0.5">
          <p className="text-lg md:text-2xl font-black truncate">{Math.round(protein)}g</p>
          <p className="text-[10px] md:text-xs text-slate-500 truncate">Goal: {targets.protein}g</p>
        </div>
        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${calculatePercentage(protein, targets.protein)}%` }}></div>
        </div>
      </div>

       {/* Carbs */}
       <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-3 md:p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex flex-row items-center gap-2 mb-2">
          <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg text-orange-500 shrink-0">
            <span className="material-icons-round text-lg md:text-2xl">grain</span>
          </div>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Carbs</span>
        </div>
        <div className="space-y-0.5">
          <p className="text-lg md:text-2xl font-black truncate">{Math.round(carbs)}g</p>
          <p className="text-[10px] md:text-xs text-slate-500 truncate">Goal: {targets.carbs}g</p>
        </div>
        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${calculatePercentage(carbs, targets.carbs)}%` }}></div>
        </div>
      </div>

       {/* Fats */}
       <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-3 md:p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex flex-row items-center gap-2 mb-2">
          <div className="p-1.5 md:p-2 bg-yellow-500/10 rounded-lg text-yellow-500 shrink-0">
            <span className="material-icons-round text-lg md:text-2xl">opacity</span>
          </div>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Fats</span>
        </div>
        <div className="space-y-0.5">
          <p className="text-lg md:text-2xl font-black truncate">{Math.round(fat)}g</p>
          <p className="text-[10px] md:text-xs text-slate-500 truncate">Goal: {targets.fat}g</p>
        </div>
        <div className="mt-3 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${calculatePercentage(fat, targets.fat)}%` }}></div>
        </div>
      </div>
    </div>
  );
}
