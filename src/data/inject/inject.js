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
      element.click();
    }
    else if (element.type === 'select-one') {
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
      element.value = input.value;
      element.selectionStart = element.selectionEnd = input.value.length;
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
