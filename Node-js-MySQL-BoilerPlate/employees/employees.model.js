const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Employee = sequelize.define('Employee', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        employeeId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        position: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hireDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            defaultValue: 'Active',
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'accounts', 
                key: 'id'
            }
        },
        departmentId: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'employees',
        timestamps: true
    });

    // Define associations
    Employee.associate = (models) => {
        // Change this to match what you have in db.js - use Account instead of User
        Employee.belongsTo(models.Account, { 
            foreignKey: 'userId',
            as: 'User' // Keep the alias 'User' for backward compatibility
        });
        
        Employee.belongsTo(models.Department, { 
            foreignKey: 'departmentId',
            as: 'department',
            constraints: false
        });
    };

    return Employee;
};