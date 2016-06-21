/* globals chrome */
'use strict';

var background = {  // jshint ignore:line
  send: (method, data) => chrome.runtime.sendMessage({method, data}),
  receive: (method, callback) => chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.method === method && !sender.tab) {
      callback(request.data);
    }
  })
};
