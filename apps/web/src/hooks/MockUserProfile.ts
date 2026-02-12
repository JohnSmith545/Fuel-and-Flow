// Mock useUserProfile for E2E testing
export function useUserProfile() {
  return {
    profile: {
      onboardingCompleted: true,
      role: 'premium',
      goal: 'maintenance',
      allergens: ['peanuts', 'dairy'],
      name: 'Test User',
      email: 'test@example.com'
    },
    loading: false,
    updateProfile: async () => {}
  };
}
