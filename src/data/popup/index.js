/* globals Fuse, defaults */
'use strict';
const select = document.querySelector('select');
const profile = document.getElementById('profile');
const search = document.getElementById('search');

let fuse = {
  search: function() {
    return [0];
  }
};
const notify = e => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message: e.message || e
});

document.addEventListener('click', function(e) {
  const cmd = e.target.dataset.cmd;

  if (cmd === 'generate-password') {
    chrome.storage.local.get({
      'password.charset': 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
      'password.length': 12
    }, prefs => {
      const length = prefs['password.length'];
      const password = [...new Array(length)]
        .map(() => prefs['password.charset'].charAt(Math.floor(Math.random() * length)))
        .join('');
      navigator.clipboard.writeText(password).then(() => {
        notify('a new random password is stored in your clipboard');
        window.close();
      }).catch(e => notify(e));
    });
  }
  else if (cmd === 'open-settings') {
    chrome.runtime.openOptionsPage();
  }
  else if (cmd === 'open-faqs') {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url
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
(function(callback) {
  let old = select.value;
  function check() {
    const value = select.value;
    if (value !== old) {
      old = value;
      callback(value);
    }
  }
  select.addEventListener('change', check);
  select.addEventListener('click', check);
})(function(current) {
  profile.textContent = current;
  chrome.storage.local.set({current});
});

chrome.storage.local.get({
  users: '',
  current: 'default'
}, prefs => {
  const users = defaults.utils.getUsers(prefs.users);
  fuse = new Fuse(users);
  users.forEach(name => {
    const option = document.createElement('option');
    option.textContent = option.value = name;
    select.appendChild(option);
  });
  select.value = prefs.current;
  profile.textContent = prefs.current;
});

search.addEventListener('keypress', () => {
  const index = fuse.search(search.value)[0] || 0;
  const current = fuse.list[index];
  profile.textContent = current;
  chrome.storage.local.set({current});
});
