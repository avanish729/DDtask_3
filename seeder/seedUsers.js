const { Sequelize } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { roles } = require('../utils/constants');

// Function to generate random emails
const getRandomEmail = (index) => `user${index}@example.com`;

// Function to hash passwords
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Function to generate random roles
const getRandomRole = () => {
    const roleValues = Object.values(roles);
    return roleValues[Math.floor(Math.random() * roleValues.length)];
};

// Seed 100 users
const seedUsers = async () => {
    try {
        await sequelize.sync(); // Ensure database connection

        let users = [];
        for (let i = 1; i <= 100; i++) {
            users.push({
                email: getRandomEmail(i),
                password: await hashPassword('password123'), // Default password
                role: getRandomRole(),
            });
        }

        await User.bulkCreate(users);
        console.log('✅ 100 users added successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
};

// Run seeder
seedUsers();
