import { useState, useEffect } from 'react';
import { useUserProfile, UserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { Button } from '@repo/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/Card';
import { ConfirmModal } from './ConfirmModal';

export function ProfileSettings() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { profile, updateProfile, loading } = useUserProfile();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{title: string, description: string, variant?: 'primary' | 'danger'}>({
      title: '', description: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        gender: profile.gender,
        goal: profile.goal,
        allergens: profile.allergens
      });
    }
  }, [profile]);

  const handleSave = async () => {
    // Validation: Check for required fields
    if (!formData.goal || !formData.gender || !formData.weight || !formData.height || !formData.age) {
        setModalConfig({
            title: "Missing Information",
            description: "Please fill in all required fields (Goal, Gender, Weight, Height, Age). Allergens are optional.",
            variant: "danger"
        });
        setModalOpen(true);
        return;
    }

    try {
      await updateProfile(formData);
      setIsEditing(false);
      setModalConfig({
          title: "Success",
          description: "Profile updated successfully!",
          variant: "primary"
      });
      setModalOpen(true);
    } catch (error) {
        console.error("Error updating profile", error);
        setModalConfig({
            title: "Error",
            description: "Failed to update profile. Please try again.",
            variant: "danger"
        });
        setModalOpen(true);
    }
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading || !profile) return <div>Loading settings...</div>;

  if (!isEditing) {
      return (
          <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-medium">My Profile</CardTitle>
                    {profile.role === 'premium' && <span className="px-2 py-0.5 text-[10px] font-bold text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-full uppercase tracking-wider">Premium</span>}
                    {(!profile.role || profile.role === 'free') && <span className="px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full uppercase tracking-wider">Free Plan</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
                      <span className="material-icons-round text-lg">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                  </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold">Goal:</span> {profile.goal || 'Not set'}</div>
                    <div><span className="font-semibold">Weight:</span> {profile.weight ? `${profile.weight}kg` : 'Not set'}</div>
                    <div><span className="font-semibold">Height:</span> {profile.height ? `${profile.height}cm` : 'Not set'}</div>
                    <div><span className="font-semibold">Age:</span> {profile.age || 'Not set'}</div>
                    <div><span className="font-semibold">Gender:</span> {profile.gender || 'Not set'}</div>
                  </div>
                  <div>
                      <span className="font-semibold">Allergens:</span> {profile.allergens?.join(', ') || 'None'}
                  </div>
                  <div className="pt-2 border-t mt-2 text-xs text-slate-400 font-mono flex justify-between items-center">
                    <span>User ID: {profile.uid}</span>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" size="sm" onClick={logout}>Sign Out</Button>
                  </div>
              </CardContent>
              <ConfirmModal 
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalConfig.title}
                description={modalConfig.description}
                confirmText="OK"
                variant={modalConfig.variant}
              />
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
            <CardTitle>Edit Profile</CardTitle>
            {profile.role === 'premium' && <span className="px-2 py-0.5 text-[10px] font-bold text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-full uppercase tracking-wider">Premium</span>}
            {(!profile.role || profile.role === 'free') && <span className="px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full uppercase tracking-wider">Free Plan</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
          <span className="material-icons-round text-lg">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label htmlFor="goal" className="text-xs font-medium">Goal</label>
                <select 
                    id="goal"
                    className="w-full border rounded p-2 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    value={formData.goal || ''}
                    onChange={(e) => handleChange('goal', e.target.value)}
                >
                    <option value="">Select Goal</option>
                    <option value="weight_loss">Weight Loss</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="focus">Focus</option>
                </select>
            </div>
            
             <div className="space-y-1">
                <label className="text-xs font-medium">Gender</label>
                <select 
                    className="w-full border rounded p-2 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    value={formData.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium">Weight (kg)</label>
                <input 
                    type="number" 
                    className="w-full border rounded p-2 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    value={formData.weight || ''}
                    onChange={(e) => handleChange('weight', Number(e.target.value))}
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium">Height (cm)</label>
                <input 
                    type="number" 
                    className="w-full border rounded p-2 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    value={formData.height || ''}
                    onChange={(e) => handleChange('height', Number(e.target.value))}
                />
            </div>
             <div className="space-y-1">
                <label className="text-xs font-medium">Age</label>
                <input 
                    type="number" 
                    className="w-full border rounded p-2 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    value={formData.age || ''}
                    onChange={(e) => handleChange('age', Number(e.target.value))}
                />
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-xs font-medium">Allergens (comma separated)</label>
            <input 
                type="text" 
                className="w-full border rounded p-2 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                placeholder="peanuts, shellfish, etc."
                value={formData.allergens?.join(', ') || ''}
                onChange={(e) => handleChange('allergens', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            />
        </div>

        <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
      <ConfirmModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText="OK"
        variant={modalConfig.variant}
      />
    </Card>
  );
}
