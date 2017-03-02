/* globals defaults */
'use strict';

var context = null;
(function (callback) {
  try {
    document.addEventListener('contextmenu', callback, true);
  }
  catch (e) {}
})(function (e) {
  context = e.target;
});

var lazySave = {
  profile: {
    id: null,
    cache: [],
    save () {
      let values = lazySave.profile.cache.map(r => r.values)
        // flatten
        .reduce((a, b) => a.concat(b));
      console.log(values)
      let profile = values
        .reduce((p, c) => {
          p[c.name] = c.value;
          return p;
        }, lazySave.profile.cache[0].profile);
      let current = lazySave.profile.cache[0].current;
      let users = lazySave.profile.cache[0].users;

      defaults.utils.storeProfile(current, profile, () => {
        defaults.utils.addUser(current, users, () => {
          chrome.storage.local.set({
            current
          }, () => {
            if (values.length) {
              defaults.utils.notify(`${values.length} values is added or updated for "${current}" profile.`);
            }
            lazySave.profile.cache = [];
          });
        });
      });
    }
  },
  rules: {
    id: null,
    cache: [],
    save () {
      let rules = lazySave.rules.cache.map(r => r.rules.new)
        // flatten
        .reduce((a, b) => a.concat(b));
      let length = rules.map(r => r.name).filter((n, i, l) => l.indexOf(n) === i).length;

      rules = rules.reduce((p, c) => {
        p[c.name] = {
          'site-rule': c.site,
          'field-rule': c.field
        };
        return p;
      }, lazySave.rules.cache[0].rules.old);

      chrome.storage.local.set({
        rules: JSON.stringify(rules)
      }, () => {
        defaults.utils.notify(`${length} rules is added or updated in your rule list`);
      });
    }
  }
};

window.addEventListener('message', e => {
  if (e.data.cmd === 'update-profile') {
    lazySave.profile.cache.push(e.data);
    window.clearTimeout(lazySave.profile.id);
    lazySave.profile.id = window.setTimeout(lazySave.profile.save, 1000);
  }
  else if (e.data.cmd === 'save-rules') {
    lazySave.rules.cache.push(e.data);
    window.clearTimeout(lazySave.rules.id);
    lazySave.rules.id = window.setTimeout(lazySave.rules.save, 1000);
  }
});
