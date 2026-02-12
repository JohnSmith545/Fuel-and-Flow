import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DailyFuel } from './DailyFuel';
import { Timestamp } from 'firebase/firestore';
import * as Firestore from 'firebase/firestore';

// 1. Mock Hooks
const { mockUseAuth, mockUseUserProfile, mockUseLogMeal, mockDeleteLog, mockOnSnapshot } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseUserProfile: vi.fn(),
  mockUseLogMeal: vi.fn(),
  mockDeleteLog: vi.fn(),
  mockOnSnapshot: vi.fn(),
}));

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../hooks/useUserProfile', () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

vi.mock('../hooks/useLogMeal', () => ({
  useLogMeal: () => ({
    deleteLog: mockDeleteLog,
  }),
}));

// 2. Mock Firestore
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        orderBy: vi.fn(),
        where: vi.fn(),
        onSnapshot: (query: unknown, callback: (snapshot: unknown) => void) => {
            return mockOnSnapshot(query, callback);
        },
    }
});

vi.mock('../lib/firebase', () => ({
    db: {}
}));

describe('DailyFuel Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default Auth & Profile
        mockUseAuth.mockReturnValue({ user: { uid: 'test-user' } });
        mockUseUserProfile.mockReturnValue({ profile: { role: 'free', targets: { calories: 2000, protein: 150, carbs: 200, fat: 70 } }, loading: false });
        mockDeleteLog.mockResolvedValue(true);

        // Default: Return one meal
        mockOnSnapshot.mockImplementation((query, callback) => {
            act(() => {
                callback({
                    docs: [
                        {
                            id: 'meal-1',
                            data: () => ({
                                name: 'Test Meal',
                                calories: 500,
                                protein: 30,
                                carbs: 50,
                                fat: 20,
                                loggedAt: Timestamp.now()
                            })
                        }
                    ]
                });
            });
            return () => {}; // Unsubscribe
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Rendering & Calculations', () => {
        it('renders meal list correctly', async () => {
            render(<DailyFuel selectedDate={new Date()} />);
            expect(await screen.findByText('Test Meal')).toBeInTheDocument();
            // Check formatted macros
            expect(screen.getByText('500 kcal')).toBeInTheDocument();
        });

        it('displays "No meals logged" on empty state', async () => {
            // Override mock to return empty
            mockOnSnapshot.mockImplementation((query, callback) => {
                act(() => {
                    callback({ docs: [] });
                });
                return () => {}; 
            });

            render(<DailyFuel selectedDate={new Date()} />);
            expect(await screen.findByText('No meals logged for this day.')).toBeInTheDocument();
        });

        it('calculates total macros correctly', async () => {
            // The MacroSummary component receives totals. 
            // We can check if the MacroSummary displays the correct values.
            // Based on our 1 meal: 500 cal, 30p, 50c, 20f.
            // Assuming MacroSummary displays these values directly or in a progress bar.
            // Let's rely on text presence of the values.
            render(<DailyFuel selectedDate={new Date()} />);
            
            // Wait for load
            await screen.findByText('Test Meal');

            // Check if MacroSummary text is present (it usually shows "30g" "50g" etc)
            // Note: Use getAllByText because specific values might appear multiple times (in list and summary)
            expect(screen.getAllByText(/30/)).toHaveLength(2); // One in list, one in summary 
        });
    });

    describe('Role-Based Deletion', () => {
        it('allows delete for free users (Confirmation Modal)', async () => {
            render(<DailyFuel selectedDate={new Date()} />);
            
            await screen.findByText('Test Meal');
            
            // Click delete
            // Note: In mobile view it's a visible button, in desktop it's hover.
            // RTL can click it if it's in the DOM, even if opacity is 0 (usually).
            // But we can target by title "Delete Log"
            const deleteBtns = screen.getAllByTitle('Delete Log'); // might match multiple if multiple items, but we mocked 1
            fireEvent.click(deleteBtns[0]);
            
            // Should see Confirmation
            expect(await screen.findByText('Delete Meal Log')).toBeInTheDocument();
            
            // Confirm
            fireEvent.click(screen.getByText('Yes, Delete'));

            expect(mockDeleteLog).toHaveBeenCalledWith('meal-1');
        });

         it('handles delete errors (e.g. CANNOT_DELETE restrictions)', async () => {
             // Mock delete failure
             const errorMsg = 'CANNOT_DELETE: You cannot delete meals from the past.';
             mockDeleteLog.mockRejectedValue(new Error(errorMsg));

            render(<DailyFuel selectedDate={new Date()} />);
            await screen.findByText('Test Meal');
            
            fireEvent.click(screen.getAllByTitle('Delete Log')[0]);
            fireEvent.click(screen.getByText('Yes, Delete'));

            // Expect modal to update to error state
            // The component replaces "Delete Meal Log" with "Cannot Delete Meal" title
            expect(await screen.findByText('Cannot Delete Meal')).toBeInTheDocument();
            expect(screen.getByText('You cannot delete meals from the past.')).toBeInTheDocument();
        });
    });
});
