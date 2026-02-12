
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/Card';
 import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface EnergyLog {
  id: string;
  level: number;
  tags: string[];
  timestamp: Timestamp;
}

export function EnergyChart({ selectedDate }: { selectedDate: Date }) {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logsRef = collection(db, 'users', user.uid, 'energy_logs');
    
    const q = query(
      logsRef, 
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('timestamp', 'desc'), // Newest first to get the *last* 10
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          level: d.level,
          time: d.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTime: d.timestamp?.toDate().getTime()
        };
      }).reverse(); // Reverse back to chronological order (Oldest -> Newest) for the chart
      setData(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedDate]);

  if (loading) return <div className="text-sm text-slate-500">Loading chart...</div>;
  if (data.length === 0) return <div className="text-sm text-slate-400 italic">No energy logs yet.</div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Energy Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-w-0" ref={containerRef}>
          {dimensions.width > 0 && dimensions.height > 0 && (
            <LineChart width={dimensions.width} height={dimensions.height} data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="rawTime" 
                type="category"
                tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                interval={0}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                domain={[0, 10]} 
                ticks={[0, 2, 4, 6, 8, 10]} 
                interval={0}
              />
              <Tooltip 
                labelFormatter={(label) => new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
              <Line type="linear" dataKey="level" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
