 
// If not, use native Date. I'll use native Date to avoid dep issues, but formatting is annoying.
// I'll stick to the native formatting used in DailyFuel.

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (newDate: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    onDateChange(newDate);
  };

  const isToday = new Date().toDateString() === selectedDate.toDateString();

  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm w-full">
      <button 
        onClick={() => changeDate(-1)}
        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        title="Previous Day"
      >
        ←
      </button>
      <div className="font-semibold text-slate-700 flex items-center gap-2">
        <span>{selectedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        {isToday && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Today</span>}
      </div>
      <button 
        onClick={() => changeDate(1)}
        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        title="Next Day"
        disabled={isToday} 
      >
        →
      </button>
    </div>
  );
}
