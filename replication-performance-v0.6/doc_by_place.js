/**
* Inserts a view called doc_by_place in the design doc.
*/

/*jslint node: true */
'use strict';

var request = require('request');

// View function, similar to the doc_by_place filter.
// It mimics the doc_by_place filter, commenting out the unnecessary bits, to be sure I don't forget any.
// Definitely not production code.
var doc_by_place_view = function(doc) {
  var ok = function(place) {
/*    if (!req.query.id) {
      // admin
      // !!! no emission (don't want unfiltered repl for benchmarking)
      return true;
    }*/
    if (!place) {
      // !!! no emission (too complicated for benchmarking)
      return;  // req.query.unassigned === 'true';
    }
    while (place) {
      /*      if (place._id === req.query.id) {
              return true;
            }*/
      emit(place._id, doc._id);
      place = place.parent;
    }
    return false;
  };

  if (doc._id === '_design/medic') {
    // Never replicate the ddoc as it's too big.
    // Changes are tracked in the watchDesignDoc function of the DB service.
    // no emission
    return false;
  }
  if (doc._id === 'resources') {
    emit('ALL', doc._id); // all places should get this.
    return true;
  }
/*  if (doc._id === 'org.couchdb.user:' + req.userCtx.name) {
    // no emission. Get this separately : each user fetches their user doc.
    return true;
  }*/
  switch (doc.type) {
    case 'data_record':
      if (doc.kujua_message === true) {
        // outgoing message
        return ok(doc.tasks &&
          doc.tasks[0] &&
          doc.tasks[0].messages &&
          doc.tasks[0].messages[0] &&
          doc.tasks[0].messages[0].contact);
      } else {
        // incoming message
        return ok(doc.contact);
      }
      break;
    case 'form':
      emit('ALL', doc._id);
      return true;
    case 'clinic':
    case 'district_hospital':
    case 'health_center':
    case 'person':
      return ok(doc);
    default:
      return false;
  }
}.toString();

function getDdoc(remoteCouchName, ddocName, callback) {
  request(remoteCouchName + '/_design/' + ddocName, function(err, res, body) {
    var ddoc = body;
    if (!body._id) {
      ddoc = JSON.parse(body);
    }
    console.log(ddoc._id);
    console.log('Num Views : ' + Object.keys(ddoc.views).length);
    callback(ddoc);
  });
}

function insertViewIntoDdoc(ddoc, viewName) {
  ddoc.views[viewName] = {
    map: doc_by_place_view
  };
  return ddoc;
}

function putDdocBack(remoteCouchName, ddocName, ddoc) {
  var options = {
    method: 'put',
    body: ddoc,
    json: true,
    url: remoteCouchName + '/_design/' + ddocName
  };
  request(options, function(err, res, body) {
    console.log(err);
    console.log(body);
  });

}

// Settings : replace by your own values.
var remoteCouchName = 'http://admin:pass@localhost:5984/lgmedic-copy';
var ddocName = 'medic';
var viewName = 'doc_by_place';


getDdoc(remoteCouchName, ddocName, function(ddoc) {
  ddoc = insertViewIntoDdoc(ddoc, viewName);
  console.log('Num Views : ' + Object.keys(ddoc.views).length);
  putDdocBack(remoteCouchName, ddocName, ddoc);
});
