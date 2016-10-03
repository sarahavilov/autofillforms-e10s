/* globals background, Fuse */
'use strict';
var select = document.querySelector('select');
var profile = document.getElementById('profile');
var search = document.getElementById('search');

var fuse = {
  search: function () {
    return [0];
  }
};

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
  background.send('profile', value);
  profile.textContent = value;
});

background.receive('show', function (obj) {
  select.textContent = '';
  let list = ['default'].concat(obj.list);
  fuse = new Fuse(list);
  list.forEach(function(name, index) {
    let option = document.createElement('option');
    option.textContent = option.value = name;
    select.appendChild(option);
    if (name === obj.current) {
      select.selectedIndex = index;
      profile.textContent = name;
    }
  });
});

search.addEventListener('keypress', function () {
  let index = fuse.search(search.value)[0] || 0;
  let value = fuse.list[index];
  background.send('profile', value);
  profile.textContent = value;
});
