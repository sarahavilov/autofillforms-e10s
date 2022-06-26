/* globals defaults, utils */
'use strict';

const toast = document.getElementById('toast');
const profiles = {};

const tabs = {
  switch(index) {
    [...document.querySelectorAll('#tabs>span')]
      .forEach(span => span.dataset.active = span.dataset.index === index);
    [...document.querySelectorAll('#panels>div')]
      .forEach(div => div.dataset.active = div.dataset.index === index);
  }
};

function notify(msg, delay = 750, callback = () => {}) {
  toast.textContent = msg;
  setTimeout(() => {
    toast.textContent = '';
    callback();
  }, delay);
}

function syncProfile(name) {
  profiles[name] = [...document.querySelectorAll('#profile tbody tr')].map(tr => ({
    name: tr.querySelector('td:nth-child(1) input').value,
    value: tr.querySelector('td:nth-child(2) input').value
  })).filter(obj => obj.name !== '' && obj.value !== '')
    .reduce((p, c) => {
      p[c.name] = c.value;
      return p;
    }, {});
}

function disabled(current) {
  document.querySelector('[data-cmd=delete]').disabled = current === 'default';
  document.querySelector('[data-cmd=rename]').disabled = current === 'default';
}

function save() {
  const prefs = {};
  // general
  prefs.types = document.getElementById('types').value;
  prefs['password.charset'] = document.getElementById('password.charset').value;
  prefs['password.length'] = +document.getElementById('password.length').value;
  prefs['detect'] = document.getElementById('detect').value;
  // users
  prefs.users = [...document.querySelectorAll('#users option')]
    .map(e => e.value);
  // current
  prefs.current = document.getElementById('users').value;
  // updating profiles
  syncProfile(prefs.current);
  // profiles
  Object.keys(profiles)
  // do not store deleted profiles
    .filter(name => prefs.users.indexOf(name) !== -1)
    .forEach(name => {
      utils.storeProfile(name, profiles[name]);
    });
  // users (part 2)
  prefs.users = prefs.users.filter(n => n !== 'default').join(', ');
  // rules
  const rules = [...document.querySelectorAll('#rules tr')].map(tr => ({
    name: tr.querySelector('td:nth-child(1) input').value,
    site: tr.querySelector('td:nth-child(2) input').value,
    field: tr.querySelector('td:nth-child(3) input').value
  }))
    .filter(obj => obj.name !== '' && obj.field !== '')
    .filter(obj => {
      const rule = defaults.rules[obj.name];
      return !rule || rule['field-rule'] !== obj.field || rule['site-rule'] !== obj.site;
    }).reduce((p, c) => {
      p[c.name] = {
        'site-rule': c.site,
        'field-rule': c.field
      };
      return p;
    }, {});

  prefs.rules = JSON.stringify(rules);

  chrome.storage.local.set(prefs, () => {
    utils.cleanDB(() => {
      notify('Settings saved', 750, () => {
        // window.location.reload();
      });
    });
  });
}

function duplicate(current) {
  const users = document.getElementById('users');
  current = current || users.value;
  const used = [...users.querySelectorAll('option')].map(o => o.value);
  const num = /\((\d+)\)/.exec(current);
  const names = [];
  if (num) {
    for (let i = (+num[1]) + 1; i < 200; i += 1) {
      names.push(current.replace(`(${num[1]})`, `(${i})`));
    }
    current = name;
  }
  else {
    names.push(current);
    for (let i = 1; i < 100; i += 1) {
      names.push(current + ` (${i})`);
    }
  }

  current = names.filter(n => used.indexOf(n) === -1).shift();
  // store
  syncProfile(current);
  // create element
  const option = document.createElement('option');
  option.textContent = option.value = current;
  users.appendChild(option);
  users.value = current;
  users.dispatchEvent(new Event('change'));
}

function remove(d, s) {
  const users = document.getElementById('users');
  users.removeChild(d ? users.querySelector(`[value="${d}"]`) : users.selectedOptions[0]);
  users.value = s || 'default';
  users.dispatchEvent(new Event('change'));
}

document.addEventListener('click', e => {
  const target = e.target;
  if (target.dataset.index) {
    tabs.switch(target.dataset.index);
  }
  if (target.dataset.cmd === 'delete-row') {
    const tr = target.closest('tr');
    tr.parentNode.removeChild(tr);
  }
  else if (target.dataset.cmd === 'add-a-value') {
    const template = document.querySelector('#profile template');
    const tbody = document.querySelector('#profile tbody');
    const tr = document.importNode(template.content, true);
    tbody.appendChild(tr);
    const input = tbody.querySelector('tr:last-child input');
    input.scrollIntoView();
    input.focus();
  }
  else if (target.dataset.cmd === 'add-a-rule') {
    const template = document.querySelector('#rules template');
    const tbody = document.getElementById('rules');
    const tr = document.importNode(template.content, true);
    tbody.appendChild(tr);
    const input = tbody.querySelector('tr:last-child input');
    input.scrollIntoView();
    input.focus();
  }
  else if (target.dataset.cmd === 'save') {
    save();
  }
  else if (target.dataset.cmd === 'delete') {
    remove();
  }
  else if (target.dataset.cmd === 'duplicate') {
    duplicate();
  }
  else if (target.dataset.cmd === 'rename') {
    const name = document.getElementById('rename').value;
    if (name) {
      const current = document.getElementById('users').value;
      duplicate(name);
      remove(current, name);
    }
    else {
      notify('Enter a new name');
      document.getElementById('rename').focus();
    }
  }
  else if (target.dataset.cmd === 'export') {
    const filename = 'AutoFill-Forms-' + (new Date()).toLocaleString().replace(/[\s:/]/g, '-').replace(',', '') + '.json';

    chrome.storage.local.get(prefs => {
      fetch('data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(prefs)))
        .then(res => res.blob())
        .then(blob => {
          const href = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = href;
          a.download = filename;
          a.click();
          setTimeout(() => URL.revokeObjectURL(href), 5000);
        });
    });
  }
  else if (target.dataset.cmd === 'permission') {
    chrome.permissions.request({
      origins: ['*://*/*']
    }, granted => {
      const lastError = chrome.runtime.lastError;

      notify(lastError ? lastError.message : ('permission ' + (granted ? 'granted' : 'denied')));
    });
  }
  else if (target.dataset.cmd === 'reset') {
    if (e.detail === 1) {
      notify('Double-click to reset!');
    }
    else {
      localStorage.clear();
      chrome.storage.local.clear(() => {
        chrome.runtime.reload();
        window.close();
      });
    }
  }
  else if (target.dataset.cmd === 'support') {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
    });
  }
});
// import
document.querySelector('[data-cmd=import]').addEventListener('change', e => {
  const target = e.target;
  const files = target.files;

  if (files && files.length) {
    const reader = new FileReader();
    reader.onload = function() {
      try {
        const prefs = JSON.parse(reader.result);
        if (prefs['password.length']) {
          chrome.storage.local.set(prefs, () => {
            window.location.reload();
          });
        }
        else {
          notify('JSON file is incompatible', 5000);
        }
      }
      catch (e) {
        notify(e.message, 5000);
      }
      target.value = '';
    };
    reader.readAsText(files[0], 'utf-8');
  }
});

function prepareProfile() {
  const current = document.getElementById('users').value;

  function second() {
    const profile = profiles[current];
    const template = document.querySelector('#profile template');
    const tbody = document.querySelector('#profile tbody');
    tbody.textContent = '';
    Object.keys(profile).forEach(name => {
      const tr = document.importNode(template.content, true);
      tr.querySelector('td:nth-child(1) input').value = name;
      if (name in defaults.profile) {
        tr.querySelector('td:nth-child(1) input').readOnly = true;
      }
      tr.querySelector('td:nth-child(2) input').value = profile[name];
      tbody.appendChild(tr);
    });
  }

  if (profiles[current]) {
    second(current);
  }
  else {
    utils.getProfile(current, profile => {
      profiles[current] = profile;
      second(current);
    });
  }
}

chrome.storage.local.get({
  'users': '',
  'current': 'default',
  'password.charset': defaults['password.charset'],
  'password.length': defaults['password.length'],
  'types': defaults.types,
  'detect': defaults.detect,
  'rules': '{}'
}, prefs => {
  // general
  document.getElementById('password.charset').value = prefs['password.charset'];
  document.getElementById('password.length').value = prefs['password.length'];
  document.getElementById('types').value = prefs.types;
  document.getElementById('detect').value = prefs.detect;
  // rename & delete
  disabled(prefs.current);
  // profile -> users
  const users = utils.getUsers(prefs.users);
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = option.textContent = user;
    document.getElementById('users').appendChild(option);
  });
  document.getElementById('users').value = prefs.current;
  document.getElementById('users').dataset.value = prefs.current;
  // profile -> value
  prepareProfile();
  // rules
  const rules = utils.getRules(prefs.rules);

  const template = document.querySelector('#rules template');
  const tbody = document.getElementById('rules');
  Object.keys(rules).forEach(name => {
    const tr = document.importNode(template.content, true);
    tr.querySelector('td:nth-child(1) input').value = name;
    if (name in defaults.rules) {
      tr.querySelector('td:nth-child(1) input').readOnly = true;
    }
    tr.querySelector('td:nth-child(2) input').value = rules[name]['site-rule'];
    tr.querySelector('td:nth-child(3) input').value = rules[name]['field-rule'];
    tbody.appendChild(tr);
  });
});

// change of profile
document.getElementById('users').addEventListener('change', e => {
  const current = e.target.value;
  const old = e.target.dataset.value;

  disabled(current);

  // updating the old tree
  syncProfile(old);

  e.target.dataset.value = current;
  prepareProfile();
});
