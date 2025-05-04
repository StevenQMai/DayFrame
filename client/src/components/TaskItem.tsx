import { Task } from "@shared/schema";
import { formatTimeDisplay } from "@/lib/taskHelpers";
import { Edit, Clock, ArrowRight, Play, Pause, Timer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTasks } from "@/hooks/useTasks";

type TaskItemProps = {
  task: Task;
  onClick: () => void;
  isActive?: boolean;
};

export default function TaskItem({ task, onClick, isActive = false }: TaskItemProps) {
  const { startTimeDisplay, endTimeDisplay } = formatTimeDisplay(task);
  const { toggleTaskTimer, isTogglingTimer } = useTasks();
  
  // Calculate arc background style
  const percent = (Number(task.duration) / 24) * 100;
  const gradientDeg = Math.min(percent * 3.6, 360); // Convert percent to degrees (360 max)
  
  // Handle timer toggle
  const handleTimerToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    toggleTaskTimer({ id: task.id, active: !task.isTimerActive });
  };
  
  // Calculate timer progress if active
  const getTimerProgress = () => {
    if (!task.isTimerActive || !task.timerStartedAt) return 0;
    
    const now = Date.now();
    const elapsed = (now - task.timerStartedAt) / 1000; // in seconds
    const durationInSeconds = task.duration * 60 * 60;
    return Math.min((elapsed / durationInSeconds) * 100, 100);
  };
  
  // Format elapsed time if timer is active
  const getElapsedTimeDisplay = () => {
    if (!task.isTimerActive || !task.timerStartedAt) return null;
    
    const now = Date.now();
    const elapsedMs = now - task.timerStartedAt;
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  return (
    <div 
      className={`p-4 transition-all cursor-pointer relative overflow-hidden 
        ${isActive 
          ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
      onClick={onClick}
    >
      {/* Background arc indicator */}
      <div 
        className={`absolute top-0 right-0 bottom-0 left-0 ${isActive ? 'opacity-10' : 'opacity-5'}`}
        style={{ 
          background: `conic-gradient(${task.color} 0deg, ${task.color} ${gradientDeg}deg, transparent ${gradientDeg}deg, transparent 360deg)` 
        }}
      ></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: task.color }}></div>
            <h3 className={`font-medium truncate ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>{task.name}</h3>
            {isActive && (
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-sm font-semibold tracking-wide uppercase">
                Now
              </span>
            )}
            {task.isTimerActive && (
              <span className="flex items-center gap-1 bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-sm font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                TIMER {getElapsedTimeDisplay()}
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isActive 
              ? 'bg-white text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <Clock className="w-3 h-3" />
            {task.duration}h
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className={isActive ? 'text-blue-700 font-medium' : 'text-gray-500'}>
              {startTimeDisplay}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className={isActive ? 'text-blue-700 font-medium' : 'text-gray-500'}>
              {endTimeDisplay}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Timer toggle button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className={`p-1.5 rounded-full transition-all ${
                      task.isTimerActive 
                        ? 'text-green-500 hover:text-green-700 hover:bg-green-100' 
                        : 'text-gray-400 hover:text-primary hover:bg-gray-100'
                    }`}
                    onClick={handleTimerToggle}
                    disabled={isTogglingTimer}
                  >
                    {task.isTimerActive ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.isTimerActive ? 'Stop timer' : 'Start timer'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Edit button */}
            <button 
              className={`p-1.5 rounded-full transition-all ${
                isActive 
                  ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-100' 
                  : 'text-gray-400 hover:text-primary hover:bg-gray-100'
              }`}
              onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* Time indicator bar */}
        <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full"
            style={{ width: `${percent}%`, backgroundColor: task.color }}
          ></div>
        </div>
        
        {/* Timer progress bar (only visible when timer is active) */}
        {task.isTimerActive && (
          <div className="mt-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full animate-pulse"
              style={{ 
                width: `${getTimerProgress()}%`, 
                backgroundColor: task.color,
                filter: 'brightness(85%)' 
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
