require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const errorHandler = require('_middleware/error-handler');

// Update your CORS configuration to allow both domains
const allowedOrigins = [
  'https://paraiso-final-project-system-2025.onrender.com',
  'https://paraiso-final-project-2025.onrender.com',
  'http://localhost:4200'
];

// More explicit CORS handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Keep your existing CORS middleware as well for backward compatibility
app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Auth']
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const angularPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'public') 
  : path.join(__dirname, '../Angular-10-Boilerplate');

console.log("Angular path:", angularPath);
const fs = require('fs');
if (fs.existsSync(path.join(angularPath, 'index.html'))) {
  console.log('index.html found!');
} else {
  console.log('index.html NOT found! Directory contents:', fs.readdirSync(angularPath));
}

// Serve static files with proper MIME types
app.use(express.static(angularPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

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

// Add Content Security Policy headers to allow HTTPS resources
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data:; font-src 'self' https:;"
  );
  next();
});

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