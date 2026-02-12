import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FoodLogger } from '../components/FoodLogger';
import { Timestamp } from 'firebase/firestore';

// Integration Test: Logging Flow
// Goal: Verify that selecting a food item results in the correct data payload being sent to the database.

// 1. Mock Everything (Integration style - mocking the boundary, not the internals if possible, but here we mock DB)
const { mockAddDoc, mockUseAuth, mockUseUserProfile, mockUseEnergyLog } = vi.hoisted(() => ({
    mockAddDoc: vi.fn(),
    mockUseAuth: vi.fn(),
    mockUseUserProfile: vi.fn(),
    mockUseEnergyLog: vi.fn(),
}));

vi.mock('../providers/AuthProvider', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('../hooks/useUserProfile', () => ({
    useUserProfile: () => mockUseUserProfile(),
}));

vi.mock('../hooks/useEnergyLog', () => ({
    useEnergyLog: () => ({
        logEnergy: mockUseEnergyLog, 
        loading: false
    }),
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(() => 'MOCK_COLLECTION_REF'),
        addDoc: mockAddDoc,
        // Stub other methods needed for FoodLogger mount
        query: vi.fn(),
        onSnapshot: vi.fn(() => () => {}),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
        serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
    }
});

describe('Integration: Food Logging Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({ user: { uid: 'test-user' } });
        mockUseUserProfile.mockReturnValue({ profile: { role: 'premium', goal: 'muscle_gain' }, loading: false });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('calls onAddFood prop when clicking a recommended food', async () => {
        // FoodLogger calls onAddFood prop when an existing item is clicked. 
        // It does NOT call addDoc directly for existing items (that's likely handled by a parent component in the real app).
        const onAddFoodMock = vi.fn();
        render(<FoodLogger onAddFood={onAddFoodMock} />);

        // 1. Find item
        const foodItem = await screen.findByText(/Grilled Chicken Salad/i);
        
        // 2. Click item
        fireEvent.click(foodItem);
        
        // 3. Verify Prop Call
        expect(onAddFoodMock).toHaveBeenCalledTimes(1);
        expect(onAddFoodMock).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Grilled Chicken Salad',
            calories: 350,
            protein: 30
        }));
    });

    it('creates a new custom meal document when saving a custom meal', async () => {
        render(<FoodLogger />);

        // 1. Create Custom Meal button
        fireEvent.click(screen.getByText('Create Custom Meal'));

        // 2. Fill Form
        const nameInput = await screen.findByPlaceholderText(/Meal Name/i);
        fireEvent.change(nameInput, { target: { value: 'Post-Workout Shake' } });
        
        const inputs = screen.getAllByPlaceholderText('0');
        const calInput = inputs[0];
        const protInput = inputs[1];

        fireEvent.change(calInput, { target: { value: '400' } });
        fireEvent.change(protInput, { target: { value: '40' } });
        
        // 3. Save
        const saveBtn = screen.getByText('Save Meal');
        fireEvent.click(saveBtn);

        // 4. Verify Payload (Custom meals ARE saved to DB by this component)
        await waitFor(() => {
             expect(mockAddDoc).toHaveBeenCalledWith(
                'MOCK_COLLECTION_REF',
                expect.objectContaining({
                    name: 'Post-Workout Shake',
                    calories: 400,
                    protein: 40,
                    carbs: 0,
                    fat: 0,
                    ingredients: [''],
                    recipe: '',
                    createdAt: 'MOCK_TIMESTAMP'
                })
             );
        });
    });
});
