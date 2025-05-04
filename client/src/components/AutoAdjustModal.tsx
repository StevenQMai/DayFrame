import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Suggestion = {
  taskId: number;
  name: string;
  color: string;
  oldDuration: number;
  newDuration: number;
  selected: boolean;
};

type AutoAdjustModalProps = {
  isOpen: boolean;
  suggestions: Suggestion[];
  onAdjustmentToggle: (taskId: number) => void;
  onClose: () => void;
  onApply: () => void;
  onManualAdjust: () => void;
};

export default function AutoAdjustModal({
  isOpen,
  suggestions,
  onAdjustmentToggle,
  onClose,
  onApply,
  onManualAdjust
}: AutoAdjustModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Schedule</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-medium">Your schedule exceeds 24 hours</p>
              <p className="text-xs mt-1">You need to reduce time from some tasks. How would you like to proceed?</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested adjustments:</h3>
          
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.taskId} 
                className="flex items-center justify-between p-2 border border-gray-200 rounded"
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: suggestion.color }}
                  ></div>
                  <span className="text-sm">{suggestion.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">
                    {suggestion.oldDuration}h → {suggestion.newDuration}h
                  </span>
                  <Checkbox 
                    className="ml-2"
                    checked={suggestion.selected}
                    onCheckedChange={() => onAdjustmentToggle(suggestion.taskId)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onManualAdjust}
          >
            Adjust Manually
          </Button>
          <Button 
            onClick={onApply}
          >
            Apply Adjustments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
