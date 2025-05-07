const express = require('express');
const tasksRouter = require('./tasks');

const app = express();

// Mount the tasks router
app.use(tasksRouter);

// Base API health check
app.get('/api', (req, res) => {
  res.json({ status: 'API is running' });
});

// Handle 404s for any unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

module.exports = app; 