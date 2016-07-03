'use strict';

var app = app || require('./firefox/firefox');
var config = config || require('./config');
var regtools = regtools || require('./regtools');

function checkRegExp (value) {
  let tmp = /^\/(.+)\/[gimuy]*$/.exec(value);
  if (tmp && tmp.length) {
    try {
      value = regtools.gen(tmp[1]);
    }
    catch (e) {
      value = e.message || e;
    }
  }
  return value;
}

function contextmenu (name) {
  let value = config.profiles.getprofile()[name] || name;
  value = checkRegExp(value);
  app.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => tabs.forEach(tab => app.inject.send(tab.id, 'contextmenu', value)));
}

var build = (function () {
  let ids = [];
  return function () {
    let exceptions = config.profiles.getExceptions();
    ids.forEach(id => app.contextMenus.remove(id));
    ids = [];
    Object.keys(config.profiles.getrules()).sort()
      .filter(name => exceptions.indexOf(name) === -1)
      .forEach(function (title) {
        ids.push(app.contextMenus.create({
          title,
          contexts: ['editable'],
          onclick: contextmenu.bind(app, title)
        }));
      });
  };
})();

app.timers.setTimeout(build, 3000);
app.storage.on('rules', build);

// popup
app.popup.receive('fill-forms', function (profile) {
  app.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => tabs.forEach(tab => app.inject.send(tab.id, 'fill', {
    types: config.settings.types,
    profile
  })));
  app.popup.hide();
});
app.popup.receive('show', () => app.popup.send('show', {
  list: config.profiles.users.list,
  current: config.profiles.users.current
}));
app.popup.receive('gen-password', function () {
  function gen(charset, length) {
    return Array.apply(null, new Array(length))
      .map(() => charset.charAt(Math.floor(Math.random() * charset.length)))
      .join('');
  }
  app.clipboard.write(gen(config.settings.password.charset, config.settings.password.length));
  app.notifications.create(null, {
    type: 'basic',
    iconUrl: 'data/icons/48.png',
    title: 'AutoFill Forms',
    message: 'a new random password is stored in your clipboard'
  });
  app.popup.hide();
});
app.popup.receive('open-settings', () => {
  app.tabs.create({
    url: app.extension.getURL('data/options/index.html')
  });
  app.popup.hide();
});
app.popup.receive('open-faqs', () => {
  app.tabs.create({
    url: 'http://add0n.com/autofillforms-e10s.html'
  });
  app.popup.hide();
});
app.popup.receive('open-bug', () => {
  app.tabs.create({
    url: 'https://github.com/sarahavilov/autofillforms-e10s'
  });
  app.popup.hide();
});

// inject
app.inject.receive('guess', function (tabID, obj) {
  let _rules = config.profiles.getrules();
  config.profiles.getExceptions().forEach(n => delete _rules[n]);

  let rules = Object.keys(_rules).map(name => ({
    name,
    field: new RegExp(_rules[name]['field-rule'], 'i'),
    site: new RegExp(_rules[name]['site-rule'], 'i')
  }));

  let inputs = obj.inputs.map(function (input) {
    for (let n in rules) {
      if (rules[n].field.test(input.name) && rules[n].site.test(obj.href)) {
        return Object.assign(input, {rule: rules[n].name});
      }
    }
    return null;
  }).filter(input => input);

  // assigning value
  let profile = config.profiles.getprofile(obj.profile);
  inputs.forEach((input, index) => inputs[index].value = profile[input.rule] || input.rule);
  // use String_random.js if value is a regular expression
  inputs.forEach((input, index) => inputs[index].value = checkRegExp(inputs[index].value));
  app.inject.send(tabID, 'guess', inputs);
});

// options
function sendProfile () {
  app.options.send('profile', {
    profile: config.profiles.getprofile(),
    defaults: config.profiles.users.default
  });
}
function sendUsers () {
  app.options.send('users', {
    list: config.profiles.users.list,
    current: config.profiles.users.current
  });
}
function sendRules () {
  let rules = config.profiles.getrules();
  app.options.send('rules', {
    rules: Object.keys(rules).map(name => ({
      site: rules[name]['site-rule'],
      field: rules[name]['field-rule'],
      name
    })),
    defaults: config.profiles.rules
  });
}
function sendPassword () {
  app.options.send('password', config.settings.password);
}
function sendTypes () {
  app.options.send('types', config.settings.types);
}
app.options.receive('init', function () {
  sendPassword();
  sendTypes();
  sendProfile();
  sendUsers();
  sendRules();
});
app.options.receive('password.length', function (num) {
  config.settings.password.length = +num;
  sendPassword();
});
app.options.receive('password.charset', function (val) {
  config.settings.password.charset = val;
  sendPassword();
});
app.options.receive('types', function (types) {
  config.settings.types = types;
  sendTypes();
});
app.options.receive('edit-users', function (name) {
  let users = name.split(/\s*\,\s*/);
  users = users.filter((n, i, l) => n && l.indexOf(n) === i && n !== 'default');
  config.profiles.users.list = users;
  config.profiles.users.current = 'default';
  sendUsers();
  sendProfile();
});
app.options.receive('add-to-profile', function (obj) {
  let current = config.profiles.users.current;
  let profile = config.profiles.getprofile(current);
  profile[obj.name] = obj.value;
  let tmp = {};
  Object.keys(profile).forEach(function (key) {
    if (profile[key] !== config.profiles.users.default[key]) {
      tmp[key] = profile[key];
    }
  });
  config.profiles.setprofile(current, tmp);
  sendProfile();
  build();
});
app.options.receive('delete-a-value', function (name) {
  let current = config.profiles.users.current;
  let profile = config.profiles.getprofile(current);
  let defaults = Object.keys(config.profiles.users.default);
  delete profile[name];
  // deleting a custom rule
  if (defaults.indexOf(name) !== -1) {
    config.profiles.addException(current, name);
  }
  let tmp = {};
  Object.keys(profile).forEach(function (key) {
    if (profile[key] !== config.profiles.users.default[key]) {
      tmp[key] = profile[key];
    }
  });
  config.profiles.setprofile(current, tmp);
  sendProfile();
  build();
});
app.options.receive('reset-exceptions', function () {
  config.profiles.clearExceptions(config.profiles.users.current);
  sendProfile();
  build();
});
app.options.receive('change-profile', function (name) {
  config.profiles.users.current = name;
  sendUsers();
  sendProfile();
  build();
});
app.options.receive('add-to-rules', function (obj) {
  let rules = config.profiles.rules;
  if (rules[obj.name] && rules[obj.name]['site-rule'] === obj.site && rules[obj.name]['field-rule'] === obj.field) {
    config.profiles.setrule(obj.name, null, true);
  }
  else {
    config.profiles.setrule(obj.name, {
      'site-rule': obj.site || '(?:)',
      'field-rule': obj.field
    });
  }
  sendRules();
  build();
});
app.options.receive('delete-a-rule', function (name) {
  config.profiles.setrule(name, null, true);
  sendRules();
  build();
});

/* startup */
app.startup(function () {
  // FAQs page
  let version = config.welcome.version;
  if (app.version !== version) {
    app.timers.setTimeout(function () {
      app.tabs.create({
        url: 'http://add0n.com/autofillforms-e10s.html?v=' + app.version +
        (version ? '&p=' + version + '&type=upgrade' : '&type=install')
      });
      config.welcome.version = app.version;
    }, config.welcome.timeout);
  }
});
