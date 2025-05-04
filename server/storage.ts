import { tasks, type Task, type InsertTask } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  toggleTaskTimer(id: number, active: boolean): Promise<Task | undefined>;
  initializeDefaultTasks(): Promise<void>;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  async getTasks(): Promise<Task[]> {
    try {
      const dbTasks = await db.select().from(tasks);
      
      // Convert string numeric values to numbers for the application
      return dbTasks.map(task => ({
        id: task.id,
        name: task.name,
        startTime: parseFloat(task.startTime),
        duration: parseFloat(task.duration),
        color: task.color,
        isTimerActive: task.isTimerActive === "true",
        timerStartedAt: task.timerStartedAt ? parseFloat(task.timerStartedAt) : undefined
      }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  }

  async getTask(id: number): Promise<Task | undefined> {
    try {
      const [dbTask] = await db.select().from(tasks).where(eq(tasks.id, id));
      
      if (!dbTask) {
        return undefined;
      }
      
      // Convert string numeric values to numbers for the application
      return {
        id: dbTask.id,
        name: dbTask.name,
        startTime: parseFloat(dbTask.startTime),
        duration: parseFloat(dbTask.duration),
        color: dbTask.color,
        isTimerActive: dbTask.isTimerActive === "true",
        timerStartedAt: dbTask.timerStartedAt ? parseFloat(dbTask.timerStartedAt) : undefined
      };
    } catch (error) {
      console.error(`Error fetching task with ID ${id}:`, error);
      return undefined;
    }
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    try {
      // Convert number values to strings for database storage
      const dbTask = {
        name: insertTask.name,
        startTime: insertTask.startTime.toString(),
        duration: insertTask.duration.toString(),
        color: insertTask.color,
        isTimerActive: "false",
        timerStartedAt: null
      };
      
      const [createdTask] = await db.insert(tasks).values(dbTask).returning();
      
      // Convert string numeric values to numbers for the application
      return {
        id: createdTask.id,
        name: createdTask.name,
        startTime: parseFloat(createdTask.startTime),
        duration: parseFloat(createdTask.duration),
        color: createdTask.color,
        isTimerActive: false,
        timerStartedAt: undefined
      };
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  async updateTask(id: number, updateTask: Partial<InsertTask>): Promise<Task | undefined> {
    try {
      // Convert number values to strings for database
      const dbUpdateTask: Record<string, any> = {};
      
      if (updateTask.name !== undefined) {
        dbUpdateTask.name = updateTask.name;
      }
      
      if (updateTask.startTime !== undefined) {
        dbUpdateTask.startTime = updateTask.startTime.toString();
      }
      
      if (updateTask.duration !== undefined) {
        dbUpdateTask.duration = updateTask.duration.toString();
      }
      
      if (updateTask.color !== undefined) {
        dbUpdateTask.color = updateTask.color;
      }
      
      const [dbUpdatedTask] = await db
        .update(tasks)
        .set(dbUpdateTask)
        .where(eq(tasks.id, id))
        .returning();
      
      if (!dbUpdatedTask) {
        return undefined;
      }
      
      // Convert string numeric values to numbers for the application
      return {
        id: dbUpdatedTask.id,
        name: dbUpdatedTask.name,
        startTime: parseFloat(dbUpdatedTask.startTime),
        duration: parseFloat(dbUpdatedTask.duration),
        color: dbUpdatedTask.color,
        isTimerActive: dbUpdatedTask.isTimerActive === "true",
        timerStartedAt: dbUpdatedTask.timerStartedAt ? parseFloat(dbUpdatedTask.timerStartedAt) : undefined
      };
    } catch (error) {
      console.error(`Error updating task with ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteTask(id: number): Promise<boolean> {
    try {
      const [deletedTask] = await db
        .delete(tasks)
        .where(eq(tasks.id, id))
        .returning();
      
      return !!deletedTask;
    } catch (error) {
      console.error(`Error deleting task with ID ${id}:`, error);
      return false;
    }
  }
  
  async toggleTaskTimer(id: number, active: boolean): Promise<Task | undefined> {
    try {
      // First get the task to make sure it exists
      const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, id));
      
      if (!existingTask) {
        return undefined;
      }
      
      // If we're activating a timer, reset any other active timers first
      if (active) {
        await db
          .update(tasks)
          .set({ 
            isTimerActive: "false",
            timerStartedAt: null 
          })
          .where(eq(tasks.isTimerActive, "true"));
      }
      
      // Set the timer status for this task
      const now = Date.now();
      const [updatedTask] = await db
        .update(tasks)
        .set({ 
          isTimerActive: active ? "true" : "false",
          timerStartedAt: active ? now.toString() : null 
        })
        .where(eq(tasks.id, id))
        .returning();
      
      if (!updatedTask) {
        return undefined;
      }
      
      // Convert string numeric values to numbers for the application
      return {
        id: updatedTask.id,
        name: updatedTask.name,
        startTime: parseFloat(updatedTask.startTime),
        duration: parseFloat(updatedTask.duration),
        color: updatedTask.color,
        isTimerActive: active,
        timerStartedAt: active ? now : undefined
      };
    } catch (error) {
      console.error(`Error toggling timer for task with ID ${id}:`, error);
      return undefined;
    }
  }

  async initializeDefaultTasks(): Promise<void> {
    try {
      // Check if we already have tasks
      const existingTasks = await this.getTasks();
      if (existingTasks.length > 0) {
        return; // Database already has tasks
      }
      
      // Initialize with default tasks
      const defaultTasks: InsertTask[] = [
        { name: "Sleeping", startTime: 22, duration: 8, color: "#8B5CF6" },
        { name: "Breakfast", startTime: 6, duration: 0.5, color: "#F59E0B" },
        { name: "Job Applications", startTime: 6.5, duration: 3, color: "#EC4899" },
        { name: "Leetcode", startTime: 9.5, duration: 2, color: "#6366F1" },
        { name: "Lunch", startTime: 11.5, duration: 1, color: "#F59E0B" },
        { name: "Project Work", startTime: 12.5, duration: 4, color: "#10B981" },
        { name: "Exercise", startTime: 16.5, duration: 1, color: "#EF4444" },
        { name: "Dinner", startTime: 17.5, duration: 1, color: "#F59E0B" },
        { name: "Personal Time", startTime: 18.5, duration: 3.5, color: "#9CA3AF" }
      ];
      
      // Add all default tasks to the database
      for (const task of defaultTasks) {
        await this.createTask(task);
      }
    } catch (error) {
      console.error("Error initializing default tasks:", error);
      throw error;
    }
  }
}

// Memory storage implementation (for backwards compatibility or testing)
export class MemStorage implements IStorage {
  // We store the task data with string number values to mimic the database
  private tasks: Map<number, { 
    id: number; 
    name: string; 
    startTime: string; 
    duration: string; 
    color: string;
    isTimerActive?: string;
    timerStartedAt?: string | null;
  }>;
  currentId: number;

  constructor() {
    this.tasks = new Map();
    this.currentId = 1;
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      startTime: parseFloat(task.startTime),
      duration: parseFloat(task.duration),
      color: task.color,
      isTimerActive: task.isTimerActive === "true",
      timerStartedAt: task.timerStartedAt ? parseFloat(task.timerStartedAt) : undefined
    }));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    return {
      id: task.id,
      name: task.name,
      startTime: parseFloat(task.startTime),
      duration: parseFloat(task.duration),
      color: task.color,
      isTimerActive: task.isTimerActive === "true",
      timerStartedAt: task.timerStartedAt ? parseFloat(task.timerStartedAt) : undefined
    };
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    
    // Store numeric values as strings for consistency with database
    const dbTask = {
      id,
      name: insertTask.name,
      startTime: insertTask.startTime.toString(),
      duration: insertTask.duration.toString(),
      color: insertTask.color,
      isTimerActive: "false",
      timerStartedAt: null
    };
    
    this.tasks.set(id, dbTask);
    
    // Return with numeric values for the application
    return {
      id: dbTask.id,
      name: dbTask.name,
      startTime: insertTask.startTime,
      duration: insertTask.duration,
      color: dbTask.color,
      isTimerActive: false,
      timerStartedAt: undefined
    };
  }

  async updateTask(id: number, updateTask: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      return undefined;
    }
    
    // Convert numeric values to strings for storage
    const updates: Record<string, string | number> = {};
    
    if (updateTask.name !== undefined) {
      updates.name = updateTask.name;
    }
    
    if (updateTask.startTime !== undefined) {
      updates.startTime = updateTask.startTime.toString();
    }
    
    if (updateTask.duration !== undefined) {
      updates.duration = updateTask.duration.toString();
    }
    
    if (updateTask.color !== undefined) {
      updates.color = updateTask.color;
    }
    
    const updatedDbTask = { ...existingTask, ...updates };
    this.tasks.set(id, updatedDbTask);
    
    // Return with numeric values for the application
    return {
      id: updatedDbTask.id,
      name: updatedDbTask.name,
      startTime: parseFloat(updatedDbTask.startTime),
      duration: parseFloat(updatedDbTask.duration),
      color: updatedDbTask.color,
      isTimerActive: updatedDbTask.isTimerActive === "true",
      timerStartedAt: updatedDbTask.timerStartedAt ? parseFloat(updatedDbTask.timerStartedAt) : undefined
    };
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  async toggleTaskTimer(id: number, active: boolean): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      return undefined;
    }
    
    // If we're activating a timer, reset any other active timers first
    if (active) {
      // Convert to array first to avoid TypeScript iterator issue
      Array.from(this.tasks.entries()).forEach(([taskId, task]) => {
        if (task.isTimerActive === "true") {
          const updatedTask = { ...task, isTimerActive: "false", timerStartedAt: null };
          this.tasks.set(taskId, updatedTask);
        }
      });
    }
    
    // Now update this task
    const now = Date.now();
    const updatedTask = { 
      ...existingTask, 
      isTimerActive: active ? "true" : "false",
      timerStartedAt: active ? now.toString() : null
    };
    
    this.tasks.set(id, updatedTask);
    
    // Return with numeric values for the application
    return {
      id: updatedTask.id,
      name: updatedTask.name,
      startTime: parseFloat(updatedTask.startTime),
      duration: parseFloat(updatedTask.duration),
      color: updatedTask.color,
      isTimerActive: active,
      timerStartedAt: active ? now : undefined
    };
  }

  async initializeDefaultTasks(): Promise<void> {
    // Initialize with default tasks
    const defaultTasks: InsertTask[] = [
      { name: "Sleeping", startTime: 22, duration: 8, color: "#8B5CF6" },
      { name: "Breakfast", startTime: 6, duration: 0.5, color: "#F59E0B" },
      { name: "Job Applications", startTime: 6.5, duration: 3, color: "#EC4899" },
      { name: "Leetcode", startTime: 9.5, duration: 2, color: "#6366F1" },
      { name: "Lunch", startTime: 11.5, duration: 1, color: "#F59E0B" },
      { name: "Project Work", startTime: 12.5, duration: 4, color: "#10B981" },
      { name: "Exercise", startTime: 16.5, duration: 1, color: "#EF4444" },
      { name: "Dinner", startTime: 17.5, duration: 1, color: "#F59E0B" },
      { name: "Personal Time", startTime: 18.5, duration: 3.5, color: "#9CA3AF" }
    ];
    
    for (const task of defaultTasks) {
      await this.createTask(task);
    }
  }
}

// Use PostgreSQL database storage
export const storage = new DatabaseStorage();
