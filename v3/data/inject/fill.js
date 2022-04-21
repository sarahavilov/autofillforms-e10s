/* globals mode, current, utils, defaults */
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

function grab(target, types) {
  const es = new Set();
  utils.inputs(target, es, types);

  return [...es];
}

chrome.storage.local.get({
  current: 'default',
  rules: '{}',
  users: '',
  detect: defaults.detect // 'forms', 'body'
}, prefs => {
  prefs.rules = utils.getRules(prefs.rules);

  const types = new RegExp(defaults.types);
  let inputs = [];
  const matrix = new WeakMap();
  const founds = new WeakMap();

  if (prefs.detect === 'forms') {
    const forms = [...document.forms];
    // grab all input elements that are supported by prefs.types
    forms.forEach((form, index) => {
      matrix.set(form, index);
      grab(form, types).forEach((input, index) => {
        inputs.push(input);
        matrix.set(input, index);
      });
    });
  }
  if (inputs.length === 0 || prefs.detect === 'body') {
    grab(document.body, types).forEach((input, index) => {
      inputs.push(input);
      matrix.set(input, index);
    });
  }

  // filtering
  inputs = inputs.filter((e, i, l) => l.indexOf(e) === i);
  // for mode === 'retrieve' only use filled input elements
  if (mode === 'retrieve') {
    inputs = inputs.filter(input => {
      if (input.type === 'radio') {
        return input.checked;
      }
      else if (input.type === 'checkbox') {
        return true; // so that we can update unchecked inputs too
      }
      else {
        return input.value;
      }
    });
  }

  if (inputs.length) {
    chrome.runtime.sendMessage({
      cmd: 'get-url'
    }, response => {
      utils.getProfile(prefs.current, profile => {
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
                console.info('found stage 1/1', exp, input);
                founds.set(input, rule.name);
                break;
              }
            }
            else {
              const r = (new RegExp(exp, 'i'));
              const name = utils.id(input);
              if (r.test(name)) {
                console.info('found stage 1/2', exp, input);
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
              const r = new RegExp(exp, 'i');
              const bol = inspect(input).reduce((p, c) => p || r.test(c), false);
              if (bol) {
                console.info('found stage 2', exp, input);
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
                console.info('found stage 2', exp, input);
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
              element.checked = Boolean(value);
              // if (
              //   element.value.toLowerCase() === value.toLowerCase() ||
              //   element.textContent.toLowerCase() === value.toLowerCase()
              // ) {
              //   element.checked = true;
              // }
              // else {
              //   element.checked = false;
              // }
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
              value = utils.format(value);

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
              value: (input.type === 'checkbox' || input.type === 'radio') ? (input.checked ? input.value : '') : input.value
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
