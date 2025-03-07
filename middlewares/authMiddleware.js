const { roles } = require('../utils/constants');
const Task = require('../models/userTask');  

const canEditOrDeleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;  
        const task = await Task.findByPk(id);

        if (!task) {
            req.flash('error', 'Task not found.');
            return res.redirect('back');
        }

        // Allow if user is an admin OR the task owner
        if (req.user.role === roles.admin || req.user.id === task.userId) {
            return next();
        }

        req.flash('error', 'Unauthorized action.');
        return res.redirect('back');
        

    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred.');
        return res.redirect('back');
    }
};

module.exports = { canEditOrDeleteTask };
