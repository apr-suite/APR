APR.Define('APR/Event', 0.1).using(function () {

	'use strict';

	var ArrayProto = Array.prototype;
	var _ = Object.assign(APR.createPrivateKey(), {
		'isEventTypeIncluded' : function (option, eventType) {
			return option === true || APR.inArray(APR.defaults(option, [option]), eventType);
		},
		'getReservedOptions' : function (options) {
			return APR.defaults(APR.defaults(options, {}).addGlobalEvent, {});
		},
		'throttle' : function (ms, callback, store) {

			var handler = function () {
				callback();
				store.temp = null;
			};

			if (typeof ms === 'number') {
				clearTimeout(store.temp);
				store.temp = setTimeout(handler, ms);
			}
			else {
				store.temp = true;
				window.requestAnimationFrame(handler);
			}

		}

	});

	function APREvent (elements) {

		if (!(this instanceof APREvent)) {
			return new APREvent(elements);
		}

		if (this.constructor === APREvent) {
			this.length = ArrayProto.push.apply(this, APR.defaults(elements, [elements]));
		}

		ArrayProto.forEach.call(this, function (element) {
			
			if (!_(element).attachedEvents) {
				_(element).attachedEvents = {};
			}

		});

	}

	Object.assign(APREvent, {
		'version' : this.version,
		'getAttachedEvents' : function (element) {
			return _(element).attachedEvents;
		}
	});

	Object.assign(APREvent.prototype, {

		'addEvent' : (function () {

			var DEFAULT_OPTIONS = {
				'useCapture' : false,
				'once' : false,
				'detail' : null,
				'bubbles' : void 0,
				'throttle' : void 0,
				'cloned' : void 0,
				'custom' : void 0,
				'filter' : null,
				'originalListener' : void 0
			};

			return function (names, handler, options) {

				var instance = this;
				var listener = (function () {

					var throttleStore = {};

					return function (e) {
					
						var params = options.detail;					
						var filter = options.filter;
						var once = options.once;
						var throttle = options.throttle;
						var eventType = e.type;

						if (typeof filter === 'function' && !filter.call(this, e, params)) {
							return;
						}

						if (_.isEventTypeIncluded(once, eventType)) {
							instance.removeListener(handler);
						}

						if (typeof throttle !== 'undefined') {

							if (APR.isKeyValueObject(throttle)) {
								throttle = throttle[eventType];
							}
							else if (_.isEventTypeIncluded(throttle, eventType)) {
								throttle = true;
							}

							_.throttle(throttle, handler.bind(this, e, params), throttleStore);

						}
						else {
							handler.call(this, e, params);
						}
						
					};

				})();

				options = Object.assign({}, DEFAULT_OPTIONS, options);
				
				if (typeof options.bubbles === 'boolean') {
					options.useCapture = !options.bubbles;
				}

				APR.defaults(names, [names]).forEach(function (name) {

					var type = (_.isEventTypeIncluded(options.custom, name)
						? name
						: name.slice(name.lastIndexOf('.') + 1)
					);
					var id = name;

					ArrayProto.forEach.call(this, function (element) {

						if (_(handler).id === id && _(element).attachedEvents[id]) {
							return;
						}

						_(handler).id = id;

						element.addEventListener(type, listener, options.useCapture);

						_(element).attachedEvents[id] = {
							'type' : type,
							'name' : name,
							'hasNamespace' : type !== name,
							'originalListener' : options.originalListener || handler,
							'listener' : listener,
							'options' : options
						};

						if (options.trigger) {
							this.triggerEvent(name, options.trigger);
						}

					}, this);

				}, this);

				return this;

			};

		})(),
		'addCustomEvent' : function (types, handler, options) {
		
			this.addEvent(types, handler, Object.assign(APR.defaults(options, {}), {
				'custom' : true
			}));

			return this;

		},
		'removeEvent' : function (name, listenerName) {

			this.eachEvent(function (handler, id) {

				if (handler.name === name && typeof listenerName === 'undefined' || APR.getFunctionName(handler.originalListener) === listenerName) {
					this.removeListener(handler.originalListener);
				}

			});

			return this;

		},
		'removeListener' : function (listener) {

			var id = _(listener).id;

			ArrayProto.forEach.call(this, function (element) {

				var handler = APREvent.getAttachedEvents(element)[id];

				element.removeEventListener(handler.type, handler.listener, handler.options.useCapture);
				
				delete _(element).attachedEvents[id];

			});

			delete _(listener).id;

			return this;
		},
		'cloneEvents' : function (target) {
			
			var aprTarget = new APREvent(target);

			this.eachEvent(function (handler, id) {

				aprTarget.addEvent(handler.name, handler.originalListener, APR.assign(handler.options, {
					'cloned' : true
				}));

			});
			
			return this;

		},
		'eachEvent' : function (handler) {
			
			ArrayProto.forEach.call(this, function (element) {
				APR.eachProperty(APREvent.getAttachedEvents(element), handler, element);
			});

			return this;
		},
		'triggerEvent' : function (type, params) {

			this.eachEvent(function (handler, namespacedType) {

				var customEvent;

				if (namespacedType !== type) {
					return;
				}

				customEvent = new CustomEvent(type, Object.assign({}, handler.options, {'detail' : params}));

				if (handler.hasNamespace && !handler.options.custom) {
					handler.listener.call(this, customEvent);
				}
				else {
					this.dispatchEvent(customEvent);
				}

			});

			return this;

		},
		'addGlobalEvent' : (function () {

			var NON_BUBBLING_TO_BUBBLING = {
				'focus' : 'focusin',
				'blur' : 'focusout',
				'mouseenter' : 'mouseover',
				'mouseleave' : 'mouseout'
			};
			var NON_BUBBLING_EVENTS = ['load', 'unload', 'abort', 'error'];
			
			return function (eventNames, events, options) {

				if (!APR.isKeyValueObject(events)) {
					throw new TypeError('"' + events + '" must be a key-value object.');
				}

				options = APR.defaults(options, {});

				APR.defaults(eventNames, [eventNames]).forEach(function (eventName) {

					if (!options.force && APR.inArray(NON_BUBBLING_EVENTS, eventName)) {
						throw new TypeError(eventName + ' doesn\'t bubble, but you can attach it anyway adding {force: true} (in the "options" parameter).');
					}
					
					this.addEvent(NON_BUBBLING_TO_BUBBLING[eventName] || eventName, function (e, params) {

						var somethingMatched = false;
						var triggerOptions = _.getReservedOptions(options.trigger);
						var triggerTargets = triggerOptions[e.type] ? APR.getElements(triggerOptions[e.type], this) : [e.target];

						triggerTargets.forEach(function (target) {

							APR.getRemoteParent(target, function () {

								APR.eachProperty(events, function (handler, selector) {

									if (this.matches && this.matches(selector)) {
										somethingMatched = true;
										handler.call(this, e, params);
									}

								}, this);

								return false;

							}, this, true);

						}, this);

						if (!somethingMatched && typeof events.elsewhere === 'function') {
							events.elsewhere.call(this, e, params);
						}

					}, Object.assign(options, {
						'bubbles' : true
					}));

				}, this);

				return this;

			};

		})()

	}, {'constructor' : APREvent});

	if (!APR.Event) {
		APR.Event = APREvent;
	}

});