
//express setup

require('dotenv').config();
const express = require("express");
const app = express();

//lodash

const _ = require("lodash");

// Session and authentication

const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// mongoose requiements

const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');

// ejs and static folder

const ejs = require("ejs");
app.set('view engine', 'ejs');
const path = require("path")
app.use(express.static(__dirname + "/public"));
app.set('views', [path.join(__dirname, 'views'),path.join(__dirname, 'views/partials/')]);


//body parser 

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//session manager 

app.use(session({
  secret: 'process.env.SESSION_SECRET',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());


//db setup

const dbUri = process.env.NODE_ENV === 'production' ? process.env.LIVE_DB_URI : process.env.LOCAL_DB_URI;

mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Connected to MongoDB Atlas");

  
//Port Setup

const PORT  = process.env.PORT || 3000;
app.listen(PORT,function(){console.log('Started Server')})

})

.catch((error) => {
  console.log("Failed to connect to MongoDB Atlas:",dbUri , error);
});

//User Schema

const userSchema = new mongoose.Schema
({username:String,
  password: String,
  googleId: String,
  name:String,
  first_name:String,
  google_dp: String,
  blog: []})

userSchema.plugin(passportLocalMongoose); 

userSchema.plugin(findOrCreate);

const User = mongoose.model('User',userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(async function (id, done) {
  let err, user;
  try {
    user = await User.findById(id).exec();
  } catch (e) {
    err = e;
  }
  done(err, user);
});

const callbackUrl = process.env.NODE_ENV === 'production' ? process.env.LIVE_CALLBACK_URL : process.env.LOCAL_CALLBACK_URL;

console.log(callbackUrl);

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: callbackUrl,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOne({ googleId: profile.id });
    if (user) {
      return done(null, user);
    } else {
      const newUser = await User.create({
        googleId: profile.id,
        username: profile._json.email,
        name: profile.displayName,
        first_name: profile.name.givenName,
        google_dp: profile.photos[0].value
      });
      return done(null, newUser);
    }
  } catch (err) {
    return done(err, null);
  }
}));



// loading error tip 'don't use empty function,run the authentication directly" 

app.get("/auth/google",
  passport.authenticate("google", { scope:["profile","email"] } )
)

app.get("/auth/google/OpenBlog",
  passport.authenticate("google", 
  {failureRedirect: "/login" }),
  (req, res) => res.redirect("/"));


// Root Route

app.get('/',function(req,res){
 
  if (req.isAuthenticated()){

    console.log('authenticated');
    res.redirect('home');
  }
  else{
    res.render('index',{loggedIn: 'nope'});
    console.log('Root Get Route: Not Authenticated')
  }
})

// Home Route

app.get('/home', async function (req, res) {
  if (req.isAuthenticated()) {
    console.log('Home Get Route: authenticated');
    try {
      const result = await User.find({ 'blog': { $ne: [] } });
      res.render('home', { blogs: result, loggedIn: 'yes', firstName: req.user.first_name, dp: req.user.google_dp });
    } catch (err) {
      console.log(err);
      res.redirect('/');
    }
  } else {
    console.log('Home Get Route: Not authenticated');
    res.redirect("/");
  }
});


//Login Routes

app.get('/login',function(req,res){

  if (req.isAuthenticated()){
    console.log('authenticated');
    res.redirect('home');
  }
  else{
    res.render('login',{loggedIn:'aboutTo'});
    console.log('Login Get Route: Not Authenticated');
  }
})

app.post('/login',function(req,res){

  const user = new User({
  username: req.body.username,
  password: req.body.password})

  req.login(user, function(err){
    if(err){
     console.log(err + "something's wrong");
    }
    else{
     passport.authenticate("local", { failureRedirect: '/login',failureMessage:true})(req, res, function(){
     res.redirect('/home');
     })

    }
  })

})

//LogOut Routes

app.get('/logout', function(req,res){
  req.logout(done=>{
    console.log('done');
  });
  res.redirect("/");
  })
  
//Register Routes

app.get('/register',function(req,res){
  if (req.isAuthenticated()){
    console.log('authenticated');
    res.redirect('home');
  }
  else{
    res.render('register',{loggedIn:'aboutto'});
    console.log(' register get route: Not Authenticated')
  }
})

app.post('/register',function(req,res){

  const f_name = _.startCase(req.body.firstName);
  const l_name = _.startCase(req.body.lastName);
  const full_name = _.startCase(f_name + " " + l_name);

  User.register( {username: req.body.username, name: full_name, first_name: f_name, google_dp:'/images/test.svg'}, req.body.password, function(err, user){
  if(err){
    console.log(err);
    res.redirect('/register');
  }
  else{
    passport.authenticate('local')(req,res, function(){
      res.redirect("/home");
      console.log('success')
    })
  }
})

})

//Compose Routes

app.get('/compose',function(req,res){
  if (req.isAuthenticated()){
    console.log('authenticated');
    res.render('compose',{loggedIn:'yes',firstName: req.user.first_name, dp: req.user.google_dp});
  }
  else{
    res.redirect('/login');
    console.log('Compose Get Route: Not Authenticated')
  }
  
})

app.post('/compose', async function(req, res) {
  const newPost = {
    key: _.kebabCase(req.body.title),
    title: _.trim(req.body.title),
    content: req.body.content
  };

  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.blog.push(newPost);
      await user.save();
    }
  } catch (err) {
    console.log(err);
  }

  res.redirect('/home');
});



//about Us Route

app.get('/about',function(req,res){
  if (req.isAuthenticated()){
    console.log('authenticated');
  res.render('about',{loggedIn:'yes',firstName: req.user.first_name, dp: req.user.google_dp});
  }
  else{
  res.render('about',{loggedIn:'nope'});
    console.log('About Us Get Route: Not Authenticated')
  }
})


//Pricing Route

app.get('/pricing',function(req,res){
  if (req.isAuthenticated()){
    console.log('authenticated');
    res.render('pricing',{loggedIn:'yes',firstName: req.user.first_name, dp: req.user.google_dp});
  }
  else{
    console.log('Pricing Get Route: Not Authenticated')
    res.render('pricing',{loggedIn:'nope'});
  }
  
})

//Solo View Route

app.get("/posts/:user/:blog", async function(req, res) {
  if (req.isAuthenticated()) {
    console.log('Article Get Route authenticated');

    const user = req.params.user;
    const post = req.params.blog;
    console.log('Requested Path: ' + user + "/" + post);

    try {
      const foundUser = await User.findOne({ _id: user });
      console.log('User found: ' + foundUser?.name + ' Looking for Posts...');

      if (foundUser) {
        let foundBlog = null;
        for (const blog of foundUser.blog) {
          if (blog.key === post) {
            foundBlog = blog;
            break;
          }
        }

        if (foundBlog) {
          console.log('Post Found: ' + foundBlog.key);

          let postOwner = false;
          const owner = JSON.stringify(foundUser._id);
          const currentUser = JSON.stringify(req.user._id);
          if (owner === currentUser) {
            postOwner = true;
          }
          console.log('Owned Post: ' + postOwner);

          res.render('article', {
            user: foundUser,
            blog: foundBlog,
            owner: postOwner,
            loggedIn: 'yes',
            firstName: req.user.first_name,
            dp: req.user.google_dp
          });
        } else {
          console.log("Blog not found: " + post);
          res.redirect('/error-404');
        }
      } else {
        console.log('User Not Found');
        res.redirect('/error-404');
      }
    } catch (err) {
      console.log("Syntax Error" + err);
      res.redirect('/error-404');
    }
  } else {
    console.log('Article Get Route: Not Authenticated');
    res.redirect('/login');
  }
});



//Delete Route

app.get("/delete/:user/:post", function(req, res) {
  console.log(req.params.user + '/' + req.params.post);
  const user_id = req.params.user;
  const post_key = req.params.post;

  if (user_id === req.user.id) {
    User.findOneAndUpdate(
      { _id: user_id },
      { $pull: { blog: { key: post_key } } }
    )
      .then(() => {
        console.log("Deleted Post: " + post_key);
        res.redirect("/home");
      })
      .catch((err) => {
        console.log("Couldn't delete post: " + err);
      });
  } else {
    console.log(user_id, req.user.id);
    res.send("Access Denied");
  }
});



app.get("/error_404",function(req,res){
  if (req.isAuthenticated()){
    console.log('authenticated');
    res.render('404',{loggedIn:'yes',firstName: req.user.first_name, dp: req.user.google_dp});
  }
  else{
    console.log('404 Route: Not Authenticated')
    res.render('404',{loggedIn:'nope'});
  }

})

app.get("/:page",function(req,res){
  res.redirect("/error_404");
})
