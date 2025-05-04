import { Task } from "@shared/schema";
import TaskItem from "@/components/TaskItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Filter, Calendar, PieChart } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { getTotalDuration } from "@/lib/taskHelpers";

type TaskPanelProps = {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick: (taskId: number) => void;
  onAddTask: () => void;
};

export default function TaskPanel({ tasks, isLoading, onTaskClick, onAddTask }: TaskPanelProps) {
  const [sortOrder, setSortOrder] = useState<"time" | "duration" | "name">("time");
  
  // Get total duration for progress indicator
  const totalDuration = getTotalDuration(tasks);
  const progressPercent = Math.min(Math.round((totalDuration / 24) * 100), 100);
  const remainingHours = 24 - totalDuration;
  
  // Sort tasks based on selected criteria
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortOrder === "time") {
      return Number(a.startTime) - Number(b.startTime);
    } else if (sortOrder === "duration") {
      return Number(b.duration) - Number(a.duration);
    } else { // name
      return a.name.localeCompare(b.name);
    }
  });

  // Get current time for highlighted task
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  
  // Find the current task based on time
  const currentTask = tasks.find(task => {
    const startTime = Number(task.startTime);
    const endTime = startTime + Number(task.duration);
    // Handle tasks that span across midnight
    if (startTime > endTime) {
      return currentHour >= startTime || currentHour < endTime;
    }
    return currentHour >= startTime && currentHour < endTime;
  });
  
  return (
    <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col h-full shadow-md">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Task Manager</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage your 24-hour schedule</p>
        </div>
        <Button 
          onClick={onAddTask}
          variant="default"
          size="sm"
          className="rounded-full h-9 px-3 gap-1 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </Button>
      </div>
      
      {/* Current task highlight */}
      {currentTask && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">Current Task</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentTask.color }}></div>
              <span className="font-medium text-gray-800">{currentTask.name}</span>
            </div>
            <span className="text-xs bg-white text-gray-600 px-2 py-1 rounded-full border border-gray-200">
              {currentTask.duration}h
            </span>
          </div>
        </div>
      )}
      
      {/* Task allocation progress */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-gray-700 flex items-center">
            <PieChart className="w-4 h-4 mr-1.5 text-gray-500" />
            <span>Time Allocation</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
              {totalDuration.toFixed(1)}/24h
            </span>
            {remainingHours > 0 && (
              <span className="text-xs text-gray-500">
                ({remainingHours.toFixed(1)}h free)
              </span>
            )}
          </div>
        </div>
        <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercent === 100 
                ? 'bg-green-500' 
                : progressPercent > 90 
                  ? 'bg-amber-500' 
                  : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
      
      {/* Sort controls */}
      <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-gray-700 border-gray-200 shadow-sm">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs">Sort by: {sortOrder === 'time' ? 'Time' : sortOrder === 'duration' ? 'Duration' : 'Name'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuRadioGroup value={sortOrder} onValueChange={(value) => setSortOrder(value as "time" | "duration" | "name")}>
              <DropdownMenuRadioItem value="time">By Start Time</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="duration">By Duration</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name">By Name</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Task list */}
      <div className="task-list divide-y divide-gray-100 flex-grow overflow-y-auto">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div className="p-4" key={i}>
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
          ))
        ) : sortedTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <div className="rounded-full bg-gray-100 p-3 mb-3">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-600">No tasks available</p>
            <p className="text-sm mt-1">Click the Add Task button to get started.</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task.id)}
              isActive={currentTask?.id === task.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
