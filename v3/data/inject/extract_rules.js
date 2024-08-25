/* globals hostname, defaults, utils */
'use strict';

chrome.storage.local.get({
  rules: '{}',
  detect: 'body',
  types: defaults.types
}, prefs => {
  prefs.rules = utils.getRules(prefs.rules);

  const types = new RegExp(prefs.types);
  // get all input fields
  const inputs = new Set();

  if (prefs.detect === 'forms') {
    [...document.forms].forEach(f => {
      utils.inputs(f, inputs, types);
    });
  }

  if (inputs.size === 0 || prefs.detect === 'body') {
    utils.inputs(document.body, inputs, types);
  }

  //
  if (inputs.size) {
    chrome.runtime.sendMessage({
      cmd: 'get-url'
    }, response => {
      // filter inputs that already match with current set of rules
      const rules = [];
      for (const input of inputs) {
        const name = utils.id(input);

        const matches = Object.values(prefs.rules).map(rule => {
          const t1 = (new RegExp(rule['site-rule'], 'i')).test(response);
          if (t1) {
            const r = new RegExp(rule['field-rule'], 'i');
            const t2 = r.test(name);
            if (t2) {
              // does this rule match another element on this page
              const count = [...inputs].filter(e => r.test(utils.id(e))).length;

              if (count === 1) {
                return true;
              }
              else {
                if (utils.clean(name) === rule['field-rule']) {
                  return true;
                }
                else {
                  return {name, r, count};
                }
              }
            }
          }
          else {
            return false;
          }
        }).filter(a => a);

        // add a new rule if there is no match or there is no exact match
        if (matches.length === 0 || matches.some(a => a === true) === false) {
          // converting to rules
          rules.push({
            'name': name,
            'field': utils.clean(name),
            'site': hostname ? utils.clean(hostname) : '(?:)'
          });
        }
      }

      if (rules.length) {
        chrome.runtime.sendMessage({
          cmd: 'save-rules',
          rules: {
            new: rules,
            old: prefs.rules
          }
        }, () => chrome.runtime.lastError);
      }
      if (!rules.length && window === window.top) {
        utils.notify('Cannot find any new rules for this page');
      }
    });
  }
  else if (window === window.top) {
    utils.notify('There is no input to record on the top frame of the current page!');
  }
});
