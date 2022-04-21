// From https://github.com/cho45/String_random.js
self.regtools = {};

self.regtools.gen = function(pattern) {
  if (pattern instanceof RegExp) pattern = pattern.source;

  function processGrouping(pattern) {
    var tree = [];
    var stack = [tree];
    var n = 1;
    while (pattern.length) {
      var chr = pattern.shift();
      if (chr === '\\') {
        var next = pattern.shift();
        if (next === '(' || next === ')') {
          stack[0].push(next);
        }
        else {
          stack[0].push(chr, next);
        }
      }
      else
      if (chr === '(') {
        var inner = [];
        stack[0].push(inner);
        stack.unshift(inner);

        var next = pattern.shift(); // no warnings
        if (next === '?') {
          next = pattern.shift();
          if (next === ':') {
            // just create a group
          }
          else {
            throw "Invalid group";
          }
        }
        else
        if (next === '(' || next === ')') {
          pattern.unshift(next);
        }
        else {
          inner.n = n++;
          inner.push(next);
        }
      }
      else
      if (chr === ')') {
        stack.shift();
      }
      else {
        stack[0].push(chr);
      }
    }

    if (stack.length > 1) throw "missmatch paren";

    return tree;
  }

  function processSelect(tree) {
    var candinates = [
      []
    ];

    while (tree.length) {
      var chr = tree.shift();
      if (chr === '\\') {
        var next = tree.shift();
        if (next === '|') {
          candinates[0].push(next);
        }
        else {
          candinates[0].push(chr, next);
        }
      }
      else
      if (chr === '[') {
        candinates[0].push(chr);
        while (tree.length) {
          chr = tree.shift();
          candinates[0].push(chr);
          if (chr === '\\') {
            var next = tree.shift(); // no warnings
            candinates[0].push(next);
          }
          else
          if (chr === ']') {
            break;
          }
        }
      }
      else
      if (chr === '|') {
        candinates.unshift([]);
      }
      else {
        candinates[0].push(chr);
      }
    }

    for (var i = 0, it;
      (it = candinates[i]); i++) {
      tree.push(it);
      for (var j = 0, len = it.length; j < len; j++) {
        if (it[j] instanceof Array) {
          processSelect(it[j]);
        }
      }
    }

    // 入れ子、 奇数段が pattern 偶数段が candinates,
    return [tree];
  }

  var UPPERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
  var LOWERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
  var DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  var SPACES = [" ", "\n", "\t"];
  var OTHERS = ["!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "`", "{", "|", "}", "~"];
  var ALL = [].concat(UPPERS, LOWERS, DIGITS, " ", OTHERS, ["_"]);

  var CLASSES = {
    'd': DIGITS,
    'D': [].concat(UPPERS, LOWERS, SPACES, OTHERS, ['_']),
    'w': [].concat(UPPERS, LOWERS, DIGITS, ['_']),
    'W': [].concat(SPACES, OTHERS),
    't': ['\t'],
    'n': ['\n'],
    'v': ['\u000B'],
    'f': ['\u000C'],
    'r': ['\r'],
    's': SPACES,
    'S': [].concat(UPPERS, LOWERS, DIGITS, OTHERS, ['_']),
    '0': ['\0']
  };

  var REFERENCE = {};

  function processOthers(tree) {
    var ret = '',
      candinates = [];
    tree = tree.slice(0);

    function choice() {
      var ret = candinates[Math.floor(candinates.length * Math.random())];
      if (ret instanceof Array) {
        ret = processOthers(ret);
      }
      if (candinates.n) REFERENCE[candinates.n] = ret;
      return ret || '';
    }

    while (tree.length) {
      var chr = tree.shift();
      switch (chr) {
      case '^':
      case '$':
        // do nothing
        break;
      case '*':
        for (var i = 0, len = Math.random() * 10; i < len; i++) {
          ret += choice();
        }
        candinates = [];
        break;
      case '+':
        for (var i = 0, len = Math.random() * 10 + 1; i < len; i++) {
          ret += choice();
        }
        candinates = [];
        break;
      case '{':
        var brace = '';
        while (tree.length) {
          chr = tree.shift();
          if (chr === '}') {
            break;
          }
          else {
            brace += chr;
          }
        }

        if (chr !== '}') throw "missmatch brace: " + chr;

        var dd = brace.split(/,/);
        var min = +dd[0];
        var max = (dd.length === 1) ? min : (+dd[1] || 10);
        for (var i = 0, len = Math.floor(Math.random() * (max - min + 1)) + min; i < len; i++) {
          ret += choice();
        }
        candinates = [];
        break;
      case '?':
        if (Math.random() < 0.5) {
          ret += choice();
        }
        candinates = [];

        break;

      case '\\':
        ret += choice();
        var escaped = tree.shift();

        if (escaped.match(/^[1-9]$/)) {
          candinates = [REFERENCE[escaped] || ''];
        }
        else {
          if (escaped === 'b' || escaped === 'B') {
            throw "\\b and \\B is not supported";
          }
          candinates = CLASSES[escaped];
        }

        if (!candinates) candinates = [escaped];

        break;
      case '[':
        ret += choice();

        var sets = [],
          negative = false;
        while (tree.length) {
          chr = tree.shift();
          if (chr === '\\') {
            var next = tree.shift();
            if (CLASSES[next]) {
              sets = sets.concat(CLASSES[next]);
            }
            else {
              sets.push(next);
            }
          }
          else
          if (chr === ']') {
            break;
          }
          else
          if (chr === '^') {
            var before = sets[sets.length - 1];
            if (!before) {
              negative = true;
            }
            else {
              sets.push(chr);
            }
          }
          else
          if (chr === '-') {
            var next = tree.shift(); // no warnings
            if (next === ']') {
              sets.push(chr);
              chr = next;
              break;
            }
            var before = sets[sets.length - 1]; // no warnings
            if (!before) {
              sets.push(chr);
            }
            else {
              for (var i = before.charCodeAt(0) + 1, len = next.charCodeAt(0); i < len; i++) {
                sets.push(String.fromCharCode(i));
              }
            }
          }
          else {
            sets.push(chr);
          }
        }
        if (chr !== ']') throw "missmatch bracket: " + chr;

        if (negative) {
          var neg = {};
          for (var i = 0, len = sets.length; i < len; i++) {
            neg[sets[i]] = true;
          }

          candinates = [];
          for (var i = 0, len = ALL.length; i < len; i++) {
            if (!neg[ALL[i]]) candinates.push(ALL[i]);
          }
        }
        else {
          candinates = sets;
        }
        break;
      case '.':
        ret += choice();
        candinates = ALL;
        break;
      default:
        ret += choice();
        candinates = chr;
      }
    }
    return ret + choice();
  }

  var tree;
  tree = processGrouping(pattern.split(''));
  tree = processSelect(tree);
  return processOthers(tree);
};
