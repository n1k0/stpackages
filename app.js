var app = require('./lib/app');

var port = process.env.PORT || 5000;
app.start(port, function() {
  console.log('App started on port ' + port);
});
