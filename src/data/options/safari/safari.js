/* globals safari */
'use strict';

var background = {  // jshint ignore:line
  send: (id, data) => safari.self.tab.dispatchMessage('message', {
    id,
    data
  }),
  receive: (function () {
    let callbacks = {};
    safari.self.addEventListener('message', (e) => {
      (callbacks[e.name] || []).forEach(c => c(e.message));
    }, false);

    return (id, callback) => {
      callbacks[id] = callbacks[id] || [];
      callbacks[id].push(callback);
    };
  })()
};
