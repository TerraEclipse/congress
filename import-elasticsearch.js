var elasticsearch = require('elasticsearch')
  , memcached = require('elasticsearch-memcached')
  , modeler = require('modeler-elasticsearch')
  , glob = require('glob')

var client = elasticsearch.createClient({
  _index: 'congress',
  request: memcached,
  server: {
    memcached: {
      host: 'localhost',
      port: 11211
    },
    rest: {
      host: 'localhost',
      port: 9200
    }
  }
});

var bills = modeler({
  name: 'bills',
  client: client
});

var amendments = modeler({
  name: 'amendments',
  client: client
});

var votes = modeler({
  name: 'votes',
  client: client
});

client.indices.createIndex(function (err) {
  if (err) throw err;
  client.cluster.health({
    _index: 'congress',
    wait_for_status: 'yellow'
  }, function (err) {
    if (err) throw err;

    console.log('searching for data files...');
    var latch = 1, errored = false;

    var base = './' + (process.argv[2] && process.argv[2].replace(/\/$/, '') + '/' || '');

    glob(base + '**/data.json')
      .on('match', function (p) {
        try {
          var data = require(p);
        }
        catch (e) {
          return console.error(e);
        }
        latch++;
        console.log('putting', p);
        if (data.bill_id) {
          data.id = data.bill_id;
          bills.create(data, tryEnd);
        }
        else if (data.amendment_id) {
          data.id = data.amendment_id;
          amendments.create(data, tryEnd);
        }
        else if (data.vote_id) {
          data.id = data.vote_id;
          votes.create(data, tryEnd);
        }
        else {
          console.error('no id for ' + p);
          tryEnd();
        }
      })
      .on('end', function () {
        tryEnd();
      })

    function tryEnd (err) {
      if (errored) return;
      if (err) {
        errored = true;
        return console.error(err);
      }
      if (!--latch) {
        db.close(function () {
          console.log('done.');
        });
      }
    }
  });
});
