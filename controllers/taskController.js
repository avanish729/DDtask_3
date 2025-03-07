const Task = require('../models/userTask');
const User = require('../models/userModel');
console.log("hiiii");
const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.findAll({ where: { userId: req.user.id } });
        res.render('task', { tasks, user: req.user });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).send('Internal Server Error');
    }
};

const createTask = async (req, res) => {
    try {
        const { title, description, startTime, completionTime, location } = req.body;
        await Task.create({
            title,
            description,
            startTime,
            completionTime,
            location,
            userId: req.user.id
        });
        res.redirect('/tasks');
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).send('Internal Server Error');
    }
};

const deleteTask = async (req, res) => {
    try {
        await Task.destroy({ where: { id: req.params.id, userId: req.user.id } });
        res.redirect('/tasks');
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Internal Server Error');
    }
};

const editTaskForm = async (req, res) => {
    try {
        const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!task) {
            return res.status(404).send('Task not found');
        }
        res.render('editTask', { task, user: req.user });
    } catch (error) {
        console.error('Error fetching task for editing:', error);
        res.status(500).send('Internal Server Error');
    }
};

const updateTask = async (req, res) => {
    try {
        const { title, description, startTime, completionTime, location } = req.body;
        const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });

        if (!task) {
            return res.status(404).send('Task not found');
        }

        await task.update({ title, description, startTime, completionTime, location });
        res.redirect('/tasks');
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Internal Server Error');
    }
};


const getAllTasksAdmin = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            include: [{ model: User, as: 'UserSchemas' }] // Get User details
        });
        res.render('admin-tasks', { tasks, user: req.user });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).send('Internal Server Error');
    }
};

console.log("123456")
const editTaskFormAdmin = async (req, res) => {
    try {
        const task = await Task.findOne({
            where: { id: req.params.id },
            include: [{ model: User, as: 'UserSchema' }] 
        });
        console.log("tasks-",task);

        if (!task) {
            return res.status(404).send('Task not found');
        }
        if (req.user.role === 'MODERATOR' && task.UserSchema?.role === 'ADMIN') {
            req.flash('error','Access Denied: Moderators cannot delete admin tasks');
            return res.redirect('/admin/tasks');
        }


        res.render('editTask1', { task, user: req.user });
    } catch (error) {
        console.error('Error fetching task for editing:', error);
        res.status(500).send('Internal Server Error');
    }
};


const updateTaskAdmin = async (req, res) => {
    try {
        const { title, description, startTime, completionTime, location } = req.body;
        const task = await Task.findOne({
            where: { id: req.params.id },
            include: [{ model: User, as: 'UserSchema' }] 
        });


        if (!task) {
            return res.status(404).send('Task not found');
        }

        await task.update({ title, description, startTime, completionTime, location });
        res.redirect('/admin/tasks');
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Internal Server Error');
    }
};


const deleteTaskAdmin = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id, {
            include: [{ model: User, as: 'UserSchema' }] 
        });

        console.log("Task ID:", req.params.id);

        if (!task) {
            return res.status(404).send('Task not found');
        }

        // Ensure moderators cannot delete admin-created tasks
         console.log("llok--",task);
        if (req.user.role === 'MODERATOR' && task.UserSchema?.role === 'ADMIN') {
            req.flash('error','Access Denied: Moderators cannot delete admin tasks');
            return res.redirect('/admin/tasks');
        }

        await task.destroy();
        res.redirect('/admin/tasks');
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Internal Server Error');
    }
};

console.log("thik")

//  Make sure functions are properly defined before exporting
module.exports = {
    getAllTasks,
    createTask,
    deleteTask,
    editTaskForm,
    updateTask,
    getAllTasksAdmin,
    editTaskFormAdmin,
    updateTaskAdmin,
    deleteTaskAdmin
};
