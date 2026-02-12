// This is the useUserProfile hook.
// It is used to get the user profile from the database.
// Refactored to use TanStack Query.

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  onboardingCompleted: boolean;
  age?: number;
  gender?: string;
  weight?: number; // in kg
  height?: number; // in cm
  allergens?: string[];
  goal?: 'weight_loss' | 'maintenance' | 'muscle_gain' | 'focus';
  role?: 'free' | 'premium';
  targets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!user) throw new Error('No user');
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, data);
      return data;
    },
    onSuccess: (newData) => {
      // Optimistic update or invalidation
      queryClient.setQueryData(['userProfile', user?.uid], (old: UserProfile | null) => {
        return old ? { ...old, ...newData } : null;
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
    },
  });

  return { 
    profile: profile || null, 
    loading: isLoading, 
    error: error ? (error as Error).message : null, 
    updateProfile: mutation.mutateAsync 
  };
}
