'use strict';

// Load Firefox based resources
var self = require('sdk/self'),
    tabs = require('sdk/tabs'),
    timers = require('sdk/timers'),
    array = require('sdk/util/array'),
    sp = require('sdk/simple-prefs'),
    unload = require('sdk/system/unload'),
    pageMod = require('sdk/page-mod'),
    clipboard = require('sdk/clipboard'),
    cm = require('sdk/context-menu'),
    notifications = require('sdk/notifications'),
    {ToggleButton} = require('sdk/ui/button/toggle'),
    {Panel} = require('sdk/panel');

exports.version = self.version;

var button = new ToggleButton({
  id: self.name,
  label: 'AutoFill Forms (e10s)',
  icon: {
    '18': './icons/18.png',
    '36': './icons/36.png',
    '64': './icons/64.png'
  },
  onChange: function (state) {
    if (state.checked) {
      exports.popup.show(button);
    }
  }
});

exports.contextMenus = (function () {
  let parentMenu = cm.Menu({
    label: 'AutoFill Forms (e10s)',
    context: cm.SelectorContext('input'),
    image: self.data.url('./icons/32.png')
  });
  return {
    create: function (prop) {
      return cm.Item({
        parentMenu,
        label: prop.title,
        contentScript: `self.on('click', self.postMessage);`,
        onMessage: prop.onclick
      });
    },
    remove: (menu) => menu.destroy()
  };
})();

exports.popup = (function () {
  let popup = new Panel({
    contentURL: self.data.url('./popup/index.html'),
    contentScriptFile: [
      self.data.url('./popup/firefox/firefox.js'),
      self.data.url('./popup/index.js')
    ]
  });
  popup.on('hide', () => button.state('window', {checked: false}));
  return {
    show: (position) => popup.show({
      width: 400,
      height: 300,
      position
    }),
    send: (id, data) => popup.port.emit(id, data),
    receive: (id, callback) => {
      if (id === 'show') {
        popup.on('show', callback);
      }
      else {
        popup.port.on(id, callback);
      }
    },
    hide: () => popup.hide()
  };
})();

exports.browserAction = {
  setBadgeText: (v) => button.badge = v.text,
  setTitle: (v) => button.label = v.title
};

exports.tabs = {
  create: (obj) => tabs.open(obj),
  query: (prop, callback) => callback([tabs.activeTab])
};

exports.storage = {
  read: (id) => sp.prefs[id],
  write: (id, data) => sp.prefs[id] = data,
  on: (name, callback) => sp.on(name, callback)
};

exports.timers = timers;

exports.clipboard = {
  write: clipboard.set
};

exports.notifications = {
  create: (d, options) => notifications.notify({
    title: options.title,
    text: options.message,
    iconURL: self.data.url(options.iconUrl.replace('data/', ''))
  })
};

exports.extension = {
  getURL: (path) => self.data.url(path.replace('data/', ''))
};

exports.inject = (function () {
  let workers = [], callbacks = [];
  pageMod.PageMod({
    include: ['http://*', 'https://*', 'file://*'],
    contentScriptFile: [
      self.data.url('./inject/firefox/firefox.js'),
      self.data.url('./inject/inject.js')
    ],
    contentScriptWhen: 'start',
    attachTo: ['top', 'existing', 'frame'],
    onAttach: function(worker) {
      array.add(workers, worker);
      worker.on('pageshow', () => array.add(workers, worker));
      worker.on('pagehide', () => array.remove(workers, worker));
      worker.on('detach', () => array.remove(workers, worker));
      callbacks.forEach((arr) => worker.port.on(arr[0], (obj) => arr[1](worker.tab.id, obj)));
    }
  });
  return {
    send: function (tabid, method, data) {
      workers.filter(w => w.tab.id === tabid).forEach(w => w.port.emit(method, data));
    },
    receive: function (id, callback) {
      callbacks.push([id, callback]);
      workers.forEach(w => w.port.on(id, (obj) => callback(w.tab.id, obj)));
    }
  };
})();

exports.options = (function () {
  let workers = [], callbacks = [];
  pageMod.PageMod({
    include: self.data.url('options/index.html'),
    contentScriptFile: [
      self.data.url('options/firefox/firefox.js'),
      self.data.url('options/index.js')
    ],
    contentScriptWhen: 'ready',
    onAttach: function(worker) {
      array.add(workers, worker);
      worker.on('pageshow', () => array.add(workers, worker));
      worker.on('pagehide', () => array.remove(workers, worker));
      worker.on('detach', () => array.remove(workers, worker));
      callbacks.forEach((arr) => worker.port.on(arr[0], arr[1]));
    }
  });
  sp.on('openOptions', () => exports.tabs.create({
    url: self.data.url('options/index.html')
  }));

  return {
    send: (id, data) => workers.forEach(w => w.port.emit(id, data)),
    receive: (id, callback) => callbacks.push([id, callback])
  };
})();


//startup
exports.startup = function (callback) {
  if (self.loadReason === 'install' || self.loadReason === 'startup') {
    callback();
  }
};

unload.when(function (e) {
  if (e === 'shutdown') {
    return;
  }
  for each (var tab in tabs) {
    if (tab.url.startsWith(self.data.url(''))) {
      tab.close();
    }
  }
});
