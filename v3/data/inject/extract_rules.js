/* globals hostname, defaults, utils */
'use strict';

chrome.storage.local.get({
  rules: '{}',
  detect: 'body'
}, prefs => {
  prefs.rules = utils.getRules(prefs.rules);

  const types = new RegExp(defaults.types);
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
        const count = Object.keys(prefs.rules).filter(name => {
          const rule = prefs.rules[name];
          const t1 = (new RegExp(rule['site-rule'], 'i')).test(response);
          const t2 = (new RegExp(rule['field-rule'], 'i')).test(input.name || input.id);

          return t1 && t2;
        }).length;
        if (count === 0) {
          // converting to rules
          const name = utils.id(input);

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
