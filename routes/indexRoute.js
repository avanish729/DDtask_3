const router=require('express').Router();
const user = require('../models/userModel');
const Task=require('../models/userTask');
router.get('/',async(req,res)=>{
    
    try {
        if (!req.user) {
            return res.render('index', { user: null, tasks: [] }); // ✅ Handle case where user is not logged in
        }

        const tasks = await Task.findAll({ where: { userId: req.user.id } }); // ✅ Fetch tasks for the logged-in user
        console.log(req.user);
        res.render('index', { user: req.user, tasks });

    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).send('Server Error'); // ✅ Handle potential errors
    }
})

module.exports = router;

function ensureAuthentication(req,res,next){
    if(req.isAuthenticated()){
        next();
    }
    else{
        res.redirect('/index');
    }
}



