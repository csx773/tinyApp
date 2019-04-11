
var express = require("express");
var app = express();
var PORT = 8080;

//init the body-parser module
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//init EJS module
app.set("view engine", "ejs");

//init morgan module and Tell the app to use morgan to log HTTP requests
const morgan = require('morgan')
app.use(morgan('dev'))

//init cookie module in express
var cookieParser = require('cookie-parser')
app.use(cookieParser())

// Database for app
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

//genreate unique URL, returns a sting of 6 characters
function generateRandomString() {
  let name = Math.random().toString(36).slice(2,8);
  //console.log(name);
  return name;
}

//loops through users and check if email already exist. Returns true or false
function doesEmailExist(email){
  for ( var elm in users){
    if ( users[elm].email === email){
      return true;
    }
  }
  //email do NOT exist
  return false;
}

//compares the email and password to database
function authenticateUser(email, password){
  for(var key in users){
    if(users[key].email=== email && users[key].password===password){
      return users[key];
    }
  }
  return false;
}


//event Handler for differnt routes *****************************

//homepage
app.get("/", (req, res) => {
  //res.send("Hello there General Kenobi!");
  res.redirect('/login');
});
//display database JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
//for testing
app.get("/hello", (req, res) => {
  //access in variable in .ejs file by KEY name!!!
  let templateVars = {
                        greeting: 'Hello World! This is my Lil App!',
                        user_id:  req.cookies["user_id"],
                        user: users[req.cookies["user_id"]]
                     };
  res.render("hello_world", templateVars);
});

//new User registration page
app.get("/register", (req, res) => {
  console.log('inside register page')
  let templateVars = {
                      user_id:  req.cookies["user_id"],
                      user: users[req.cookies["user_id"]]
   };
  res.render("new-registration", templateVars);
});

//Login page
app.get("/login", (req, res) => {
  console.log('inside login page')
  let templateVars = {
                      user_id:  req.cookies["user_id"],
                      user: users[req.cookies["user_id"]]
   };
  res.render("login", templateVars);
});


// displays all urls
app.get("/urls", (req, res) => {
  let templateVars = {  urls: urlDatabase,
                        user_id:  req.cookies["user_id"],
                        user: users[req.cookies["user_id"]]
                     };
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

//handdle GET for new tiny URL, create new URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
                      user_id:  req.cookies["user_id"],
                      user: users[req.cookies["user_id"]]
   };
  res.render("urls_new", templateVars);
});

//display single url
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL,
                        longURL: urlDatabase,
                        user_id:  req.cookies["user_id"],
                        user: users[req.cookies["user_id"]]
                      };
  res.render("urls_show", templateVars);
});

//GET handler for after new shortURL created, redirects to acutal longURL page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// event Handler for all POST methods ***********************************

//event Handler for POST from browser
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  console.log('urlDatabase is now: ', urlDatabase);
  res.redirect('/urls');
});

// delete URL method
app.post('/urls/:shortURL/delete', (req, res) => {
  console.log("inside POST delete route");
  let shortURL = req.params.shortURL;
  //console.log(`shortURL is: ${shortURL}`);
  delete urlDatabase[shortURL];
  console.log(urlDatabase);
  res.redirect('/urls');
});

//update URL method
app.post('/urls/:id/update', (req, res) => {
  console.log('inside POST update route');
  let id = req.params.id;
  let longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect('/urls');
});

// (Default) Login page
app.post('/login', (req, res) => {
  console.log('inside POST login route');
  // let tempID = req.cookies['user_id'];
  let email = req.body.email;
  let password = req.body.password;
  console.log(`entered email is: ${email} and password: ${password}`);

  var user = authenticateUser(email, password);
  if(user){
    // res.send("Username and password matched");
    res.cookie('user_id', user.id );
    res.redirect('/urls');
  } else if ( user === false){
    //email and password do not match, returned false
    if ( doesEmailExist(email) === true){
      res.send("Sorry. Email and password does not match.");
      console.log("Email exist, password do not match");
      res.status(403).end();
    } else {
      //email do not exist
      res.send("Sorry. Email does not exist.");
      console.log("Email does not exist");
      res.status(403).end();
    }
  }
})

// username Logout
app.post('/logout', (req, res) => {
  console.log('inside POST logout route');
  //res.clearCookie('username');
  res.clearCookie('user_id');
  res.redirect('/login');
})

// new user registation
app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  let newUser = {
                  id: randomID,
                  email: req.body.email,
                  password: req.body.password
  }
  //if email and password are empty
  if (!(newUser.email && newUser.password)){
    console.log('email and password are empty!!');
    res.status(400).end();
  }else if( doesEmailExist(newUser.email) === true){
    //email exist alerady
    console.log('email exist already!')
    res.status(400).end();
  }else {
    // start new user registration
    users[randomID] = newUser;
    res.cookie('user_id', randomID);
    console.log('users Database is now: ', users);
    res.redirect('/urls');
  }

});

//start the server to listen to requests ******************************8
app.listen(PORT, () => {
  console.log(`TinyURL App listening on port ${PORT}!`);
});
