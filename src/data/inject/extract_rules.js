/* globals hostname, defaults */
'use strict';

chrome.storage.local.get({
  rules: '{}'
}, prefs => {
  prefs.rules = defaults.utils.getRules(prefs.rules);

  let types = new RegExp(defaults.types);
  // get all input fields
  let inputs = [...document.forms].map(form => {
    return [...form.querySelectorAll('[name]')]
      .filter(input => input.name && types.test(input.type));
  })
  // flatten
  .reduce((a, b) => a.concat(b));
  //
  if (inputs.length) {
    chrome.runtime.sendMessage({
      cmd: 'get-url'
    }, response => {
      // filter inputs that already match with current set of rules
      let rules = inputs.filter(input => {
        let count = Object.keys(prefs.rules)
          .filter(name => {
            let rule = prefs.rules[name];
            let t1 = (new RegExp(rule['site-rule'], 'i')).test(response);
            let t2 = (new RegExp(rule['field-rule'], 'i')).test(input.name);

            return t1 && t2;
          }).length;
        return count === 0;
      })
      // converting to rules
      .map(input => {
        return {
          'name': input.name,
          'field': defaults.utils.clean(input.name),
          'site': hostname ? defaults.utils.clean(hostname) : '(?:)'
        };
      });
      if (rules.length) {
        window.top.postMessage({
          cmd: 'save-rules',
          rules: {
            new: rules,
            old: prefs.rules
          }
        }, '*');
      }
      if (!rules.length && window === window.top) {
        defaults.utils.notify('Cannot find any new rules for this page');
      }
    });
  }
  else if (window === window.top) {
    defaults.utils.notify('There is no input at top frame of this page');
  }
});
