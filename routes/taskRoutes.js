const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController.js');
// const { isAuthenticated } = require('../utils/passportAuth.js'); // Ensure only logged-in users access
console.log("yha pe");

// const { sessionMiddleware } = require('../middlewares/sessionMiddleware.js');

// // Apply session middleware globally (before routes)
// router.use(sessionMiddleware);


const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
};
const isAdmin = (req, res, next) => {
    if (req.user.role !== roles.admin) {
      req.flash('error', 'Only admins can perform this action.');
      return res.redirect('back');
    }
    next();
  };
  

console.log("yee",{ isAuthenticated });
// Existing routes
router.get('/',isAuthenticated, taskController.getAllTasks);
console.log("yha pe");
router.post('/add', isAuthenticated, taskController.createTask);
console.log("yha pe")
router.get('/delete/:id', isAuthenticated, taskController.deleteTask);

// Add these routes for editing tasks
router.get('/edit/:id', isAuthenticated, taskController.editTaskForm);
router.post('/update/:id', isAuthenticated, taskController.updateTask);



router.get('/admin/tasks', isAuthenticated,  taskController.getAllTasksAdmin);
router.get('/admin/edit/:id', isAuthenticated, taskController.editTaskFormAdmin);
router.post('/admin/update/:id', isAuthenticated, taskController.updateTaskAdmin);
router.get('/admin/delete/:id', isAuthenticated, taskController.deleteTaskAdmin);

module.exports = router;
console.log(taskController);



