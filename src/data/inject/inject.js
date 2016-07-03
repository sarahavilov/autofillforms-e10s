/* globals background */
'use strict';

function change (element) {
  element.dispatchEvent(new Event('change'));
  element.dispatchEvent(new Event('keydown'));
  element.dispatchEvent(new Event('keyup'));
  element.dispatchEvent(new Event('keychange'));
}

/**/
var context = null;

document.addEventListener('contextmenu', function(e) {
  context = e.target;
}, true);
background.receive('contextmenu', function (val) {
  if (context) {
    context.value = val;
    context.selectionStart = context.selectionEnd = val.length;
    change(context);
    context = null;
  }
});

/**/
var inputs = [];

background.receive('guess', function (obj) {
  obj.forEach(function (input) {
    let element = inputs[input.index];
    if (element.type === 'radio') {
      if (
        element.value.toLowerCase() === input.value.toLowerCase() ||
        element.textContent.toLowerCase() === input.value.toLowerCase()
      ) {
        element.click();
      }
    }
    else if (element.type === 'checkbox') {
      if (
        element.value.toLowerCase() === input.value.toLowerCase() ||
        element.textContent.toLowerCase() === input.value.toLowerCase()
      ) {
        element.checked = true;
      }
      else {
        element.checked = false;
      }
      change(element);
    }
    // http://contactform7.com/checkboxes-radio-buttons-and-menus/
    else if (element.type === 'select-one' || element.type === 'select-multiple') {
      Array.from(element.options).forEach(function (option, index) {
        if (
          option.value.toLowerCase() === input.value.toLowerCase() ||
          option.textContent.toLowerCase() === input.value.toLowerCase()
        ) {
          element.selectedIndex = index;
          change(element);
        }
      });
    }
    else {
      // supporting multi-line input boxes
      element.value = (input.value || '').split(/(?:\\n)|(?:\<br\>)|(?:\<br\/\>)/).join('\n');
      try {
        element.selectionStart = element.selectionEnd = input.value.length;
      }
      catch (e) {}
      change(element);
    }
  });
});

background.receive('fill', function (obj) {
  let types = new RegExp(obj.types);
  Array.from(document.forms).forEach(function (form) {
    Array.from(form.querySelectorAll('[name]')).filter(input => types.test(input.type)).forEach(function (input) {
      if (inputs.indexOf(input) === -1) {
        inputs.push(input);
      }
    });
  });
  if (inputs.length) {
    background.send('guess', {
      href: document.location.href,
      profile: obj.profile,
      inputs: inputs.map((input, index) => ({
        name: input.name,
        index
      }))
    });
  }
});
