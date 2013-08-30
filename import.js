var db = require('level')('./db', {valueEncoding: 'json'});

console.log('searching for data files...');
var latch = 1, errored = false;

require('glob')('**/data.json')
  .on('match', function (p) {
    try {
      var data = require(p);
    }
    catch (e) {
      return console.error(e);
    }
    var id = data.bill_id || data.amendment_id || data.vote_id;
    if (!id) return console.error('no id for ' + p);
    latch++;
    console.log('putting', id);
    db.put(id, data, tryEnd);
  })
  .on('end', tryEnd)

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
