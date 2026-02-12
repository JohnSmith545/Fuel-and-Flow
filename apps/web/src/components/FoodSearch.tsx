// This is the FoodSearch component.
// It is used to search for food items and add them to the daily log.
// It is used in the App.tsx file.

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/Button';
import { Card, CardContent } from '@repo/ui/Card';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../providers/AuthProvider';
import { useUserProfile } from '../hooks/useUserProfile';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Mock Database for MVP
const FOOD_DATABASE = [
  { id: '1', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, ingredients: ['oats'], recipe: 'Boil water, add oats, cook for 5 mins.' },
  { id: '2', name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 3, fat: 0, ingredients: ['milk', 'dairy'] },
  { id: '3', name: 'Peanut Butter Sandwich', calories: 400, protein: 12, carbs: 40, fat: 20, ingredients: ['peanuts', 'bread', 'gluten'], recipe: 'Spread peanut butter on bread.' },
  { id: '4', name: 'Grilled Chicken Salad', calories: 350, protein: 30, carbs: 10, fat: 15, ingredients: ['chicken', 'lettuce', 'tomato'], recipe: 'Grill chicken, toss with lettuce and tomato.' },
  { id: '5', name: 'Protein Shake', calories: 120, protein: 24, carbs: 2, fat: 1, ingredients: ['whey', 'dairy', 'soy'], recipe: 'Mix powder with water or milk.' },
  { id: '6', name: 'Donut', calories: 300, protein: 2, carbs: 35, fat: 15, ingredients: ['flour', 'sugar', 'gluten', 'egg'], recipe: 'Buy from store.' },
];

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[]; 
  recipe?: string;
  isCustom?: boolean;
  isRecommended?: boolean;
}

interface FoodSearchProps {
  onAddFood: (food: FoodItem) => void;
}

export function FoodSearch({ onAddFood }: FoodSearchProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [customMeals, setCustomMeals] = useState<FoodItem[]>([]);

  // Recipe Modal State
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<{name: string, instructions: string, ingredients?: string[]} | null>(null);

  // Premium Feature Modal State
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  // Custom Meal Form State
  const [isCreatingMeal, setIsCreatingMeal] = useState(false);
  const [newMeal, setNewMeal] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
    recipe: string;
  }>({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: '', recipe: '' });

  // Fetch Custom Meals
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'custom_meals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const meals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isCustom: true })) as FoodItem[];
        setCustomMeals(meals);
    });
    return () => unsubscribe();
  }, [user]);

  const isRecommended = (food: FoodItem) => {
    if (!profile?.goal) return false;
    switch (profile.goal) {
      case 'weight_loss': // Low Cal (< 400) + High Protein (> 20)
        return food.calories < 400 && food.protein > 20;
      case 'muscle_gain': // High Protein (> 25)
        return food.protein > 25;
      case 'maintenance': // Balanced (Protein > 15, Cal < 600)
        return food.protein > 15 && food.calories < 600;
      case 'focus': // Low Carb (< 30) + Mod Protein (> 10)
        return food.carbs < 30 && food.protein > 10;
      default:
        return false;
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQueryText(val);
    
    if (val.length > 0) {
      const allFoods = [...FOOD_DATABASE, ...customMeals];
      const filtered = allFoods.filter(food => 
        food.name.toLowerCase().includes(val.toLowerCase())
      );
      
      // Sort: Recommended first
      filtered.sort((a, b) => {
        const aRec = isRecommended(a);
        const bRec = isRecommended(b);
        if (aRec && !bRec) return -1;
        if (!aRec && bRec) return 1;
        return 0;
      });

      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  // Success Message Modal State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateMeal = async () => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'users', user.uid, 'custom_meals'), {
            name: newMeal.name,
            calories: Number(newMeal.calories),
            protein: Number(newMeal.protein),
            carbs: Number(newMeal.carbs),
            fat: Number(newMeal.fat),
            ingredients: newMeal.ingredients.split(',').map(i => i.trim()),
            recipe: newMeal.recipe,
            createdAt: serverTimestamp()
        });
        setSuccessMessage('Custom meal added successfully!');
        setIsCreatingMeal(false);
        setNewMeal({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: '', recipe: '' });
    } catch (error) {
        console.error("Error creating meal", error);
        alert("Failed to create meal");
    }
  };

  const handleCreateClick = () => {
    if (!profile || profile.role === 'free') {
        setPremiumModalOpen(true);
        return;
    }
    setIsCreatingMeal(true);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
            <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Log a Meal</label>
            <input
                type="text"
                value={queryText}
                onChange={handleSearch}
                placeholder="Search food (e.g., 'Oatmeal')..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            </div>
            <div className="flex items-end">
                <Button variant="secondary" onClick={handleCreateClick}>
                    + Create Meal
                </Button>
            </div>
        </div>

        {/* Custom Meal Form Modal */}
        {isCreatingMeal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold">Create Custom Meal</h3>
                    <input className="w-full border p-2 rounded" placeholder="Meal Name" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                        <input className="border p-2 rounded" type="number" placeholder="Calories" value={newMeal.calories || ''} onChange={e => setNewMeal({...newMeal, calories: Number(e.target.value)})} />
                        <input className="border p-2 rounded" type="number" placeholder="Protein (g)" value={newMeal.protein || ''} onChange={e => setNewMeal({...newMeal, protein: Number(e.target.value)})} />
                        <input className="border p-2 rounded" type="number" placeholder="Carbs (g)" value={newMeal.carbs || ''} onChange={e => setNewMeal({...newMeal, carbs: Number(e.target.value)})} />
                        <input className="border p-2 rounded" type="number" placeholder="Fat (g)" value={newMeal.fat || ''} onChange={e => setNewMeal({...newMeal, fat: Number(e.target.value)})} />
                    </div>
                    <textarea className="w-full border p-2 rounded" placeholder="Ingredients (comma separated)" value={newMeal.ingredients} onChange={e => setNewMeal({...newMeal, ingredients: e.target.value})} />
                    <textarea className="w-full border p-2 rounded" placeholder="Recipe Instructions" value={newMeal.recipe} onChange={e => setNewMeal({...newMeal, recipe: e.target.value})} />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsCreatingMeal(false)}>Cancel</Button>
                        <Button onClick={handleCreateMeal}>Save Meal</Button>
                    </div>
                </div>
            </div>
        )}

        <ConfirmModal 
            isOpen={premiumModalOpen}
            onClose={() => setPremiumModalOpen(false)}
            title="Premium Feature"
            description="Creating custom meals is a Premium feature. Upgrade to create your own meals!"
            confirmText="OK"
        />
        
        {/* Helper Modal for Success (reusing ConfirmModal logic somewhat or just creating a new state for it) */}
        {/* Actually, let's reuse ConfirmModal for Success Message purely */}
        <ConfirmModal 
             isOpen={!!successMessage}
             onClose={() => setSuccessMessage(null)}
             title="Success"
             description={successMessage || ''}
             confirmText="OK"
             variant="primary"
        />

        {results.length > 0 && (
          <ul className="border rounded-md divide-y overflow-hidden max-h-60 overflow-y-auto">
            {results.map((food) => (
              <li key={food.id} className="p-3 bg-white hover:bg-slate-50 flex justify-between items-center transition-colors">
                <div>
                  <div className="font-medium text-slate-900 flex items-center gap-2">
                      {food.name}
                      {food.isCustom && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Custom</span>}
                      {isRecommended(food) && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-icons-round text-[10px]">stars</span>
                          Recommended
                        </span>
                      )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {food.calories}kcal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                  </div>
                </div>
                <div className="flex gap-2">
                    {food.recipe && (
                        <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                            setSelectedRecipe({ 
                              name: food.name, 
                              instructions: food.recipe!,
                              ingredients: food.ingredients 
                            });
                            setRecipeModalOpen(true);
                        }}
                        >
                        Recipe
                        </Button>
                    )}
                    <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                        onAddFood({
                          ...food,
                          isRecommended: isRecommended(food)
                        });
                        setQueryText('');
                        setResults([]);
                    }}
                    >
                    Add
                    </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <ConfirmModal 
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        title={`Recipe: ${selectedRecipe?.name}`}
        description={
          <div className="space-y-4">
            {selectedRecipe?.ingredients && selectedRecipe.ingredients.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-slate-700 mb-1">Ingredients:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedRecipe?.instructions ? (
              <div>
                <h4 className="font-semibold text-sm text-slate-700 mb-1">Instructions:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                    {selectedRecipe.instructions
                        .split(/\n|(?<=[.?!])\s+/) // Split by newline OR period/punctuation followed by space
                        .map(step => step.trim())
                        .filter(step => step.length > 0)
                        .map((step, idx) => (
                            <li key={idx}>{step}</li>
                        ))
                    }
                </ul>
              </div>
            ) : <p className="text-sm text-slate-500">No instructions available.</p>}
          </div>
        }
        confirmText="Close"
        // Hide cancel button by NOT passing onConfirm (Wait, ConfirmModal logic: if onConfirm is undefined, show OK. If defined, show Cancel + Confirm. Here we just want a Close button, so passing NO onConfirm is correct for alert style, but title says 'ConfirmModal' so it might be confusing. I'll pass no onConfirm which renders 'OK' button effectively acting as Close)
      />
      <ConfirmModal 
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        title="Premium Feature"
        description="Creating custom meals is a Premium feature. Upgrade to create your own meals!"
        confirmText="OK"
      />
    </Card>
  );
}
