var express = require("express");
var app = express();
var PORT = 8080;

//init the body-parser module
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  },
  "578g6c": {
    longURL: "http://www.example.com",
    userID: "user2RandomID"
  }
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

// checks all URLS registered to enter userID, id must be entered as string
// returns an array of keys assocated with id in urlsDatabase
function urlsForUser(id) {
  let userURLS = [];
  for (var link in urlDatabase) {
    if (urlDatabase[link]['userID'] === id) {
      //  passed in id matches urlDatabase id
      userURLS.push(link);
    }
  }
  if (userURLS.length === 0) {
    return false;
  } else {
    // return all keys associated with id
    return userURLS;
  }
}

// returns a subset of the single User URLS, key is an array
function singleUserDatabase(key) {
  let subDatabase = {};
  if (key === undefined) {
    return false;
  }
  //search the urlsDatabase for all matching keys and adds to subDatabase
  key.forEach(function(index) {
    subDatabase[index] = urlDatabase[index]['longURL'];
  });
  return subDatabase;
}

//genreate unique URL, returns a sting of 6 characters
function generateRandomString() {
  let name = Math.random().toString(36).slice(2, 8);
  return name;
}

//loops through users and check if email already exist. Returns true or false
function doesEmailExist(email) {
  for (var elm in users) {
    if (users[elm].email === email) {
      //Email does exist
      return true;
    }
  }
  //Email do NOT exist
  return false;
}

//checks if given shortURL exist in database
function doesLinkExist(link) {
  for (var key in urlDatabase) {
    if (key == link) {
      return true;
    }
  }
  //link do NOT exist
  return false;
}

//compares the email and password to database
function authenticateUser(email, password) {
  let tempPassword = '';
  for (var key in users) {
    tempPassword = bcrypt.compareSync(password, users[key].password); //returns true if same
    if (users[key].email === email && tempPassword) {
      //return the specfic user{} object assocated with email and password
      return users[key];
    }
  }
  //email and password do not matcb
  return false;
}

//**********Event Handler for differnt routes **************

// Root homepage
app.get("/", (req, res) => {
  res.redirect('/login');
});

//display database JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//for testing only
app.get("/hello", (req, res) => {
  let templateVars = {
    greeting: 'Hello World! This is my Lil App!',
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };
  res.render("hello_world", templateVars);
});

// New User registration page
app.get("/register", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };
  if (templateVars.user_id) {
    //user is logged in
    res.redirect('/urls');
  } else {
    //user is not logged in
    res.render("new-registration", templateVars);
  }
});

//Login page
app.get("/login", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };
  res.render("login", templateVars);
});


// Displays all urls
app.get("/urls", (req, res) => {
  let tempID = req.session.user_id;
  if (tempID !== undefined) {
    //user is logged in
    let urlKeys = urlsForUser(tempID);
    if (urlKeys === false) {
      //new user registration, no links to display, give 1 sample URL to display based on urls_index.ejs condition
      let templateVars = {
        urls: {
          sample: "http://www.example.com"
        },
        user_id: req.session.user_id,
        user: users[req.session.user_id]
      };
      res.render("urls_index", templateVars);
    } else {
      //user already registered, show associated links
      //returns links only assocated with user
      let subDatabase = singleUserDatabase(urlKeys);

      let templateVars = {
        urls: subDatabase,
        user_id: req.session.user_id,
        user: users[req.session.user_id],
        urlKeys: urlKeys
      };
      res.render("urls_index", templateVars);
    }
  } else {
    //user is NOT logged in
    let templateVars = {
      user_id: req.session.user_id,
      user: users[req.session.user_id],
    };
    res.render("urls_index", templateVars);
  }
});

// Handdle GET for new tiny URL, create new URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };
  if (templateVars.user_id) {
    //user is valid and logged in
    res.render("urls_new", templateVars);
  } else {
    //user is not logged in
    res.redirect('/login');
  }
});

// Display single url
app.get("/urls/:shortURL", (req, res) => {
  //error handling for invalid shortURLS
  if (!doesLinkExist(req.params.shortURL)) {
    res.send("Link do not exist");
  }

  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  };

  if (templateVars.user_id) {
    //need to check if link associated with user_id
    if (templateVars.user_id === urlDatabase[req.params.shortURL].userID) {
      //user owns this link
      res.render("urls_show", templateVars);
    } else {
      //user logged in but dont own link
      res.send('You do not have access to this link');
    }
  } else {
    // user is not logged in, header will take care of displaying error msg to user to login/register
    res.render("urls_show", templateVars);
  }
});

// GET handler for after new shortURL created, redirects to acutal longURL page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let result = doesLinkExist(shortURL);
  if (result === true) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send('Error! Link do not exist');
  }
});


// event Handler for all POST methods ***********************************

// event Handler for POST from browser, redirected from /urls/new
// Same as /urls:id
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let templongURL = req.body.longURL;
  let tempuserID = req.session.user_id;
  if (tempuserID) {
    //user is logged in
    urlDatabase[shortURL] = {
      longURL: templongURL,
      userID: tempuserID
    }
    res.redirect('/urls');
  } else {
    //user not logged in
    res.send('Please log in/ register first')
  }
});

// delete URL method
app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  let tempUserID = req.session.user_id;
  // need to find if shortURL is associated with that user
  if (urlDatabase[shortURL].userID === tempUserID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    // User is NOT associated with link, send error message
    res.send('Must be logged in to delete data');
  }
});

//Update(edit) URL method
app.post('/urls/:id/update', (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  let tempUserID = req.session.user_id;
  //need to check if user owns this link
  if (urlDatabase[shortURL].userID === tempUserID) {
    urlDatabase[shortURL]['longURL'] = longURL;
    res.redirect('/urls');
  } else {
    //user is NOT associated with this link
    res.send('Must be logged in to update link');
  }
});

// (Default) Login page
app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  var user = authenticateUser(email, password);
  if (user) {
    //email and password match, valid login
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else if (user === false) {
    //email and password do not match, returned false
    if (doesEmailExist(email) === true) {
      res.send("Sorry. Email and password does not match.");
      res.status(403).end();
    } else {
      //email do not exist
      res.send("Sorry. Email does not exist.");
      res.status(403).end();
    }
  }
})

//  Logout method
app.post('/logout', (req, res) => {
  //res.clearCookie('user_id');
  req.session = null //destroys all cookies
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
  if (!(newUser.email && newUser.password)) {
    //if email and password are empty
    res.send("Email and password cannot be empty");
    res.status(400).end();
  } else if (doesEmailExist(newUser.email) === true) {
    //email exist alerady
    res.send('Email exist already, please choose another email');
    res.status(400).end();
  } else {
    // start new user registration
    users[randomID] = newUser;
    req.session.user_id = randomID;
    res.redirect('/urls');
  }

});

//start the server to listen to requests ******************************8
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TinyURL App listening on port ${PORT}!`);
});
