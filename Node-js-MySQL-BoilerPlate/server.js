require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const errorHandler = require('_middleware/error-handler');

// Allow CORS requests with credentials
app.use(cors({ 
  origin: 'https://paraiso-final-project-system-2025.onrender.com',
  credentials: true 
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const angularPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../angular-signup-verification-boilerplate/dist/angular-signup-verification-boilerplate/browser') 
  : path.join(__dirname, '../angular-signup-verification-boilerplate');

// Request logging middleware
app.use((req, res, next) => {
  const requestInfo = {
    method: req.method,
    path: req.path,
    ip: req.ip
  };
  if (req.method === 'POST' || req.method === 'PUT') {
    requestInfo.body = req.body;
  }
  console.log('API Request:', JSON.stringify(requestInfo, null, 2));
  next();
});

app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`[${req.method}] ${req.url} - Request body:`, JSON.stringify(req.body));
  }
  next();
});

// API routes
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/employees', require('./employees/employees.controller')); 
app.use('/departments', require('./departments/departments.controller'));
app.use('/workflows', require('./workflows/workflows.controller')); 
app.use('/requests', require('./requests/requests.controller'));

// Swagger docs route
app.use('/api-docs', require('_helper/swagger'));

// Catch-all to serve Angular app for unknown routes
app.get('*', (req, res) => {
  const indexPath = path.join(angularPath, 'index.html');
  
  res.sendFile(indexPath, err => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(404).send('Application frontend not found.');
    }
  });
});

// Enhanced global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);

  if (err.stack) {
    console.error('Error stack:', err.stack);
  }

  if (err.name?.includes('Sequelize')) {
    console.error('Sequelize error details:', {
      name: err.name,
      message: err.message,
      sql: err.sql,
      params: err.parameters
    });

    const devMessage = process.env.NODE_ENV === 'development' 
      ? `SQL: ${err.sql || 'N/A'}, Message: ${err.message}` 
      : undefined;

    return res.status(400).json({ 
      message: 'Database operation failed',
      error: devMessage
    });
  }

  switch (true) {
    case typeof err === 'string':
      const is404 = err.toLowerCase().endsWith('not found');
      const statusCode = is404 ? 404 : 400;
      return res.status(statusCode).json({ message: err });
    case err.name === 'UnauthorizedError':
      return res.status(401).json({ message: 'Unauthorized' });
    case err.name === 'SequelizeValidationError':
      return res.status(400).json({ message: err.errors.map(e => e.message).join(', ') });
    case err.name === 'SequelizeUniqueConstraintError':
      return res.status(400).json({ message: 'A record with this name already exists' });
    default:
      console.error('Unhandled error:', err);
      return res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? (err.message || err) : undefined
      });
  }
});

// Start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));