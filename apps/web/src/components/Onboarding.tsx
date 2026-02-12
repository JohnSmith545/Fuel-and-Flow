// This is the Onboarding component.
// It is used to collect user information and set up their profile.
// It is used in the App.tsx file.

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useUserProfile } from '../hooks/useUserProfile';
import { RoleSwitcher } from './RoleSwitcher';
import { DevDailyAnalyticsTest } from './DevDailyAnalyticsTest';


export function Onboarding() {
  const { updateProfile } = useUserProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    weight: '',
    height: '',
    allergens: [] as string[],
    goal: '' as 'weight_loss' | 'maintenance' | 'muscle_gain' | 'focus',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnalyticsTester, setShowAnalyticsTester] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAllergenToggle = (allergen: string) => {
    setFormData((prev) => {
      const current = prev.allergens;
      if (current.includes(allergen)) {
        return { ...prev, allergens: current.filter((a) => a !== allergen) };
      } else {
        return { ...prev, allergens: [...current, allergen] };
      }
    });
  };

  const handleGoalSelect = (goal: string) => {
    setFormData((prev) => ({ ...prev, goal: goal as 'weight_loss' | 'maintenance' | 'muscle_gain' | 'focus' }));
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({
        age: Number(formData.age),
        gender: formData.gender,
        weight: Number(formData.weight),
        height: Number(formData.height),
        allergens: formData.allergens,
        goal: formData.goal,
        onboardingCompleted: true,
      });
      // Optimistic update makes navigation instant - no delay needed
      navigate({ to: '/dashboard' });
    } catch (error) {
      console.error("Failed to complete onboarding", error);
      alert("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ALLERGEN_OPTIONS = [
    { id: "gluten", label: "Gluten", icon: "bakery_dining" },
    { id: "dairy", label: "Dairy", icon: "local_drink" },
    { id: "peanuts", label: "Peanuts", icon: "grass" },
    { id: "treenuts", label: "Tree Nuts", icon: "nature" },
    { id: "soy", label: "Soy", icon: "spa" },
    { id: "egg", label: "Egg", icon: "egg" },
    { id: "shellfish", label: "Shellfish", icon: "set_meal" },
    { id: "fish", label: "Fish", icon: "water" },
  ];

  const goalOptions = [
    { id: 'weight_loss', label: 'Weight Loss', desc: 'Deficit-focused plan', icon: 'trending_down' },
    { id: 'muscle_gain', label: 'Muscle Gain', desc: 'Surplus-focused plan', icon: 'fitness_center' },
    { id: 'maintenance', label: 'Maintenance', desc: 'Balance-focused plan', icon: 'balance' },
    { id: 'focus', label: 'Cognitive Focus', desc: 'Stable blood sugar plan', icon: 'psychology' },
  ];

  const isStepValid = () => {
    if (step === 1) {
      return formData.age && formData.gender && formData.weight && formData.height;
    }
    if (step === 2) {
      return true; // Allergens are optional
    }
    if (step === 3) {
      return !!formData.goal;
    }
    if (step === 4) {
      return true; // Review step is always valid
    }
    return false;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 font-sans antialiased min-h-screen flex flex-col transition-colors duration-300">
      {/* HEADER */}
      <header className="w-full px-6 py-4 flex justify-between items-center bg-white dark:bg-slate-800 shadow-sm z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            F
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-blue-500 tracking-tight leading-none">FUEL<span className="text-gray-900 dark:text-white">ANDFLOW</span></span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none mt-1">Nutrition & Training</span>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Need Assistance?</span>
          <a className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors" href="#">(800) 555-0199</a>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        {/* PROGRESS BAR */}
        <div className="w-full max-w-4xl mb-12">
          <div className="relative flex items-center justify-between w-full max-w-lg mx-auto">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-200 dark:bg-slate-700 -translate-y-1/2 -z-10"></div>
            <div 
                className="absolute top-1/2 left-0 h-[2px] bg-blue-500 -translate-y-1/2 -z-10 transition-all duration-300" 
                style={{ width: step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : step === 4 ? '100%' : '100%' }}
            ></div>
            
            {/* Step 1 Node */}
            <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-900 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ring-4 ring-slate-50 dark:ring-slate-900 ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                1
              </div>
              <span className={`text-xs font-semibold ${step >= 1 ? 'text-blue-500' : 'text-slate-400'}`}>Biometrics</span>
            </div>

            {/* Step 2 Node */}
            <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-900 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ring-4 ring-slate-50 dark:ring-slate-900 ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                2
              </div>
              <span className={`text-xs font-medium ${step >= 2 ? 'text-blue-500' : 'text-slate-400'}`}>Allergens</span>
            </div>

            {/* Step 3 Node */}
            <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-900 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ring-4 ring-slate-50 dark:ring-slate-900 ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                3
              </div>
              <span className={`text-xs font-medium ${step >= 3 ? 'text-blue-500' : 'text-slate-400'}`}>Goals</span>
            </div>

            {/* Step 4 Node */}
            <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-900 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ring-4 ring-slate-50 dark:ring-slate-900 ${step >= 4 ? 'bg-blue-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                4
              </div>
              <span className={`text-xs font-medium ${step >= 4 ? 'text-blue-500' : 'text-slate-400'}`}>Review</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl p-8 md:p-12">
          
          {/* STEP 1: Biometrics */}
          {step === 1 && (
            <>
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Your Biometrics</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                        Tell us about yourself to personalize your nutrition and workout plan effectively.
                    </p>
                </div>
                
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* AGE */}
                        <div className="relative group">
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2" htmlFor="age">Age</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    🎂
                                </div>
                                <input 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm outline-none placeholder-slate-400" 
                                    id="age" 
                                    name="age" 
                                    type="number" 
                                    placeholder="e.g. 25"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* GENDER */}
                        <div className="relative group">
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2" htmlFor="gender">Gender</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    👤
                                </div>
                                <select 
                                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm appearance-none outline-none cursor-pointer" 
                                    id="gender" 
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                >
                                    <option disabled value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                    ▼
                                </div>
                            </div>
                        </div>

                        {/* WEIGHT */}
                        <div className="relative group">
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2" htmlFor="weight">Weight</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    ⚖️
                                </div>
                                <input 
                                    className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm outline-none placeholder-slate-400" 
                                    id="weight" 
                                    name="weight" 
                                    type="number" 
                                    placeholder="e.g. 70" 
                                    step="0.1"
                                    value={formData.weight}
                                    onChange={handleInputChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-900 py-1 px-1">kg</span>
                                </div>
                            </div>
                        </div>

                        {/* HEIGHT */}
                        <div className="relative group">
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2" htmlFor="height">Height</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    📏
                                </div>
                                <input 
                                    className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm outline-none placeholder-slate-400" 
                                    id="height" 
                                    name="height" 
                                    type="number" 
                                    placeholder="e.g. 175"
                                    value={formData.height}
                                    onChange={handleInputChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-900 py-1 px-1">cm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
          )}

          {/* STEP 2: Allergens */}
          {step === 2 && (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Safety Limits</h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">
                  Select allergens to exclude them from your meal recommendations. We will filter out any recipes containing these ingredients.
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {ALLERGEN_OPTIONS.map((allergen) => (
                  <label key={allergen.id} className="relative cursor-pointer">
                    <input 
                      type="checkbox" 
                      value={allergen.id}
                      checked={formData.allergens.includes(allergen.id)}
                      onChange={() => handleAllergenToggle(allergen.id)}
                      className="sr-only peer"
                    />
                    <div className={`
                      w-full aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 shadow-sm
                      ${formData.allergens.includes(allergen.id)
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-500'
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                      }
                      peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-slate-900
                    `}>
                      <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                        <span className={`material-icons-round text-4xl transition-all ${
                          formData.allergens.includes(allergen.id) ? 'text-red-600 dark:text-red-400 opacity-0' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {allergen.icon}
                        </span>
                        <span className={`material-icons-round text-4xl absolute transition-all text-red-600 dark:text-red-400 ${
                          formData.allergens.includes(allergen.id) ? 'opacity-100' : 'opacity-0'
                        }`}>
                          block
                        </span>
                      </div>
                      <span className={`text-sm font-medium text-center ${
                        formData.allergens.includes(allergen.id)
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-slate-900 dark:text-slate-200'
                      }`}>
                        {allergen.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* STEP 3: Goals */}
          {step === 3 && (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Your Primary Goal</h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">
                  What is your focus for the next 30 days? This helps us tailor your macros and meal suggestions.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { id: 'weight_loss', label: 'Weight Loss', desc: 'Deficit-focused plan', icon: 'trending_down' },
                  { id: 'muscle_gain', label: 'Muscle Gain', desc: 'Surplus-focused plan', icon: 'fitness_center' },
                  { id: 'maintenance', label: 'Maintenance', desc: 'Balance-focused plan', icon: 'balance' },
                  { id: 'focus', label: 'Cognitive Focus', desc: 'Stable blood sugar plan', icon: 'psychology' },
                ].map((goal) => (
                  <label key={goal.id} className="relative cursor-pointer">
                    <input 
                      type="radio" 
                      name="goal"
                      value={goal.id}
                      checked={formData.goal === goal.id}
                      onChange={() => handleGoalSelect(goal.id)}
                      className="sr-only peer"
                    />
                    <div className={`
                      h-full p-6 rounded-xl border-2 transition-all duration-200 shadow-sm flex flex-col items-center justify-center text-center
                      ${formData.goal === goal.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 ring-2 ring-blue-500/30'
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-400'
                      }
                      peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 dark:peer-focus:ring-offset-slate-900
                    `}>
                      <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <span className="material-icons-round text-4xl text-blue-600 dark:text-blue-300">
                          {goal.icon}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white">{goal.label}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{goal.desc}</p>
                      {formData.goal === goal.id && (
                        <div className="absolute top-4 right-4 text-blue-500">
                          <span className="material-icons-round">check_circle</span>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Review Your Profile</h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">
                  Please review your information. You can go back to make changes if needed.
                </p>
              </div>

              <div className="space-y-6 mb-8">
                {/* Biometrics Section */}
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Biometrics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Age</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{formData.age}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Gender</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white capitalize">{formData.gender}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Weight</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{formData.weight} kg</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Height</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{formData.height} cm</p>
                    </div>
                  </div>
                </div>

                {/* Allergens Section */}
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Safety Limits</h2>
                  {formData.allergens.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.allergens.map((allergen) => (
                        <span key={allergen} className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded-full px-4 py-2 text-sm font-medium">
                          🚫 {ALLERGEN_OPTIONS.find(a => a.id === allergen)?.label || allergen}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">No allergens selected</p>
                  )}
                </div>

                {/* Goal Section */}
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Primary Goal</h2>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Your Focus</p>
                    {(() => {
                      const goalLabel = goalOptions.find(g => g.id === formData.goal);
                      return (
                        <div className="flex items-center gap-3">
                          <span className="material-icons-round text-3xl text-blue-600 dark:text-blue-400">{goalLabel?.icon}</span>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">{goalLabel?.label}</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-700 mt-auto">
            {step > 1 ? (
                <button 
                    onClick={handleBack}
                    className="flex items-center text-blue-500 hover:text-blue-600 font-medium transition-colors order-2 md:order-1"
                >
                    <span className="mr-1">←</span> Back
                </button>
            ) : (
                <div className="order-2 md:order-1"></div>
            )}
            
            <button 
                onClick={step === 4 ? handleSubmit : handleNext}
                disabled={isSubmitting || !isStepValid()}
                className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-12 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 order-1 md:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? "Saving..." : step === 4 ? "Complete Profile" : "Continue"}
            </button>
          </div>

        </div>
      </main>
      
      <footer className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        © 2026 FuelAndFlow App. All rights reserved.
      </footer>

      <RoleSwitcher 
        onAnalyticsToggle={setShowAnalyticsTester} 
        isAnalyticsTesterOpen={showAnalyticsTester} 
      />
      <DevDailyAnalyticsTest isOpen={showAnalyticsTester} />
    </div>
  );
}
