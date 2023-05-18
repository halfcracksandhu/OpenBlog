
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
app.use(express.static("public")); 

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

//Port Setup

const PORT  = process.env.PORT || 3000;
app.listen(PORT,function(){console.log('Started Server')})
//db setup

mongoose.connect(process.env.MongoDB_Key)

const userSchema = new mongoose.Schema
({user: String,
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
  }
  catch (e) {
      err = e;
  }
  done(err, user);
});


passport.use(new GoogleStrategy({
  clientID:     process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/OpenBlog"
},
function(accessToken, refreshToken, profile, done) {
  User.findOrCreate({ googleId: profile.id, name: profile.displayName, first_name: profile.name.givenName ,google_dp: profile.photos[0].value }, function (err, user) {
    return done(err, user);
    
  });
}
));



// loading error tip 'don't use empty function,run the authentication directly" 

app.get("/auth/google",
  passport.authenticate("google", { scope:["profile"] } )
)

// app.get( "/auth/google/OpenBlog",
//     passport.authenticate( "google", 
//     { successRedirect: "/home",
//       failureRedirect: "/login"})
// );

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

app.get('/home',function(req,res){
  if (req.isAuthenticated()){
    console.log('Home Get Route: authenticated  ');
    
    User.find({'blog':{$ne:[]} })
    .then((result)=>{
     res.render('home',{blogs:result, loggedIn: 'yes',firstName: req.user.first_name, dp: req.user.google_dp}); 
    })
    .catch((err)=>{console.log(err)});
  }
  else{
    console.log('Home Get Route: Not authenticated');
    res.redirect("/");}
})

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

  User.register( {username: req.body.username, name:req.body.firstName + " " + req.body.lastName, first_name: req.body.firstName, google_dp:'images/test.svg'}, req.body.password, function(err, user){
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

app.post('/compose',function(req,res){
  const newPost = {
    title: req.body.title,
    content: req.body.content
  }

  User.findById(req.user._id)
  .then((result)=>{
    result.blog.push(newPost);
    result.save();
  })
  .catch((err)=>{console.log(err)})
    
res.redirect('/home');
})


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

app.get('/posts/:param/:param2',function(req,res){
  
  
  //finding user and post
  
  const user = req.params.param;
  const post = _.toUpper(req.params.param2);
  console.log(user + "/" + post);
if(post != 'INDEX.JS' && post != 'STYLE.CSS'){
  User.findOne  ({name: user})
    .then((foundUser)=>{
      console.log('User found : '+ foundUser.name +' Looking for Posts...')
      if(foundUser){
       for(i=0; i<foundUser.blog.length; i++)
       {  
        const blogTitle = _.toUpper(foundUser.blog[i].title);
         if(blogTitle === post)
         {
          console.log('Post Found: ' + blogTitle);
          res.render('article',{loggedIn:'nope'});
         }
         else{
          console.log(blogTitle + " " + post)
         }
       }
      }
      console.log('not found')
    })
    .catch((err=>{console.log(err); res.redirect('home')}))
}

})