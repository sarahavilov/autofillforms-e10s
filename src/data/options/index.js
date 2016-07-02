/* globals background */
'use strict';

var elements = {
  types: document.querySelector('[data-pref="types"]'),
  password: {
    length: document.querySelector('[data-pref="password.length"]'),
    charset: document.querySelector('[data-pref="password.charset"]')
  },
  rules: document.querySelector('#rules tbody'),
  rule: document.querySelector('#rules tbody tr'),
  select: document.querySelector('select'),
  profiles: document.querySelector('#profiles tbody'),
  profile: document.querySelector('#profiles tbody tr'),
  edit: {
    profiles: {
      form: document.getElementById('edit-profiles'),
      name: document.querySelector('#edit-profiles input[data-type=name]'),
      value: document.querySelector('#edit-profiles input[data-type=value]')
    },
    rules: {
      form: document.getElementById('edit-rules'),
      name: document.querySelector('#edit-rules input[data-type=name]'),
      site: document.querySelector('#edit-rules input[data-type=site]'),
      field: document.querySelector('#edit-rules input[data-type=field]')
    },
  }
};

elements.select.addEventListener('change', function () {
  background.send('change-profile', elements.select.value);
});

function profile (obj) {
  while (true) {
    let tr =  elements.profiles.querySelector('tr:nth-child(2)');
    if (tr) {
      tr.parentNode.removeChild(tr);
    }
    else {
      break;
    }
  }
  Object.keys(obj.profile).forEach(function (key) {
    let tr = elements.profile.cloneNode(true);
    if (obj.defaults[key]) {
      tr.classList.add('sticky');
    }
    elements.profiles.appendChild(tr);
    tr.dataset.name = tr.querySelector('td').textContent = key;
    tr.dataset.value = tr.querySelector('td:nth-child(2)').textContent = obj.profile[key];
  });
  elements.edit.profiles.name.value = '';
  elements.edit.profiles.value.value = '';
}

function rules (obj) {
  while (true) {
    let tr =  elements.rules.querySelector('tr:nth-child(2)');
    if (tr) {
      tr.parentNode.removeChild(tr);
    }
    else {
      break;
    }
  }
  obj.rules.forEach(function(rule) {
    let tr = elements.rule.cloneNode(true);
    if (obj.defaults[rule.name]) {
      tr.classList.add('sticky');
    }
    elements.rules.appendChild(tr);
    tr.dataset.name = tr.querySelector('td').textContent = rule.name;
    tr.dataset.site = tr.querySelector('td:nth-child(2)').textContent = rule.site;
    tr.dataset.field = tr.querySelector('td:nth-child(3)').textContent = rule.field;
  });
  elements.edit.rules.name.value = '';
  elements.edit.rules.site.value = '';
  elements.edit.rules.field.value = '';
}

function users (obj) {
  elements.select.textContent = '';
  ['default'].concat(obj.list).forEach(function (user, index) {
    let option = document.createElement('option');
    option.textContent = user;
    elements.select.appendChild(option);
    if (user === obj.current) {
      elements.select.selectedIndex = index;
    }
  });
}

background.receive('password', obj => {
  elements.password.charset.value = obj.charset;
  elements.password.length.value = obj.length;
});
background.receive('types', types => elements.types.value = types);
background.receive('profile', obj => profile(obj));
background.receive('rules', obj => rules(obj));
background.receive('users', obj => users(obj));
background.send('init');

document.addEventListener('click', function (e) {
  let target = e.target;
  let parent = target.parentNode;
  let id = target.parentNode.parentNode.parentNode.dataset.id;

  if (id === 'rules' && parent.dataset.name && parent.dataset.field) {
    elements.edit.rules.name.value = parent.dataset.name;
    elements.edit.rules.field.value = parent.dataset.field;
    elements.edit.rules.site.value = parent.dataset.site;
    elements.edit.rules.field.focus();
  }
  if (id === 'profiles' && parent.dataset.name && parent.dataset.value) {
    elements.edit.profiles.name.value = parent.dataset.name;
    elements.edit.profiles.value.value = parent.dataset.value;
    elements.edit.profiles.value.focus();
  }
});

document.addEventListener('click', function (e) {
  let target = e.target;
  let cmd = target.dataset.cmd;

  if (cmd === 'edit-users') {
    let users = window.prompt('Comma separated list of profiles:', Array.from(elements.select.options).map(e => e.value).join(', '));
    background.send('edit-users', users);
  }
  if (cmd === 'delete-a-rule') {
    background.send('delete-a-rule', target.parentNode.parentNode.dataset.name);
  }
  if (cmd === 'delete-a-value') {
    background.send('delete-a-value', target.parentNode.parentNode.dataset.name);
  }
  if (cmd === 'reset-exceptions') {
    background.send('reset-exceptions');
  }
});

elements.edit.profiles.form.addEventListener('submit', function (e) {
  background.send('add-to-profile', {
    name: elements.edit.profiles.name.value,
    value: elements.edit.profiles.value.value
  });
  e.preventDefault();
});
elements.edit.rules.form.addEventListener('submit', function (e) {
  background.send('add-to-rules', {
    name: elements.edit.rules.name.value,
    site: elements.edit.rules.site.value,
    field: elements.edit.rules.field.value
  });
  e.preventDefault();
});

document.addEventListener('change', function (e) {
  let target = e.target;
  let pref = target.dataset.pref;
  if (pref) {
    background.send(pref, target.value);
  }
});
