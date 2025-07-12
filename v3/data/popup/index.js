/* global Fuse, utils */

'use strict';
const select = document.querySelector('select');
const profile = document.getElementById('profile');
const search = document.getElementById('search');

let fuse = {
  search: function() {
    return [];
  }
};
const notify = (e, c = () => {}) => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/48.png',
  title: chrome.runtime.getManifest().name,
  message: e.message || e
}, id => {
  setTimeout(() => chrome.notifications.clear(id), 5000);
  c(id);
});

document.addEventListener('click', function(e) {
  const cmd = e.target.dataset.cmd;

  if (cmd === 'open-settings') {
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
  const users = utils.getUsers(prefs.users);

  fuse = new Fuse(users, {
  });
  users.forEach(name => {
    const option = document.createElement('option');
    option.textContent = option.value = name;
    select.appendChild(option);
  });
  select.value = prefs.current;
  profile.textContent = prefs.current;
});

search.addEventListener('input', () => {
  const query = search.value;
  const o = fuse.search(query)[0];
  const current = o?.item || fuse.getIndex().docs[0];
  profile.textContent = current;
  chrome.storage.local.set({current});
});

const post = cmd => chrome.runtime.sendMessage({
  cmd,
  profile: profile.textContent
}, () => {
  window.close();
  chrome.runtime.lastError;
});

// Fill Forms
document.getElementById('filling').addEventListener('submit', e => {
  e.preventDefault();

  post('fill-forms');
});
document.getElementById('fill-with-tmp-profile').onclick = () => post('fill-tmp-forms');

// Extract Rules
document.getElementById('extract-rules').onclick = () => post('extract-rules');

// Update Profile
document.getElementById('create-profile').onclick = () => post('create-profile');
document.getElementById('create-tmp-profile').onclick = () => post('create-tmp-profile');

// generate password
document.getElementById('generate-password').onclick = () => chrome.storage.local.get({
  'password.charset': 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
  'password.length': 12
}, prefs => {
  const length = prefs['password.length'];
  const password = [...new Array(length)]
    .map(() => prefs['password.charset'].charAt(Math.floor(Math.random() * length)))
    .join('');
  navigator.clipboard.writeText(password).then(() => {
    notify('a new random password is stored in your clipboard', () => {
      window.close();
    });
    chrome.runtime.lastError;
  }).catch(e => notify(e));
});

// permission
chrome.storage.local.get({
  'check.for.cross-origins': true
}, prefs => {
  if (prefs['check.for.cross-origins']) {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, tabs => {
      const tab = tabs[0];

      chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
          allFrames: true
        },
        injectImmediately: true,
        func: () => {
          const hosts = [];
          for (const frame of document.querySelectorAll('iframe')) {
            if (frame.src && frame.src.startsWith('http')) {
              try {
                const origin = new URL(frame.src).hostname;
                hosts.push(origin);
              }
              catch (e) {}
            }
          }
          return hosts;
        }
      }).then(a => {
        const hosts = new Set();
        for (const {result} of a) {
          for (const host of result) {
            if (host) {
              hosts.add(host);
            }
          }
        }
        const origins = [...hosts].map(s => '*://' + s + '/*');
        if (origins.length) {
          chrome.permissions.contains({
            origins
          }, b => {
            if (b !== true) {
              document.getElementById('permission').classList.remove('hidden');
              document.querySelector('#permission span').textContent = [...hosts].join(', ');
              document.querySelector('#permission').onsubmit = e => {
                e.preventDefault();
                chrome.permissions.request({
                  origins
                }, b => {
                  if (b) {
                    document.getElementById('permission').classList.add('hidden');
                  }
                });
              };
            }
          });
        }
      }).catch(e => console.info('Cannot check frame access', e));
    });
  }
});
document.querySelector('#permission input[type=button]').onclick = () => {
  document.getElementById('permission').classList.add('hidden');
};
