var express = require('express');
var app = express();

app.use(express.static(__dirname + "/static"));
app.use(app.router);

app.start = function() {
  this.listen(3000);
  console.log("app started.");
};

app.start();
