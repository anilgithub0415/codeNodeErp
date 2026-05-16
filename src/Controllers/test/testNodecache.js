const cache=require('../../cachemanager');

cache.set('mySalute',"Hi Good morning!")

console.log("Read cache with key:mySalute->",cache.get('mySalute'));

