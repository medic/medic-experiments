/**
* Query a couch view for a list of ids, then fetch these ids with bulk api, then insert them in pouch.
*/
/*jslint node: true */
'use strict';

var PouchDB = require('pouchdb');
var request = require('request');
var _ = require('underscore');

var localPouch;

function printTime(message, time) {
  if (!time) {
    time = new Date();
  }
  console.log(message + ' : ' + time.getTime() + ' - ' +
    time.getHours() + ":" + time.getMinutes() + ":" +
    time.getSeconds() + '.' + time.getMilliseconds());
}

function getLocalDocCount(localPouch) {
  return localPouch.info().then(function(info) {
    return Promise.resolve(info.doc_count); // JS promise
  });
}

function printLocalDocCount(localPouch) {
  getLocalDocCount(localPouch).then(function(count) {
    console.log('Local doc count : ' + count);
  });
}

function queryRemoteViewForIds(remoteCouchName, ddocName, viewName, id, callback) {
  var url = remoteCouchName + '/_design/' + ddocName + '/_view/' + viewName + '?key="' + id + '"';
  console.log('Querying : ' + url);
  request(
    url,
    function(err, res, body) {
      var rows = body.rows;
      if (!rows) {
        rows = JSON.parse(body).rows;
      }
      var ids = _.map(rows, function(row) {
        return row.value;
      });
      callback(ids);
    });
}

function getDoc(remoteCouchName, id, callback) {
  console.log('getting ' + id);
  request(remoteCouchName + '/' + id, function(err, res, body) {
    if (!body._id) {
      body = JSON.parse(body);
    }
    callback(body);
  });
}

function getDocs(ids, callback) {
  var options = {
    method: 'post',
    body: {
      "keys": ids
    },
    json: true,
    url: remoteCouchName + '/_all_docs?include_docs=true&attachments=true'
  };
  request(options, function(err, res, body) {
    var rows = body.rows;
    var docs = _.map(rows, function(row) {
      return row.doc;
    });
    callback(docs);
  });
}

function insertDocs(docs, startTime) {
  localPouch.bulkDocs(docs).then(function(result) {
    printLocalDocCount(localPouch);

    var endTime = new Date();
    printTime('\n\nInserted! ', endTime);
    printDuration('Total time', startTime, endTime);
  }).catch(function(e) {
    console.log('Couldnt insert : ' + e);
  });
}

function printDuration(message, start, end) {
  if (!end) {
    end = new Date();
  }
  console.log(message + ' : ' + (end.getTime() - start.getTime()) + ' ms');
}


// Settings : change this to your values if needed.
var remoteCouchName = 'http://admin:pass@localhost:5984/lgmedic-copy';
var ddocName = 'medic';
var viewName = 'doc_by_place';
var userId = '1D43EDB3-E2AB-0ABB-85DA-AB16479CF632';


var localPouchName = 'medic';
localPouch = new PouchDB(localPouchName);
printLocalDocCount(localPouch);

var startTime = new Date();
console.log('Remote db : ' + remoteCouchName);
console.log('Ddoc : ' + ddocName);
console.log('View : ' + viewName);
printTime('Start', startTime);
// Fetch docs with key = userId
queryRemoteViewForIds(remoteCouchName, ddocName, viewName, userId, function(ids) {
  printDuration('View query', startTime);
  console.log('Doc Ids for ' + userId + ' : ' + ids);
  getDocs(ids, function(docs) {
    insertDocs(docs, startTime);
  });
});
// Fetch docs with key = 'ALL' (all users need these. Forms mostly.)
queryRemoteViewForIds(remoteCouchName, ddocName, viewName, 'ALL', function(ids) {
  printDuration('View query', startTime);
  console.log('Doc Ids for ALL : ' + ids);
  getDocs(ids, function(docs) {
    insertDocs(docs, startTime);
  });
});
// Fetch the user doc. Using the 'demo' user arbitrarily.
getDoc(remoteCouchName, 'org.couchdb.user:demo', function(doc) {
  insertDocs([doc], startTime);
});
