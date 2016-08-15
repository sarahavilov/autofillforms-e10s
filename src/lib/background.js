'use strict';

var app = app || require('./firefox/firefox');
var config = config || require('./config');
var regtools = regtools || require('./regtools');

var EventEmitter = function () {
  this.callbacks = {};
};
EventEmitter.prototype.on = function (name, callback) {
  this.callbacks[name] = this.callbacks[name] || [];
  this.callbacks[name].push(callback);
};
EventEmitter.prototype.emit = function (name, value) {
  (this.callbacks[name] || []).forEach(c => c(value));
};
var trigger = new EventEmitter();

function notify (message) {
  app.notifications.create(null, {
    type: 'basic',
    iconUrl: './data/icons/48.png',
    title: 'AutoFill Forms',
    message
  });
}

function format (value) {
  let tmp = /^\/(.+)\/[gimuy]*$/.exec(value);
  if (tmp && tmp.length) {
    try {
      value = regtools.gen(tmp[1]);
    }
    catch (e) {
      value = e.message || e;
    }
  }
  value = value.split(/(?:\\n)|(?:\<br\>)|(?:\<br\/\>)/).join('\n');
  return value;
}

function contextmenu (name) {
  let value = config.profiles.getprofile()[name] || name;
  value = format(value);
  app.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => tabs.forEach(tab => app.inject.send(tab.id, 'contextmenu', value)));
}

var build = (function () {
  let ids = [];
  return function () {
    ids.forEach(id => app.contextMenus.remove(id));
    ids = [];
    Object.keys(config.profiles.getprofile()).sort().forEach(function (title) {
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
app.popup.receive('fill-forms', function () {
  app.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => tabs.forEach(tab => app.inject.send(tab.id, 'fill', {
    types: config.settings.types,
    profile: config.profiles.users.current
  })));
  app.popup.hide();
});
app.popup.receive('show', () => app.popup.send('show', {
  list: config.profiles.users.list,
  current: config.profiles.users.current
}));
app.popup.receive('generate-password', function () {
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
app.popup.receive('open-bugs', () => {
  app.tabs.create({
    url: 'https://github.com/sarahavilov/autofillforms-e10s'
  });
  app.popup.hide();
});
app.popup.receive('profile', function (name) {
  config.profiles.users.current = name;
  trigger.emit('profile');
});
app.popup.receive('extract-rules', function () {
  let rules = config.profiles.getrules();
  config.profiles.getExceptions().forEach(n => delete rules[n]);

  app.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => tabs.forEach(tab => app.inject.send(tab.id, 'find-rules', {
    type: config.settings.types,
    rules
  })));
  app.popup.hide();
});
app.popup.receive('create-profile', function () {
  let rules = config.profiles.getrules();
  config.profiles.getExceptions().forEach(n => delete rules[n]);
  app.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => tabs.forEach(tab => app.inject.send(tab.id, 'to-profile', {
    types: config.settings.types,
    rules,
    profile: config.profiles.users.current
  })));
  app.popup.hide();
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
trigger.on('users', function () {
  sendUsers();
  sendProfile();
});
app.options.receive('edit-users', (name) => {
  let users = name.split(/\s*\,\s*/);
  users = users.filter((n, i, l) => n && l.indexOf(n) === i && n !== 'default');
  config.profiles.users.list = users;
  config.profiles.users.current = 'default';

  trigger.emit('users');
});
trigger.on('update-profile', function () {
  sendProfile();
  build();
});
trigger.on('add-to-profile', function (obj) {
  let current = obj.profile || config.profiles.users.current;
  let profile = config.profiles.getprofile(current);
  profile[obj.name] = obj.value;
  let tmp = {};
  Object.keys(profile).forEach(function (key) {
    if (profile[key] !== config.profiles.users.default[key]) {
      tmp[key] = profile[key];
    }
  });
  config.profiles.setprofile(current, tmp);
});
app.options.receive('add-to-profile', (obj) => {
  trigger.emit('add-to-profile', obj);
  trigger.emit('update-profile');
});
trigger.on('delete-a-value', function (obj) {
  let current = obj.profile || config.profiles.users.current;
  let profile = config.profiles.getprofile(current);
  let defaults = Object.keys(config.profiles.users.default);
  delete profile[obj.name];
  // deleting a custom rule
  if (defaults.indexOf(obj.name) !== -1) {
    config.profiles.addException(current, obj.name);
  }
  let tmp = {};
  Object.keys(profile).forEach(function (key) {
    if (profile[key] !== config.profiles.users.default[key]) {
      tmp[key] = profile[key];
    }
  });
  config.profiles.setprofile(current, tmp);
});
app.options.receive('delete-a-value', function (name) {
  trigger.emit('delete-a-value', {name});
  sendProfile();
  build();
});
app.options.receive('reset-exceptions', function () {
  config.profiles.clearExceptions(config.profiles.users.current);
  sendProfile();
  build();
});
trigger.on('profile', function () {
  sendUsers();
  sendProfile();
  build();
});
app.options.receive('change-profile', (name) => {
  config.profiles.users.current = name;
  trigger.emit('profile');
});

trigger.on('add-to-rules', function (obj) {
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
});
app.options.receive('add-to-rules', function (obj) {
  trigger.emit('add-to-rules', obj);
  sendRules();
});
app.options.receive('delete-a-rule', function (name) {
  config.profiles.setrule(name, null, true);
  sendRules();
});
app.options.receive('export-all', function () {
  let content = {};
  content.rules = config.profiles.getrules();
  content.profiles = {};
  config.profiles.users.list.concat('default').forEach(function (profile) {
    content.profiles[profile] = {
      exceptions: config.profiles.getExceptions(profile),
      profile: config.profiles.getprofile(profile)
    };
  });
  app.options.send('download', {
    name: 'all',
    content
  });
});
app.options.receive('export-rules', function () {
  let content = {};
  content.rules = config.profiles.getrules();
  content.profiles = {};
  app.options.send('download', {
    name: 'rules',
    content
  });
});
app.options.receive('export-profiles', function () {
  let content = {};
  content.rules = {};
  content.profiles = {};
  config.profiles.users.list.concat('default').forEach(function (profile) {
    content.profiles[profile] = {
      exceptions: config.profiles.getExceptions(profile),
      profile: config.profiles.getprofile(profile)
    };
  });
  app.options.send('download', {
    name: 'profiles',
    content
  });
});
app.options.receive('export-active', function () {
  let content = {};
  content.rules = config.profiles.getrules();
  let exceptions = config.profiles.getExceptions();
  exceptions.forEach(n => delete content.rules[n]);
  content.profiles = {};
  let profile = config.profiles.users.current;
  content.profiles[profile] = {
    exceptions,
    profile: config.profiles.getprofile(profile)
  };

  app.options.send('download', {
    name: 'active-user',
    content
  });
});
app.options.receive('import', function (content) {
  if (!content) {
    return;
  }
  content = JSON.parse(content);
  // update rules
  let rules = content.rules;
  Object.keys(rules).forEach(function (name) {
  trigger.emit('add-to-rules', {
      name,
      site: rules[name]['site-rule'],
      field: rules[name]['field-rule']
    });
  });
  let profiles = content.profiles;
  // add users
  config.profiles.users.list = config.profiles.users.list.concat(Object.keys(profiles))
    .filter((n, i, l) => n && l.indexOf(n) === i && n !== 'default');
  config.profiles.users.current = 'default';
  // update profiles
  Object.keys(profiles).forEach(function (profile) {
    Object.keys(profiles[profile].profile).forEach(function (name) {
      trigger.emit('add-to-profile', {
        profile,
        name,
        value: profiles[profile].profile[name]
      });
    });
    profiles[profile].exceptions.forEach(function (name) {
      trigger.emit('delete-a-value', {
        name,
        profile
      });
    });
  });
  sendUsers();
  sendProfile();
  sendRules();
  build();
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
  inputs.forEach((input, index) => inputs[index].value = format(inputs[index].value));
  app.inject.send(tabID, 'guess', inputs);
});
app.inject.receive('generated-rules', function (tabID, rules) {
  rules.forEach(obj => config.profiles.setrule(obj.name, {
    'site-rule': obj.site || '(?:)',
    'field-rule': obj.field
  }));
  sendRules();
  notify(`${rules.length} rules is added or updated in your rule list`);
});
app.inject.receive('generated-values', function (tabID, obj) {
  let users = config.profiles.users.list.concat(obj.name);
  users = users.filter((n, i, l) => n && l.indexOf(n) === i && n !== 'default');
  config.profiles.users.list = users;
  config.profiles.users.current = obj.name;
  trigger.emit('users');

  let keys = Object.keys(obj.values);
  keys.forEach(k => {
    trigger.emit('add-to-profile', {
      name: k,
      value: obj.values[k]
    });
  });
  trigger.emit('update-profile');
  notify(`${keys.length} values is added or updated for "${obj.name}" profile.`);
});
app.inject.receive('notify', (tabID, msg) => notify(msg));
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
