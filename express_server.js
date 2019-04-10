
var express = require("express");
var app = express();
var PORT = 8080;

//init the body-parser module
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
//init EJS module
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//genreate unique URL
function generateRandomString() {

}

//event Handler for differnt routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  //access in variable in .ejs file by KEY name!!!
  let templateVars = { greeting: 'Hello World! This is my Lil App!' };
  res.render("hello_world", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  //in .ejs file, onject key name will be: urls
  res.render("urls_index", templateVars);
});
//handdle GET for new tiny URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL,
                        longURL: urlDatabase };
  res.render("urls_show", templateVars);
});

//event Handler for POST from browser
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok for now, longURL recieved");         // Respond with 'Ok' (we will replace this)
});

//start the server to listen to requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
