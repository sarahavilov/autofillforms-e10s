/* globals safari */
'use strict';

var app = {};
var config = {};  // jshint ignore:line
var regtools = {};  // jshint ignore:line

app.version = safari.extension.displayVersion;

app.timers = window;

app.storage = (function () {
  let callbacks = {};
  return {
    read: (id) => safari.extension.settings[id],
    write: (id, data) => {
      if (safari.extension.settings[id] === data) {
        return;
      }
      safari.extension.settings[id] = data;
      (callbacks[id] || []).forEach(c => c(data));
    },
    on: function (name, callback) {
      callbacks[name] = callbacks[name] || [];
      callbacks[name].push(callback);
    }
  };
})();

app.tabs = {
  create: (obj) => {
    safari.application.activeBrowserWindow.openTab('foreground').url = obj.url;
  },
  query: (options, callback) => callback([{
    id: {
      wn: safari.application.browserWindows.indexOf(safari.application.activeBrowserWindow),
      tn: safari.application.activeBrowserWindow.tabs.indexOf(safari.application.activeBrowserWindow.activeTab)
    }
  }])
};

app.popup = (function () {
  let callbacks = {};
  let toolbarItem = safari.extension.toolbarItems[0];
  let popup = safari.extension.popovers[0];

  return {
    show: () => toolbarItem.showPopover(),
    hide: () => popup.hide(),
    send: (id, data) => popup.contentWindow.background.dispatchMessage(id, data),
    receive: (id, callback) => {
      if (id === 'show') {
        safari.application.addEventListener('popover', callback, true);
      }
      else {
        callbacks[id] = callbacks[id] || [];
        callbacks[id].push(callback);
      }
    },
    dispatchMessage: (id, data) => (callbacks[id] || []).forEach(c => c(data))
  };
})();

app.contextMenus = (function () {
  let items = [];
  safari.application.addEventListener('contextmenu', (e) => {
    // this method messes up the context menu as there is no parent menu available
    if (e.userInfo === 'INPUT' && safari.extension.settings.contextmenu) {
      items.forEach((obj, i) => e.contextMenu.appendContextMenuItem('context/' + i, obj.title));
    }
  }, false);
  safari.application.addEventListener('command', (e) => {
    let cmd = e.command;
    if (cmd.startsWith('context/')) {
      let index = +(cmd.split('/')[1]);
      items[index].onclick();
    }
  }, false);
  return {
    create: (obj) => {
      items.push(obj);
      return obj;
    },
    remove: (obj) => {
      let index = items.indexOf(obj);
      if (index !== -1) {
        items.splice(index, 1);
      }
    }
  };
})();

app.notifications = {
  create: (id, props) => {
    // in safari password generation opens up an alert box; there is no need for desktop notifications
    return;
    let notification = window.webkitNotifications.createNotification(
      safari.extension.baseURI + props.iconUrl, props.title, props.message
    );
    notification.show();
    window.setTimeout(() => notification.cancel(), 5000);
  }
};

app.clipboard = {
  write: (msg) => window.alert(msg)
};

app.inject = (function () {
  let callbacks = {};
  safari.application.addEventListener('message', (e) => {
    let id = {
      wn: safari.application.browserWindows.indexOf(e.target.browserWindow),
      tn: e.target.browserWindow.tabs.indexOf(e.target)
    };
    (callbacks[e.message.id] || []).forEach(c => c.call(e.target, id, e.message.data));
  }, false);
  return {
    send: function (tabid, method, data) {
      safari.application.browserWindows[tabid.wn].tabs[tabid.tn].page.dispatchMessage(method, data);
    },
    receive: (id, callback) => {
      callbacks[id] = callbacks[id] || [];
      callbacks[id].push(callback);
    }
  };
})();

app.options = (function () {
  let callbacks = {};
  safari.application.addEventListener('message', (e) => {
    (callbacks[e.message.id] || []).forEach(c => c(e.message.data));
  }, false);
  return {
    send: function (id, data) {
      safari.application.browserWindows.forEach((browserWindow) => {
        browserWindow.tabs
        .filter((tab) => tab.page && tab.url.startsWith(safari.extension.baseURI + 'data/options/index.html'))
        .forEach((tab) => tab.page.dispatchMessage(id, data));
      });
    },
    receive: function (id, callback) {
      callbacks[id] = callbacks[id] || [];
      callbacks[id].push(callback);
    }
  };
})();

app.startup = function (callback) {
  callback();
};

app.extension = {
  getURL: (path) => safari.extension.baseURI + path
};
