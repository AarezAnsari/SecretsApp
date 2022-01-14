//Initiating express to use in this file
const express = require("express");

//An express object created to use bodyParser functions
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
//An express object created to use express functions
const app = express();

mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true});



//Allow server to send static files to client
app.use(express.static("Public"));

//Allow ejs to render to html pages
app.set('view engine', 'ejs');

//Allow use of bodyParser to retrieve user information
app.use(bodyParser.urlencoded({
extended: true
}));


//this method is used when there is a get request incoming to the database from client and we specify what gets sent
app.get("/", function(req, res){
  //Sending the client browser some information
  res.send("home");
});
app.get("/login", function(req, res){
  res.send("login");
});
app.get("register", function(req ,res){
  res.send("register");
});


//This method hosts website on a port or url
app.listen(3000, function(){
  console.log("This server started running on port 3000");
});
