(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],5:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":3,"./encode":4}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":7,"punycode":2,"querystring":5}],7:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],8:[function(require,module,exports){
var JSONAPIClient = require('json-api-client');
var config = require('./config');

var apiClient = new JSONAPIClient(config.host + '/api', {
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.api+json; version=1',
}, {
  beforeEveryRequest: function() {
    var auth = require('./auth');
    return auth.checkBearerToken();
  },

  handleError: function(response) {
    var errorMessage;
    if (response instanceof Error) {
      throw response;
    } else if (typeof response.body === 'object') {
      if (response.body.error) {
        errorMessage = response.body.error;
        if (response.body.error_description) {
          errorMessage += ' ' + response.error_description;
        }
      } else if (Array.isArray(response.body.errors)) {
        errorMessage = response.body.errors.map(function(error) {
          if (typeof error.message === 'string') {
            return error.message;
          } else if (typeof error.message === 'object') {
            return Object.keys(error.message).map(function(key) {
              return key + ' ' + error.message[key];
            }).join('\n');
          }
        }).join('\n');
      } else {
        errorMessage = 'Unknown error (bad response body)';
      }
    } else if (response.text.indexOf('<!DOCTYPE') !== -1) {
      // Manually set a reasonable error when we get HTML back (currently 500s will do this).
      errorMessage = [
        'There was a problem on the server.',
        response.req.url,
        response.status,
        response.statusText,
      ].join(' ');
    } else {
      errorMessage = 'Unknown error (bad response)';
    }

    throw new Error(errorMessage);
  }
});

module.exports = apiClient;

},{"./auth":9,"./config":10,"json-api-client":13}],9:[function(require,module,exports){
var JSONAPIClient = require('json-api-client');
var Model = JSONAPIClient.Model;
var makeHTTPRequest = JSONAPIClient.makeHTTPRequest;
var config = require('./config');
var apiClient = require('./api-client');

// Use this to override the default API-specific headers.
var JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// We don't want to wait until the token is already expired before refreshing it.
var BEARER_TOKEN_EXPIRATION_ALLOWANCE = 60 * 1000;

module.exports = new Model({
  _currentUserPromise: null,

  _bearerToken: '',
  _bearerTokenExpiration: NaN,
  _refreshToken: '',
  _tokenRefreshPromise: null,

  _getAuthToken: function() {
    console.log('Getting auth token');
    var url = config.host + '/users/sign_in/?now=' + Date.now();
    return makeHTTPRequest('GET', url, null, JSON_HEADERS)
      .then(function(response) {
        var authToken = response.header['x-csrf-token'];
        console.info('Got auth token', authToken.slice(-6));
        return authToken;
      })
      .catch(function(response) {
        console.error('Failed to get auth token');
        apiClient.handleError(response);
      });
  },

  _getBearerToken: function() {
    console.log('Getting bearer token');
    if (this._bearerToken) {
      console.info('Already had a bearer token', this._bearerToken);
      return Promise.resolve(this._bearerToken);
    } else {
      var url = config.host + '/oauth/token';

      var data = {
        'grant_type': 'password',
        'client_id': config.clientAppID,
      };

      return makeHTTPRequest('POST', url, data, JSON_HEADERS)
        .then(function(request) {
          var token = this._handleNewBearerToken(request);
          console.info('Got bearer token', token.slice(-6));
          return token;
        }.bind(this))
        .catch(function(request) {
          // You're probably not signed in.
          console.error('Failed to get bearer token');
          return apiClient.handleError(request);
        });
    }
  },

  _handleNewBearerToken: function(request) {
    var response = JSON.parse(request.text);

    this._bearerToken = response.access_token;
    apiClient.headers.Authorization = 'Bearer ' + this._bearerToken;

    this._bearerTokenExpiration = Date.now() + (response.expires_in * 1000);
    this._refreshToken = response.refresh_token;

    return this._bearerToken;
  },

  _bearerTokenIsExpired: function() {
    return Date.now() >= this._bearerTokenExpiration - BEARER_TOKEN_EXPIRATION_ALLOWANCE;
  },

  _refreshBearerToken: function() {
    if (this._tokenRefreshPromise === null) {
      console.log('Refreshing expired bearer token');

      var url = config.host + '/oauth/token';

      var data = {
        grant_type: 'refresh_token',
        refresh_token: this._refreshToken,
        client_id: config.clientAppID,
      };

      this._tokenRefreshPromise = makeHTTPRequest('POST', url, data, JSON_HEADERS)
        .then(function(request) {
          var token = this._handleNewBearerToken(request);
          console.info('Refreshed bearer token', token.slice(-6));
        }.bind(this))
        .catch(function(request) {
          console.error('Failed to refresh bearer token');
          apiClient.handleError(request);
        })
        .then(function() {
          this._tokenRefreshPromise = null;
        }.bind(this));
    }

    return this._tokenRefreshPromise;
  },

  _deleteBearerToken: function() {
    this._bearerToken = '';
    delete apiClient.headers.Authorization;
    this._bearerTokenExpiration = NaN;
    this._refreshToken = '';
    console.log('Deleted bearer token');
  },

  _getSession: function() {
    console.log('Getting session');
    return apiClient.get('/me')
      .then(function(users) {
        var user = users[0];
        console.info('Got session', user.login, user.id);
        return user;
      })
      .catch(function(error) {
        console.error('Failed to get session');
        throw error;
      });
  },

  register: function(given) {
    var originalArguments = arguments;
    return this.checkCurrent().then(function(user) {
      if (user) {
        return this.signOut().then(function() {
          return this.register.apply(this, originalArguments);
        }.bind(this));
      } else {
        console.log('Registering new account', given.login);
        var registrationRequest = this._getAuthToken().then(function(token) {
          var data = {
            authenticity_token: token,
            user: {
              login: given.login,
              email: given.email,
              password: given.password,
              credited_name: given.credited_name,
              global_email_communication: given.global_email_communication,
              project_id: given.project_id,
              beta_email_communication: given.beta_email_communication,
              project_email_communication: given.project_email_communication,
            },
          };

          // This URL is outside the API, but it actually returns a JSON-API response, so handle it with the client.
          return apiClient.post('/../users', data, JSON_HEADERS)
            .then(function() {
              return this._getBearerToken().then(function() {
                return this._getSession().then(function(user) {
                  console.info('Registered account', user.login, user.id);
                  return user;
                });
              }.bind(this));
            }.bind(this))
            .catch(function(error) {
              console.error('Failed to register');
              throw error;
            });
        }.bind(this));

        this.update({
          _currentUserPromise: registrationRequest.catch(function() {
            return null;
          }),
        });

        return registrationRequest;
      }
    }.bind(this));
  },

  checkCurrent: function() {
    if (!this._currentUserPromise) {
      console.log('Checking current user');
      this.update({
        _currentUserPromise: this._getBearerToken()
          .then(function() {
            return this._getSession();
          }.bind(this))
          .catch(function() {
            // Nobody's signed in. This isn't an error.
            console.info('No current user');
            return null;
          }),
      });
    }

    return this._currentUserPromise;
  },

  checkBearerToken: function() {
    var awaitBearerToken;
    if (this._bearerTokenIsExpired()) {
      awaitBearerToken = this._refreshBearerToken();
    } else {
      awaitBearerToken = Promise.resolve(this._bearerToken);
    }
    return awaitBearerToken;
  },

  signIn: function(credentials) {
    var originalArguments = arguments;
    return this.checkCurrent().then(function(user) {
      if (user) {
        return this.signOut().then(function() {
          return this.signIn.apply(this, originalArguments);
        }.bind(this));
      } else {
        console.log('Signing in', credentials.login);
        var signInRequest = this._getAuthToken().then(function(token) {
          var url = config.host + '/users/sign_in';

          var data = {
            authenticity_token: token,
            user: {
              login: credentials.login,
              password: credentials.password,
              remember_me: true,
            },
          };

          return makeHTTPRequest('POST', url, data, JSON_HEADERS)
            .then(function() {
              return this._getBearerToken().then(function() {
                return this._getSession().then(function(user) {
                  console.info('Signed in', user.login, user.id);
                  return user;
                }.bind(this));
              }.bind(this));
            }.bind(this))
            .catch(function(request) {
              console.error('Failed to sign in');
              apiClient.handleError(request);
            });
        }.bind(this));

        this.update({
          _currentUserPromise: signInRequest.catch(function() {
            return null;
          }),
        });

        return signInRequest;
      }
    }.bind(this));
  },

  changePassword: function(given) {
    return this.checkCurrent().then(function(user) {
      if (user) {
        return this._getAuthToken().then(function(token) {
          var data = {
            authenticity_token: token,
            user: {
              current_password: given.current,
              password: given.replacement,
              password_confirmation: given.replacement,
            },
          };

          return apiClient.put('/../users', data, JSON_HEADERS)
            .then(function() {
              // Rough, but it'll do for now. Without signing out and back in, the session is lost.
              return this.signOut();
            }.bind(this))
            .then(function() {
              return this.signIn({
                login: user.login,
                password: given.replacement,
              });
            }.bind(this));
        }.bind(this));
      } else {
        throw new Error('No signed-in user to change the password for');
      }
    }.bind(this));
  },

  requestPasswordReset: function(given) {
    return this._getAuthToken().then(function(token) {
      var data = {
        authenticity_token: token,
        user: {
          email: given.email,
        },
      };

      return apiClient.post('/../users/password', data, JSON_HEADERS);
    }.bind(this));
  },

  resetPassword: function(given) {
    return this._getAuthToken().then(function(authToken) {
      var data = {
        authenticity_token: authToken,
        user: {
          password: given.password,
          password_confirmation: given.confirmation,
          reset_password_token: given.token,
        },
      };

      return apiClient.put('/../users/password', data, JSON_HEADERS);
    }.bind(this));
  },

  disableAccount: function() {
    console.log('Disabling account');
    return this.checkCurrent().then(function(user) {
      if (user) {
        return user.delete().then(function() {
          this._deleteBearerToken();
          this.update({
            _currentUserPromise: Promise.resolve(null),
          });
          console.info('Disabled account');
          return null;
        }.bind(this));
      } else {
        throw new Error('Failed to disable account; not signed in');
      }
    }.bind(this));
  },

  signOut: function() {
    console.log('Signing out');
    return this.checkCurrent().then(function(user) {
      if (user) {
        return this._getAuthToken().then(function(token) {
          var url = config.host + '/users/sign_out';

          var deleteHeaders = Object.create(JSON_HEADERS);
          deleteHeaders['X-CSRF-Token'] = token;

          return makeHTTPRequest('DELETE', url, null, deleteHeaders)
            .then(function() {
              this._deleteBearerToken();
              this.update({
                _currentUserPromise: Promise.resolve(null),
              });
              console.info('Signed out');
              return null;
            }.bind(this))
            .catch(function(request) {
              console.error('Failed to sign out');
              return apiClient.handleError(request);
            }.bind(this));
        }.bind(this));
      } else {
        throw new Error('Failed to sign out; not signed in');
      }
    }.bind(this));
  },

  unsubscribeEmail: function(given) {
    return this._getAuthToken().then(function(token) {
      var url = config.host + '/unsubscribe';

      var data = {
        authenticity_token: token,
        email: given.email,
      };

      return makeHTTPRequest('POST', url, data, JSON_HEADERS);
    }.bind(this));
  },
});

},{"./api-client":8,"./config":10,"json-api-client":13}],10:[function(require,module,exports){
(function (process){
var DEFAULT_ENV = 'staging';

var API_HOSTS = {
  production: 'https://www.zooniverse.org',
  staging: 'https://panoptes-staging.zooniverse.org',
  development: 'https://panoptes-staging.zooniverse.org',
};

var API_APPLICATION_IDS = {
  production: 'f79cf5ea821bb161d8cbb52d061ab9a2321d7cb169007003af66b43f7b79ce2a',
  staging: '535759b966935c297be11913acee7a9ca17c025f9f15520e7504728e71110a27',
  development: '535759b966935c297be11913acee7a9ca17c025f9f15520e7504728e71110a27',
};

var OAUTH_HOSTS = {
  production: 'https://panoptes.zooniverse.org',
  staging: 'https://panoptes-staging.zooniverse.org',
  development: 'https://panoptes-staging.zooniverse.org',
};

var TALK_HOSTS = {
  production: 'https://talk.zooniverse.org',
  staging: 'https://talk-staging.zooniverse.org',
  development: 'https://talk-staging.zooniverse.org',
};

var SUGAR_HOSTS = {
  production: 'https://notifications.zooniverse.org',
  staging: 'https://notifications-staging.zooniverse.org',
  development: 'https://notifications-staging.zooniverse.org',
};

var STAT_HOSTS = {
  production: 'https://stats.zooniverse.org'
};

var hostFromBrowser = locationMatch(/\W?panoptes-api-host=([^&]+)/);
var appFromBrowser = locationMatch(/\W?panoptes-api-application=([^&]+)/);
var talkFromBrowser = locationMatch(/\W?talk-host=([^&]+)/);
var sugarFromBrowser = locationMatch(/\W?sugar-host=([^&]+)/);
var statFromBrowser = locationMatch(/\W?stat-host=([^&]+)/);

var hostFromShell = process.env.PANOPTES_API_HOST;
var appFromShell = process.env.PANOPTES_API_APPLICATION;
var talkFromShell = process.env.TALK_HOST;
var sugarFromShell = process.env.SUGAR_HOST;
var statFromShell = process.env.STAT_HOST;

var envFromBrowser = locationMatch(/\W?env=(\w+)/);
var envFromShell = process.env.NODE_ENV;

var env = envFromBrowser || envFromShell || DEFAULT_ENV;

if (!env.match(/^(production|staging|development)$/)) {
  throw new Error('Panoptes Javascript Client Error: Invalid Environment; ' +
    'try setting NODE_ENV to "staging" instead of "'+envFromShell+'".');
}

module.exports = {
  host: hostFromBrowser || hostFromShell || API_HOSTS[env],
  clientAppID: appFromBrowser || appFromShell || API_APPLICATION_IDS[env],
  talkHost: talkFromBrowser || talkFromShell || TALK_HOSTS[env],
  sugarHost: sugarFromBrowser || sugarFromShell || SUGAR_HOSTS[env],
  statHost: statFromBrowser || statFromShell || STAT_HOSTS[env],
  oauthHost: OAUTH_HOSTS[env],
};

// Try and match the location.search property against a regex. Basically mimics
// the CoffeeScript existential operator, in case we're not in a browser.
function locationMatch(regex) {
  var match;
  if (typeof location !== 'undefined' && location !== null) {
    match = location.search.match(regex);
  }

  return (match && match[1]) ? match[1] : undefined;
}

}).call(this,require('_process'))
},{"_process":1}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  module.exports = {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json'
  };

}).call(this);

},{}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var DEFAULT_SIGNAL, Emitter, arraysMatch, callHandler,
    slice = [].slice;

  DEFAULT_SIGNAL = 'change';

  arraysMatch = function(array1, array2) {
    var i, item, matches, ref;
    matches = (function() {
      var j, len, results;
      results = [];
      for (i = j = 0, len = array1.length; j < len; i = ++j) {
        item = array1[i];
        if (array2[i] === item) {
          results.push(i);
        }
      }
      return results;
    })();
    return (array1.length === (ref = array2.length) && ref === matches.length);
  };

  callHandler = function(handler, payload) {
    var boundArgs, context, ref;
    if (Array.isArray(handler)) {
      ref = handler, context = ref[0], handler = ref[1], boundArgs = 3 <= ref.length ? slice.call(ref, 2) : [];
      if (typeof handler === 'string') {
        handler = context[handler];
      }
    } else {
      boundArgs = [];
    }
    handler.apply(context, boundArgs.concat(payload));
  };

  module.exports = Emitter = (function() {
    Emitter.prototype._callbacks = null;

    function Emitter() {
      this._callbacks = {};
    }

    Emitter.prototype.listen = function() {
      var arg, base, callback, j, signal;
      arg = 2 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 1) : (j = 0, []), callback = arguments[j++];
      signal = arg[0];
      if (signal == null) {
        signal = DEFAULT_SIGNAL;
      }
      if ((base = this._callbacks)[signal] == null) {
        base[signal] = [];
      }
      this._callbacks[signal].push(callback);
      return this;
    };

    Emitter.prototype.stopListening = function() {
      var arg, callback, handler, i, index, j, k, ref, signal;
      arg = 2 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 1) : (j = 0, []), callback = arguments[j++];
      signal = arg[0];
      if (signal == null) {
        signal = DEFAULT_SIGNAL;
      }
      if (this._callbacks[signal] != null) {
        if (callback != null) {
          if (Array.isArray(callback)) {
            index = -1;
            ref = this._callbacks[signal];
            for (i = k = ref.length - 1; k >= 0; i = k += -1) {
              handler = ref[i];
              if (Array.isArray(handler)) {
                if (arraysMatch(callback, handler)) {
                  index = i;
                  break;
                }
              }
            }
          } else {
            index = this._callbacks[signal].lastIndexOf(callback);
          }
          if (index !== -1) {
            this._callbacks[signal].splice(index, 1);
          }
        } else {
          this._callbacks[signal].splice(0);
        }
      }
      return this;
    };

    Emitter.prototype.emit = function() {
      var callback, j, len, payload, ref, signal;
      signal = arguments[0], payload = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (signal == null) {
        signal = DEFAULT_SIGNAL;
      }
      if (signal in this._callbacks) {
        ref = this._callbacks[signal];
        for (j = 0, len = ref.length; j < len; j++) {
          callback = ref[j];
          callHandler(callback, payload);
        }
      }
      return this;
    };

    Emitter.prototype.destroy = function() {
      var callback, j, len, ref, signal;
      this.emit('destroy');
      for (signal in this._callbacks) {
        ref = this._callbacks[signal];
        for (j = 0, len = ref.length; j < len; j++) {
          callback = ref[j];
          this.stopListening(signal, callback);
        }
      }
    };

    return Emitter;

  })();

}).call(this);

},{}],13:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var DEFAULT_HEADERS, Emitter, JSONAPIClient, Model, READ_OPS, RESERVED_TOP_LEVEL_KEYS, Resource, Type, WRITE_OPS, makeHTTPRequest, mergeInto,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  makeHTTPRequest = require('./make-http-request');

  mergeInto = require('./merge-into');

  Emitter = require('./emitter');

  Type = require('./type');

  Model = require('./model');

  Resource = require('./resource');

  DEFAULT_HEADERS = require('./default-headers');

  RESERVED_TOP_LEVEL_KEYS = ['meta', 'links', 'linked', 'data'];

  READ_OPS = ['HEAD', 'GET'];

  WRITE_OPS = ['POST', 'PUT', 'DELETE'];

  JSONAPIClient = (function(superClass) {
    var fn, i, len, method, ref;

    extend(JSONAPIClient, superClass);

    JSONAPIClient.prototype.root = '/';

    JSONAPIClient.prototype.headers = null;

    JSONAPIClient.prototype.params = null;

    JSONAPIClient.prototype.reads = 0;

    JSONAPIClient.prototype.writes = 0;

    JSONAPIClient.prototype._typesCache = null;

    function JSONAPIClient(root, headers1, mixins) {
      this.root = root;
      this.headers = headers1 != null ? headers1 : {};
      this.params = {};
      JSONAPIClient.__super__.constructor.call(this, null);
      this._typesCache = {};
      mergeInto(this, mixins);
    }

    JSONAPIClient.prototype.beforeEveryRequest = function() {
      return Promise.resolve();
    };

    JSONAPIClient.prototype.request = function(method, url, payload, headers) {
      return this.beforeEveryRequest().then((function(_this) {
        return function() {
          var allHeaders, fullPayload, fullURL, request;
          method = method.toUpperCase();
          fullURL = _this.root + url;
          fullPayload = mergeInto({}, _this.params, payload);
          allHeaders = mergeInto({}, DEFAULT_HEADERS, _this.headers, headers);
          if (indexOf.call(READ_OPS, method) >= 0) {
            _this.update({
              reads: _this.reads + 1
            });
          } else if (indexOf.call(WRITE_OPS, method) >= 0) {
            _this.update({
              writes: _this.writes + 1
            });
          }
          request = makeHTTPRequest(method, fullURL, fullPayload, allHeaders);
          request["catch"](function() {
            return null;
          }).then(function() {
            if (indexOf.call(READ_OPS, method) >= 0) {
              return _this.update({
                reads: _this.reads - 1
              });
            } else if (indexOf.call(WRITE_OPS, method) >= 0) {
              return _this.update({
                writes: _this.writes - 1
              });
            }
          });
          return request.then(_this.processResponse.bind(_this))["catch"](_this.handleError.bind(_this));
        };
      })(this));
    };

    ref = ['get', 'post', 'put', 'delete'];
    fn = function(method) {
      return JSONAPIClient.prototype[method] = function() {
        return this.request.apply(this, [method].concat(slice.call(arguments)));
      };
    };
    for (i = 0, len = ref.length; i < len; i++) {
      method = ref[i];
      fn(method);
    }

    JSONAPIClient.prototype.processResponse = function(res) {
      var headers, j, k, l, len1, len2, len3, linkedResources, ref1, ref2, ref3, ref4, resourceData, resources, response, results, typeName;
      response = (function() {
        var error;
        try {
          return JSON.parse(res.text);
        } catch (error) {
          return {};
        }
      })();
      headers = res.headers;
      if ('links' in response) {
        this._handleLinks(response.links);
      }
      if ('linked' in response) {
        ref1 = response.linked;
        for (typeName in ref1) {
          linkedResources = ref1[typeName];
          ref2 = [].concat(linkedResources);
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            resourceData = ref2[j];
            this.type(typeName).create(resourceData, headers, response.meta);
          }
        }
      }
      results = [];
      if ('data' in response) {
        ref3 = [].concat(response.data);
        for (k = 0, len2 = ref3.length; k < len2; k++) {
          resourceData = ref3[k];
          results.push(this.type(resourceData.type).create(resourceData, headers, response.meta));
        }
      } else {
        for (typeName in response) {
          resources = response[typeName];
          if (indexOf.call(RESERVED_TOP_LEVEL_KEYS, typeName) < 0) {
            ref4 = [].concat(resources);
            for (l = 0, len3 = ref4.length; l < len3; l++) {
              resourceData = ref4[l];
              results.push(this.type(typeName).create(resourceData, headers, response.meta));
            }
          }
        }
      }
      return results;
    };

    JSONAPIClient.prototype._handleLinks = function(links) {
      var attributeName, href, link, ref1, results1, type, typeAndAttribute, typeName;
      results1 = [];
      for (typeAndAttribute in links) {
        link = links[typeAndAttribute];
        ref1 = typeAndAttribute.split('.'), typeName = ref1[0], attributeName = ref1[1];
        if (typeof link === 'string') {
          href = link;
        } else {
          href = link.href, type = link.type;
        }
        results1.push(this._handleLink(typeName, attributeName, href, type));
      }
      return results1;
    };

    JSONAPIClient.prototype._handleLink = function(typeName, attributeName, hrefTemplate, attributeTypeName) {
      var base, type;
      type = this.type(typeName);
      if ((base = type._links)[attributeName] == null) {
        base[attributeName] = {};
      }
      if (hrefTemplate != null) {
        type._links[attributeName].href = hrefTemplate;
      }
      if (attributeTypeName != null) {
        return type._links[attributeName].type = attributeTypeName;
      }
    };

    JSONAPIClient.prototype.handleError = function() {
      return Promise.reject.apply(Promise, arguments);
    };

    JSONAPIClient.prototype.type = function(name) {
      var base;
      if ((base = this._typesCache)[name] == null) {
        base[name] = new Type(name, this);
      }
      return this._typesCache[name];
    };

    return JSONAPIClient;

  })(Model);

  module.exports = JSONAPIClient;

  module.exports.makeHTTPRequest = makeHTTPRequest;

  module.exports.Emitter = Emitter;

  module.exports.Type = Type;

  module.exports.Model = Model;

  module.exports.Resource = Resource;

}).call(this);

},{"./default-headers":11,"./emitter":12,"./make-http-request":14,"./merge-into":15,"./model":16,"./resource":17,"./type":18}],14:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var DEFAULT_HEADERS, getsInProgress, makeHTTPRequest, normalizeUrl, request;

  request = require('superagent');

  DEFAULT_HEADERS = require('./default-headers');

  normalizeUrl = require('normalizeurl');

  getsInProgress = {};

  if (request.agent != null) {
    request = request.agent();
  }

  if (request.parse == null) {
    request.parse = {};
  }

  request.parse[DEFAULT_HEADERS['Accept']] = JSON.parse.bind(JSON);

  makeHTTPRequest = function(method, url, data, headers, modify) {
    var key, originalArguments, promisedRequest, requestID, value;
    if (headers == null) {
      headers = {};
    }
    originalArguments = Array.prototype.slice.call(arguments);
    method = method.toLowerCase();
    url = normalizeUrl(url);
    if (method === 'get') {
      for (key in data) {
        value = data[key];
        if (Array.isArray(value)) {
          data[key] = value.join(',');
        }
      }
      requestID = url + " " + (JSON.stringify(data));
      if (getsInProgress[requestID] != null) {
        return getsInProgress[requestID];
      }
    }
    promisedRequest = new Promise(function(resolve, reject) {
      var req;
      req = (function() {
        switch (method) {
          case 'get':
            return request.get(url).query(data);
          case 'head':
            return request.head(url).query(data);
          case 'put':
            return request.put(url).send(data);
          case 'post':
            return request.post(url).send(data);
          case 'delete':
            return request.del(url);
        }
      })();
      req = req.set(headers);
      if (req.withCredentials != null) {
        req = req.withCredentials();
      }
      return req.end(function(error, response) {
        delete getsInProgress[requestID];
        if ((error != null ? error.status : void 0) === 408) {
          return resolve(makeHTTPRequest.apply(null, originalArguments));
        } else if (error != null) {
          return reject(response != null ? response : error);
        } else {
          return resolve(response);
        }
      });
    });
    if (method === 'get') {
      getsInProgress[requestID] = promisedRequest;
    }
    return promisedRequest;
  };

  module.exports = makeHTTPRequest;

}).call(this);

},{"./default-headers":11,"normalizeurl":19,"superagent":20}],15:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var hasProp = {}.hasOwnProperty;

  module.exports = function() {
    var argument, i, key, len, ref, value;
    ref = Array.prototype.slice.call(arguments, 1);
    for (i = 0, len = ref.length; i < len; i++) {
      argument = ref[i];
      if (argument != null) {
        for (key in argument) {
          if (!hasProp.call(argument, key)) continue;
          value = argument[key];
          arguments[0][key] = value;
        }
      }
    }
    return arguments[0];
  };

}).call(this);

},{}],16:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var Emitter, Model, isIndex, mergeInto, removeUnderscoredKeys,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Emitter = require('./emitter');

  mergeInto = require('./merge-into');

  isIndex = function(string) {
    var integer;
    integer = parseInt(string, 10);
    return integer.toString(10) === string && !isNaN(integer);
  };

  removeUnderscoredKeys = function(target) {
    var i, key, len, results, results1, value;
    if (Array.isArray(target)) {
      results1 = [];
      for (i = 0, len = target.length; i < len; i++) {
        value = target[i];
        results1.push(removeUnderscoredKeys(value));
      }
      return results1;
    } else if ((target != null) && typeof target === 'object') {
      results = {};
      for (key in target) {
        value = target[key];
        if (key.charAt(0) !== '_') {
          results[key] = removeUnderscoredKeys(value);
        }
      }
      return results;
    } else {
      return target;
    }
  };

  module.exports = Model = (function(superClass) {
    extend(Model, superClass);

    Model.prototype._changedKeys = null;

    function Model() {
      var configs;
      configs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      Model.__super__.constructor.apply(this, arguments);
      this._changedKeys = [];
      mergeInto.apply(null, [this].concat(slice.call(configs)));
      this.emit('create');
    }

    Model.prototype.update = function(changeSet) {
      var base, i, key, lastKey, len, name, path, ref, rootKey, value;
      if (changeSet == null) {
        changeSet = {};
      }
      if (typeof changeSet === 'string') {
        for (i = 0, len = arguments.length; i < len; i++) {
          key = arguments[i];
          if (indexOf.call(this._changedKeys, key) < 0) {
            (ref = this._changedKeys).push.apply(ref, arguments);
          }
        }
      } else {
        for (key in changeSet) {
          if (!hasProp.call(changeSet, key)) continue;
          value = changeSet[key];
          path = key.split('.');
          rootKey = path[0];
          base = this;
          while (path.length !== 1) {
            if (base[name = path[0]] == null) {
              base[name] = isIndex(path[1]) ? [] : {};
            }
            base = base[path.shift()];
          }
          lastKey = path.shift();
          if (value === void 0) {
            if (Array.isArray(base)) {
              base.splice(lastKey, 1);
            } else {
              delete base[lastKey];
            }
          } else {
            base[lastKey] = value;
          }
          if (indexOf.call(this._changedKeys, rootKey) < 0) {
            this._changedKeys.push(rootKey);
          }
        }
      }
      this.emit('change');
      return this;
    };

    Model.prototype.hasUnsavedChanges = function() {
      return this._changedKeys.length !== 0;
    };

    Model.prototype.toJSON = function() {
      return removeUnderscoredKeys(this);
    };

    Model.prototype.destroy = function() {
      this._changedKeys.splice(0);
      return Model.__super__.destroy.apply(this, arguments);
    };

    return Model;

  })(Emitter);

}).call(this);

},{"./emitter":12,"./merge-into":15}],17:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var Model, PLACEHOLDERS_PATTERN, Resource, ResourcePromise,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  Model = require('./model');

  PLACEHOLDERS_PATTERN = /{(.+?)}/g;

  Resource = (function(superClass) {
    extend(Resource, superClass);

    Resource.prototype._type = null;

    Resource.prototype._headers = null;

    Resource.prototype._meta = null;

    Resource.prototype._linksCache = null;

    Resource.prototype._savingKeys = null;

    Resource.prototype._write = Promise.resolve();

    function Resource(_type) {
      this._type = _type;
      if (this._type == null) {
        throw new Error('Don\'t call the Resource constructor directly, use `client.type("things").create({});`');
      }
      this._headers = {};
      this._meta = {};
      this._linksCache = {};
      this._savingKeys = {};
      Resource.__super__.constructor.call(this, null);
      this._type.emit('change');
      this.emit('create');
    }

    Resource.prototype.getMeta = function(key) {
      if (key == null) {
        key = this._type._name;
      }
      return this._meta[key];
    };

    Resource.prototype.update = function() {
      var value;
      value = Resource.__super__.update.apply(this, arguments);
      if (this.id && this._type._resourcesCache[this.id] !== this) {
        this._type._resourcesCache[this.id] = this;
        if (this.href != null) {
          this._type._resourcesCache[this.href] = this;
        }
        this._type.emit('change');
      }
      return value;
    };

    Resource.prototype.save = function() {
      var base, changes, key, payload;
      payload = {};
      changes = this.toJSON.call(this.getChangesSinceSave());
      payload[this._type._name] = changes;
      this._changedKeys.splice(0);
      for (key in changes) {
        if ((base = this._savingKeys)[key] == null) {
          base[key] = 0;
        }
        this._savingKeys[key] += 1;
      }
      this._write = this._write["catch"]((function(_this) {
        return function() {
          return null;
        };
      })(this)).then((function(_this) {
        return function() {
          var save;
          save = _this.id ? _this.refresh(true).then(function() {
            return _this._type._client.put(_this._getURL(), payload, _this._getHeadersForModification());
          }) : _this._type._client.post(_this._type._getURL(), payload);
          return new ResourcePromise(save.then(function(arg) {
            var result;
            result = arg[0];
            for (key in changes) {
              _this._savingKeys[key] -= 1;
              if (_this._savingKeys[key] === 0) {
                delete _this._savingKeys[key];
              }
            }
            if (result !== _this) {
              _this.update(result);
              result.destroy();
            }
            _this.emit('save');
            return _this;
          }));
        };
      })(this));
      return this._write;
    };

    Resource.prototype.getChangesSinceSave = function() {
      var changes, i, key, len, ref;
      changes = {};
      ref = this._changedKeys;
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        changes[key] = this[key];
      }
      return changes;
    };

    Resource.prototype.refresh = function(saveChanges) {
      var changes;
      if (saveChanges) {
        changes = this.getChangesSinceSave();
        return this.refresh().then((function(_this) {
          return function() {
            return _this.update(changes);
          };
        })(this));
      } else if (this.id) {
        return this._type._client.get(this._getURL());
      } else {
        throw new Error('Can\'t refresh a resource with no ID');
      }
    };

    Resource.prototype.uncache = function() {
      if (this.id) {
        this.emit('uncache');
        delete this._type._resourcesCache[this.id];
        return delete this._type._resourcesCache[this.href];
      } else {
        throw new Error('Can\'t uncache a resource with no ID');
      }
    };

    Resource.prototype["delete"] = function() {
      this._write = this._write["catch"]((function(_this) {
        return function() {
          return null;
        };
      })(this)).then((function(_this) {
        return function() {
          var deletion;
          deletion = _this.id ? _this.refresh(true).then(function() {
            return _this._type._client["delete"](_this._getURL(), null, _this._getHeadersForModification());
          }) : Promise.resolve();
          return new ResourcePromise(deletion.then(function() {
            _this.emit('delete');
            _this._type.emit('change');
            _this.destroy();
            return null;
          }));
        };
      })(this));
      return this._write;
    };

    Resource.prototype.get = function(name, query) {
      var cachedByHREF, fullHREF, href, id, ids, ref, ref1, ref2, ref3, ref4, resourceLink, result, type, typeLink;
      if ((this._linksCache[name] != null) && (query == null)) {
        return this._linksCache[name];
      } else {
        resourceLink = (ref = this.links) != null ? ref[name] : void 0;
        typeLink = this._type._links[name];
        result = (resourceLink != null) || (typeLink != null) ? (href = (ref1 = resourceLink != null ? resourceLink.href : void 0) != null ? ref1 : typeLink != null ? typeLink.href : void 0, type = (ref2 = resourceLink != null ? resourceLink.type : void 0) != null ? ref2 : typeLink != null ? typeLink.type : void 0, id = (ref3 = resourceLink != null ? resourceLink.id : void 0) != null ? ref3 : typeLink != null ? typeLink.id : void 0, id != null ? id : id = typeof resourceLink === 'string' ? resourceLink : void 0, ids = (ref4 = resourceLink != null ? resourceLink.ids : void 0) != null ? ref4 : typeLink != null ? typeLink.ids : void 0, ids != null ? ids : ids = Array.isArray(resourceLink) ? resourceLink : void 0, href != null ? (fullHREF = this._applyHREF(href), cachedByHREF = this._type._client.type(type)._resourcesCache[fullHREF], (cachedByHREF != null) && (query == null) ? Promise.resolve(cachedByHREF) : this._type._client.get(fullHREF, query).then(function(links) {
          if (id != null) {
            return links[0];
          } else {
            return links;
          }
        })) : type != null ? this._type._client.type(type).get(id != null ? id : ids, query).then(function(links) {
          if (id != null) {
            return links[0];
          } else {
            return links;
          }
        }) : void 0) : name in this ? Promise.resolve(this[name]) : this._type._client.get(this._getURL(name));
        result.then((function(_this) {
          return function() {
            if (query == null) {
              return _this._linksCache[name] = result;
            }
          };
        })(this));
        return new ResourcePromise(result);
      }
    };

    Resource.prototype._applyHREF = function(href) {
      var context;
      context = {};
      context[this._type._name] = this;
      return href.replace(PLACEHOLDERS_PATTERN, function(_, path) {
        var ref, ref1, segment, segments, value;
        segments = path.split('.');
        value = context;
        while (segments.length !== 0) {
          segment = segments.shift();
          value = (ref = value[segment]) != null ? ref : (ref1 = value.links) != null ? ref1[segment] : void 0;
        }
        if (Array.isArray(value)) {
          value = value.join(',');
        }
        if (typeof value !== 'string') {
          throw new Error("Value for '" + path + "' in '" + href + "' should be a string.");
        }
        return value;
      });
    };

    Resource.prototype.addLink = function(name, value) {
      var data, url;
      url = this._getURL('links', name);
      data = {};
      data[name] = value;
      return this._type._client.post(url, data).then((function(_this) {
        return function() {
          _this.uncacheLink(name);
          return _this.refresh();
        };
      })(this));
    };

    Resource.prototype.removeLink = function(name, value) {
      var url;
      url = this._getURL('links', name, [].concat(value).join(','));
      return this._type._client["delete"](url).then((function(_this) {
        return function() {
          _this.uncacheLink(name);
          return _this.refresh();
        };
      })(this));
    };

    Resource.prototype.uncacheLink = function(name) {
      return delete this._linksCache[name];
    };

    Resource.prototype._getHeadersForModification = function() {
      var header, headers, value;
      headers = {
        'If-Unmodified-Since': this._getHeader('Last-Modified'),
        'If-Match': this._getHeader('ETag')
      };
      for (header in headers) {
        value = headers[header];
        if (value == null) {
          delete headers[header];
        }
      }
      return headers;
    };

    Resource.prototype._getHeader = function(header) {
      var name, value;
      header = header.toLowerCase();
      return ((function() {
        var ref, results1;
        ref = this._headers;
        results1 = [];
        for (name in ref) {
          value = ref[name];
          if (name.toLowerCase() === header) {
            results1.push(value);
          }
        }
        return results1;
      }).call(this))[0];
    };

    Resource.prototype._getURL = function() {
      var ref;
      if (this.href) {
        return [this.href].concat(slice.call(arguments)).join('/');
      } else {
        return (ref = this._type)._getURL.apply(ref, [this.id].concat(slice.call(arguments)));
      }
    };

    return Resource;

  })(Model);

  ResourcePromise = (function() {
    var method, methodName, ref;

    ResourcePromise.prototype._promise = null;

    function ResourcePromise(_promise) {
      this._promise = _promise;
      if (!(this._promise instanceof Promise)) {
        throw new Error('ResourcePromise requires a real promise instance');
      }
    }

    ResourcePromise.prototype.then = function() {
      var ref;
      return (ref = this._promise).then.apply(ref, arguments);
    };

    ResourcePromise.prototype["catch"] = function() {
      var ref;
      return (ref = this._promise)["catch"].apply(ref, arguments);
    };

    ResourcePromise.prototype.index = function(index) {
      this._promise = this._promise.then(function(value) {
        index = modulo(index, value.length);
        return value[index];
      });
      return this;
    };

    ref = Resource.prototype;
    for (methodName in ref) {
      method = ref[methodName];
      if (typeof method === 'function' && !(methodName in ResourcePromise.prototype)) {
        (function(methodName) {
          return ResourcePromise.prototype[methodName] = function() {
            var args;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            this._promise = this._promise.then((function(_this) {
              return function(promisedValue) {
                var resource, result, results;
                results = (function() {
                  var i, len, ref1, results1;
                  ref1 = [].concat(promisedValue);
                  results1 = [];
                  for (i = 0, len = ref1.length; i < len; i++) {
                    resource = ref1[i];
                    result = resource[methodName].apply(resource, args);
                    if (result instanceof this.constructor) {
                      result = result._promise;
                    }
                    results1.push(result);
                  }
                  return results1;
                }).call(_this);
                if (Array.isArray(promisedValue)) {
                  return Promise.all(results);
                } else {
                  return results[0];
                }
              };
            })(this));
            return this;
          };
        })(methodName);
      }
    }

    return ResourcePromise;

  })();

  module.exports = Resource;

  module.exports.Promise = ResourcePromise;

}).call(this);

},{"./model":16}],18:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var Emitter, Resource, Type, mergeInto,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  Emitter = require('./emitter');

  Resource = require('./resource');

  mergeInto = require('./merge-into');

  module.exports = Type = (function(superClass) {
    extend(Type, superClass);

    Type.prototype.Resource = Resource;

    Type.prototype._name = '';

    Type.prototype._client = null;

    Type.prototype._links = null;

    Type.prototype._resourcesCache = null;

    function Type(_name, _client) {
      this._name = _name;
      this._client = _client;
      Type.__super__.constructor.apply(this, arguments);
      this._links = {};
      this._resourcesCache = {};
      if (!(this._name && (this._client != null))) {
        throw new Error('Don\'t call the Type constructor directly, use `client.type("things");`');
      }
    }

    Type.prototype.create = function(data, headers, meta) {
      var key, ref, ref1, resource, value;
      if (data == null) {
        data = {};
      }
      if (headers == null) {
        headers = {};
      }
      if (meta == null) {
        meta = {};
      }
      if (data.type && data.type !== this._name) {
        return (ref = this._client.type(data.type)).create.apply(ref, arguments);
      } else {
        resource = (ref1 = this._resourcesCache[data.id]) != null ? ref1 : new this.Resource(this);
        mergeInto(resource._headers, headers);
        mergeInto(resource._meta, meta);
        if (data.id != null) {
          for (key in data) {
            value = data[key];
            if ((indexOf.call(resource._changedKeys, key) < 0) && (!(key in resource._savingKeys))) {
              resource[key] = value;
            }
          }
          this._resourcesCache[resource.id] = resource;
          resource.emit('change');
        } else {
          resource.update(data);
        }
        return resource;
      }
    };

    Type.prototype.get = function() {
      return new Resource.Promise(typeof arguments[0] === 'string' ? this._getByID.apply(this, arguments) : Array.isArray(arguments[0]) ? this._getByIDs.apply(this, arguments) : this._getByQuery.apply(this, arguments));
    };

    Type.prototype._getByID = function() {
      var id, otherArgs;
      id = arguments[0], otherArgs = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return this._getByIDs.apply(this, [[id]].concat(slice.call(otherArgs))).then(function(arg) {
        var resource;
        resource = arg[0];
        return resource;
      });
    };

    Type.prototype._getByIDs = function() {
      var id, ids, otherArgs, requests;
      ids = arguments[0], otherArgs = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      requests = (function() {
        var i, len, ref, results;
        results = [];
        for (i = 0, len = ids.length; i < len; i++) {
          id = ids[i];
          if (id in this._resourcesCache && (otherArgs.length === 0 || (otherArgs[0] == null))) {
            results.push(Promise.resolve(this._resourcesCache[id]));
          } else {
            results.push((ref = this._client).get.apply(ref, [this._getURL(id)].concat(slice.call(otherArgs))).then(function(arg) {
              var resource;
              resource = arg[0];
              return resource;
            }));
          }
        }
        return results;
      }).call(this);
      return Promise.all(requests);
    };

    Type.prototype._getByQuery = function() {
      var otherArgs, query, ref;
      query = arguments[0], otherArgs = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return (ref = this._client).get.apply(ref, [this._getURL(), query].concat(slice.call(otherArgs)));
    };

    Type.prototype._getURL = function() {
      return ['', this._name].concat(slice.call(arguments)).join('/');
    };

    return Type;

  })(Emitter);

}).call(this);

},{"./emitter":12,"./merge-into":15,"./resource":17}],19:[function(require,module,exports){
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('url'));
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.normalizeUrl = factory();
    }
}(this, function (nodeJsUrlModule) {
    function extend(targetObj) { // ...
        for (var i = 1 ; i < arguments.length ; i += 1) {
            var source = arguments[i];
            if (source) {
                for (var prop in source) {
                    targetObj[prop] = source[prop];
                }
            }
        }
        return targetObj;
    }

    // Figure out which ASCII chars are percent-encoded by encodeURIComponent:

    var asciiCharCodesToPercentEncode = [],
        doPercentEncodeByUpperCaseHex = {},
        charByUpperCaseHex = {};

    for (var charCode = 0 ; charCode < 256 ; charCode += 1) {
        var ch = String.fromCharCode(charCode),
            upperCaseHex = charCode.toString(16).toUpperCase();
        while (upperCaseHex.length < 2) {
            upperCaseHex = '0' + upperCaseHex;
        }
        charByUpperCaseHex[upperCaseHex] = ch;
        if (ch !== encodeURIComponent(ch)) {
            doPercentEncodeByUpperCaseHex[upperCaseHex] = true;
            if (charCode < 128 && ch !== '/' && ch !== '%' && ch !== '=') {
                asciiCharCodesToPercentEncode.push(charCode);
            }
        }
    }

    var asciiCharsToPercentEncodeRegExp = new RegExp('[' + asciiCharCodesToPercentEncode.map(function (charCode) {
        var hex = charCode.toString('16');
        return '\\x' + (hex.length < 2 ? '0' : '') + hex;
    }).join('') + ']', 'g');

    // allowPassThroughByChar is optional
    function normalizePercentEncodedChars(urlFragment, allowPassThroughByChar) {
        // Normalize already percent-encoded bytes to upper case (Apache's mod_dav lowercases them):
        return urlFragment.replace(/%([0-9a-f]{2})/gi, function ($0, hex) {
            var upperCaseHex = hex.toUpperCase();
            if (doPercentEncodeByUpperCaseHex[upperCaseHex]) {
                return '%' + upperCaseHex;
            } else {
                return charByUpperCaseHex[upperCaseHex];
            }
        }).replace(asciiCharsToPercentEncodeRegExp, !allowPassThroughByChar ? encodeURIComponent : function ($0) {
            return allowPassThroughByChar[$0] ? $0 : encodeURIComponent($0);
        });
    }

    function normalizeUrlFragment(urlFragment, urlFragmentName) {
        urlFragment = urlFragment || '';
        if (urlFragmentName === 'protocol') {
            urlFragment = urlFragment.toLowerCase();
        } else if (typeof urlFragment === 'string') {
            if (!urlFragmentName || urlFragmentName === 'path' || urlFragmentName === 'pathname') {
                // nodeJsUrlModule.parse('//doma.in/foo/bar') includes the protocol-relative host name in the 'path' and 'pathname' fragments.
                // Detect that and strip it off before normalizing the path so that it doesn't get removed along with a /../ -- and put it back afterwards.
                var matchProtocolRelativeHost = urlFragment.match(/^(\/\/[^\/]+)(\/.*)?$/);
                if (matchProtocolRelativeHost) {
                    urlFragment = matchProtocolRelativeHost[2] || '';
                }

                urlFragment = normalizePercentEncodedChars(urlFragment);

                urlFragment = urlFragment.replace(/\/\.(\/|$)/g, '$1');
                var numReplacements;
                do {
                    numReplacements = 0;
                    urlFragment = urlFragment.replace(/\/[^\/]+\/\.\.(\/|$)/g, function ($0, $1) {
                        numReplacements += 1;
                        return $1;
                    });
                } while (numReplacements > 0);

                if (matchProtocolRelativeHost) {
                    urlFragment = matchProtocolRelativeHost[1] + urlFragment;
                }

                urlFragment = urlFragment || '/';
            } else if (urlFragmentName === 'hash' || urlFragmentName === 'search') {
                // Exclude the leading ? or # from the percent encoding:
                if (urlFragment.length > 0) {
                    urlFragment = urlFragment[0] + normalizePercentEncodedChars(urlFragment.substr(1), {'?': true, '#': urlFragmentName === 'hash'});
                }
            } else if (urlFragmentName === 'host') {
                urlFragment = normalizePercentEncodedChars(urlFragment, {':': true});
            } else if (urlFragmentName === 'auth') {
                urlFragment = normalizePercentEncodedChars(urlFragment, {':': true, '@': true});
            } else {
                urlFragment = normalizePercentEncodedChars(urlFragment);
            }
        }

        return urlFragment;
    }

    return function normalizeUrl(urlOrUrlObj) {
        var inputIsUrlObj = urlOrUrlObj && typeof urlOrUrlObj === 'object',
            urlObj;
        if (inputIsUrlObj) {
            urlObj = extend({}, urlOrUrlObj);
        } else {
            if (nodeJsUrlModule && nodeJsUrlModule.parse) {
                urlObj = nodeJsUrlModule.parse(urlOrUrlObj);
            } else {
                if (/^[\w\+]+:|^\/\//.test(urlOrUrlObj)) {
                    throw new Error('Cannot normalize absolute and protocol-relative urls passed as a string without the node.js url module');
                }
                // Do a poor man's split into 'pathname', 'search', and 'hash' fragments. This regexp should match all strings:
                var matchQueryStringAndFragmentIdentifier = urlOrUrlObj.match(/^([^?#]*)(\?[^#]*)?(#(.*))?$/);

                return normalizeUrlFragment(matchQueryStringAndFragmentIdentifier[1], 'pathname') +
                    normalizeUrlFragment(matchQueryStringAndFragmentIdentifier[2], 'search') +
                    normalizeUrlFragment(matchQueryStringAndFragmentIdentifier[3], 'hash');
            }
        }

        // Remove the aggregated parts of the url object so we don't need to keep them in sync:
        delete urlObj.href;
        delete urlObj.path;

        Object.keys(urlObj).forEach(function (propertyName) {
            urlObj[propertyName] = normalizeUrlFragment(urlObj[propertyName], propertyName);
        });

        if (inputIsUrlObj) {
            // Regenerate the aggregate parts of the url object if we have the node.js URL module:
            if (nodeJsUrlModule) {
                urlObj.href = nodeJsUrlModule.format(urlObj);
                if (urlObj.pathname || urlObj.search) {
                    urlObj.path = (urlObj.pathname || '') + (urlObj.search || '');
                }
            }
            return urlObj;
        } else {
            return nodeJsUrlModule.format(urlObj);
        }
    };
}));

},{"url":6}],20:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');
var requestBase = require('./request-base');
var isObject = require('./is-object');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Expose `request`.
 */

var request = module.exports = require('./request').bind(null, Request);

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pushEncodedKeyValuePair(pairs, key, obj[key]);
        }
      }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (Array.isArray(val)) {
    return val.forEach(function(v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  }
  pairs.push(encodeURIComponent(key)
    + '=' + encodeURIComponent(val));
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
      // issue #876: return the http status code if the response parsing fails
      err.statusCode = self.xhr && self.xhr.status ? self.xhr.status : null;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter` and `requestBase`.
 */

Emitter(Request.prototype);
for (var key in requestBase) {
  Request.prototype[key] = requestBase[key];
}

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set responseType to `val`. Presently valid responseTypes are 'blob' and 
 * 'arraybuffer'.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @param {Object} options with 'type' property 'auto' or 'basic' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (!options) {
    options = {
      type: 'basic'
    }
  }

  switch (options.type) {
    case 'basic':
      var str = btoa(user + ':' + pass);
      this.set('Authorization', 'Basic ' + str);
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;
  }
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  this._getFormData().append(field, file, filename || file.name);
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this._header['content-type'];

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * @deprecated
 */
Response.prototype.parse = function serialize(fn){
  if (root.console) {
    console.warn("Client-side parse() method has been renamed to serialize(). This method is not compatible with superagent v2.0");
  }
  this.serialize(fn);
  return this;
};

Response.prototype.serialize = function serialize(fn){
  this._parser = fn;
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = 'download';
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  if (this.username && this.password) {
    xhr.open(this.method, this.url, true, this.username, this.password);
  } else {
    xhr.open(this.method, this.url, true);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};


/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./is-object":21,"./request":23,"./request-base":22,"emitter":24,"reduce":25}],21:[function(require,module,exports){
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null != obj && 'object' == typeof obj;
}

module.exports = isObject;

},{}],22:[function(require,module,exports){
/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

exports.clearTimeout = function _clearTimeout(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Force given parser
 *
 * Sets the body parser no matter type.
 *
 * @param {Function}
 * @api public
 */

exports.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

exports.timeout = function timeout(ms){
  this._timeout = ms;
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

exports.then = function then(fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Allow for extension
 */

exports.use = function use(fn) {
  fn(this);
  return this;
}


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

exports.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

exports.getHeader = exports.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

exports.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
exports.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
exports.field = function(name, val) {
  this._getFormData().append(name, val);
  return this;
};

},{"./is-object":21}],23:[function(require,module,exports){
// The node and browser modules expose versions of this with the
// appropriate constructor function bound as first argument
/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(RequestConstructor, method, url) {
  // callback
  if ('function' == typeof url) {
    return new RequestConstructor('GET', method).end(url);
  }

  // url first
  if (2 == arguments.length) {
    return new RequestConstructor('GET', method);
  }

  return new RequestConstructor(method, url);
}

module.exports = request;

},{}],24:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],25:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],26:[function(require,module,exports){
window.zooAPI = require('panoptes-client/lib/api-client');
window.zooAuth = require('panoptes-client/lib/auth');
},{"panoptes-client/lib/api-client":8,"panoptes-client/lib/auth":9}]},{},[26]);
