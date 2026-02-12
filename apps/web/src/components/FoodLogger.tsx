import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useUserProfile } from '../hooks/useUserProfile';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FoodItem } from '../hooks/useLogMeal';
import { useEnergyLog } from '../hooks/useEnergyLog';
import { ConfirmModal } from './ConfirmModal';

const TAGS = ['Focused', 'Foggy', 'Jittery', 'Sluggish', 'Bloated', 'Hyper', 'Calm', 'Anxious', 'Sharp', 'Tired'];

// Mock Database (moved from FoodSearch.tsx)
const FOOD_DATABASE: FoodItem[] = [
  { id: '1', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, ingredients: ['oats'], recipe: 'Boil water, add oats, cook for 5 mins.', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=150&q=80' },
  { id: '2', name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 3, fat: 0, ingredients: ['milk', 'dairy'], image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=150&q=80' },
  { id: '3', name: 'Peanut Butter Sandwich', calories: 400, protein: 12, carbs: 40, fat: 20, ingredients: ['peanuts', 'bread', 'gluten'], recipe: 'Spread peanut butter on bread.', image: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?auto=format&fit=crop&w=150&q=80' },
  { id: '4', name: 'Grilled Chicken Salad', calories: 350, protein: 30, carbs: 10, fat: 15, ingredients: ['chicken', 'lettuce', 'tomato'], recipe: 'Grill chicken, toss with lettuce and tomato.', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80' },
  { id: '5', name: 'Protein Shake', calories: 120, protein: 24, carbs: 2, fat: 1, ingredients: ['whey', 'dairy', 'soy'], recipe: 'Mix powder with water or milk.', image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=150&q=80' },
  { id: '6', name: 'Donut', calories: 300, protein: 2, carbs: 35, fat: 15, ingredients: ['flour', 'sugar', 'gluten', 'egg'], recipe: 'Buy from store.', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=150&q=80' },
];

interface FoodLoggerProps {
  onAddFood?: (food: FoodItem) => void;
}

export function FoodLogger({ onAddFood }: FoodLoggerProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [customMeals, setCustomMeals] = useState<FoodItem[]>([]);
  
  // Modals
  const [isCreatingMeal, setIsCreatingMeal] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<FoodItem | null>(null);

  // Energy Log State
  const { logEnergy, loading: energyLoading } = useEnergyLog();
  const [energyLevel, setEnergyLevel] = useState(7);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [energySubmitted, setEnergySubmitted] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [lastMealTime, setLastMealTime] = useState<Date | null>(null);

  // New Meal Form
  const [newMeal, setNewMeal] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string;
    recipe: string;
  }>({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, ingredients: '', recipe: '' });

  // Load Custom Meals
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'custom_meals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const meals = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(), 
            isCustom: true,
            // Add a placeholder image for custom meals if none exists
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80' 
        })) as FoodItem[];
        setCustomMeals(meals);
    });
    return () => unsubscribe();
  }, [user]);

  // Check Eligibility for Energy Log
  useEffect(() => {
    if (!user) return;

    const checkEligibility = async () => {
      const mealsRef = collection(db, 'users', user.uid, 'meal_logs');
      const mealQ = query(mealsRef, orderBy('loggedAt', 'desc'), limit(1));
      const mealSnap = await getDocs(mealQ);

      if (mealSnap.empty) {
        setCanCheckIn(false);
        return;
      }

      const mealData = mealSnap.docs[0].data();
      const mealTime = mealData.loggedAt?.toDate();
      const now = new Date();

      if (!mealTime) return;
      
      const diffMinutes = (now.getTime() - mealTime.getTime()) / (1000 * 60);

      // Rule: Can check in if meal was between 1 minute and 180 minutes ago (3 hours)
      // NOTE: Using 1 minute minimum to simulate time to digest/metabolize
      if (diffMinutes > 1 && diffMinutes < 180) {
         // Check if already checked in for this meal
         const energyRef = collection(db, 'users', user.uid, 'energy_logs');
         const energyQ = query(
             energyRef, 
             where('timestamp', '>', mealData.loggedAt), 
             limit(1)
         );
         const energySnap = await getDocs(energyQ);

         if (energySnap.empty) {
             setCanCheckIn(true);
             setLastMealTime(mealTime);
         } else {
             setCanCheckIn(false);
         }
      } else {
          setCanCheckIn(false);
      }
    };

    checkEligibility();
    const interval = setInterval(checkEligibility, 60000);
    return () => clearInterval(interval);

  }, [user, energySubmitted]); // Re-check after submission

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

  // Handle Search
  useEffect(() => {
    let results: FoodItem[] = [];
    if (searchTerm.length > 0) {
        const allFoods = [...FOOD_DATABASE, ...customMeals];
        results = allFoods.filter(food => 
          food.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    } else {
        // Show recent/all items when no search
        results = [...customMeals.slice(0, 3), ...FOOD_DATABASE.slice(0, 5)]; 
    }

    // Attach isRecommended flag and sort
    const processedResults = results.map(item => ({
        ...item,
        isRecommended: isRecommended(item)
    }));

    processedResults.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return 0;
    });

    setSearchResults(processedResults);
  }, [searchTerm, customMeals, profile?.goal]);

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

  const openRecipe = (e: React.MouseEvent, item: FoodItem) => {
      e.stopPropagation();
      setSelectedRecipe(item);
      setRecipeModalOpen(true);
  };

  const handleLogEnergy = async () => {
    const success = await logEnergy(energyLevel, selectedTags);
    if (success) {
      setEnergySubmitted(true);
      setTimeout(() => {
        setEnergySubmitted(false);
        setEnergyLevel(7);
        setSelectedTags([]);
      }, 3000);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Section: Food Logging */}
      <div className="lg:col-span-8 space-y-8">
        {/* Search Interface */}
        <div className="space-y-4">
          <div className="relative group">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-12 md:pl-12 md:pr-24 py-5 bg-white dark:bg-slate-900 border-none rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none focus:ring-2 focus:ring-primary text-lg font-medium placeholder:text-slate-400 transition-shadow"
              placeholder="What are you fueling with?"
              type="text"
            />
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="material-icons-round text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            </div>
            <div className="absolute inset-y-0 right-4 flex items-center">
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-2 text-slate-400">
                        <span className="material-icons-round text-sm">close</span>
                    </button>
                )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                {searchTerm ? 'Search Results' : 'Recommended Fuel'}
            </h2>
            <button 
                onClick={handleCreateClick}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
            >
              <span className="material-icons-round text-sm">add</span>
              Create Custom Meal
            </button>
          </div>
        </div>

        {/* Results Feed */}
        <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
          {searchResults.map((item) => (
            <div 
                key={item.id} 
                className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-primary/40 transition-all hover:shadow-md cursor-pointer gap-4 relative" 
                onClick={() => onAddFood?.(item)}
            >
              <div className="flex items-start gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {item.image ? (
                     <img className="w-full h-full object-cover" src={item.image} alt={item.name} />
                  ) : (
                     <span className="material-icons-round text-slate-300">restaurant</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-2 text-sm sm:text-base pr-8 sm:pr-0">
                      <span className="truncate">{item.name}</span>
                      {item.isCustom && <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-600 font-bold uppercase tracking-wide shrink-0">Custom</span>}
                      {item.isRecommended && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-bold uppercase tracking-wide flex items-center gap-1 shrink-0">
                            <span className="material-icons-round text-[10px]">stars</span>
                            Rec
                        </span>
                      )}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.ingredients.join(', ')}</p>
                  
                  {/* Mobile Macros */}
                  <div className="flex sm:hidden items-center gap-3 text-[10px] text-slate-400 mt-2">
                       <span className="font-bold text-slate-600 dark:text-slate-300">{item.calories} kcal</span>
                       <span>P: {item.protein}</span>
                       <span>C: {item.carbs}</span>
                       <span>F: {item.fat}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-bold">{item.calories} kcal</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter">P: {item.protein} | F: {item.fat} | C: {item.carbs}</span>
                </div>
                
                {item.recipe && (
                    <button 
                        onClick={(e) => openRecipe(e, item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1 z-20"
                    >
                        <span className="material-icons-round text-sm">menu_book</span>
                        Recipe
                    </button>
                )}

                <button 
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all absolute top-4 right-4 sm:static sm:block"
                    title="Add to Log"
                >
                  <span className="material-icons-round text-sm">add</span>
                </button>
              </div>
            </div>
          ))}
          {searchResults.length === 0 && (
              <div className="text-center py-10 text-slate-400 italic">
                  No foods found. Try a different search or create a custom meal.
              </div>
          )}
        </div>

        {/* Insight Section */}
        <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="material-icons-round text-primary">auto_awesome</span>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-1">Fueling Tip</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Based on your recent <strong>Focused</strong> flow states, increasing your protein intake by 15g during breakfast could extend your peak cognitive performance by 45 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Energy Check-In Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass p-6 rounded-2xl shadow-2xl shadow-primary/5 sticky top-24 bg-white/70 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-icons-round text-primary">waves</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Flow Check-In</h2>
          </div>

           {!canCheckIn && !energySubmitted ? (
               <div className="py-8 text-center">
                   <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                       <span className="material-icons-round">hourglass_empty</span>
                   </div>
                   <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ready to Flow?</h3>
                   <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                       Log a meal first. Value your energy levels 30-180 mins after fueling to unlock insights.
                   </p>
               </div>
           ) : energySubmitted ? (
               <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                   <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-4">
                       <span className="material-icons-round text-3xl">check</span>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">Flow Logged!</h3>
                   <p className="text-slate-500 text-sm mt-1">Data saved to analytics.</p>
               </div>
           ) : (
             <>
                {/* Slider */}
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Energy Level</label>
                        <span className="text-4xl font-black text-primary">{energyLevel}<span className="text-sm font-medium text-slate-400">/10</span></span>
                    </div>
                    <div className="relative w-full h-10 flex items-center">
                        <input 
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary" 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={energyLevel}
                            onChange={(e) => setEnergyLevel(Number(e.target.value))}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>Low / Lethargic</span>
                        <span>Peak Flow</span>
                    </div>
                </div>

                {/* Chips */}
                <div className="space-y-4 mb-8">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">How do you feel?</label>
                    <div className="flex flex-wrap gap-2">
                        {TAGS.map((feel) => (
                            <button 
                                key={feel} 
                                onClick={() => toggleTag(feel)}
                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                                    selectedTags.includes(feel)
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary'
                                }`}
                            >
                                {feel}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleLogEnergy}
                    disabled={energyLoading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <span className="material-icons-round text-sm">{energyLoading ? 'hourglass_empty' : 'save'}</span>
                    {energyLoading ? 'Logging...' : 'Log Flow State'}
                </button>
             </>
           )}
        </div>
      </div>

      {/* CREATE MEAL MODAL */}
      {isCreatingMeal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Custom Meal</h3>
                        <button onClick={() => setIsCreatingMeal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-icons-round">close</span></button>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-slate-500">Meal Details</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary" placeholder="Meal Name (e.g. Super Smoothie)" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 px-1">Calories</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-xl" type="number" placeholder="0" value={newMeal.calories || ''} onChange={e => setNewMeal({...newMeal, calories: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 px-1">Protein (g)</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-xl" type="number" placeholder="0" value={newMeal.protein || ''} onChange={e => setNewMeal({...newMeal, protein: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 px-1">Carbs (g)</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-xl" type="number" placeholder="0" value={newMeal.carbs || ''} onChange={e => setNewMeal({...newMeal, carbs: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 px-1">Fat (g)</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-xl" type="number" placeholder="0" value={newMeal.fat || ''} onChange={e => setNewMeal({...newMeal, fat: Number(e.target.value)})} />
                            </div>
                        </div>

                        <label className="text-xs font-bold uppercase text-slate-500 mt-2 block">Ingredients & Recipe</label>
                        <textarea className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-xl min-h-[80px]" placeholder="Ingredients (comma separated)" value={newMeal.ingredients} onChange={e => setNewMeal({...newMeal, ingredients: e.target.value})} />
                        <textarea className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-xl min-h-[100px]" placeholder="Preparation Instructions..." value={newMeal.recipe} onChange={e => setNewMeal({...newMeal, recipe: e.target.value})} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsCreatingMeal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                        <button onClick={handleCreateMeal} className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20">Save Meal</button>
                    </div>
                </div>
            </div>
      )}

      {/* RECIPE MODAL */}
      <ConfirmModal 
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        title={selectedRecipe?.name || 'Recipe'}
        description={
          <div className="space-y-5 text-left">
            {selectedRecipe?.ingredients && selectedRecipe.ingredients.length > 0 && (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2">Ingredients</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700">
                        {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {selectedRecipe?.recipe ? (
              <div>
                <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2">Instructions</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {selectedRecipe.recipe
                            .split(/\n|(?<=[.?!])\s+/) 
                            .map(step => step.trim())
                            .filter(step => step.length > 0)
                            .map((step, idx) => (
                                <li key={idx} className="flex gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">{idx + 1}</span>
                                    <span>{step}</span>
                                </li>
                            ))
                        }
                    </ul>
                </div>
              </div>
            ) : <p className="text-sm text-slate-500 italic">No instructions available for this item.</p>}
          </div>
        }
        confirmText="Back to Log"
      />

      <ConfirmModal 
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        title="Premium Feature"
        description="Creating custom meals is a Premium feature. Upgrade to create your own meals!"
        confirmText="Go Premium"
        variant="primary"
      />

    </div>
  );
}
