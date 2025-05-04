import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TASK_COLORS } from "@shared/schema";
import { formatTimeOptions, getTotalDuration } from "@/lib/taskHelpers";

type TaskEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (task: Partial<Task>) => void;
  onDelete?: () => void;
  tasks: Task[];
};

export default function TaskEditModal({ 
  isOpen, 
  onClose, 
  task, 
  onSave, 
  onDelete,
  tasks
}: TaskEditModalProps) {
  // Form state
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>(TASK_COLORS[0]);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  // Initialize form with task data or defaults
  useEffect(() => {
    if (task) {
      setName(task.name);
      setStartTime(Number(task.startTime));
      setDuration(Number(task.duration));
      setSelectedColor(task.color);
    } else {
      setName("");
      setStartTime(0);
      setDuration(1);
      setSelectedColor(TASK_COLORS[0]);
    }
  }, [task]);
  
  // Check if time allocation exceeds 24 hours
  useEffect(() => {
    const currentDuration = task ? Number(task.duration) : 0;
    const durationDifference = duration - currentDuration;
    
    const totalDuration = getTotalDuration(tasks);
    const newTotalDuration = totalDuration + durationDifference;
    
    setShowTimeWarning(newTotalDuration > 24);
  }, [duration, task, tasks]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      startTime,
      duration,
      color: selectedColor
    });
  };
  
  const decreaseDuration = () => {
    if (duration > 0.5) {
      setDuration(prev => prev - 0.5);
    }
  };
  
  const increaseDuration = () => {
    if (duration < 24) {
      setDuration(prev => prev + 0.5);
    }
  };
  
  // Generate time options for the select dropdown
  const timeOptions = formatTimeOptions();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="taskName" className="block text-sm font-medium text-gray-700 mb-1">Task Name</Label>
            <Input 
              id="taskName" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</Label>
              <Select 
                value={startTime.toString()}
                onValueChange={(value) => setStartTime(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</Label>
              <div className="flex items-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={decreaseDuration}
                  className="rounded-r-none"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </Button>
                <Input 
                  id="duration" 
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="rounded-none text-center"
                  min={0.5}
                  max={24}
                  step={0.5}
                  required
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={increaseDuration}
                  className="rounded-l-none"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <Label className="block text-sm font-medium text-gray-700 mb-1">Task Color</Label>
            <div className="grid grid-cols-7 gap-2">
              {TASK_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full hover:ring-2 hover:ring-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600 ${
                    selectedColor === color ? "ring-2 ring-gray-600" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          
          {showTimeWarning && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-800 rounded-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <p className="text-sm font-medium">Time allocation exceeds 24 hours</p>
                  <p className="text-xs mt-1">You need to adjust other tasks to maintain a 24-hour schedule.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            {onDelete && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onDelete}
                className="text-red-600 hover:bg-red-50"
              >
                Delete
              </Button>
            )}
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
