 const get_Data=(): Promise<{ id: string; nm: string }[]> =>{
    return new Promise((resolve, reject) => {
      resolve([{"id":"1","nm":"one"},{"id":"2","nm":"two"},{"id":"3","nm":"three"}]);
      // You would typically call reject() in case of an error in an async operation.
    });
  }

  module.exports={get_Data}