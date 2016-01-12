# Replication performance

Times filtered replication (filter on server side) vs. getting subset of docs through querying a view.
Logs are in /logs dir.
The bulk query first queries the list of necessary ids from the view, then fetches the docs. This is in case there are too many docs and we want to split the fetching into several queries.

On a clone of lg.dev with 6886 docs (35.2 MB), we get : 
- replication : 573390 ms (9+ minutes)
- bulk download : 206 ms
=> 2783 times faster! The filter is very slow, each document takes for ever to be found. Then fetching it is fast.


## How to run
Requires node.

### Install node dependencies 
```
npm install
```

### Clear out the local pouch after each script run
Edit settings vars in `clearDb.js` if needed.
Run : 
```
node clearDb.js
```

### Run the replication script
Edit settings vars in `repl.js` if needed.
Run : 
```
node repl.js
```

### Optional : insert a view into your ddoc
Inserts the equivalent of the doc_by_place filter, as a view.
Edit settings vars in `doc_by_place.js` if needed.
Run : 
```
node doc_by_place.js
```

### Run the bulk query script
Edit settings vars in `bulk_query.js` if needed.
Run : 
```
node bulk_query.js
```
