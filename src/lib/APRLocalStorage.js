define('APRLocalStorage', [
	'./defaults',
	'./eachProperty',
], function (
	defaults,
	eachProperty
) {

	'use strict';

	function APRLocalStorage (consent) {
		
		if (!(this instanceof APRLocalStorage)) {
			return new APRLocalStorage(consent);
		}

		Object.defineProperties(this, {
			'consent': {
				'value': !!consent
			}
		});

	}

	Object.defineProperties(APRLocalStorage, {
		'cookieExists': {
			'value': function (cookie) {
				return new RegExp('; ' + cookie + '(=|;)').test('; ' + document.cookie + ';');
			}
		},
		'getCookie': {
			'value': function (name) {
				return ('; ' + document.cookie).split('; ' + name + '=').pop().split('; ').shift().split(/^=/).pop();
			}
		}
	});

	Object.defineProperties(APRLocalStorage.prototype, {
		'setCookie': {
			'value': function (name, value, options, insecure) {
		
				var cookie = '', set = function (k, v) {
					cookie += k + (typeof v !== 'undefined' ? '=' + v : '') + '; ';
				};

				if (!this.consent) {
					return false;
				}

				options = defaults(options, {});

				set(name, value);

				if (!insecure) {
					set('secure');
				}

				if (options['max-age']) {
					options.expires = +new Date() + options['max-age'] * 1e3;
				}

				if (options.expires) {
					options.expires = new Date(options.expires).toGMTString();
				}

				eachProperty(options, function (v, k) {
					set(k, v);
				});

				document.cookie = cookie;

				return true;

			}
		},
		'removeCookie': {
			'value': function (name, options) {
			
				if (!APRLocalStorage.cookieExists(name)) {
					return true;
				}

				return this.setCookie(name, '', Object.assign(defaults(options, {}), {
					'max-age': 0
				}));

			}
		},
		'isStorageAvailable': {
			'value': function (type) {
	
				var _ = 'x';
				var storage;

				if (!this.consent) {
					return false;
				}

				try {
					storage = window[type];
					storage.setItem(_, _);
					storage.removeItem(_);
				}
				catch (exception) {
					return false;
				}
				
				return true;

			}
		}
	});

	return APRLocalStorage;

});