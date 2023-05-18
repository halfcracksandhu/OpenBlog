
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

  User.register( {username: req.body.username, name:req.body.firstName + " " + req.body.lastName, first_name: req.body.firstName, google_dp:'/images/test.svg'}, req.body.password, function(err, user){
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

app.get("/posts/:user/:blog",function(req,res){
  
  //authentication

  if (req.isAuthenticated()){
    console.log('Article Get Route authenticated');
  
    const user = req.params.user;
    const post = _.toUpper(req.params.blog);
    console.log('Requested Path: ' + user + "/" + post);
    
      //finding user and post

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

          //Checking Ownership


          let postOwner = false;
          const owner = JSON.stringify(foundUser._id);
          const user = JSON.stringify(req.user._id);
            if(owner === user){postOwner = true; }
            console.log('Owned Post:' + postOwner);
          res.render('article',
          { user:foundUser,
            blog:foundUser.blog[i],
            owner:postOwner,
            loggedIn:'yes',
            firstName: req.user.first_name,
            dp: req.user.google_dp}); 
          }
         else{
          console.log("Didn't match")
         }
       }
      }
      else{
      console.log('Didn\'t Match');
      }
    })
    .catch((err=>{console.log(err); res.redirect('home')}))
  }
  else{
    console.log('Article Get Route: Not Authenticated')
    res.redirect('/login');
  }
  
})

//Delete Route

app.get("/delete/:user/:post",function(req,res){
 console.log(req.params.user + '/' + req.params.post);
 const user_id = req.params.user;
 const post_title = req.params.post;

  User.findOneAndUpdate
     ({_id:user_id},{$pull:{blog:{title:post_title}}})
     .then(
       (doc)=>{
         console.log("Deleted Items" + blog.title);
         res.redirect("/home");
       }
     )
     .catch((err)=>{
       console.log("couldn/'t do it" + err);
       res.redirect("/home");
     })

})
