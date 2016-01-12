/*jslint node: true */
'use strict';

var PouchDB = require('pouchdb');

function clearPouch(localPouch) {
  new PouchDB(localPouch).destroy(localPouch).then(function() {
    console.log('localPouch ' + localPouch + ' destroyed.');
    printLocalDocCount(localPouch);
  }).catch(function(err) {
    console.log('Couldnt destroy localPouch ' + localPouch + '.');
  });
}

function getLocalDocCount(localPouch) {
  return new PouchDB(localPouch).info().then(function(info) {
    return Promise.resolve(info.doc_count); // JS promise
  });
}

function printLocalDocCount(localPouch) {
  getLocalDocCount(localPouch).then(function(count) {
    console.log('Local doc count : ' + count);
  });
}

var localPouch = 'medic';
clearPouch(localPouch);
