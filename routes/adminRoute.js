const router =require('express').Router();
const  User  = require('../models/userModel');
const { roles } = require('../utils/constants');
const Task = require('../models/userTask'); 

const { Op } = require('sequelize');



router.get('/users', async (req, res, next) => {
    try {
      
    //   res.send(users);
    const users = await User.findAll();
    res.render('manage-users',{users}
    );
    } catch (error) {
      next(error);
    }
 });


router.get('/users/data',async(req,res,next)=>{
    try{
            const draw=parseInt(req.query.draw) || 1;
            const start=parseInt(req.query.start) || 0;
            const length=parseInt(req.query.length) || 10;
            const searchValue=req.query.search?.value ||'';
            // const sort=req.query.order[0].column || 0;
            console.log(`Start value: ${start}`);
            let where;

            if(searchValue)
            {
                where={email:{[Op.iLike]:`%${searchValue}%`}};
            }
            else{
                where={};   
            }
//fetch paginated user
            const {count,rows:users}=await User.findAndCountAll({
                where:where,
                limit:length,
                offset:start,
                order:[['id','ASC']]
            });
            console.log(User.findAll({ where: where, limit: length, offset: start, order: [['createdAt', 'DESC']] }));


            res.json({
                draw,
                recordsTotal:count,
                recordsFiltered:count,
                data:users

            });
    }
    catch(error){
        next(error);
    }
});


  router.get('/user/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      if (isNaN(id)) { 
        req.flash('error', 'Invalid id');
        return res.redirect('/admin/users');
    }

    const person = await User.findByPk(id);

    if (!person) {
        req.flash('error', 'User not found');   
        return res.redirect('/admin/users');
    }

    res.render('profile', { person });
}
    catch (error) {
        next(error);
    }

  });

  router.post('/update-role', async (req, res, next) => {
    try {
      const { id, role } = req.body;
  
     
      if (!id || !role) {
        req.flash('error', 'Invalid request');
        return res.redirect('back');
      }
  
     
      if (isNaN(id)) {
        req.flash('error', 'Invalid id');
        return res.redirect('back');
      }
      
      

      
      const rolesArray = Object.values(roles);
      if (!rolesArray.includes(role)) {
        req.flash('error', 'Invalid role');
        return res.redirect('back');
      }
      
      const targetUser = await User.findByPk(id);
        if (!targetUser) {
            req.flash('error', 'User not found');
            return res.redirect('back');
        }

       
        if (req.user.role === roles.moderator && targetUser.role === roles.admin) {
            req.flash('error', 'Moderators cannot change admin roles.');
            return res.redirect('back');
        }

     
      if (req.user.id == id) {
        req.flash(
          'error',
          'Admins cannot remove themselves from Admin, ask another admin.'
        );
        return res.redirect('back');
      }
  
      //  Update the user's role using Sequelize
      const [updatedRows, updatedUsers] = await User.update(
        { role },
        { where: { id }, returning: true }
    );
    
    if (updatedRows === 0 || !updatedUsers.length) {
        req.flash('error', 'User not found');
        return res.redirect('back');
    }
    
    req.flash('info', `Updated role for ${updatedUsers[0].email} to ${updatedUsers[0].role}`);
      res.redirect('back');
  
    } catch (error) {
      next(error);
    }
  });
  
const isAdmin = (req, res, next) => {
  if (req.user.role !== roles.admin) {
    req.flash('error', 'Only admins can perform this action.');
    return res.redirect('back');
  }
  next();
};

console.log("hi");
const isModerator = (req, res, next) => {
    console.log("Checking user role:", req.user); 
    if (req.user && (req.user.role === roles.admin || req.user.role === roles.moderator)) {
        console.log("req.user",req.user);
        return next();
    }
    return res.status(403).send('Access Denied: Admins & Moderators Only');
};
  



router.post('/delete-user', isAdmin, async (req, res, next) => {
    try {
      const { id } = req.body;
  
     
      if (!id || isNaN(id)) {
        req.flash('error', 'Invalid user ID');
        return res.redirect('back');
      }
  
      const targetUser = await User.findByPk(id);
      console.log(targetUser);
        if (!targetUser) {
            req.flash('error', 'User not found');
            return res.redirect('back');
        }
       
        if (req.user.role === roles.moderator && targetUser.role === roles.admin) {
            req.flash('error', 'Moderators cannot delete admin users.');
            return res.redirect('back');
        }

        if (req.user.role === roles.admin && targetUser.role === roles.admin) {
            req.flash('error', 'admin cannot delete admin users.');
            return res.redirect('back');
        }

       
      if (req.user.id == id) {
        req.flash('error', 'Admins cannot delete themselves.');
        return res.redirect('back');
      }
  
      
      const deletedUser = await User.destroy({ where: { id } });
  
      if (!deletedUser) {
        req.flash('error', 'User not found.');
        return res.redirect('back');
      }
  
      req.flash('info', 'User deleted successfully.');
      res.redirect('back');
  
    } catch (error) {
      next(error);
    }
  });



router.get('/tasks', isModerator,async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 5; 
        const offset = (page - 1) * limit;
       
        const totalTasks = await Task.count(); 
        const totalPages = Math.ceil(totalTasks / limit);

        const tasks = await Task.findAll({
            include: [{ model: User, attributes: ['id', 'email','role'], required: true }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
      
        console.log("Fetched tasks with user details:", JSON.stringify(tasks, null, 2));
        res.render('admin-tasks', { tasks, totalPages, currentPage: page });
    } catch (error) {
        next(error);
    }
});

router.get('/add-user',isAdmin,async(req,res,next)=>{
    res.render('add-user');
})

router.post('/add-user',isAdmin,async(req,res,next)=>{
   try{
        const {email,password,role}=req.body;
        if(!email||!password || !role){
            req.flash('error','Please fill all fields');
            return res.redirect('back');
        }

        const newUser = await User.create({ email, password, role });
        req.flash('success','user-added-successfully.');
        res.redirect('/admin/users');
   }
  catch(error)
  {
    next(error);
  }


});




  module.exports=router;