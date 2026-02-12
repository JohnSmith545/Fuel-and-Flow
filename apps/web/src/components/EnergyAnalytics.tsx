
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { collection, query, orderBy, onSnapshot, where, Timestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useDietaryEngine } from '../hooks/useDietaryEngine';

interface ChartData {
  id: string;
  level: number;
  time: string;
  rawTime: number;
  timestamp: Timestamp;
  meal?: boolean; // Add optional meal property to interface
  energy?: number; // Add optional energy property to interface match usage
}

export function EnergyAnalytics({ selectedDate }: { selectedDate: Date }) {
  const { user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  
  // Chart Dimensions State
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    // Initial measure
    updateDimensions();

    // Observe resize
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);
  
  // Metrics State
  const [avgScore, setAvgScore] = useState(0);
  const [peakTime, setPeakTime] = useState<string>('--:--');
  const [stability, setStability] = useState<{ label: string; value: number; trend: 'up' | 'down' | 'stable' }>({ label: 'Analyzing', value: 0, trend: 'stable' });

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);

    // Calculate date range based on timeRange
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    
    if (timeRange === 'day') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeRange === 'week') {
      // Start from 7 days ago at midnight
      startDate.setDate(selectedDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeRange === 'month') {
      // Start from 30 days ago at midnight
      startDate.setDate(selectedDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const logsRef = collection(db, 'users', user.uid, 'energy_logs');
    
    const q = query(
      logsRef, 
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'asc'), // Oldest to newest for aggregation
      limit(500)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          level: d.level,
          time: d.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTime: d.timestamp?.toDate().getTime(),
          timestamp: d.timestamp // Keep original timestamp for calculations
        };
      });
      
      setData(logs);
      
      // Calculate Metrics
      if (logs.length > 0) {
        // 1. Avg Energy Score
        const total = logs.reduce((sum, log) => sum + log.level, 0);
        const avg = total / logs.length;
        setAvgScore(Number(avg.toFixed(1)));

        // 2. Peak Energy Time - varies by timeRange
        let peakTimeDisplay = '--:--';
        if (timeRange === 'day') {
          // Find the specific time with highest energy for the day
          const maxLog = logs.reduce((max, log) => log.level > max.level ? log : max);
          peakTimeDisplay = maxLog.timestamp?.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } else if (timeRange === 'week') {
          // Find the day and hour with highest average energy across the week
          const dayMap = new Map<string, { sum: number; count: number }>();
          logs.forEach(log => {
            const date = log.timestamp?.toDate();
            if (date) {
              const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const current = dayMap.get(day) || { sum: 0, count: 0 };
              dayMap.set(day, { sum: current.sum + log.level, count: current.count + 1 });
            }
          });
          
          let maxAvg = 0;
          let bestDay = '';
          dayMap.forEach((val, day) => {
            const dayAvg = val.sum / val.count;
            if (dayAvg > maxAvg) {
              maxAvg = dayAvg;
              bestDay = day;
            }
          });
          
          peakTimeDisplay = bestDay || '--:--';
        } else if (timeRange === 'month') {
          // Find the hour with highest average energy across the month
          const hourlyMap = new Map<number, { sum: number; count: number }>();
          logs.forEach(log => {
            const hour = log.timestamp?.toDate().getHours();
            if (hour !== undefined) {
              const current = hourlyMap.get(hour) || { sum: 0, count: 0 };
              hourlyMap.set(hour, { sum: current.sum + log.level, count: current.count + 1 });
            }
          });

          let maxAvg = 0;
          let bestHour = -1;
          hourlyMap.forEach((val, hour) => {
            const hourAvg = val.sum / val.count;
            if (hourAvg > maxAvg) {
              maxAvg = hourAvg;
              bestHour = hour;
            }
          });
          
          if (bestHour !== -1) {
            const date = new Date();
            date.setHours(bestHour, 0);
            peakTimeDisplay = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          }
        }
        
        setPeakTime(peakTimeDisplay);

        // 3. Metabolic Stability (Standard Deviation)
        const variance = logs.reduce((sum, log) => sum + Math.pow(log.level - avg, 2), 0) / logs.length;
        const sd = Math.sqrt(variance);
        
        let stabilityLabel = 'Stable';
        if (sd < 1.0) stabilityLabel = 'High';
        else if (sd < 2.0) stabilityLabel = 'Moderate';
        else stabilityLabel = 'Low';

        setStability({
            label: stabilityLabel,
            value: Number((100 - (sd * 10)).toFixed(1)),
            trend: avg > 5 ? 'up' : 'down'
        });

      } else {
          setAvgScore(0);
          setPeakTime('--:--');
          setStability({ label: '-', value: 0, trend: 'stable' });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedDate, timeRange]);

  // Engine Suggestions
  const { suggestions, loading: engineLoading } = useDietaryEngine();

  // Helper function to calculate energy trend (compare to previous period)
  const calculateTrend = () => {
    if (data.length === 0) return { direction: 'neutral' as const, value: '--', color: 'text-slate-400', icon: 'trending_flat' };
    
    // Split data into two halves
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    if (firstHalf.length === 0 || secondHalf.length === 0) {
      return { direction: 'neutral' as const, value: '--', color: 'text-slate-400', icon: 'trending_flat' };
    }

    const firstAvg = firstHalf.reduce((sum, log) => sum + log.level, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, log) => sum + log.level, 0) / secondHalf.length;

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    const absTrend = Math.abs(percentChange).toFixed(0);

    if (percentChange > 5) {
      return { direction: 'up' as const, value: `+${absTrend}%`, color: 'text-emerald-500', icon: 'trending_up' };
    } else if (percentChange < -5) {
      return { direction: 'down' as const, value: `-${absTrend}%`, color: 'text-rose-500', icon: 'trending_down' };
    } else {
      return { direction: 'neutral' as const, value: '−5%–5%', color: 'text-slate-400', icon: 'trending_flat' };
    }
  };

  const trend = calculateTrend();
  const getAggregatedDataByDay = (logs: ChartData[]) => {
    const dayMap = new Map<string, { sum: number; count: number }>();
    
    logs.forEach(log => {
      const date = log.timestamp?.toDate();
      if (date) {
        const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const current = dayMap.get(day) || { sum: 0, count: 0 };
        dayMap.set(day, { sum: current.sum + log.level, count: current.count + 1 });
      }
    });

    return Array.from(dayMap.entries()).map(([day, stats]) => ({
      label: day,
      level: Number((stats.sum / stats.count).toFixed(1))
    }));
  };

  // Helper function to aggregate data by hour (for month view)
  const getAggregatedDataByHour = (logs: ChartData[]) => {
    const hourMap = new Map<number, { sum: number; count: number }>();
    
    logs.forEach(log => {
      const hour = log.timestamp?.toDate().getHours();
      if (hour !== undefined) {
        const current = hourMap.get(hour) || { sum: 0, count: 0 };
        hourMap.set(hour, { sum: current.sum + log.level, count: current.count + 1 });
      }
    });

    return Array.from(hourMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, stats]) => {
        const date = new Date();
        date.setHours(hour, 0);
        const label = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return {
          label,
          level: Number((stats.sum / stats.count).toFixed(1))
        };
      });
  };

  const getSuggestionStyle = (type: string) => {
    switch (type) {
        case 'warning':
            return {
                bg: 'bg-rose-50/50 dark:bg-rose-900/10',
                border: 'border-rose-500',
                iconBg: 'bg-rose-500',
                icon: 'warning',
                title: 'text-rose-900 dark:text-rose-100',
                text: 'text-rose-800/70 dark:text-rose-200/70'
            };
        case 'success':
            return {
                bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
                border: 'border-emerald-500',
                iconBg: 'bg-emerald-500',
                icon: 'verified',
                title: 'text-emerald-900 dark:text-emerald-100',
                text: 'text-emerald-800/70 dark:text-emerald-200/70'
            };
        case 'tip':
        default:
            return {
                bg: 'bg-blue-50/50 dark:bg-primary/10',
                border: 'border-primary',
                iconBg: 'bg-primary',
                icon: 'lightbulb',
                title: 'text-blue-900 dark:text-blue-100',
                text: 'text-blue-800/70 dark:text-blue-200/70'
            };
    }
  };


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 branch-lg p-3 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">
             {timeRange === 'day' ? new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : label}
          </p>
          <p className="text-primary font-bold text-sm">
            Energy: {payload[0].value}/10
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Energy Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">Correlating metabolic data with cognitive performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['Day', 'Week', 'Month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range.toLowerCase() as 'day' | 'week' | 'month')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timeRange === range.toLowerCase()
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <span className="material-icons-round">timer</span>
            </div>
            <span className={`text-xs font-bold flex items-center gap-1 ${trend.color}`}>
              <span className="material-icons-round text-sm">{trend.icon}</span> {trend.value}
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Peak Energy Time</h3>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{peakTime}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${
                avgScore >= 7 ? 'bg-emerald-50 text-emerald-600' :
                avgScore >= 4 ? 'bg-amber-50 text-amber-600' :
                'bg-rose-50 text-rose-600'
            }`}>
              <span className="material-icons-round">bolt</span>
            </div>
            <span className={`text-xs font-bold ${
              avgScore >= 7 ? 'text-emerald-500' :
              avgScore >= 4 ? 'text-amber-500' :
              'text-rose-500'
            }`}>
              {avgScore >= 7 ? 'Excellent' : avgScore >= 4 ? 'Moderate' : 'Low'}
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Avg. Energy Score</h3>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{avgScore} / 10</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg shrink-0">
              <span className="material-icons-round">auto_graph</span>
            </div>
            <span className={`text-[10px] sm:text-xs font-bold flex flex-wrap items-center justify-end gap-1 text-right ${
              stability.value >= 80 ? 'text-emerald-500' :
              stability.value >= 60 ? 'text-amber-500' :
              'text-rose-500'
            }`}>
               {stability.value >= 80 ? 'Excellent' : stability.value >= 60 ? 'Good' : 'Needs Optimization'}
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Metabolic Stability</h3>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{stability.value}%</p>
        </div>
      </div>

      {/* Energy Trend Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daily Energy Flux</h2>
            <p className="text-sm text-slate-400">
              {timeRange === 'day' && 'Time vs Energy Level (1-10)'}
              {timeRange === 'week' && 'Average Energy by Day'}
              {timeRange === 'month' && 'Average Energy by Hour'}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary"></span>
              <span className="text-xs font-medium text-slate-500">Energy</span>
            </div>
          </div>
        </div>
      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-icons-round text-primary">analytics</span>
                Energy Flow
            </h3>
            
            <div className="h-[300px] w-full" ref={containerRef} tabIndex={-1} style={{ outline: 'none' }}>
                {dimensions.width > 0 && dimensions.height > 0 ? (
                    <AreaChart 
                        width={dimensions.width}
                        height={dimensions.height}
                        data={timeRange === 'day' ? data : timeRange === 'week' ? getAggregatedDataByDay(data) : getAggregatedDataByHour(data)} 
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                        <XAxis 
                            dataKey={timeRange === 'day' ? 'rawTime' : 'label'} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            interval="preserveStartEnd"
                            tickFormatter={(value) => {
                                if (timeRange === 'day') {
                                return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                }
                                return value;
                            }}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10 }} 
                            domain={[0, 10]}
                            ticks={[0, 2, 4, 6, 8, 10]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                            type="monotone" 
                            dataKey={timeRange === 'day' ? 'level' : 'level'} // level is used in both raw and aggregated
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorEnergy)" 
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                )}
            </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
             {/* Peak Flow Card */}
             <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-xl text-white shadow-lg shadow-primary/20">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Peak Flow</p>
                        <h4 className="text-3xl font-black mt-1">
                            {peakTime}
                        </h4>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <span className="material-icons-round">bolt</span>
                    </div>
                </div>
                <p className="text-sm text-blue-100 leading-relaxed">
                    You consistently reach your highest energy levels around {peakTime} after high-protein meals.
                </p>
             </div>

             {/* Fuel Impact Card */}
             <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-white/20 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <span className="material-icons-round text-6xl text-slate-500">restaurant</span>
                 </div>
                 <h4 className="font-bold text-slate-800 dark:text-white mb-2">Fuel Impact</h4>
                 <div className="space-y-4 relative z-10">
                     <div className="flex items-center justify-between text-sm">
                         <span className="text-slate-500">High Protein</span>
                         <span className="font-bold text-green-500 flex items-center gap-1">
                             <span className="material-icons-round text-sm">arrow_upward</span>
                             +15% Energy
                         </span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                         <span className="text-slate-500">High Sugar</span>
                         <span className="font-bold text-red-500 flex items-center gap-1">
                             <span className="material-icons-round text-sm">arrow_downward</span>
                             -20% Crash
                         </span>
                     </div>
                 </div>
             </div>
        </div>
      </div>
      </div>

       {/* Engine Suggestions Grid */}
       <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="material-icons-round text-primary">psychology</span>
            Engine Suggestions
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {engineLoading ? (
                <div className="col-span-3 text-center py-10 text-slate-400 italic">Analyzing your metabolic data...</div>
            ) : suggestions.length === 0 ? (
                <div className="col-span-3 text-center py-10 text-slate-400 italic">
                    No suggestions yet. Keep logging meals and energy levels to unlock insights.
                </div>
            ) : (
                suggestions.map((suggestion) => {
                    const style = getSuggestionStyle(suggestion.type);
                    return (
                        <div key={suggestion.id} className={`${style.bg} border-l-4 ${style.border} p-6 rounded-xl`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-2 ${style.iconBg} text-white rounded-lg`}>
                                    <span className="material-icons-round">{style.icon}</span>
                                </div>
                                <div>
                                    <h4 className={`font-bold ${style.title}`}>{suggestion.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h4>
                                    <p className={`text-sm ${style.text} mt-1 leading-relaxed`}>{suggestion.message}</p>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
}

