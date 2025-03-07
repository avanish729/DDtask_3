const express=require('express')
const httperror=require('http-errors')
const morgan = require('morgan')
const sequelize = require('./utils/db.js');
const session=require('express-session');
const indexRoutes = require('./routes/indexRoute.js'); 
const authRoutes = require('./routes/authRoute.js'); 
const Task = require('./models/userTask');  // Import Task model


// const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoute.js'); 
const passport= require('passport');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
require('dotenv').config()
const connectFlash=require('connect-flash')
const { roles } = require('./utils/constants');
const app=express()

// app.set("views", path.join(__dirname, "views"));
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:false}))


const { sessionMiddleware } = require('./middlewares/sessionMiddleware.js');

// // Apply session middleware globally (before routes)
// app.use(sessionMiddleware);




// init session
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your_default_secret',
        resave: false,
        saveUninitialized: false, 

        store: new SequelizeStore({ 
            db: sequelize,
            checkExpirationInterval: 15 * 60 * 1000, 
            expiration: 24 * 60 * 60 * 1000,

            
            extendDefaultFields: (defaults, session) => {
                return {
                    data: defaults.data,
                    expires: defaults.expires,
                    userId: session.userId || null, 
                };
            },
        }),

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);



  app.use(passport.initialize());
  app.use(passport.session());

require('./utils/passportAuth.js');

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });
app.use(connectFlash());

// Middleware to Make Flash Messages Available in Views
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});


app.use('/',indexRoutes);
app.use('/auth',authRoutes);
app.use('/user',ensureAuthentication,userRoutes);
app.use('/admin',ensureAuthentication,ensureMultiple,require('./routes/adminRoute.js'))
// app.use('/profile',ensureAuthentication,);

const taskRoutes = require('./routes/taskRoutes');
app.use('/tasks', ensureAuthentication, taskRoutes);


app.use((req,res,next)=>{
    next(httperror.NotFound());
})

app.use((error, req, res, next) => {
    error.status = error.status || 500;
    res.status(error.status);
    res.render('error_40x', { error, user: req.user || null });  // Pass user
});



sequelize.sync({alter:true}) 
    .then(() => {
        console.log('Database & tables created!');
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Failed to sync database:', err);
    });


    function ensureAuthentication(req,res,next){
        if(req.isAuthenticated()){
            next();
        }
        else{
            res.redirect('/');
        }
    }

    function ensureAdmin(req, res, next) {
        if (req.user.role === roles.admin) {
          next();
        } else {
          req.flash('warning', 'you are not Authorized to see this route');
          res.redirect('/');
        }
      }
     

      function ensureMultiple(req, res, next) {
        if (req.user.role === roles.moderator || req.user.role === roles.admin) {
          next();
        } else {
          req.flash('warning', 'you are not Authorized to see this route');
          res.redirect('/');
        }
      }