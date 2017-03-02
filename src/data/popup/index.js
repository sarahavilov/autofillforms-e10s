/* globals Fuse, defaults */
'use strict';
var select = document.querySelector('select');
var profile = document.getElementById('profile');
var search = document.getElementById('search');

var fuse = {
  search: function () {
    return [0];
  }
};

document.addEventListener('click', function (e) {
  let cmd = e.target.dataset.cmd;

  if (cmd === 'generate-password') {
    chrome.storage.local.get({
      'password.charset': 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
      'password.length': 12
    }, prefs => {
      let length = prefs['password.length'];
      let password = Array.apply(null, new Array(length))
        .map(() => prefs['password.charset'].charAt(Math.floor(Math.random() * length)))
        .join('');
      // write to clipboard
      document.oncopy = function (event) {
        event.clipboardData.setData('text/plain', password);
        event.preventDefault();
      };
      document.execCommand('Copy', false, null);
      chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: '/data/icons/48.png',
        title: 'AutoFill Forms',
        message: 'a new random password is stored in your clipboard'
      });
      window.close();
    });
  }
  else if (cmd === 'open-settings') {
    chrome.runtime.openOptionsPage();
  }
  else if (cmd === 'open-faqs') {
    chrome.tabs.create({
      url: 'http://add0n.com/autofillforms-e10s.html'
    });
    window.close();
  }
  else if (cmd === 'open-bugs') {
    chrome.tabs.create({
      url: 'https://github.com/sarahavilov/autofillforms-e10s'
    });
    window.close();
  }
  else if (cmd) {
    chrome.runtime.sendMessage({
      cmd,
      profile: profile.textContent
    });
    window.close();
  }
});
// select
(function (callback) {
  let old = select.value;
  function check () {
    let value = select.value;
    if (value !== old) {
      old = value;
      callback(value);
    }
  }
  select.addEventListener('change', check);
  select.addEventListener('click', check);
})(function (current) {
  profile.textContent = current;
  chrome.storage.local.set({current});
});

chrome.storage.local.get({
  users: '',
  current: 'default'
}, prefs => {
  let users = defaults.utils.getUsers(prefs.users);
  fuse = new Fuse(users);
  users.forEach(name => {
    let option = document.createElement('option');
    option.textContent = option.value = name;
    select.appendChild(option);
  });
  select.value = prefs.current;
  profile.textContent = prefs.current;
});

search.addEventListener('keypress', () => {
  let index = fuse.search(search.value)[0] || 0;
  let current = fuse.list[index];
  profile.textContent = current;
  chrome.storage.local.set({current});
});
