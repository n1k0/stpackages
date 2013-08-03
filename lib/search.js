var SearchClient = require('elasticsearchclient');

function createClient() {
  var options = {
    host: process.env.ELASTICSEARCH_HOST || 'localhost',
    port: ~~process.env.ELASTICSEARCH_PORT || 9200,
    secure: false
  };
  if (process.env.ELASTICSEARCH_USERNAME) {
    options.auth = {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    };
  }
  return new SearchClient(options);
}
exports.createClient = createClient;
