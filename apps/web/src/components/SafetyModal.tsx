import { Button } from '@repo/ui/Button';
import { FoodItem } from '../hooks/useLogMeal';

interface SafetyModalProps {
  violation: { food: FoodItem; reason: string } | null;
  onCancel: () => void;
  onOverride: () => void;
}

export function SafetyModal({ violation, onCancel, onOverride }: SafetyModalProps) {
  if (!violation) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-l-4 border-red-600">
        <h3 className="text-lg font-bold text-red-700 mb-2">Safety Alert</h3>
        <p className="text-slate-700 mb-4">
          This <strong>{violation.food.name}</strong> contains <strong>{violation.reason}</strong>, which is on your exclusion list.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onOverride}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            I understand the risk (Add anyway)
          </Button>
        </div>
      </div>
    </div>
  );
}
