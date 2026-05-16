//cachemanager.js
const NodeCache = require('node-cache');    
const expsec=55;
var cache=new NodeCache({stdTTL:expsec});

module.exports =cache

