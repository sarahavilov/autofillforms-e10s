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
select.addEventListener('click', function () {
  background.send('profile', this.value);
  profile.textContent = this.value;
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
