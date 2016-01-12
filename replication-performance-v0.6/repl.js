/*jslint node: true */
'use strict';

var PouchDB = require('pouchdb');
PouchDB.debug.enable('*');

function runSync(localPouch, remoteCouch, ddocName, filterName, userId, isLive, onComplete) {
  return remoteCouch.replicate.to(localPouch, {
      // Use options below to filter with a view. Couldn't get it to work.
      //      filter: '_view',
      //     view: 'myddoc/myview',
      // Filter with a filter function on the remote ddoc (filtering is done on server)
      filter: ddocName + '/' + filterName,
      query_params: {
        id: userId
      },
      live: isLive,
      retry: true,
    })
    .on('change', function(info) {
      // Note : this event doesn't fire in one-time syncs.
      console.log('replication : change : ' + info.direction + " - docs_written : " + info.change.docs_written +
        ' - docs_read : ' + info.changes.docs_read);
      printLocalDocCount(localPouch, startTime);
    })
    .on('paused', function() {
      console.log('replication : paused');
      printLocalDocCount(localPouch, startTime);
    })
    .on('active', function() {
      // replicate resumed (e.g. user went back online)
      console.log('replication : active');
    })
    .on('denied', function(info) {
      // a document failed to replicate, e.g. due to permissions
      console.log('replication : denied ' + JSON.stringify(info));
    })
    .on('complete', onComplete)
    .on('error', function(err) {
      // handle error
      console.log('replication : error ' + JSON.stringify(err));
    });
}

function runOneTimeSync(localPouch, remoteCouch, ddocName, filterName, userId, onComplete) {
  return runSync(localPouch, remoteCouch, ddocName, filterName, userId, false, onComplete);
}

function runLiveSync(localPouch, remoteCouch, ddocName, filterName, userId) {
  return runSync(localPouch, remoteCouch, ddocName, filterName, userId, true, function() {});
}

function printTime(message, time) {
  if (!time) {
    time = new Date();
  }
  console.log(message + ' : ' + time.getTime() + ' - ' +
    time.getHours() + ":" + time.getMinutes() + ":" +
    time.getSeconds() + '.' + time.getMilliseconds());
}

function printDuration(message, start, end) {
  if (!end) {
    end = new Date();
  }
  var durationMs = end.getTime() - start.getTime();
  var minutes = Math.floor(durationMs / 1000 / 60);
  console.log(message + ' : ' + (end.getTime() - start.getTime()) + ' ms (' + minutes + '+ minutes)');
}

function getLocalDocCount(localPouch) {
  return localPouch.info().then(function(info) {
    return Promise.resolve(info.doc_count); // JS promise
  });
}

function printLocalDocCount(localPouch, startTime) {
  getLocalDocCount(localPouch).then(function(count) {
    console.log('Local doc count : ' + count);
    printDuration('so far', startTime);
  });
}

// Settings : change these to whatever.
var remoteCouchName = 'http://admin:pass@localhost:5984/lgmedic-copy';
var ddocName = 'medic'; 
var filterName = 'doc_by_place'; 
var userId = '1D43EDB3-E2AB-0ABB-85DA-AB16479CF632';


var localPouchName = 'medic';
var localPouch = new PouchDB(localPouchName);
var remoteCouch = new PouchDB(remoteCouchName);

var startTime = new Date();
console.log('Remote db : ' + remoteCouchName);
console.log('Ddoc : ' + ddocName);
console.log('Filter : ' + filterName);
console.log('UserId : ' + userId);
printTime('Start', startTime);

runOneTimeSync(localPouch, remoteCouch, ddocName, filterName, userId, function() {
  var endTime = new Date();
  printTime('\n\nSync complete', endTime);
  console.log('Total time : ' + (endTime.getTime() - startTime.getTime()) + ' ms');
});
