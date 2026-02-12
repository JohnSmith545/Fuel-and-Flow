import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSettings } from './ProfileSettings';

// Mock Hooks
const { mockUseAuth, mockUseUserProfile, mockUseTheme } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseUserProfile: vi.fn(),
  mockUseTheme: vi.fn(),
}));

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../hooks/useUserProfile', () => ({
    useUserProfile: () => mockUseUserProfile(),
    UserProfile: {} // Mock type if needed, though strictly not needed for runtime
}));

vi.mock('../providers/ThemeProvider', () => ({
    useTheme: () => mockUseTheme()
}));

describe('ProfileSettings Component', () => {
    const mockUpdateProfile = vi.fn();
    const mockLogout = vi.fn();
    const mockSetTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockUseAuth.mockReturnValue({ 
            user: { uid: 'test-user' },
            logout: mockLogout
        });

        mockUseTheme.mockReturnValue({
            theme: 'light',
            setTheme: mockSetTheme
        });

        // Default Profile
        mockUseUserProfile.mockReturnValue({
            profile: {
                uid: 'test-user',
                role: 'free',
                age: 30,
                weight: 80,
                height: 180,
                gender: 'male',
                goal: 'maintenance',
                allergens: []
            },
            updateProfile: mockUpdateProfile,
            loading: false
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders profile summary initially (View Mode)', () => {
        render(<ProfileSettings />);
        expect(screen.getByText('My Profile')).toBeInTheDocument();
        expect(screen.getByText(/80kg/)).toBeInTheDocument();
        expect(screen.getByText(/180cm/)).toBeInTheDocument();
        // Check edit button exists
        expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('switches to edit mode and pre-fills form', () => {
        render(<ProfileSettings />);
        
        const editBtn = screen.getByText('Edit');
        fireEvent.click(editBtn);

        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        expect(screen.getByDisplayValue('80')).toBeInTheDocument(); // Weight
        expect(screen.getByDisplayValue('180')).toBeInTheDocument(); // Height
    });

    it('validates required fields on save', async () => {
        render(<ProfileSettings />);
        fireEvent.click(screen.getByText('Edit')); // Enter edit mode

        // Clear a required field (Weight)
        const weightInput = screen.getByDisplayValue('80');
        fireEvent.change(weightInput, { target: { value: '' } });

        // Save
        fireEvent.click(screen.getByText('Save Changes'));

        // Expect Error Modal (Missing Information)
        expect(await screen.findByText('Missing Information')).toBeInTheDocument();
        expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('submits valid data correctly', async () => {
        render(<ProfileSettings />);
        fireEvent.click(screen.getByText('Edit'));

        // Change weight
        const weightInput = screen.getByDisplayValue('80');
        fireEvent.change(weightInput, { target: { value: '85' } });

        // Change goal
        fireEvent.change(screen.getByRole('combobox', { name: /Goal/i }), { target: { value: 'muscle_gain' } });

        // Save
        mockUpdateProfile.mockResolvedValue(true);
        fireEvent.click(screen.getByText('Save Changes'));

        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
                weight: 85,
                goal: 'muscle_gain'
            }));
        });

        // Expect Success Modal
        expect(await screen.findByText('Success')).toBeInTheDocument();
    });
});
