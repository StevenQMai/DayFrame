import { Task } from "@shared/schema";

// Format time display for task items (e.g., "09:30")
export function formatTimeDisplay(task: Task) {
  const formatHour = (hour: number) => {
    const intHour = Math.floor(hour);
    const formattedHour = String(intHour).padStart(2, "0");
    return formattedHour;
  };
  
  const formatMinutes = (hour: number) => {
    const intHour = Math.floor(hour);
    const minutes = Math.round((hour - intHour) * 60);
    return String(minutes).padStart(2, "0");
  };
  
  const startHour = Number(task.startTime);
  const endHour = (Number(task.startTime) + Number(task.duration)) % 24;
  
  const startTimeDisplay = `${formatHour(startHour)}:${formatMinutes(startHour)}`;
  const endTimeDisplay = `${formatHour(endHour)}:${formatMinutes(endHour)}`;
  
  return { startTimeDisplay, endTimeDisplay };
}

// Generate time options for select dropdown
export function formatTimeOptions() {
  const options = [];
  
  for (let hour = 0; hour < 24; hour++) {
    // Full hour
    options.push({
      value: hour,
      label: `${String(hour).padStart(2, "0")}:00`
    });
    
    // Half hour
    options.push({
      value: hour + 0.5,
      label: `${String(hour).padStart(2, "0")}:30`
    });
  }
  
  return options;
}

// Calculate total duration of all tasks
export function getTotalDuration(tasks: Task[]) {
  return tasks.reduce((sum, task) => sum + Number(task.duration), 0);
}

// Check if two tasks overlap
export function doTasksOverlap(task1: Task, task2: Task) {
  const task1Start = Number(task1.startTime);
  const task1End = (task1Start + Number(task1.duration)) % 24;
  
  const task2Start = Number(task2.startTime);
  const task2End = (task2Start + Number(task2.duration)) % 24;
  
  // Handle tasks that cross midnight
  if (task1End < task1Start && task2End < task2Start) {
    // Both tasks cross midnight
    return true;
  } else if (task1End < task1Start) {
    // task1 crosses midnight
    return task2Start < task1End || task2End > task1Start;
  } else if (task2End < task2Start) {
    // task2 crosses midnight
    return task1Start < task2End || task1End > task2Start;
  } else {
    // Neither task crosses midnight
    return (task1Start < task2End && task1End > task2Start);
  }
}
