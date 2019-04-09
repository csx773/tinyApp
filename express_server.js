
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
  res.send("<html><body>Hello <b>CHRISSSSS</b></body></html>\n");
});

//start the server to listen to requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
