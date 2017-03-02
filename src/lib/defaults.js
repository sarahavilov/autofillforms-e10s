/* globals regtools */
'use strict';

var defaults = {
  'password.charset': 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
  'password.length': 12,
  'types': '^(?:(?:text(?:area)?)|(?:select-(?:(?:one)|(?:multiple)))|(?:checkbox)|(?:radio)|(?:email)|(?:url)|(?:number)|(?:month)|(?:week)|(?:tel)|(?:file))$'
};

defaults.profile = {
  'user-name': 'my-user-name',
  'email': 'me@mydomain.com',
  'title': 'Mr.',
  'gender': 'male',
  'age': '30',
  'first-name': 'my first name',
  'middle-name': 'my middle name',
  'last-name': 'my last name',
  'name-suffix': 'my name suffix',
  'full-name': 'my full name',
  'street-line-1': 'street address line number one',
  'street-line-2': 'street address line number two',
  'street-line-3': 'street address line number three',
  'full-street': 'full street address',
  'city': 'city name',
  'state': 'state name',
  'zip-code': 'zip code or postal code',
  'country-code': 'US',
  'country': 'country name',
  'lang': 'language',
  'birth-day-type-1': '1',
  'birth-day-type-2': '01',
  'birth-month-number-type-1': '1',
  'birth-month-number-type-2': '01',
  'birth-month-string': 'January',
  'birth-year': '1971',
  'company': 'company name',
  'occupation': 'occupation',
  'phone': '(123) 456-7890',
  'homepage': 'http://my-home-page.com',
  'comment': 'this is a comment'
};

defaults.rules = {
  'birth-day-type-1': {
    'field-rule': '(?:dd)|(?:bday)|(?:birth\\w?day)|(?:dob\\w?day)|(?:birth\\w*1)',
    'site-rule': '(?:)'
  },
  'birth-day-type-2': {
    'field-rule': '(?:dd)|(?:bday)|(?:birth\\w?day)|(?:dob\\w?day)|(?:birth\\w*1)',
    'site-rule': '(?:)'
  },
  'birth-month-number-type-1': {
    'field-rule': '(?:mm)|(?:bmon)|(?:birth\\w?mon)|(?:dob\\w?mon)|(?:birth\\w*2)',
    'site-rule': '(?:)'
  },
  'birth-month-number-type-2': {
    'field-rule': '(?:mm)|(?:bmon)|(?:birth\\w?mon)|(?:dob\\w?mon)|(?:birth\\w*2)',
    'site-rule': '(?:)'
  },
  'birth-month-string': {
    'field-rule': '(?:mm)|(?:bmon)|(?:birth\\w?mon)|(?:dob\\w?mon)|(?:birth\\w*2)',
    'site-rule': '(?:)'
  },
  'birth-year': {
    'field-rule': '(?:yy)|(?:byear)|(?:birth\\w?year)|(?:dob\\w?year)|(?:birth\\w*3)',
    'site-rule': '(?:)'
  },

  'full-street': {
    'field-rule': '(?:street)|(?:addr)',
    'site-rule': '(?:)'
  },

  'full-name': {
    'field-rule': 'name',
    'site-rule': '(?:)'
  },


  'state': {
    'field-rule': '(?:state)|(?:prov)|(?:region)',
    'site-rule': '(?:)'
  },
  'zip-code': {
    'field-rule': '(?:zip)|(?:post\\w*code)',
    'site-rule': '(?:)'
  },

  'user-name': {
    'field-rule': '(?:(?:username)|(?:login)|(?:membername))(?!\\w*pass)',
    'site-rule': '(?:)'
  },
  'title': {
    'field-rule': '(?:prefix\\w*name)|(?:name\\w*prefix)|(?:title)',
    'site-rule': '(?:)'
  },
  'gender': {
    'field-rule': '(?:gender)|(?:sex)',
    'site-rule': '(?:)'
  },

  'lang': {
    'field-rule': 'lang',
    'site-rule': '(?:)'
  },
  'age': {
    'field-rule': 'age',
    'site-rule': '(?:)'
  },

  'occupation': {
    'field-rule': '(?:occupation)|(?:job)',
    'site-rule': '(?:)'
  },
  'phone': {
    'field-rule': '(?:phone)|(?:tel)|(?:phon)',
    'site-rule': '(?:)'
  },

  'comment': {
    'field-rule': '(?:commnt)|(?:comment)|(?:description)',
    'site-rule': '(?:)'
  },

  'first-name': {
    'field-rule': '(?:first\\w*name)|(?:frst\\w*name)|(?:name\\w*first)',
    'site-rule': '(?:)'
  },
  'middle-name': {
    'field-rule': '(?:middle\\w*name)|(?:name\\w*middle)',
    'site-rule': '(?:)'
  },
  'last-name': {
    'field-rule': '(?:last\\w*name)|(?:name\\w*last)',
    'site-rule': '(?:)'
  },

  'name-suffix': {
    'field-rule': '(?:suffix\\w*name)|(?:name\\w*suffix)',
    'site-rule': '(?:)'
  },

  'email': {
    'field-rule': '(?:mail)',
    'site-rule': '(?:)'
  },

  'street-line-1': {
    'field-rule': '(?:(?:street)|(?:addr))\\w*1',
    'site-rule': '(?:)'
  },
  'street-line-2': {
    'field-rule': '(?:(?:street)|(?:addr))\\w*2',
    'site-rule': '(?:)'
  },
  'street-line-3': {
    'field-rule': '(?:(?:street)|(?:addr))\\w*3',
    'site-rule': '(?:)'
  },
  'city': {
    'field-rule': 'city',
    'site-rule': '(?:)'
  },
  'country-code': {
    'field-rule': '(?:country\\w*code)|(?:phone\\w*country)',
    'site-rule': '(?:)'
  },
  'country': {
    'field-rule': 'country',
    'site-rule': '(?:)'
  },

  'company': {
    'field-rule': 'company',
    'site-rule': '(?:)'
  },
  'homepage': {
    'field-rule': '(?:web)|(?:homepage)|(?:www)|(?:url)',
    'site-rule': '(?:)'
  }
};

defaults.utils = {
  getProfile: (name, callback) => {
    if (name) {
      let pname = 'profile-' + name;
      let ename = 'profile-' + name + '-exceptions';
      chrome.storage.local.get({
        [pname]: '{}',
        [ename]: '[]'
      }, apfs => {
        let profile = JSON.parse(apfs[pname]);
        let exceptions = JSON.parse(apfs[ename]);
        profile = Object.assign({}, defaults.profile, profile);
        exceptions.forEach(name => delete profile[name]);

        callback(profile);
      });
    }
    else {
      chrome.storage.local.get({
        current: 'default'
      }, prefs => defaults.utils.getProfile(prefs.current, callback));
    }
  },
  storeProfile: (name, profile, callback = function () {}) => {
    let names = Object.keys(profile);
    let prefs = {
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
    chrome.storage.local.set(prefs, callback);
  },
  addUser: (name, users, callback = function () {}) => {
    users = users.split(', ')
      .filter((n, i, l) => n && l.indexOf(n) === i && n !== 'default')
      .join(', ')
      .sort();
    chrome.storage.local.set({
      users
    }, callback);
  },
  getUsers: (sUsers) => sUsers.split(', ').concat('default').filter(n => n),
  getRules: (sRules) => {
    let rules = JSON.parse(sRules);
    return Object.assign({}, defaults.rules, rules);
  },
  cleanDB: (callback) => {
    chrome.storage.local.get(null, prefs => {
      let users = defaults.utils.getUsers(prefs.users || '');

      let profiles = Object.keys(prefs)
        .filter(n => n.startsWith('profile-'))
        .map(n => n.replace('profile-', '').replace('-exceptions', ''))
        .filter((n, i, l) => l.indexOf(n) === i)
        .filter(n => users.indexOf(n) === -1)
        .map(name => ['profile-' + name, 'profile-' + name + '-exceptions'])
          // flatten
        .reduce((a, b) => a.concat(b), []);
      chrome.storage.local.remove(profiles, callback);
    });
  },
  notify: message => {
    if (chrome.notifications) {
      chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: '/data/icons/48.png',
        title: 'AutoFill Forms',
        message
      });
    }
    else {
      chrome.runtime.sendMessage({
        cmd: 'notify',
        message
      });
    }
  },
  clean: (str) => {
    return str.replace(/([`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/])/gi, '\\$1').replace(/\\{3,}/g, '\\\\');
  },
  format: (value) => {
    let tmp = /^\/(.+)\/[gimuy]*$/.exec(value);
    if (tmp && tmp.length) {
      try {
        value = regtools.gen(tmp[1]);
      }
      catch (e) {
        value = e.message || e;
      }
    }
    value = value.split(/(?:\\n)|(?:<br\>)|(?:<br\/\>)/).join('\n');
    return value;
  }
};
