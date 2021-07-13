/* globals mode, current, defaults */
'use strict';

function change(element) {
  try {
    ['keydown', 'keyup', 'keychange', 'change', 'input'].forEach(name => {
      element.dispatchEvent(new Event(name, {bubbles: true}));
    });
  }
  catch (e) {}
}

function inspect(node) {
  let results = [];

  function one(node) {
    results = results.concat([
      node.value,
      node.placeholder,
      node.tagName === 'SELECT' || node.querySelector('select') ? '' : node.textContent
    ]);
  }
  one(node);
  [...node.parentElement.children].forEach(node => one(node));
  results = results
    .map(s => (s || '').trim())
    .filter((s, i, l) => s && s.length > 3 && l.indexOf(s) === i);

  return results;
}

chrome.storage.local.get({
  current: 'default',
  rules: '{}',
  users: ''
}, prefs => {
  prefs.rules = defaults.utils.getRules(prefs.rules);

  const types = new RegExp(defaults.types);
  let inputs = [];
  const forms = [...document.forms];
  const matrix = new WeakMap();
  const founds = new WeakMap();
  // grab all input elements that are supported by prefs.types
  forms.forEach((form, index) => {
    matrix.set(form, index);
    [...form.querySelectorAll('[name]')].forEach((input, index) => {
      if (types.test(input.type)) {
        inputs.push(input);
        matrix.set(input, index);
      }
    });
    inputs = inputs.filter((e, i, l) => l.indexOf(e) === i);
    // for mode === 'retrieve' only use filled input elements
    if (mode === 'retrieve') {
      inputs = inputs.filter(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
          return input.checked;
        }
        else {
          return input.value;
        }
      });
    }
  });

  if (inputs.length) {
    chrome.runtime.sendMessage({
      cmd: 'get-url'
    }, response => {
      defaults.utils.getProfile(prefs.current, profile => {
        // preparing rule list
        const rules = Object.keys(prefs.rules).filter(name => {// filter rules that match this domain
          const r = new RegExp(prefs.rules[name]['site-rule'], 'i');
          return r.test(response);
        }).reverse() // prioritizing user-defined rules
          .map(name => Object.assign(prefs.rules[name], {name}));

        // inputs find rules part 1
        inputs.forEach(input => {
          for (const rule of rules) {
            const exp = rule['field-rule'];
            if (exp.startsWith('position:')) {
              const index = matrix.get(input);
              const formIndex = matrix.get(input.form);
              if (exp === 'position:' + index + '/' + formIndex || exp === 'position:' + index) {
                console.log('found stage 1/1', exp, input);
                founds.set(input, rule.name);
                break;
              }
            }
            else {
              const r = (new RegExp(exp, 'i'));
              if (r.test(input.name)) {
                console.log('found stage 1/2', exp, input);
                founds.set(input, rule.name);
                break;
              }
            }
          }
        });
        // inputs find rules part 2
        inputs.filter(input => !founds.has(input)).forEach(input => {
          for (const rule of rules) {
            const exp = rule['field-rule'];
            if (!exp.startsWith('position:')) {
              const r = (new RegExp(exp, 'i'));
              const bol = inspect(input).reduce((p, c) => p || r.test(c), false);
              if (bol) {
                // console.log('found stage 2', exp, input);
                founds.set(input, rule.name);
                break;
              }
            }
          }
        });
        // inputs find rules part 3
        inputs.filter(input => !founds.has(input)).forEach(input => {
          for (const rule of rules) {
            const exp = rule['field-rule'];
            if (!exp.startsWith('position:')) {
              const r = (new RegExp(exp, 'i'));
              const bol = inspect(input.parentElement).reduce((p, c) => p || r.test(c), false);
              if (bol) {
                // console.log('found stage 2', exp, input);
                founds.set(input, rule.name);
                break;
              }
            }
          }
        });

        // fill values
        if (mode === 'insert') {
          inputs.filter(input => founds.has(input)).forEach(element => {
            let value = profile[founds.get(element)] || '';

            if (element.type === 'radio') {
              if (
                element.value.toLowerCase() === value.toLowerCase() ||
                element.textContent.toLowerCase() === value.toLowerCase()
              ) {
                element.click();
              }
            }
            else if (element.type === 'checkbox') {
              if (
                element.value.toLowerCase() === value.toLowerCase() ||
                element.textContent.toLowerCase() === value.toLowerCase()
              ) {
                element.checked = true;
              }
              else {
                element.checked = false;
              }
              change(element);
            }
            else if (element.type === 'select-one' || element.type === 'select-multiple') {
              Array.from(element.options).forEach((option, index) => {
                if (
                  option.value.toLowerCase() === value.toLowerCase() ||
                  option.textContent.toLowerCase() === value.toLowerCase()
                ) {
                  element.selectedIndex = index;
                  change(element);
                }
              });
            }
            else {
              // replacing keywords
              const {href, hostname} = new URL(response);
              value = value.
                replace(/_url_/g, href).
                replace(/_host_/g, hostname);
              value = defaults.utils.format(value);

              element.value = value;
              // supporting multi-line input boxes
              try {
                element.selectionStart = element.selectionEnd = value.length;
              }
              catch (e) {}
              change(element);
            }
          });
        }
        else {
          const values = inputs.filter(input => founds.has(input)).map(input => {
            return {
              name: founds.get(input),
              value: input.value
            };
          }).filter(obj => defaults[obj.name] !== obj.value && profile[obj.name] !== obj.value);

          if (values.length || current !== prefs.current) {
            chrome.runtime.sendMessage({
              cmd: 'update-profile',
              current,
              values,
              profile,
              users: prefs.users
            });
          }
        }
      });
    });
  }
});
