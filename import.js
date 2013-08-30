var db = require('level')('./db', {valueEncoding: 'json'});

console.log('searching for data files...');
var latch = 1, errored = false;

var base = './' + (process.argv[2] && process.argv[2] + '/' || '');

require('glob')(base + '**/data.json')
  .on('match', function (p) {
    var match = p.match(/data\/(\d+)\/(amendments|bills)\/([^\/]+)\/([^\/]+)\//);
    if (match) return tryGet(match[3] + '-' match[1]);
    var match = p.match(/data\/(\d+)\/votes\/(\d+)\/([^\/]+)\//);
    if (match) return tryGet(match[3] + '-' + match[1] + '.' + match[2]);
    console.error('no match', p);
    tryEnd();

    function tryGet (id) {
      db.get(id, function (err, data) {
        if (err) return tryEnd(err);
        if (!data) put();
        else {
          console.log(id, 'already in db');
          tryEnd();
        }
      });
    }

    function put () {
      try {
        var data = require(base + p);
      }
      catch (e) {
        return console.error(e);
      }
      var id = data.bill_id || data.amendment_id || data.vote_id;
      if (!id) return console.error('no id for ' + p);
      latch++;
      console.log('putting', id);
      db.put(id, data, tryEnd);
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
