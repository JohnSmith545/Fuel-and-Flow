
import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface EnergyLog {
  id: string;
  level: number;
  tags: string[];
  notes?: string;
  timestamp: any; // ServerTimestamp can be tricky with types
}

export function useEnergyLog() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logEnergy = async (level: number, tags: string[], notes?: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const logsRef = collection(db, 'users', user.uid, 'energy_logs');
      await addDoc(logsRef, {
        level,
        tags,
//        notes, // keeping it simple for now, but preserving API if needed later. But usually just tags + level.
        timestamp: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Error logging energy:", err);
      setError('Failed to log energy');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { logEnergy, loading, error };
}
