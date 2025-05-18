let config;

try {
    // Try to load config.json
    config = require('./config.json');
} catch (error) {
    // If config.json doesn't exist, create a default structure
    config = {
        database: {
            host: "localhost",
            port: 3306,
            user: "root",
            password: "",
            database: "node-mysql-registration-login"
        },
        secret: "THIS_IS_A_DEFAULT_SECRET_REPLACE_IT",
        emailFrom: "info@example.com",
        smtpOptions: {
            host: "smtp.example.com",
            port: 587,
            auth: {
                user: "",
                pass: ""
            }
        }
    };
}

// Override with environment variables if they exist
const envConfig = {
    database: {
        host: process.env.DB_HOST || config.database.host,
        port: parseInt(process.env.DB_PORT) || config.database.port,
        user: process.env.DB_USER || config.database.user,
        password: process.env.DB_PASSWORD || config.database.password,
        database: process.env.DB_NAME || config.database.database
    },
    secret: process.env.JWT_SECRET || config.secret,
    emailFrom: process.env.EMAIL_FROM || config.emailFrom,
    smtpOptions: {
        host: process.env.SMTP_HOST || config.smtpOptions.host,
        port: parseInt(process.env.SMTP_PORT) || config.smtpOptions.port,
        auth: {
            user: process.env.SMTP_USER || config.smtpOptions.auth.user,
            pass: process.env.SMTP_PASS || config.smtpOptions.auth.pass
        }
    }
};

module.exports = envConfig;