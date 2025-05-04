import { useState } from "react";
import Header from "@/components/Header";
import AnalogClock from "@/components/AnalogClock";
import TaskPanel from "@/components/TaskPanel";
import TaskEditModal from "@/components/TaskEditModal";
import AutoAdjustModal from "@/components/AutoAdjustModal";
import TimeInfo from "@/components/TimeInfo";
import { useTasks } from "@/hooks/useTasks";
import { Task } from "@shared/schema";

export default function Home() {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask } = useTasks();
  
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustmentSuggestions, setAdjustmentSuggestions] = useState<{
    taskId: number;
    name: string;
    color: string;
    oldDuration: number;
    newDuration: number;
    selected: boolean;
  }[]>([]);

  const selectedTask = selectedTaskId 
    ? tasks?.find(task => task.id === selectedTaskId) 
    : null;

  const openTaskModal = (taskId: number | null = null) => {
    setSelectedTaskId(taskId);
    setIsEditModalOpen(true);
  };

  const closeTaskModal = () => {
    setSelectedTaskId(null);
    setIsEditModalOpen(false);
  };

  const handleTaskSave = async (taskData: Partial<Task>) => {
    // Check if saving would exceed 24 hours
    if (selectedTaskId) {
      const existingTask = tasks?.find(t => t.id === selectedTaskId);
      if (!existingTask) return;
      
      // Calculate the difference in duration
      const oldDuration = Number(existingTask.duration);
      const newDuration = taskData.duration ? Number(taskData.duration) : oldDuration;
      const durationDifference = newDuration - oldDuration;
      
      // If duration is increased, check if it would exceed 24 hours
      if (durationDifference > 0) {
        const totalDuration = tasks?.reduce((sum, task) => sum + Number(task.duration), 0) || 0;
        const newTotalDuration = totalDuration + durationDifference;
        
        if (newTotalDuration > 24) {
          // Need to suggest adjustments
          generateAdjustmentSuggestions(durationDifference);
          setIsEditModalOpen(false);
          setIsAdjustModalOpen(true);
          return;
        }
      }
      
      try {
        // Otherwise, update the task
        await updateTask({
          id: selectedTaskId,
          ...taskData
        });
        closeTaskModal();
      } catch (error) {
        console.error("Error updating task:", error);
      }
    } else {
      // For new task, check if adding would exceed 24 hours
      const totalDuration = tasks?.reduce((sum, task) => sum + Number(task.duration), 0) || 0;
      const newDuration = taskData.duration ? Number(taskData.duration) : 1;
      
      if (totalDuration + newDuration > 24) {
        // Need to suggest adjustments
        generateAdjustmentSuggestions(newDuration);
        setIsEditModalOpen(false);
        setIsAdjustModalOpen(true);
        return;
      }
      
      try {
        // Otherwise, create the task
        await createTask({
          ...taskData as Task,
          name: taskData.name || "New Task",
          duration: taskData.duration?.toString() || "1",
        });
        closeTaskModal();
      } catch (error) {
        console.error("Error creating task:", error);
      }
    }
  };

  const generateAdjustmentSuggestions = (extraDuration: number) => {
    if (!tasks) return;
    
    // Sort tasks by priority (we'll spare sleep and eating if possible)
    const prioritizedTasks = [...tasks].sort((a, b) => {
      // Lower priority first (easier to adjust)
      if (a.name.toLowerCase().includes("personal")) return -1;
      if (b.name.toLowerCase().includes("personal")) return 1;
      if (a.name.toLowerCase().includes("exercise")) return -1;
      if (b.name.toLowerCase().includes("exercise")) return 1;
      if (a.name.toLowerCase().includes("project")) return -1;
      if (b.name.toLowerCase().includes("project")) return 1;
      if (a.name.toLowerCase().includes("leetcode")) return -1;
      if (b.name.toLowerCase().includes("leetcode")) return 1;
      // Higher priority last (harder to adjust)
      if (a.name.toLowerCase().includes("sleep")) return 1;
      if (b.name.toLowerCase().includes("sleep")) return -1;
      if (a.name.toLowerCase().includes("eating") || a.name.toLowerCase().includes("breakfast") || 
          a.name.toLowerCase().includes("lunch") || a.name.toLowerCase().includes("dinner")) return 1;
      if (b.name.toLowerCase().includes("eating") || b.name.toLowerCase().includes("breakfast") || 
          b.name.toLowerCase().includes("lunch") || b.name.toLowerCase().includes("dinner")) return -1;
      return 0;
    });
    
    let remainingDuration = extraDuration;
    const suggestions: typeof adjustmentSuggestions = [];
    
    for (const task of prioritizedTasks) {
      if (remainingDuration <= 0) break;
      
      // Skip the task being edited
      if (task.id === selectedTaskId) continue;
      
      // Only reduce tasks with duration > 0.5
      if (Number(task.duration) <= 0.5) continue;
      
      // How much we can reduce from this task
      const maxReduction = Math.min(
        Math.floor(Number(task.duration) * 2) / 2 - 0.5, // Ensure we don't go below 0.5 and keep in 0.5 increments
        remainingDuration
      );
      
      if (maxReduction <= 0) continue;
      
      const newDuration = Number(task.duration) - maxReduction;
      
      suggestions.push({
        taskId: task.id,
        name: task.name,
        color: task.color,
        oldDuration: Number(task.duration),
        newDuration: newDuration,
        selected: true // Default to selected
      });
      
      remainingDuration -= maxReduction;
    }
    
    setAdjustmentSuggestions(suggestions);
  };

  const handleApplyAdjustments = async () => {
    const selectedAdjustments = adjustmentSuggestions.filter(adj => adj.selected);
    
    // Apply all selected adjustments
    for (const adjustment of selectedAdjustments) {
      await updateTask({
        id: adjustment.taskId,
        duration: adjustment.newDuration.toString()
      });
    }
    
    // Now create or update the original task
    if (selectedTaskId && selectedTask) {
      await handleTaskSave(selectedTask);
    }
    
    setIsAdjustModalOpen(false);
  };
  
  const handleManualAdjust = () => {
    setIsAdjustModalOpen(false);
    setIsEditModalOpen(true);
  };
  
  const toggleAdjustmentSelection = (taskId: number) => {
    setAdjustmentSuggestions(prev => 
      prev.map(adj => adj.taskId === taskId ? { ...adj, selected: !adj.selected } : adj)
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSave={() => {}} />
      
      <main className="flex-grow flex flex-col md:flex-row">
        <div className="flex-grow p-4 md:p-8 flex flex-col items-center justify-center relative">
          <AnalogClock 
            tasks={tasks || []} 
            isLoading={isLoading}
            onTaskClick={openTaskModal}
          />
          
          <TimeInfo 
            tasks={tasks || []} 
            isLoading={isLoading}
          />
        </div>
        
        <TaskPanel 
          tasks={tasks || []} 
          isLoading={isLoading}
          onTaskClick={openTaskModal}
          onAddTask={() => openTaskModal(null)}
        />
      </main>
      
      {isEditModalOpen && (
        <TaskEditModal 
          isOpen={isEditModalOpen}
          onClose={closeTaskModal}
          task={selectedTask || null}
          onSave={handleTaskSave}
          onDelete={selectedTaskId ? () => deleteTask(selectedTaskId) : undefined}
          tasks={tasks || []}
        />
      )}
      
      {isAdjustModalOpen && (
        <AutoAdjustModal 
          isOpen={isAdjustModalOpen}
          suggestions={adjustmentSuggestions}
          onAdjustmentToggle={toggleAdjustmentSelection}
          onClose={() => setIsAdjustModalOpen(false)}
          onApply={handleApplyAdjustments}
          onManualAdjust={handleManualAdjust}
        />
      )}
    </div>
  );
}
