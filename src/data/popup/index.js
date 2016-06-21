/* globals background */
'use strict';
var select = document.querySelector('select');

document.addEventListener('click', function (e) {
  let cmd = e.target.dataset.cmd;
  if (cmd) {
    if (cmd === 'fill-forms') {
      background.send('fill-forms', select.value);
    }
    else {
      background.send(cmd);
    }
    window.close();
  }
});


background.receive('show', function (obj) {
  select.innerHTML = '';
  ['default'].concat(obj.list).forEach(function(name, index) {
    let option = document.createElement('option');
    option.textContent = option.value = name;
    select.appendChild(option);
    if (name === obj.current) {
      select.selectedIndex = index;
    }
  });
});
