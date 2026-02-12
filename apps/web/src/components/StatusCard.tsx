import { Card } from '@repo/ui/Card';

interface StatusCardProps {
  goal?: string;
}

export function StatusCard({ goal = "Optimization" }: StatusCardProps) {
  return (
    <div className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl"></div>
      
      <div className="relative z-10 p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full mb-4 border border-green-500/20">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest">Metabolic Status: Optimal</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-slate-900 dark:text-white">
            Optimized for {goal.replace('_', ' ')}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 max-w-xl text-lg leading-relaxed">
            Your energy levels are stable. Based on your current biomarkers and recent logs, you are in a prime window for deep work.
          </p>

          <div className="mt-8 flex gap-4">
             <div className="bg-white/50 dark:bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center min-w-[100px] border border-white/50 dark:border-white/10 shadow-sm">
                <span className="text-3xl font-black text-primary">94</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">Flow Score</span>
             </div>
             <div className="bg-white/50 dark:bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center min-w-[100px] border border-white/50 dark:border-white/10 shadow-sm">
                <span className="text-3xl font-black text-primary">8.2</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">Consistency</span>
             </div>
          </div>
      </div>
      
      {/* Decorative Blur */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000 pointer-events-none"></div>
    </div>
  );
}
