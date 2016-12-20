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
  users: document.querySelector('.profile-container'),
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

var activeElement;
document.addEventListener('transitionend', (e) => {
  e.target.classList.remove('highlight');
}, false);

function isVisisble (el) {
  let elemTop = el.getBoundingClientRect().top;
  let elemBottom = el.getBoundingClientRect().bottom;

  return (elemTop >= 0) && (elemBottom <= window.innerHeight);
}

function highlight () {
  try {
    let element = elements[activeElement.id].querySelector(`[data-name="${activeElement.name}"]`);
    element.classList.add('highlight');
    if (!isVisisble(element)) {
      element.scrollIntoView();
    }
  }
  catch (e) {}
}

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
  highlight();
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
  highlight();
}

function users (obj) {
  // clean up
  while(elements.users.children.length > 2) {
    elements.users.removeChild(elements.users.children[1]);
  }
  elements.users.children[0].querySelectorAll('input').forEach(i => i.disabled = false);
  elements.users.children[0].dataset.default = false;
  // generate
  obj.list.forEach(function (user, index) {
    let div = elements.users.children[0].cloneNode(true);
    let span = div.querySelector('span');
    div.dataset.name = span.textContent = span.title = user;
    if (user === obj.current) {
      div.dataset.default = true;
    }
    elements.users.insertBefore(div, elements.users.children[index + 1]);
  });
  // do not allow delete and rename on the default profile
  if (obj.current === 'default') {
    elements.users.children[0].dataset.default = true;
  }
  elements.users.children[0].querySelectorAll('input').forEach(i => i.disabled = i.dataset.cmd !== 'duplicate-a-user');
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
    elements.edit.rules.field.select();
    activeElement = {
      id,
      name: parent.dataset.name
    };
  }
  else if (id === 'profiles' && parent.dataset.name && parent.dataset.value) {
    elements.edit.profiles.name.value = parent.dataset.name;
    elements.edit.profiles.value.value = parent.dataset.value;
    elements.edit.profiles.value.focus();
    elements.edit.profiles.value.select();
    activeElement = {
      id,
      name: parent.dataset.name
    };
  }
});

document.addEventListener('click', function (e) {
  let target = e.target;
  let cmd = target.dataset.cmd;

  if (cmd === 'delete-a-rule') {
    background.send('delete-a-rule', target.parentNode.parentNode.dataset.name);
  }
  else if (cmd === 'delete-a-value') {
    background.send('delete-a-value', target.parentNode.parentNode.dataset.name);
  }
  else if (cmd === 'add-a-user') {
    let user = window.prompt('Select a new for your new profile');
    if (user) {
      background.send('add-a-user', user);
    }
  }
  else if (cmd === 'change-profile') {
    background.send('change-profile', e.target.dataset.name);
  }
  else if (cmd === 'delete-a-user') {
    let name = target.parentNode.parentNode.dataset.name;
    if (window.confirm('Are you sure you want to delete "' + name + '" profile?')) {
      background.send('delete-a-user', name);
    }
  }
  else if (cmd === 'rename-a-user') {
    let oldname = target.parentNode.parentNode.dataset.name;
    let newname = window.prompt('Select a new name for "' + oldname + '" profile', oldname);
    if (newname && newname !== oldname) {
      background.send('rename-a-user', {oldname, newname});
    }
  }
  else if (cmd === 'duplicate-a-user') {
    let name = target.parentNode.parentNode.dataset.name;
    background.send('duplicate-a-user', name);
  }
  else {
    background.send(cmd);
  }
});
document.addEventListener('change', function (e) {
  let target = e.target;
  let files = target.files;
  if (files && files.length) {
    let reader = new FileReader();
    reader.onload = function () {
      background.send(target.dataset.cmd, reader.result);
      target.value = '';
    };
    reader.readAsText(files[0]);
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

background.receive('download', function (obj) {
  let a = document.createElement('a');
  a.download = 'AutoFill-Forms-Exported-' + obj.name + '-' + (new Date()).toLocaleString().replace(/[\s\:\/]/g, '-').replace(',', '') + '.json';
  document.body.appendChild(a);
  let blob = new Blob([JSON.stringify(obj.content, null, 2)], {type : 'application/json'});
  let reader = new FileReader();
  reader.onload = function () {
    a.href = reader.result;
    a.click();
    a.parentNode.removeChild(a);
  };
  reader.readAsDataURL(blob);
});
