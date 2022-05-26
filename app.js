//Initiating express to use in this file
const express = require("express");
require("dotenv").config();
//An express object created to use bodyParser functions
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 8;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

//An express object created to use express functions
const app = express();


//Allow server to send static files to client
app.use(express.static("Public"));

//Allow ejs to render to html pages
app.set('view engine', 'ejs');

//Allow use of bodyParser to retrieve user information
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret:"Our little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true});



//Creating user schema that shows the structure of information being entered into the database
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Creating a object user that will be used to read and store information
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//this method is used when there is a get request incoming to the database from client and we specify what gets sent
app.get("/", function(req, res){
  //Sending the client browser some information
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"]})
);
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });
app.get("/login", function(req, res){
  res.render("login");
});
app.get("/register", function(req ,res){
  res.render("register");
});

app.get('/secrets', function (req, res){

    User.find({ secret: {"$nin": ['secret', 'user'] } }, function (err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", { usersWithSecrets: foundUsers});
        }
      }
    });


});

app.get('/submit', function(req, res){
  if (req.isAuthenticated()) {
    res.render('submit')

  } else {
    res.redirect('/login');
  }


})

app.get("/logout", function(req, res){
  req.logout(function(err){
      if (err){
        console.log(err);
      }
      res.redirect("/");
  });
})
//Post request that server will recieve from client after submitting information
app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register")
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets")
      })
    }

  });

});

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets")
      });
    }
  });

});

app.post('/submit', function(req, res){
  const submittedSecret = req.body.secret;


  console.log(req.user._id);

  User.findById(req.user._id, function(err, foundUser){
    if(err){
    console.log(err);
  }else{
    if(foundUser){
      foundUser.secret = submittedSecret;
      foundUser.save(function(){
        res.redirect("/secrets")
      });
    }
  }
});
});

//This method hosts website on a port or url
app.listen(3000, function(){
  console.log("This server started running on port 3000");
});
