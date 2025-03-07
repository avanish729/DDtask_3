const { Sequelize, DataTypes } = require('sequelize'); 
const sequelize = require('../utils/db'); 
const bcrypt=require('bcryptjs');
const createHttpError = require('http-errors');
const {roles}=require('../utils/constants');

const User = sequelize.define('UserSchema', {

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true 
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [8, 100] 
        }
    },
    role: {
        type: DataTypes.ENUM(roles.admin, roles.moderator, roles.client),
        allowNull: false,
        defaultValue: roles.client,  
    },
    otp: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    otpExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,  
    }
   
   
    
});

User.beforeCreate(async (user, options) => {
    try {
        if(!user.googleId)
        {
            if(!user.password)
            {
                throw new Error("password is require for regular user");
            }
            const salt = await bcrypt.genSalt(10);
             user.password = await bcrypt.hash(user.password, salt);
        }
        
        if(user.email===process.env.ADMIN_EMAIL.toLowerCase()){
            user.role=roles.admin;
        }
    } catch (error) {   
        console.error('❌ Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
});


User.prototype.isValidPassword = async function (password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      throw createHttpError.InternalServerError(error.message);
    }
  };



module.exports = User;