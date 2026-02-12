import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FoodLogger } from './FoodLogger';
import { Timestamp } from 'firebase/firestore';

// 1. Mock Hooks
const { mockUseAuth, mockUseUserProfile, mockUseEnergyLog } = vi.hoisted(() => ({
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
    loading: false,
  }),
}));

// 2. Mock Firestore
const { mockAddDoc, mockOnSnapshot } = vi.hoisted(() => ({
    mockAddDoc: vi.fn(),
    mockOnSnapshot: vi.fn(),
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(() => 'MOCK_COLLECTION_REF'),
        query: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        where: vi.fn(),
        addDoc: mockAddDoc,
        getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })), // Default empty for eligibility check
        onSnapshot: (query: unknown, callback: (snapshot: unknown) => void) => {
            mockOnSnapshot(query, callback);
            // Simulate data being returned immediately
            act(() => {
                callback({
                    docs: [
                        {
                            id: 'custom-1',
                            data: () => ({
                                name: 'My Custom Shake',
                                calories: 400,
                                protein: 30,
                                carbs: 20,
                                fat: 10,
                                ingredients: ['whey', 'milk'],
                                recipe: 'Mix it',
                                createdAt: Timestamp.now()
                            })
                        }
                    ]
                });
            });
            return () => {}; // Unsubscribe
        },
        // Return a non-undefined value so expect.anything() works, or match explicitly
        serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
    }
});

vi.mock('../lib/firebase', () => ({
    db: {}
}));

// 3. Helper to render
const renderComponent = (props = {}) => {
    return render(<FoodLogger {...props} />);
};

describe('FoodLogger Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default Auth & Profile
        mockUseAuth.mockReturnValue({ user: { uid: 'test-user-123' } });
        mockUseUserProfile.mockReturnValue({ 
            profile: { 
                role: 'free', 
                goal: 'muscle_gain' // Helper for "Recommended" logic
            },
            loading: false 
        });

        // Default Energy Log
        mockUseEnergyLog.mockResolvedValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ==========================================
    // INITIALIZATION TESTS
    // ==========================================
    describe('Initialization', () => {
        it('renders search bar and default sections', async () => {
            renderComponent();
            
            expect(screen.getByPlaceholderText(/What are you fueling with/i)).toBeInTheDocument();
            expect(screen.getByText('Recommended Fuel')).toBeInTheDocument();
        });

        it('loads and displays custom meals from firestore', async () => {
            renderComponent();
            
            // "My Custom Shake" comes from the mockOnSnapshot implementation above
            expect(await screen.findByText('My Custom Shake')).toBeInTheDocument();
            expect(screen.getByText('Custom')).toBeInTheDocument(); // Checks for the badge
        });

        it('highlights recommended foods based on profile goal', async () => {
            // goal is 'muscle_gain' -> Protein > 25
            renderComponent();

            // "Grilled Chicken Salad" (from static FOOD_DATABASE) has 30g protein
            // Wait for it to appear (search results default to recent/mixed)
            const chickenItem = await screen.findByText('Grilled Chicken Salad');
            expect(chickenItem).toBeInTheDocument();

            // Check for "Rec" badge within the same container or nearby
            // This might be tricky with `getByText` if strict, creating a more robust check:
            const card = chickenItem.closest('div.group'); 
            expect(card).toHaveTextContent(/Rec/i); 
        });
    });

    // ==========================================
    // SEARCH TESTS
    // ==========================================
    describe('Search Functionality', () => {
        it('filters results when typing', async () => {
            renderComponent();
            
            const input = screen.getByPlaceholderText(/What are you fueling with/i);
            fireEvent.change(input, { target: { value: 'Donut' } });

            // "Donut" should be visible
            expect(await screen.findByText('Donut')).toBeInTheDocument();
            
            // "Grilled Chicken Salad" should NOT be visible (it's in default list, but should be filtered out)
            // Note: queryByText returns null if not found
            expect(screen.queryByText('Grilled Chicken Salad')).not.toBeInTheDocument();
        });

        it('shows "No foods found" for invalid search', async () => {
            renderComponent();
            
            const input = screen.getByPlaceholderText(/What are you fueling with/i);
            fireEvent.change(input, { target: { value: 'XUEHUIAHOISHDA' } });

            expect(await screen.findByText(/No foods found/i)).toBeInTheDocument();
        });
    });

    // ==========================================
    // INTERACTION TESTS
    // ==========================================
    describe('Interactions', () => {
        it('calls onAddFood when clicking a food item', async () => {
            const handleAddFood = vi.fn();
            renderComponent({ onAddFood: handleAddFood });

            const foodItem = await screen.findByText('Grilled Chicken Salad');
            fireEvent.click(foodItem);

            expect(handleAddFood).toHaveBeenCalledTimes(1);
            // Verify it was called with the correct object (partial match check)
            expect(handleAddFood).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Grilled Chicken Salad'
            }));
        });

        it('opens create meal modal when clicking "Create Custom Meal" (Gold/Premium)', async () => {
            mockUseUserProfile.mockReturnValue({ profile: { role: 'premium' } });
            renderComponent();

            const createBtn = screen.getByText(/Create Custom Meal/i);
            fireEvent.click(createBtn);

            expect(screen.getByText('Meal Details')).toBeInTheDocument(); // Modal Header/Content
        });

        it('shows premium gate when clicking "Create Custom Meal" as Free user', async () => {
            // Default mock is free, but explicit here for clarity
            mockUseUserProfile.mockReturnValue({ profile: { role: 'free' } });
            renderComponent();

            const createBtn = screen.getByText(/Create Custom Meal/i);
            fireEvent.click(createBtn);

            // Use Heading to be specific and avoid multiple matches
            expect(await screen.findByRole('heading', { name: /Premium Feature/i })).toBeInTheDocument();
            expect(screen.queryByText('Meal Details')).not.toBeInTheDocument();
        });

        it('submits a new custom meal', async () => {
            mockUseUserProfile.mockReturnValue({ profile: { role: 'premium' } });
            renderComponent();

            // 1. Open Modal
            fireEvent.click(screen.getByText(/Create Custom Meal/i));

            // 2. Fill Form
            // Input for Name
            fireEvent.change(screen.getByPlaceholderText(/Meal Name/i), { target: { value: 'Super Toast' } });
            
            // Numeric Inputs
            const numberInputs = screen.getAllByRole('spinbutton'); // input type="number"
            // Order: Calories, Protein, Carbs, Fat
            fireEvent.change(numberInputs[0], { target: { value: '200' } }); // Cals
            fireEvent.change(numberInputs[1], { target: { value: '10' } });  // Protein

            fireEvent.change(screen.getByPlaceholderText(/Ingredients/i), { target: { value: 'Bread, Butter' } });

            // 3. Save
            const saveBtn = screen.getByText('Save Meal');
            fireEvent.click(saveBtn);

            // 4. Verify addDoc called
            expect(mockAddDoc).toHaveBeenCalledTimes(1);
            expect(mockAddDoc).toHaveBeenCalledWith(
                expect.anything(), // Collection ref (mocked)
                expect.objectContaining({
                    name: 'Super Toast',
                    calories: 200,
                    protein: 10,
                    carbs: 0,
                    fat: 0,
                    ingredients: ['Bread', 'Butter'],
                    recipe: '',
                    createdAt: 'MOCK_TIMESTAMP'
                })
            );
        });
    });
});
