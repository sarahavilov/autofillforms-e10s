/* globals safari */
'use strict';

var background = (function () { // jshint ignore:line
  let callbacks = {};
  return {
    send: (id, data) => safari.extension.globalPage.contentWindow.app.popup.dispatchMessage(id, data),
    receive: (id, callback) => {
      callbacks[id] = callbacks[id] || [];
      callbacks[id].push(callback);
    },
    dispatchMessage: (id, data) => (callbacks[id] || []).forEach(c => c(data))
  };
})();
