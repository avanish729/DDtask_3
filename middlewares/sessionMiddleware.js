const sessionStore = require('../utils/sessionStore'); // Ensure this file exists
const session=require('express-session');

exports.sessionMiddleware = (req, res, next) => {
    console.log(sessionID);
    if (!req.sessionID) {
        return res.redirect("/");
    }

    sessionStore.get(req.sessionID, (err, sessionData) => {
        if (err) {
            console.error("Session check error:", err);
            return res.redirect("/");
        }
        if (!sessionData || !sessionData.userId) {
            req.session.destroy(() => {
                return res.redirect("/");
            });
        } else {
            next(); // ✅ Only call next() when session is valid
        }
    });
};
