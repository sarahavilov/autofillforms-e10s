/* globals background, app */
'use strict';

function change (element) {
  element.dispatchEvent(new Event('change'));
  element.dispatchEvent(new Event('keydown'));
  element.dispatchEvent(new Event('keyup'));
  element.dispatchEvent(new Event('keychange'));
}

/**/
var context = null;
(function (callback) {
  try {
    document.addEventListener('contextmenu', callback, true);
    app.unload(() => {
      try {
        document.removeEventListener('contextmenu', callback);
      }
      catch (e) {}
    });
  }
  catch (e) {}
})(function (e) {
  context = e.target;
});

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
    if (!element) {
      return;
    }
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
      // replacing keywords
      element.value = input.value.
        replace(/\_url\_/g, document.location.href).
        replace(/\_host\_/g, document.location.hostname);
      // supporting multi-line input boxes
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
  let forms = Array.from(document.forms);
  forms.forEach(function (form) {
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
        textContent: input.textContent || input.parentNode.textContent || input.parentNode.parentNode.textContent,
        index,
        formIndex: forms.indexOf(input.closest('form'))
      }))
    });
  }
});

// guess
background.receive('find-rules', function (obj) {
  let types = new RegExp(obj.types);
  let rules = [];
  Array.from(document.forms).forEach(function (form) {
    Array.from(form.querySelectorAll('[name]'))
    .filter(input => types.test(input.type))
    // checkbox
    .filter(input => input.type === 'checkbox' ? input.checked : true)
    // textbox
    .filter(input => input.type === 'text' ? input.value : true)
    .forEach(function (input) {
      // only add rule is non of existing ones is a match
      let count = Object.keys(obj.rules)
        .filter(name => {
          let rule = obj.rules[name];
          let t1 = (new RegExp(rule['site-rule'], 'i')).test(window.location.href);
          let t2 = (new RegExp(rule['field-rule'], 'i')).test(input.name);

          return t1 && t2;
        }).length;
      if (count === 0) {
        let tmp = {
          name: input.name,
          field: input.name.replace(/([`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/])/gi, '\\$1')
        };
        obj.rules[input.name] = {
          'site-rule': '',
          'field-rule': tmp.field
        };
        rules.push(tmp);
      }
    });
  });
  if (rules.length === 0) {
    return background.send('notify', 'no new rule is detected');
  }
  let site = window.confirm(`Only add rules for this domain (${window.location.host})?`);
  if (site) {
    site = window.location.host.replace(/([`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/])/gi, '\\$1');
  }
  else {
    site = '(?:)';
  }
  rules = rules.map(r => {
    r.site = site;
    return r;
  });
  background.send('generated-rules', rules);
});
background.receive('to-profile', function (obj) {
  let types = new RegExp(obj.types, 'i');
  let names = {};
  Array.from(document.forms).forEach(function (form) {
    Array.from(form.querySelectorAll('[name]'))
    .filter(input => types.test(input.type))
    // checkbox
    .filter(input => input.type === 'checkbox' ? input.checked : true)
    .forEach(function (input) {
      if (input.value) {
        names[input.name] = input.value;
      }
    });
  });
  let href = document.location.href;
  let keys = Object.keys(names);
  if (keys.length === 0) {
    return background.send('notify', 'noting to collect');
  }
  let name = window.prompt('Select a name for your new profile or use an old name to update existing profile?', obj.profile);
  if (!name) {
    return;
  }

  let values = {};
  Object.keys(obj.rules).forEach(function (name) {
    let rule = obj.rules[name];
    if ((new RegExp(rule['site-rule'], 'i')).test(href) === false) {
      return;
    }
    let f = new RegExp(rule['field-rule'], 'i');
    keys.filter(k => f.test(k)).forEach((n) => values[name] = names[n]);
  });
  background.send('generated-values', {
    name,
    values
  });
});
