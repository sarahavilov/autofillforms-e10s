'use strict';

var app = app || require('./firefox/firefox');
var config = config || exports;

config.settings = {
  get types () {
    return app.storage.read('types') || '^(?:(?:text(?:area)?)|(?:select-(?:(?:one)|(?:multiple)))|(?:checkbox)|(?:radio)|(?:email)|(?:url)|(?:number)|(?:month)|(?:week)|(?:tel)|(?:file))$';
  },
  set types (val) {
    app.storage.write('types', val);
  },
  password: {
    get charset () {
      return app.storage.read('password.charset') || 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890';
    },
    set charset (val) {
      app.storage.write('password.charset', val);
    },
    get length () {
      return app.storage.read('password.length') || 12;
    },
    set length (val) {
      app.storage.write('password.length', val);
    }
  }
};

config.profiles = {
  rules: {
    'user-name': {
      'field-rule': '(?:(?:username)|(?:login)|(?:membername))(?!\\w*pass)',
      'site-rule': '(?:)'
    },
    'email': {
      'field-rule': '(?:mail)|(?:id)',
      'site-rule': '(?:)'
    },
    'title': {
      'field-rule': '(?:prefix\\w*name)|(?:name\\w*prefix)|(?:title)',
      'site-rule': '(?:)'
    },
    'gender': {
      'field-rule': '(?:gender)',
      'site-rule': '(?:)'
    },
    'first-name': {
      'field-rule': '(?:first\\w*name)|(?:name\\w*first)',
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
    'full-name': {
      'field-rule': 'name',
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
    'full-street': {
      'field-rule': '(?:street)|(?:addr)',
      'site-rule': '(?:)'
    },
    'city': {
      'field-rule': 'city',
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
    'country-code': {
      'field-rule': '(?:country\\w*code)|(?:phone\\w*country)',
      'site-rule': '(?:)'
    },
    'country': {
      'field-rule': 'country',
      'site-rule': '(?:)'
    },
    'lang': {
      'field-rule': 'lang',
      'site-rule': '(?:)'
    },
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
    'company': {
      'field-rule': 'company',
      'site-rule': '(?:)'
    },
    'occupation': {
      'field-rule': '(?:occupation)|(?:job)',
      'site-rule': '(?:)'
    },
    'phone': {
      'field-rule': '(?:phone)|(?:tel)',
      'site-rule': '(?:)'
    },
    'homepage': {
      'field-rule': '(?:web)|(?:homepage)|(?:www)|(?:url)',
      'site-rule': '(?:)'
    }
  },
  users: {
    'default': {
      'user-name': 'my-user-name',
      'email': 'me@mydomain.com',
      'title': 'Mr.',
      'gender': 'male',
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
      'homepage': 'http://my-home-page.com'
    },
    get list () {
      let users = app.storage.read('users');
      return users ? users.split(', ') : [];
    },
    set list (val) {
      app.storage.write('users', val.join(', '));
    },
    get current () {
      return app.storage.read('current') || 'default';
    },
    set current (val) {
      app.storage.write('current', val);
    }
  }
};

config.profiles.setrule = function (name, obj, del) {
  let rules = JSON.parse(app.storage.read('rules') || '{}');
  rules[name] = obj;
  if (del) {
    delete rules[name];
  }
  app.storage.write('rules', JSON.stringify(rules));
};
config.profiles.getrules = function () {
  let rules = JSON.parse(app.storage.read('rules') || '{}');
  return Object.assign({}, config.profiles.rules, rules);
};

config.profiles.setprofile = function (name, obj) {
  app.storage.write('profile-' + name, JSON.stringify(obj));
};
config.profiles.getprofile = function (name) {
  name = name || config.profiles.users.current;
  let profile = JSON.parse(app.storage.read('profile-' + name) || '{}');
  let exceptions = JSON.parse(app.storage.read('profile-' + name + '-exceptions') || '[]');
  profile = Object.assign({}, config.profiles.users.default, profile);
  exceptions.forEach(name => delete profile[name]);
  return profile;
};
config.profiles.addException = function (name, value) {
  name = name || config.profiles.users.current;
  let pref = 'profile-' + name + '-exceptions';
  let exceptions = JSON.parse(app.storage.read(pref) || '[]');
  exceptions.push(value);
  exceptions = exceptions.filter((n, i, l) => l.indexOf(n) === i);
  app.storage.write(pref, JSON.stringify(exceptions));
};
config.profiles.clearExceptions = function (name) {
  name = name || config.profiles.users.current;
  app.storage.write('profile-' + name + '-exceptions', '[]');
};
config.profiles.getExceptions = function (name) {
  name = name || config.profiles.users.current;
  return JSON.parse(app.storage.read('profile-' + name + '-exceptions') || '[]');
};

config.welcome = {
  get version () {
    return app.storage.read('version');
  },
  set version (val) {
    app.storage.write('version', val);
  },
  timeout: 3,
  get show () {
    return app.storage.read('show') === false ? false : true; // default is true
  },
  set show (val) {
    app.storage.write('show', val);
  }
};
