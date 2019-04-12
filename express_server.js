
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


//init NEW cookie-session
var cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['gundam'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))



//init bcrypt password module
const bcrypt = require('bcrypt');

// Database for app
var urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"  },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID"  },
  "578g6c": { longURL: "http://www.example.com", userID: "user2RandomID"  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("123", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("456", 10)
  }
}

//const hashedPassword = bcrypt.hashSync(password, 10);

// checks all URLS registered to enter userID, id must be entered as string
function urlsForUser(id){
  console.log("Inside urlsForUser function");
  let userURLS = [];
  for (var link in urlDatabase){
    if ( urlDatabase[link]['userID'] === id ){
      userURLS.push(link);
    }
  }
  console.log(`All shortLinks for user are: ${userURLS}`);
  if ( userURLS.length === 0){
    return false;
  } else {
    return userURLS;
  }
}

// returns a subset of the single User URLS, key is an array
function singleUserDatabase ( key ){
  let subDatabase = {};
  if (key === undefined){
    return false;
  }
  // for ( var i of key){
  //   subDatabase[i] = urlDatabase[i]['longURL'];
  // }
  key.forEach(function (index){
    subDatabase[index] = urlDatabase[index]['longURL'];
  });
  return subDatabase;
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

//checks if given shortURL exist in database
function doesLinkExist (link){
  for ( var key in urlDatabase){
    if ( key === link ){
      return true;
    }
  }
  //link do NOT exist
  return false;
}

//compares the email and password to database
function authenticateUser(email, password){
  let tempPassword = '';
  for(var key in users){
    tempPassword = bcrypt.compareSync( password, users[key].password); //returns true if same
    if(users[key].email === email && tempPassword){
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
                        user_id:  req.session.user_id,
                        user: users[req.session.user_id]
                     };
  res.render("hello_world", templateVars);
});

//new User registration page
app.get("/register", (req, res) => {
  console.log('inside register page')
  let templateVars = {
                      user_id:  req.session.user_id,
                      user: users[req.session.user_id]
   };
  if (templateVars.user_id){
    //user is logged in
    res.redirect('/urls');
  } else {
    res.render("new-registration", templateVars);
  }
});

//Login page
app.get("/login", (req, res) => {
  console.log('inside login page')
  let templateVars = {
                      user_id:  req.session.user_id,
                      user: users[req.session.user_id]
   };
  res.render("login", templateVars);
});


// displays all urls
app.get("/urls", (req, res) => {
  let tempID = req.session.user_id;
  if (tempID !== undefined){
    //user is logged in
    let urlKeys = urlsForUser(tempID);
    console.log(`Returned urlsList: ${urlKeys}`);
    if ( urlKeys === false){
      //new user registration, no links to display, give 1 sample URL
      let templateVars = {
                          urls: { sample: "http://www.example.com"},
                          user_id:  req.session.user_id,
                          user: users[req.session.user_id]
                          };
      console.log(`New user registration, templateVars: ${templateVars}`);
      res.render("urls_index", templateVars);
    } else {
      //user already registered, show associated links
      let subDatabase = singleUserDatabase(urlKeys);
      console.log(`Returned singleUserDatabase is: ${subDatabase}`);

      let templateVars = {  urls: subDatabase,
                            user_id:  req.session.user_id,
                            user: users[req.session.user_id],
                            urlKeys: urlKeys
                         };
      console.log(templateVars);
      res.render("urls_index", templateVars);
    }
  } else {
    //user is NOT logged in
    console.log('User is NOT logged in');
    //res.send("User is not logged in, please login/register");
    let templateVars = {
                          user_id:  req.session.user_id,
                          user: users[req.session.user_id],
                       };
    res.render("urls_index", templateVars);
  }

});

//handdle GET for new tiny URL, create new URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
                      user_id:  req.session.user_id,
                      user: users[req.session.user_id]
   };
   if (templateVars.user_id){
    //user is valid and logged in
    res.render("urls_new", templateVars);
   } else {
    //user is not logged in
    res.redirect('/login');
   }
});

//display single url
app.get("/urls/:shortURL", (req, res) => {

  if ( !doesLinkExist(req.params.shortURL)){
    res.send("Link do not exist");
  }

  let templateVars = {  shortURL: req.params.shortURL,
                        longURL: urlDatabase[req.params.shortURL].longURL,
                        user_id:  req.session.user_id,
                        user: users[req.session.user_id]
                      };

  if ( templateVars.user_id ){
    //need to check if link associated with user_id
    if ( templateVars.user_id === urlDatabase[req.params.shortURL].userID ){
      //user owns this link
      res.render("urls_show", templateVars);
    } else {
      //user logged in but dont own link
      res.send('You do not have access to this link');
    }
  } else {
    // user is not logged in
    //res.send("Please log in to edit links");
    res.render("urls_show", templateVars);
  }
});

//GET handler for after new shortURL created, redirects to acutal longURL page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let result  = doesLinkExist(shortURL);
  if (result === true){
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send('Error! Link do not exist');
  }
});


// event Handler for all POST methods ***********************************

//event Handler for POST from browser, redirected from /urls/new
// same as /urls:id
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let templongURL = req.body.longURL;
  let tempuserID = req.session.user_id;
  if (tempuserID){
    //user is logged in
    urlDatabase[shortURL] = { longURL: templongURL,
                              userID: tempuserID
    }
    console.log('urlDatabase is now: ', urlDatabase);
    res.redirect('/urls');
  } else {
    //user not logged in
    res.send('Please log in/ register first')
  }
});

// delete URL method
app.post('/urls/:shortURL/delete', (req, res) => {
  console.log("inside POST delete route");
  let shortURL = req.params.shortURL;
  let tempUserID = req.session.user_id;
  //console.log(`shortURL is: ${shortURL},  userID is: ${tempUserID}`);
  // need to find if shortURL is associated with that user
  console.log(`targeted userID is: ${urlDatabase[shortURL].userID}`);
  if ( urlDatabase[shortURL].userID === tempUserID){
    //console.log('POST delete route: user IS associated with link');
    delete urlDatabase[shortURL];
    console.log(urlDatabase);
    res.redirect('/urls');
  } else {
    console.log('POST Delete route: User NOT associated with link!');
    res.send('Must be logged in to delete data');
  }
});

//update(edit) URL method
app.post('/urls/:id/update', (req, res) => {
  console.log('inside POST update route');
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  let tempUserID = req.session.user_id;  //have to correct syntax:  remove ==>req.
  //console.log(`shortURL is: ${shortURL},  userID is: ${tempUserID}`);
  if ( urlDatabase[shortURL].userID === tempUserID){
    urlDatabase[shortURL]['longURL'] = longURL;
    res.redirect('/urls');
  } else {
    console.log('POST Update route: User NOT associated with link!');
    res.send('Must be logged in to update link');
  }
});

// (Default) Login page
app.post('/login', (req, res) => {
  console.log('inside POST login route');
  let email = req.body.email;
  let password = req.body.password;
  console.log(`entered email is: ${email} and password: ${password}`);
  //bcrypt.compareSync("purple-monkey-dinosaur", hashedPassword); // returns true
  var user = authenticateUser(email, password);
  if(user){
    req.session.user_id = user.id;
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

//  Logout method
app.post('/logout', (req, res) => {
  console.log('inside POST logout route');
  //res.clearCookie('user_id');
  req.session = null  //destroys all cookies
  res.redirect('/urls');
})

// new user registation
app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  let hashedPassword = bcrypt.hashSync(req.body.password, 10);
  let newUser = {
                  id: randomID,
                  email: req.body.email,
                  password: hashedPassword
  }
  //if email and password are empty
  if (!(newUser.email && newUser.password)){
    console.log('email and password are empty!!');
    res.send("Email and password cannot be empty");
    res.status(400).end();
  }else if( doesEmailExist(newUser.email) === true){
    //email exist alerady
    console.log('email exist already!')
    res.send('Email exist already, please choose another email');
    res.status(400).end();
  }else {
    // start new user registration
    users[randomID] = newUser;
    req.session.user_id = randomID;
    console.log('users Database is now: ', users);
    res.redirect('/urls');
  }

});

//start the server to listen to requests ******************************8
app.listen(PORT,'0.0.0.0', () => {
  console.log(`TinyURL App listening on port ${PORT}!`);
});
