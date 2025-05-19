require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const errorHandler = require('_middleware/error-handler');
const config = require('config.json');

// Add better error tracking
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Define allowed origins from env or defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:4200', 'https://user-management-frontend-jazu.onrender.com'];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Enhanced CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    console.log(`Request from origin: ${origin}`);
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      console.log(`CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization,X-Requested-With,Accept'
};

app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// API routes
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/employees', require('./employees/employees.controller')); 
app.use('/departments', require('./departments/departments.controller'));
app.use('/workflows', require('./workflows/workflows.controller')); 
app.use('/requests', require('./requests/requests.controller'));

// Swagger docs route
app.use('/api-docs', require('_helper/swagger'));

// Log all API requests
app.use((req, res, next) => {
  console.log(`API Request: ${JSON.stringify({
    method: req.method,
    path: req.path,
    ip: req.ip
  })}`);
  next();
});

// Serve static frontend files if in production
if (process.env.NODE_ENV === 'production') {
  console.log('Serving static frontend files');
  
  // Try multiple possible static directories
  const possiblePublicDirs = [
    path.join(__dirname, 'public'),
    path.join(__dirname, '../public'),
    path.join(__dirname, '../../public'),
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), '../public')
  ];
  
  // Find the first directory that exists
  const fs = require('fs');
  let publicDir = null;
  
  for (const dir of possiblePublicDirs) {
    try {
      if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
        publicDir = dir;
        console.log(`Found valid public directory with index.html at: ${publicDir}`);
        break;
      }
    } catch (err) {
      console.log(`Directory check error: ${err.message}`);
    }
  }
  
  if (publicDir) {
    app.use(express.static(publicDir));
    
    // Handle client-side routing for Angular
    app.get('*', (req, res, next) => {
      // Only serve index.html for non-API requests
      if (!req.path.startsWith('/accounts') && 
          !req.path.startsWith('/employees') && 
          !req.path.startsWith('/departments') &&
          !req.path.startsWith('/workflows') &&
          !req.path.startsWith('/requests') &&
          !req.path.startsWith('/api-docs')) {
        
        const indexPath = path.join(publicDir, 'index.html');
        console.log(`Serving Angular app from ${indexPath}`);
        res.sendFile(indexPath, err => {
          if (err) {
            console.error(`Error sending index.html: ${err.message}`);
            res.status(500).send('Error loading application. Please try again later.');
          }
        });
      } else {
        next();
      }
    });
  } else {
    console.error('No valid public directory with index.html found!');
    console.log('Available directories:', possiblePublicDirs);
    
    // Fallback route to indicate frontend is not available
    app.get('*', (req, res, next) => {
      if (!req.path.startsWith('/accounts') && 
          !req.path.startsWith('/employees') && 
          !req.path.startsWith('/departments') &&
          !req.path.startsWith('/workflows') &&
          !req.path.startsWith('/requests') &&
          !req.path.startsWith('/api-docs')) {
        res.status(200).send('API server is running, but frontend files are not available.');
      } else {
        next();
      }
    });
  }
}

// Global error handler
app.use(errorHandler);

// Start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => {
  console.log('===== SERVER STARTED =====');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Allowed origins:', allowedOrigins);
  if (process.env.NODE_ENV === 'production') {
    console.log('Angular path:', path.join(__dirname, 'public'));
    // Check if index.html exists
    try {
      const indexPath = path.join(__dirname, 'public', 'index.html');
      if (require('fs').existsSync(indexPath)) {
        console.log('index.html found!');
      } else {
        console.log('WARNING: index.html not found in public folder');
      }
    } catch (error) {
      console.error('Error checking for index.html:', error.message);
    }
  }
  console.log('Server listening on port ' + port);
});