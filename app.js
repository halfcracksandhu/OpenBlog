
//express setup

require('dotenv').config();
const express = require("express");
const app = express();

// Session and authentication

// const session = require('express-session');
// const passport = require('passport')
// const passportLocalMongoose = require('passport-local-mongoose');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;

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

//sessin manager 

// app.use(session({
//   secret: 'our little secret.',
//   resave: false,
//   saveUninitialized: false
// }))

// app.use(passport.initialize());
// app.use(passport.session());

//Port Setup

const PORT  = process.env.PORT || 3000;
app.listen(PORT,function(){console.log('Started Server')})
//db setup

mongoose.connect(process.env.MongoDB_Key)

// const userSchema = new mongoose.Schema
// ({user: String,
//   password: String,
//   googleId: String,
//   secret: String})

// userSchema.plugin(passportLocalMongoose); 

// userSchema.plugin(findOrCreate);

// const User = mongoose.model('User',userSchema);

// passport.use(User.createStrategy());


// passport.serializeUser(function (user, done) {
//   done(null, user.id);
// });
// passport.deserializeUser(async function (id, done) {
//   let err, user;
//   try {
//       user = await User.findById(id).exec();
//   }
//   catch (e) {
//       err = e;
//   }
//   done(err, user);
// });


// passport.use(new GoogleStrategy({
//   clientID:     process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   callbackURL: "http://localhost:3000/auth/google/secrets"
// },
// function(accessToken, refreshToken, profile, done) {
//   console.log(accessToken + refreshToken + profile + done);
//   User.findOrCreate({ googleId: profile.id }, function (err, user) {
//     return done(err, user);
//   });
// }
// ));

app.get('/',function(req,res){
  res.render('index');
})

// loading error tip 'don't use empty function,run the authentication directly" 

// app.get("/auth/google",
//   passport.authenticate("google", { scope:["profile"] } )
// )

// app.get( "/auth/google/secrets",
//     passport.authenticate( "google", 
//     { successRedirect: "/secrets",
//       failureRedirect: "/login"})
// );

// app.get("/auth/google/secrets",
//   passport.authenticate("google", 
//   {failureRedirect: "/login" }),
//   (req, res) => res.redirect("/secrets"));

app.get('/signIn',function(req,res){
  res.render('signIn')
})

app.post('/signIn',function(req,res){

  // const user = new User({
  // username: req.body.username,
  // password: req.body.password})

  // req.login(user, function(err){
  //   if(err){
  //    console.log(err);
  //   }
  //   else{
  //    passport.authenticate("local")(req, res, function(){
  //    res.redirect('/secrets');

  //    });

  //   }
  // })

})

app.get('/login',function(req,res){
  res.render('login');
})


app.get('/compose',function(req,res){
  // if (req.isAuthenticated()){
  //   console.log('authenticated');
  //   res.render('secrets');
  // }
  // else{
  //   res.redirect('/login');
  //   console.log('Not Authenticated')
  // }
  res.render('compose')
})

// app.get('/logout', function(req,res){
// req.logout(done=>{
//   console.log('done');
// });
// res.redirect('/');
// })

app.post('/signup',function(req,res){

//   User.register( {username: req.body.username}, req.body.password, function(err, user){
//   if(err){
//     console.log(err);
//     res.redirect('/register');
//   }
//   else{
//     passport.authenticate('local')(req,res, function(){
//       res.redirect("/secrets");
//     })
//   }
// })

})