
import { Card, CardContent } from '@repo/ui/Card';
import { useDietaryEngine } from '../hooks/useDietaryEngine';

export function EngineSuggestions() {
  const { suggestions, loading } = useDietaryEngine();

  if (loading) return null; // Invisible while loading
  if (suggestions.length === 0) return null; // Invisible if no suggestions

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <Card 
          key={suggestion.id} 
          className={`border-l-4 ${
            suggestion.type === 'warning' ? 'border-l-red-500 bg-red-50' :
            suggestion.type === 'success' ? 'border-l-green-500 bg-green-50' :
            'border-l-blue-500 bg-blue-50'
          }`}
        >
          <CardContent className="flex items-start gap-4 p-4">
            <div className={`text-2xl ${
                suggestion.type === 'warning' ? 'text-red-500' :
                suggestion.type === 'success' ? 'text-green-500' :
                'text-blue-500'
            }`}>
              {suggestion.type === 'warning' ? '⚠️' : 
               suggestion.type === 'success' ? '🚀' :
               '💡'}
            </div>
            <div>
              <h4 className={`font-semibold text-sm ${
                suggestion.type === 'warning' ? 'text-red-900' :
                suggestion.type === 'success' ? 'text-green-900' :
                'text-blue-900'
              }`}>
                {suggestion.type === 'warning' ? 'Alert' : 
                 suggestion.type === 'success' ? 'Going Strong' :
                 'Optimization Tip'}
              </h4>
              <p className={`text-sm ${
                suggestion.type === 'warning' ? 'text-red-700' :
                suggestion.type === 'success' ? 'text-green-700' :
                'text-blue-700'
              }`}>
                {suggestion.message}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
