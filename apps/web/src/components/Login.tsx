import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

export function Login() {
  const { signInWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 1. New State for Confirm Password
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 2. Validation Logic: Check if passwords match during Sign Up
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4 md:p-8 font-display">
      <div className="bg-background-light dark:bg-slate-900 w-full max-w-6xl flex flex-col md:flex-row rounded-[2rem] shadow-2xl overflow-hidden min-h-[700px]">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xs">restaurant_menu</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-white tracking-tight">Fuel&Flow</span>
          </div>
          
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
              {isLogin ? 'Hello,\nWelcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-10">
              {isLogin ? "Hey, welcome back to your special place. Let's track your nutrition today." : "Join us to start tracking your nutrition journey."}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <input 
                    className="w-full px-5 py-4 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary transition-all outline-none" 
                    placeholder="Full Name" 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <input 
                  className="w-full px-5 py-4 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary transition-all outline-none" 
                  placeholder="Email Address" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <input 
                  className="w-full px-5 py-4 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary transition-all outline-none" 
                  placeholder="Password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* 3. New Confirm Password Field - Only shows on Sign Up */}
              {!isLogin && (
                <div className="relative">
                  <input 
                    className="w-full px-5 py-4 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary transition-all outline-none" 
                    placeholder="Confirm Password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              
              {isLogin && (
                <div className="flex items-center justify-between text-sm font-medium">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      defaultChecked 
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary dark:bg-slate-800 transition-all" 
                      type="checkbox" 
                    />
                    <span className="text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                      Remember me
                    </span>
                  </label>
                  <a className="text-slate-400 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors" href="#">
                    Forgot Password?
                  </a>
                </div>
              )}

              {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
              
              <button 
                type="submit"
                className="w-full px-10 py-4 bg-primary hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-200 dark:shadow-none transform transition-all active:scale-95"
              >
                {isLogin ? 'Sign In' : 'Sign Up'}
              </button>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Or continue with</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full px-10 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-white font-bold rounded-2xl transform transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                <span>Google</span>
              </button>
            </form>
          </div>
          
          <div className="mt-12 text-center md:text-left">
            <p className="text-slate-500 dark:text-slate-300 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                   setIsLogin(!isLogin);
                   setError(null); // Clear errors when switching modes
                   setConfirmPassword(''); // Clear confirm password
                }} 
                className="text-violet-400 dark:text-violet-400 font-bold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden md:flex w-1/2 relative items-center justify-center p-12 m-4 rounded-[1.5rem] overflow-hidden" style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' }}>
          <div className="absolute top-10 left-10 w-32 h-16 bg-white/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-48 h-24 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
          
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <div className="relative w-72 h-[550px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl flex flex-col overflow-hidden">
              <div className="h-6 w-1/3 bg-slate-800 mx-auto rounded-b-2xl mb-4"></div>
              
              <div className="flex-1 p-6 space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-white text-4xl">nutrition</span>
                  </div>
                  <div className="h-4 w-3/4 bg-white/20 rounded-full mx-auto mb-2"></div>
                  <div className="h-2 w-1/2 bg-white/10 rounded-full mx-auto"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-orange-400/30 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-200">egg_alt</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-2/3 bg-white/30 rounded-full"></div>
                      <div className="h-1 w-1/3 bg-white/10 rounded-full"></div>
                    </div>
                    <span className="material-symbols-outlined text-white/40 text-sm">check_circle</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-green-400/30 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-200">salad</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-3/4 bg-white/30 rounded-full"></div>
                      <div className="h-1 w-1/2 bg-white/10 rounded-full"></div>
                    </div>
                    <span className="material-symbols-outlined text-white/40 text-sm">radio_button_unchecked</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white/20 rounded-2xl border border-white/10 ring-2 ring-white/20">
                    <div className="w-10 h-10 bg-blue-400/30 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-200">fitness_center</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-1/2 bg-white rounded-full"></div>
                      <div className="h-1 w-1/4 bg-white/30 rounded-full"></div>
                    </div>
                    <div className="h-1.5 w-8 bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="h-12 w-full bg-primary rounded-2xl flex items-center justify-center text-white text-sm font-bold">
                  View Daily Progress
                </div>
              </div>
            </div>
            
            <div className="absolute -top-4 -right-8 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600">check</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Goal Reached!</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-300">2,400 kcal hit</p>
              </div>
            </div>
            
            <div className="absolute bottom-20 -left-12 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600">water_drop</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Hydration</p>
                <p className="text-[10px] text-slate-500">8/10 glasses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        className="fixed bottom-6 right-6 p-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform" 
        onClick={() => document.documentElement.classList.toggle('dark')}
      >
        <span className="material-symbols-outlined block dark:hidden">dark_mode</span>
        <span className="material-symbols-outlined hidden dark:block">light_mode</span>
      </button>
    </div>
  );
}