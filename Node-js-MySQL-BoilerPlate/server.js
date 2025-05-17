require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');
const path = require('path'); 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// api routes
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/employees', require('./employees/employees.controller')); 
app.use('/departments', require('./departments/departments.controller'));
app.use('/workflows', require('./workflows/workflows.controller')); 
app.use('/requests', require('./requests/requests.controller'));

// swagger docs route
app.use('/api-docs', require('_helper/swagger'));

// Serve Angular static files
app.use(express.static(path.join(__dirname, '../Angular-10-Boilerplate/dist/angular-signup-verification-boilerplate')));

// For any other route, serve Angular's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Angular-10-Boilerplate/dist/angular-signup-verification-boilerplate/index.html'));
});

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));