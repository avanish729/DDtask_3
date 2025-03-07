const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('./userModel'); // Ensure correct path

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    startTime: {
        type: DataTypes.DATE
    },
    completionTime: {
        type: DataTypes.DATE
    },
    location: {
        type: DataTypes.STRING
    },
    userId: {
        type: DataTypes.INTEGER, // Match Sequelize's default id type
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
          onDelete: 'CASCADE',  // This will delete the tasks if the user is deleted
          onUpdate: 'CASCADE'
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt fields
});

// Establishing relationship
Task.belongsTo(User, { foreignKey: 'userId' ,onDelete: 'CASCADE', onUpdate: 'CASCADE'});
User.hasMany(Task, { foreignKey: 'userId' });

console.log("helloooo");
module.exports = Task;
