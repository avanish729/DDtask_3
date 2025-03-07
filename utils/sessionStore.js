const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./db'); // Adjust if needed

const sessionStore = new SequelizeStore({ db: sequelize });
sessionStore.sync(); // Ensure session store is ready

module.exports = sessionStore;