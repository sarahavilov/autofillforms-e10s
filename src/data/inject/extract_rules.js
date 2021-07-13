/* globals hostname, defaults */
'use strict';

chrome.storage.local.get({
  rules: '{}'
}, prefs => {
  prefs.rules = defaults.utils.getRules(prefs.rules);

  const types = new RegExp(defaults.types);
  // get all input fields
  const inputs = [...document.forms].map(form => {
    return [...form.querySelectorAll('[name]')]
      .filter(input => input.name && types.test(input.type));
  }).flat();
  //
  if (inputs.length) {
    chrome.runtime.sendMessage({
      cmd: 'get-url'
    }, response => {
      // filter inputs that already match with current set of rules
      const rules = inputs.filter(input => {
        const count = Object.keys(prefs.rules)
          .filter(name => {
            const rule = prefs.rules[name];
            const t1 = (new RegExp(rule['site-rule'], 'i')).test(response);
            const t2 = (new RegExp(rule['field-rule'], 'i')).test(input.name);

            return t1 && t2;
          }).length;
        return count === 0;
      }).map(input => { // converting to rules
        return {
          'name': input.name,
          'field': defaults.utils.clean(input.name),
          'site': hostname ? defaults.utils.clean(hostname) : '(?:)'
        };
      });
      if (rules.length) {
        chrome.runtime.sendMessage({
          cmd: 'save-rules',
          rules: {
            new: rules,
            old: prefs.rules
          }
        });
      }
      if (!rules.length && window === window.top) {
        defaults.utils.notify('Cannot find any new rules for this page');
      }
    });
  }
  else if (window === window.top) {
    defaults.utils.notify('There is no input to record on the top frame of the current page!');
  }
});
