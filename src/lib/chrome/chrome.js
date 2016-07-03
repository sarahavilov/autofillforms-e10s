'use strict';

var app = {};
var config = {};  // jshint ignore:line
var regtools = {};  // jshint ignore:line

app.storage = chrome.storage;
app.tabs = chrome.tabs;
app.timers = window;
app.XMLHttpRequest = window.XMLHttpRequest;
app.DOMParser = window.DOMParser;
app.browserAction = chrome.browserAction;
app.runtime = chrome.runtime;
app.notifications = chrome.notifications;
app.extension = chrome.extension;
app.contextMenus = chrome.contextMenus;

app.version = chrome.runtime.getManifest().version;

app.storage = (function () {
  let objs = {};
  let callbacks = {};
  chrome.storage.local.get(null, (o) => objs = o);
  return {
    read: (id) => objs[id],
    write: (id, data) => {
      if (objs[id] === data) {
        return;
      }
      objs[id] = data;
      let tmp = {};
      tmp[id] = data;
      chrome.storage.local.set(tmp, function () {});
      (callbacks[id] || []).forEach(c => c(data));
    },
    on: function (name, callback) {
      callbacks[name] = callbacks[name] || [];
      callbacks[name].push(callback);
    }
  };
})();

app.inject = (function () {
  return {
    send: (id, method, data) => chrome.tabs.sendMessage(id, {method, data}),
    receive: (method, callback) => app.runtime.onMessage.addListener(function (message, sender) {
      if (sender.tab.id && message.method === method) {
        callback(sender.tab.id, message.data);
      }
    })
  };
})();

app.popup = {
  send: (method, data) => chrome.extension.sendRequest({method, data}),
  receive: (id, callback) => chrome.extension.onRequest.addListener(function (request, sender) {
    if (request.method === id && !sender.tab) {
      callback(request.data);
    }
  }),
  hide: function () {}
};

app.clipboard = {
  write: (str) => {
    document.oncopy = function(event) {
      event.clipboardData.setData('text/plain', str);
      event.preventDefault();
    };
    document.execCommand('Copy', false, null);
  }
};

app.startup = (function () {
  let loadReason, callback = function () {};
  function check () {
    if (loadReason === 'startup' || loadReason === 'install') {
      callback();
    }
  }
  chrome.runtime.onInstalled.addListener(function (details) {
    loadReason = details.reason;
    check();
  });
  chrome.runtime.onStartup.addListener(function () {
    loadReason = 'startup';
    check();
  });
  return (c) => {
    callback = c;
    check();
  };
})();

app.options = (function () {
  let url = chrome.extension.getURL('data/options/index.html');
  return {
    send: (method, data) => chrome.tabs.query(
      {url},
      (tabs) => tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, {method, data}))
    ),
    receive: function (method, callback) {
      chrome.runtime.onMessage.addListener(function (message, sender) {
        if (
          message.method === method &&
          sender.tab &&
          sender.tab.url.startsWith(chrome.extension.getURL('data/options/index.html'))
        ) {
          callback(message.data);
        }
      });
    }
  };
})();
