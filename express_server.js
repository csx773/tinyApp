
var express = require("express");
var app = express();
var PORT = 8080;

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  //render template from views/urls_index.ejs

  res.render("urls_index", templateVars);
});

//start the server to listen to requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
