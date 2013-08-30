var db = require('level')('./db');

require('glob')('**/data.json')
  .on('match', function (p) {
    console.log(p);
  })
  .on('end', function () {
    db.close(function () {
      console.log('done');
    });
  })
