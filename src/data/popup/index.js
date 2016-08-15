/* globals background */
'use strict';
var select = document.querySelector('select');
var profile = document.getElementById('profile');

document.addEventListener('click', function (e) {
  let cmd = e.target.dataset.cmd;
  if (cmd) {
    background.send(cmd);
    window.close();
  }
});
// select
(function (callback) {
  let old = select.value;
  function check () {
    let value = select.value;
    if (value !== old) {
      old = value;
      callback(value);
    }
  }
  select.addEventListener('change', check);
  select.addEventListener('click', check);
})(function (value) {
  console.error(value);
  background.send('profile', value);
  profile.textContent = value;
});

background.receive('show', function (obj) {
  select.textContent = '';
  ['default'].concat(obj.list).forEach(function(name, index) {
    let option = document.createElement('option');
    option.textContent = option.value = name;
    select.appendChild(option);
    if (name === obj.current) {
      select.selectedIndex = index;
      profile.textContent = name;
    }
  });
});
