const express = require('express');
const { storage } = require('../server/storage');
const { insertTaskSchema } = require('../shared/schema');
const { z } = require('zod');

// Initialize the Express application
const app = express();
app.use(express.json());

// GET /api/tasks - Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await storage.getTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get a task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    
    const task = await storage.getTask(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const validation = insertTaskSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid task data',
        errors: validation.error.errors
      });
    }
    
    const newTask = await storage.createTask(validation.data);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id - Update a task
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    
    const partialSchema = insertTaskSchema.partial();
    const validation = partialSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid task data',
        errors: validation.error.errors
      });
    }
    
    const updatedTask = await storage.updateTask(id, validation.data);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    
    const result = await storage.deleteTask(id);
    if (!result) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/timer - Toggle a task timer
app.post('/api/tasks/:id/timer', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    
    const toggleSchema = z.object({
      active: z.boolean()
    });
    
    const validation = toggleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid toggle data',
        errors: validation.error.errors
      });
    }
    
    const updatedTask = await storage.toggleTaskTimer(id, validation.data.active);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error toggling task timer:', error);
    res.status(500).json({ message: 'Failed to toggle task timer' });
  }
});

// Initialize default tasks on startup
storage.initializeDefaultTasks()
  .then(() => console.log('Database initialized with default tasks or already had tasks'))
  .catch(error => console.error('Failed to initialize default tasks:', error));

// Export the app as a serverless function
module.exports = app; 