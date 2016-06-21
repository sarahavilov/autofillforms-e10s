/* globals chrome */
'use strict';

var background = {
  send: (method, data) => chrome.extension.sendRequest({method, data}),
  receive: (id, callback) => chrome.extension.onRequest.addListener(function (request) {
    if (request.method === id) {
      callback(request.data);
    }
  })
};

window.addEventListener('DOMContentLoaded', () => background.send('show'));
