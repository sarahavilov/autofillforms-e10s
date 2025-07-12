/* global defaults, regtools */
{
  const utils = {};
  self.utils = utils;

  utils.getProfile = (name, callback) => {
    if (name) {
      const pname = 'profile-' + name;
      const ename = 'profile-' + name + '-exceptions';

      const next = apfs => {
        let profile = JSON.parse(apfs[pname]);
        const exceptions = JSON.parse(apfs[ename]);
        profile = Object.assign({}, defaults.profile, profile);
        exceptions.forEach(name => delete profile[name]);

        callback(profile);
      };

      // since this is called inside page and chrome does not allow chrome.storage.session on the page context
      if (name.includes('tmp::')) {
        chrome.runtime.sendMessage({
          cmd: 'read.session.storage',
          prefs: {
            [pname]: '{}',
            [ename]: '[]'
          }
        }, next);
      }
      else {
        chrome.storage.local.get({
          [pname]: '{}',
          [ename]: '[]'
        }, next);
      }
    }
    else {
      chrome.storage.local.get({
        current: 'default'
      }, prefs => utils.getProfile(prefs.current, callback));
    }
  };

  utils.storeProfile = (name, profile, callback = function() { }) => {
    const names = Object.keys(profile);
    const prefs = {
      ['profile-' + name + '-exceptions']: JSON.stringify(
        Object.keys(defaults.profile).filter(name => names.indexOf(name) === -1)
      ),
      ['profile-' + name]: JSON.stringify(
        names.filter(name => profile[name] !== '' && profile[name] !== defaults.profile[name]).reduce((p, c) => {
          p[c] = profile[c];
          return p;
        }, {})
      )
    };
    chrome.storage[name && name.includes('tmp::') ? 'session' : 'local'].set(prefs, callback);
  };

  utils.getUsers = sUsers => sUsers.split(', ').concat('default').filter(n => n);

  utils.addUser = (name, users, callback = function() { }) => {
    users = [...users.split(', '), name]
      .filter((n, i, l) => n && l.indexOf(n) === i && n !== 'default')
      .sort()
      .join(', ');
    chrome.storage.local.set({
      users
    }, callback);
  };

  utils.getRules = sRules => {
    const rules = JSON.parse(sRules);
    return Object.assign({}, defaults.rules, rules);
  };

  utils.cleanDB = callback => {
    chrome.storage.local.get(null, prefs => {
      const users = utils.getUsers(prefs.users || '');

      const profiles = Object.keys(prefs)
        .filter(n => n.startsWith('profile-'))
        .map(n => n.replace('profile-', '').replace('-exceptions', ''))
        .filter((n, i, l) => l.indexOf(n) === i)
        .filter(n => users.indexOf(n) === -1)
        .map(name => ['profile-' + name, 'profile-' + name + '-exceptions'])
        .reduce((a, b) => a.concat(b), []); // flatten
      chrome.storage.local.remove(profiles, callback);
    });
  };

  utils.notify = message => {
    if (chrome.notifications) {
      chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: '/data/icons/48.png',
        title: 'AutoFill Forms',
        message
      }, id => {
        setTimeout(() => chrome.notifications.clear(id), 5000);
      });
    }
    else {
      chrome.runtime.sendMessage({
        cmd: 'notify',
        message
      }, () => chrome.runtime.lastError);
    }
  };

  utils.clean = str => {
    return str.replace(/([`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/])/gi, '\\$1').replace(/\\{3,}/g, '\\\\');
  };

  utils.format = value => {
    const tmp = /^\/(.+)\/[gimuy]*$/.exec(value);
    if (tmp && tmp.length) {
      try {
        value = regtools.gen(tmp[1]);
      }
      catch (e) {
        value = e.message || e;
      }
    }
    value = value.split(/(?:\\n)|(?:<br>)|(?:<br\/>)/).join('\n');
    return value;
  };


  utils.id = e => {
    const checks = ['data-automation-id', 'name', 'id', 'value']; // order is important
    const root = e.closest('form') || document.body;

    // match based on the first distinguishable property
    for (let n = 0; n < checks.length; n += 1) {
      const check = checks[n];
      try {
        let v;
        if (check === 'value') {
          if (e.type && ['radio', 'checkbox', 'select-one', 'select-multiple'].includes(e.type)) {
            return e.value;
          }
        }
        else {
          v = e.getAttribute(check);
        }
        if (v) {
          const m = root.querySelector(`[${check}="${v}"]`);
          if (m === e) {
            return v;
          }
        }
      }
      catch (e) { }
    }

    if (e.placeholder) {
      return e.placeholder.replace(/\s/g, '_');
    }

    for (const check of checks) {
      const v = e.getAttribute(check);
      if (v) {
        return v;
      }
    }

    return (
      e.getAttribute('data-automation-id') ||
      e.name ||
      e.id ||
      e.placeholder.replace(/\s/g, '_')
    );
  };
  utils.inputs = (target, inputs, types) => {
    for (const e of target.querySelectorAll('[data-automation-id], [name]')) {
      if (e.disabled || e.readOnly) {
        continue;
      }
      if (types.test(e.type)) {
        inputs.add(e);
      }
    }

    for (const e of target.querySelectorAll('input, textarea, select')) {
      if (e.disabled || e.readOnly) {
        continue;
      }
      if (utils.id(e) && types.test(e.type)) {
        inputs.add(e);
      }
    }
  };
}

// eslint-disable-next-line semi
'' // Firefox cloning issue
