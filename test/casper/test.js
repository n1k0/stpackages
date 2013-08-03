/* global casper */
casper.scrollToBottom = function() {
  return this.thenEvaluate(function() {
    window.scrollTo(0, document.height + window.innerHeight);
  });
};

casper.test.begin("Should load the homepage", 4, function(test) {
  casper.start("http://localhost:3000/", function() {
    test.assertHttpStatus(200);
    test.assertTitle("Sublime Packages");
    test.assertSelectorHasText('ul.nav li.active', 'Recent');
    test.assertElementCount('.pkg-list>li.ng-scope', 12);
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Should load the about page", 1, function(test) {
  casper.start("http://localhost:3000/#/about", function() {
    test.assertHttpStatus(200);
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Should paginate recent packages list", 2, function(test) {
  casper.start("http://localhost:3000/").scrollToBottom();

  casper.waitForResource(/recent\?offset=12$/, function() {
    test.pass('Packages list ajax resource loaded');
  });

  casper.waitForSelector('.pkg-list>li.ng-scope:nth-child(24)', function() {
    test.pass('Now 24 package elements');
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Should display updated packages list", 2, function(test) {
  casper.start("http://localhost:3000/").thenClick('a[href="/#/updated"]');

  casper.waitForUrl(/#\/updated$/, function() {
    test.pass('URL changed to /#/updated');
  });

  casper.waitForSelector('.pkg-list>li.ng-scope:nth-child(12)', function() {
    test.pass("12 first elements fetched");
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Should paginate updated packages list", 2, function(test) {
  casper.start("http://localhost:3000/#/updated").scrollToBottom();

  casper.waitForResource(/updated\?offset=12$/, function() {
    test.pass('Packages list ajax resource loaded');
  });

  casper.waitForSelector('.pkg-list>li.ng-scope:nth-child(24)', function() {
    test.pass('Now 24 package elements');
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Should display popular packages list", 2, function(test) {
  casper.start("http://localhost:3000/").thenClick('a[href="/#/popular"]');

  casper.waitForUrl(/#\/popular$/, function() {
    test.pass('URL changed to /#/popular');
  });

  casper.waitForSelector('.pkg-list>li.ng-scope:nth-child(12)', function() {
    test.pass("12 first elements fetched");
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Should paginate popular packages list", 2, function(test) {
  casper.start("http://localhost:3000/#/popular").scrollToBottom();

  casper.waitForResource(/popular\?offset=12$/, function() {
    test.pass('Packages list ajax resource loaded');
  });

  casper.waitForSelector('.pkg-list>li.ng-scope:nth-child(24)', function() {
    test.pass('Now 24 package elements');
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Should allow searching for packages", 2, function(test) {
  casper.start("http://localhost:3000/", function() {
    this.sendKeys('[type="search"]', "text");
    this.click('[type="submit"]');
  });

  casper.waitForUrl(/#\/search\/text$/, function() {
    test.pass('URL changed to /#/search/text');
  });

  casper.waitForSelector('.pkg-list>li.ng-scope:nth-child(12)', function() {
    test.pass("12 first elements fetched");
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Should paginate search results", 2, function(test) {
  casper.start("http://localhost:3000/#/search/text").scrollToBottom();

  casper.waitForResource(/search\?q=text&offset=12$/, function() {
    test.pass('Packages list ajax resource loaded');
  });

  casper.waitForSelector('.pkg-list>li.ng-scope:nth-child(24)', function() {
    test.pass('Now 24 package elements');
  });

  casper.run(function() {
    test.done();
  });
});
