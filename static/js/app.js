/* global Zepto */
(function(exports, $) {
  function App(config) {
    this.config = config || {};
    if (!config.endpoint)
      throw new Error("This app needs an endpoint");
    this.endpoint = config.endpoint;
  }
  exports.App = App;

  App.prototype = {
    loadPackages: function(cb) {
      $.ajax({
        url: this.dbURL,
        success: function(data) {
          cb(null, data);
        },
        error: function(xhr, type) {
          cb(new Error('Ajax error: ' + type));
        }
      });
    },
    start: function() {

    }
  };
})(this, Zepto);
