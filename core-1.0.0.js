

define('core/lib/support',[],function() {
  

  var support;
  return support = {
    propertyDescriptors: (function() {
      var o;
      if (!(typeof Object.defineProperty === 'function' && typeof Object.defineProperties === 'function')) {
        return false;
      }
      try {
        o = {};
        Object.defineProperty(o, 'foo', {
          value: 'bar'
        });
        return o.foo === 'bar';
      } catch (error) {
        return false;
      }
    })()
  };
});

var __slice = [].slice;

define('core/lib/utils',['underscore', 'core/lib/support'], function() {
  

  var support, utils, _;
  _ = require('underscore');
  support = require('core/lib/support');
  utils = {
    isDeferred: function(obj) {
      return _.isFunction(obj.promise) && _.isFunction(obj.done) && _.isFunction(obj.fail) && _.isFunction(obj.state);
    },
    beget: (function() {
      var ctor;
      if (typeof Object.create === 'function') {
        return Object.create;
      } else {
        ctor = function() {};
        return function(obj) {
          ctor.prototype = obj;
          return new ctor;
        };
      }
    })(),
    readonly: (function() {
      var readonlyDescriptor;
      if (support.propertyDescriptors) {
        readonlyDescriptor = {
          writable: false,
          enumerable: true,
          configurable: false
        };
        return function() {
          var obj, prop, properties, _i, _len;
          obj = arguments[0], properties = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          for (_i = 0, _len = properties.length; _i < _len; _i++) {
            prop = properties[_i];
            readonlyDescriptor.value = obj[prop];
            Object.defineProperty(obj, prop, readonlyDescriptor);
          }
          return true;
        };
      } else {
        return function() {
          return false;
        };
      }
    })(),
    upcase: function(str) {
      return str.charAt(0).toUpperCase() + str.substring(1);
    },
    underscorize: function(string) {
      return string.replace(/[A-Z]/g, function(char, index) {
        return (index !== 0 ? '_' : '') + char.toLowerCase();
      });
    },
    modifierKeyPressed: function(event) {
      return event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
    }
  };
  if (typeof Object.seal === "function") {
    Object.seal(utils);
  }
  return utils;
});


define('core/session',['underscore', 'backbone', 'core/lib/support', 'core/lib/utils'], function() {
  

  var Backbone, session, support, utils, _;
  _ = require('underscore');
  Backbone = require('backbone');
  support = require('core/lib/support');
  utils = require('core/lib/utils');
  session = {
    user: null,
    serviceUrl: 'service'
  };
  session.subscribe = session.on = Backbone.Events.on;
  session.unsubscribe = session.off = Backbone.Events.off;
  session.publish = session.trigger = Backbone.Events.trigger;
  session._callbacks = null;
  utils.readonly(session, 'subscribe', 'unsubscribe', 'publish', 'on', 'off', 'trigger');
  session.seal = function() {
    if (support.propertyDescriptors && Object.seal) {
      return Object.seal(session);
    }
  };
  utils.readonly(session, 'seal');
  return session;
});


define('core/dao_factory',['underscore', 'core/session'], function() {
  var DaoFactory, session, _;
  _ = require('underscore');
  session = require('core/session');
  return DaoFactory = {
    registry: {},
    instanceCache: {},
    register: function(daoName, daoClass) {
      if (!_.has(this.registry, daoName)) {
        return this.registry[daoName] = daoClass;
      }
    },
    getDAOByName: function(daoName) {
      var instance;
      if (!_.has(this.registry, daoName)) {
        throw new Error("DAO with name " + daoName + " not found");
      }
      if (!_.contains(_.keys(this.instanceCache), daoName)) {
        this.instanceCache[daoName] = new this.registry[daoName];
        instance = this.instanceCache[daoName];
        instance.setBaseUrl(session.serviceUrl + instance.baseUrl);
      }
      return this.instanceCache[daoName];
    }
  };
});


define('core/mediator',['underscore', 'backbone', 'core/lib/support', 'core/lib/utils'], function() {
  

  var Backbone, mediator, support, utils, _;
  _ = require('underscore');
  Backbone = require('backbone');
  support = require('core/lib/support');
  utils = require('core/lib/utils');
  mediator = {};
  mediator.subscribe = mediator.on = Backbone.Events.on;
  mediator.unsubscribe = mediator.off = Backbone.Events.off;
  mediator.publish = mediator.trigger = Backbone.Events.trigger;
  mediator._callbacks = null;
  utils.readonly(mediator, 'subscribe', 'unsubscribe', 'publish', 'on', 'off', 'trigger');
  mediator.seal = function() {
    if (support.propertyDescriptors && Object.seal) {
      return Object.seal(mediator);
    }
  };
  utils.readonly(mediator, 'seal', 'subscribe', 'unsubscribe', 'publish', 'on', 'off', 'trigger');
  return mediator;
});


define('core/dao',['core/dao_factory', 'core/mediator'], function() {
  var Dao, Feedback, Mediator, daofactory;
  daofactory = require('core/dao_factory');
  Mediator = require('core/mediator');
  Feedback = require('core/feedback');
  return Dao = (function() {

    Dao.prototype.baseUrl = '/';

    Dao.prototype.modelClass = null;

    Dao.prototype.collectionClass = null;

    function Dao(baseUrl) {
      if (baseUrl == null) {
        baseUrl = '/';
      }
      this.setBaseUrl(baseUrl);
    }

    Dao.prototype.setBaseUrl = function(baseUrl) {
      this.baseUrl = baseUrl;
      if (this.baseUrl.charAt(this.baseUrl.length - 1) !== "/") {
        return this.baseUrl = this.baseUrl + "/";
      }
    };

    Dao.prototype.removeWhitespaces = function(data) {
      var key, value, _results;
      if (_.isObject(data)) {
        _results = [];
        for (key in data) {
          value = data[key];
          if (_.isString(value)) {
            _results.push(data[key] = value.replace(/\s\s+/g, ' '));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Dao.prototype.fetchCollection = function(type, url, params, data) {
      var ajaxPromise, promise,
        _this = this;
      if (type == null) {
        type = "GET";
      }
      if (url == null) {
        url = "";
      }
      if (params == null) {
        params = [];
      }
      if (data == null) {
        data = {};
      }
      promise = $.Deferred();
      this.removeWhitespaces(data);
      ajaxPromise = $.ajax({
        url: this.constructUrl(url, params),
        type: type,
        dataType: 'json',
        data: data
      });
      ajaxPromise.fail(this.defaultPromiseError(promise)).done(function(json, status, ajaxObj) {
        var collection;
        collection = new _this.collectionClass(json);
        return promise.resolve.apply(_this, [collection, ajaxObj]);
      });
      return promise;
    };

    Dao.prototype.defaultPromiseError = function(promise) {
      var func;
      func = function(error) {
        var contentType, json;
        if (error.status === 420) {
          Mediator.publish('session:expired');
        } else if (error.status === 500) {
          Mediator.publish('service:error');
        } else {
          contentType = error.getResponseHeader('Content-Type');
          if (error.status === 404 && (!contentType || contentType.indexOf('application/json') === -1)) {
            Feedback.error('Página não encontrada');
          } else {
            json = $.parseJSON(error.responseText);
            Feedback.error(json.erro.message);
            $('form').find('.control-group.success').removeClass('success');
          }
        }
        return promise.reject.apply(this, arguments);
      };
      return func;
    };

    Dao.prototype.fetchModel = function(type, url, params, data) {
      var ajaxPromise, promise,
        _this = this;
      if (type == null) {
        type = "GET";
      }
      if (url == null) {
        url = "";
      }
      if (params == null) {
        params = [];
      }
      if (data == null) {
        data = {};
      }
      if (_.isObject(url)) {
        data = url;
        url = "";
      }
      this.removeWhitespaces(data);
      promise = $.Deferred();
      ajaxPromise = $.ajax({
        url: this.constructUrl(url, params),
        type: type,
        dataType: 'json',
        data: data
      });
      ajaxPromise.fail(this.defaultPromiseError(promise)).done(function(json, status, ajaxObj) {
        var model;
        model = new _this.modelClass(json);
        return promise.resolve.apply(_this, [model, ajaxObj]);
      });
      return promise;
    };

    Dao.prototype.fetchRaw = function(type, url, params, data) {
      var ajaxPromise, promise,
        _this = this;
      if (type == null) {
        type = "GET";
      }
      if (url == null) {
        url = "";
      }
      if (params == null) {
        params = [];
      }
      if (data == null) {
        data = {};
      }
      if (_.isObject(url)) {
        data = url;
        url = "";
      }
      this.removeWhitespaces(data);
      promise = $.Deferred();
      ajaxPromise = $.ajax({
        url: this.constructUrl(url, params),
        type: type,
        dataType: 'json',
        data: data
      });
      ajaxPromise.fail(this.defaultPromiseError(promise)).done(function(json, status, ajaxObj) {
        return promise.resolve.apply(_this, [json, ajaxObj]);
      });
      return promise;
    };

    Dao.prototype.listar = function() {
      return this.fetchCollection("GET");
    };

    Dao.prototype.remover = function(id) {
      return this.fetchModel("DELETE", "{0}", [id]);
    };

    Dao.prototype.atualizar = function(id, data) {
      return this.fetchModel("PUT", "{0}", [id], data);
    };

    Dao.prototype.criar = function(data) {
      return this.fetchModel("POST", "{0}", null, data);
    };

    Dao.prototype.ler = function(id) {
      return this.fetchModel("GET", "{0}", [id]);
    };

    Dao.prototype.constructUrl = function(url, params) {
      var param, paramIndex, replaceParam, _i, _len;
      replaceParam = function(param, index) {
        var reg;
        reg = new RegExp("\\{" + index + "\\}");
        return url = url.replace(reg, param);
      };
      for (paramIndex = _i = 0, _len = params.length; _i < _len; paramIndex = ++_i) {
        param = params[paramIndex];
        replaceParam(param, paramIndex);
      }
      return url = this.baseUrl + url;
    };

    return Dao;

  })();
});


define('core/lib/subscriber',['core/mediator'], function(mediator) {
  

  var Subscriber;
  Subscriber = {
    subscribeEvent: function(type, handler) {
      if (typeof type !== 'string') {
        throw new TypeError('Subscriber#subscribeEvent: ' + 'type argument must be a string');
      }
      if (typeof handler !== 'function') {
        throw new TypeError('Subscriber#subscribeEvent: ' + 'handler argument must be a function');
      }
      mediator.unsubscribe(type, handler, this);
      return mediator.subscribe(type, handler, this);
    },
    unsubscribeEvent: function(type, handler) {
      if (typeof type !== 'string') {
        throw new TypeError('Subscriber#unsubscribeEvent: ' + 'type argument must be a string');
      }
      if (typeof handler !== 'function') {
        throw new TypeError('Subscriber#unsubscribeEvent: ' + 'handler argument must be a function');
      }
      return mediator.unsubscribe(type, handler);
    },
    unsubscribeAllEvents: function() {
      return mediator.unsubscribe(null, null, this);
    }
  };
  if (typeof Object.freeze === "function") {
    Object.freeze(Subscriber);
  }
  return Subscriber;
});

var __slice = [].slice;

define('core/lib/logger',[],function() {
  

  var Logger;
  return Logger = {
    log: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.logPrefix != null) {
        args.unshift("[" + this.logPrefix + "]");
      }
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.log === "function") {
          console.log.apply(console, args);
        }
      }
      return this;
    },
    error: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.logPrefix != null) {
        args.unshift("[" + this.logPrefix + "]");
      }
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.error === "function") {
          console.error.apply(console, args);
        }
      }
      return this;
    },
    warn: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.logPrefix != null) {
        args.unshift("[" + this.logPrefix + "]");
      }
      if (typeof console !== "undefined" && console !== null) {
        if (typeof console.warn === "function") {
          console.warn.apply(console, args);
        }
      }
      return this;
    }
  };
});


define('core/dispatcher',['underscore', 'underscore.string', 'backbone', 'core/mediator', 'core/lib/utils', 'core/lib/subscriber', 'core/lib/logger'], function() {
  

  var ActionNotImplementedError, Backbone, Dispatcher, Logger, Subscriber, mediator, utils, _, _s;
  _ = require('underscore');
  _s = require('underscore.string');
  Backbone = require('backbone');
  mediator = require('core/mediator');
  utils = require('core/lib/utils');
  Subscriber = require('core/lib/subscriber');
  Logger = require('core/lib/logger');
  ActionNotImplementedError = function(action, controller) {
    this.name = "ActionNotImplementedError";
    return this.message = "We cannot find an action '" + action + "' on controller '" + controller + "'";
  };
  ActionNotImplementedError.prototype = new Error();
  ActionNotImplementedError.prototype.constructor = ActionNotImplementedError;
  return Dispatcher = (function() {

    Dispatcher.extend = Backbone.Model.extend;

    _(Dispatcher.prototype).extend(Subscriber);

    _(Dispatcher.prototype).extend(Logger);

    Dispatcher.prototype.previousControllerName = null;

    Dispatcher.prototype.currentControllerName = null;

    Dispatcher.prototype.currentController = null;

    Dispatcher.prototype.currentAction = null;

    Dispatcher.prototype.currentParams = null;

    Dispatcher.prototype.logPrefix = 'Dispatcher';

    Dispatcher.prototype.url = null;

    function Dispatcher() {
      this.initialize.apply(this, arguments);
    }

    Dispatcher.prototype.initialize = function(options) {
      if (options == null) {
        options = {};
      }
      this.settings = _(options).defaults({
        controllerPath: 'controllers/',
        controllerSuffix: '_controller'
      });
      this.subscribeEvent('matchRoute', this.matchRoute);
      return this.subscribeEvent('!startupController', this.startupController);
    };

    Dispatcher.prototype.matchRoute = function(route, params) {
      this.log("Loading controller for route: " + route);
      return this.startupController(route.controller, route.action, params);
    };

    Dispatcher.prototype.startupController = function(controllerName, action, params) {
      var handler, isSameController;
      if (action == null) {
        action = 'index';
      }
      if (params == null) {
        params = {};
      }
      if (params.changeURL !== false) {
        params.changeURL = true;
      }
      if (params.forceStartup !== true) {
        params.forceStartup = false;
      }
      isSameController = !params.forceStartup && this.currentControllerName === controllerName && this.currentAction === action && (!this.currentParams || _(params).isEqual(this.currentParams));
      if (isSameController) {
        return;
      }
      handler = _(this.controllerLoaded).bind(this, controllerName, action, params);
      return this.loadController(controllerName, handler);
    };

    Dispatcher.prototype.loadController = function(controllerName, handler) {
      var controllerFileName, path;
      controllerFileName = _s.underscored(controllerName) + this.settings.controllerSuffix;
      path = this.settings.controllerPath + controllerFileName;
      if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
        return require([path], handler);
      } else {
        return handler(require(path));
      }
    };

    Dispatcher.prototype.controllerLoaded = function(controllerName, action, params, ControllerConstructor) {
      var controller, currentController, currentControllerName;
      currentControllerName = this.currentControllerName || null;
      currentController = this.currentController || null;
      if (currentController) {
        mediator.publish('beforeControllerDispose', currentController);
        currentController.dispose(params, controllerName);
      }
      controller = new ControllerConstructor(params, currentControllerName);
      if (controller[action] === void 0) {
        throw new ActionNotImplementedError(action, controllerName);
      }
      this.log("Calling controller action '" + action + "' on controller '" + controllerName + "'");
      controller[action](params, currentControllerName);
      if (controller.redirected) {
        return;
      }
      this.previousControllerName = currentControllerName;
      this.currentControllerName = controllerName;
      this.currentController = controller;
      this.currentAction = action;
      this.currentParams = params;
      this.adjustURL(controller, params);
      this.log("Broadcasting the event 'startupController' throught mediator");
      return mediator.publish('startupController', {
        previousControllerName: this.previousControllerName,
        controller: this.currentController,
        controllerName: this.currentControllerName,
        params: this.currentParams
      });
    };

    Dispatcher.prototype.adjustURL = function(controller, params) {
      var url;
      if (params.path || params.path === '') {
        url = params.path;
      } else if (typeof controller.historyURL === 'function') {
        url = controller.historyURL(params);
      } else if (typeof controller.historyURL === 'string') {
        url = controller.historyURL;
      } else {
        throw new Error('Dispatcher#adjustURL: controller for ' + ("" + this.currentControllerName + " does not provide a historyURL"));
      }
      if (params.changeURL) {
        mediator.publish('!router:changeURL', url);
      }
      return this.url = url;
    };

    Dispatcher.prototype.disposed = false;

    Dispatcher.prototype.dispose = function() {
      if (this.disposed) {
        return;
      }
      this.unsubscribeAllEvents();
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return Dispatcher;

  })();
});

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('core/views/layout',['underscore', 'backbone', 'core/mediator', 'core/lib/utils', 'core/lib/subscriber', 'core/lib/logger'], function() {
  

  var Backbone, Layout, Logger, Subscriber, mediator, utils, _;
  _ = require('underscore');
  Backbone = require('backbone');
  mediator = require('core/mediator');
  utils = require('core/lib/utils');
  Subscriber = require('core/lib/subscriber');
  Logger = require('core/lib/logger');
  return Layout = (function() {

    Layout.extend = Backbone.Model.extend;

    _(Layout.prototype).extend(Subscriber);

    _(Layout.prototype).extend(Logger);

    Layout.prototype.title = '';

    Layout.prototype.events = {};

    Layout.prototype.el = document;

    Layout.prototype.$el = $(document);

    Layout.prototype.cid = 'chaplin-layout';

    function Layout() {
      this.openLink = __bind(this.openLink, this);
      this.initialize.apply(this, arguments);
    }

    Layout.prototype.initialize = function(options) {
      if (options == null) {
        options = {};
      }
      this.title = options.title;
      this.settings = _(options).defaults({
        routeLinks: true,
        scrollTo: [0, 0]
      });
      this.subscribeEvent('beforeControllerDispose', this.hideOldView);
      this.subscribeEvent('startupController', this.showNewView);
      this.subscribeEvent('startupController', this.adjustTitle);
      this.delegateEvents();
      if (this.settings.routeLinks) {
        return this.initLinkRouting();
      }
    };

    Layout.prototype.undelegateEvents = Backbone.View.prototype.undelegateEvents;

    Layout.prototype.delegateEvents = Backbone.View.prototype.delegateEvents;

    Layout.prototype.hideOldView = function(controller) {
      var scrollTo, view;
      this.log('Hiding old view');
      scrollTo = this.settings.scrollTo;
      if (scrollTo) {
        window.scrollTo(scrollTo[0], scrollTo[1]);
      }
      view = controller.view;
      if (view) {
        return view.$el.css('display', 'none');
      }
    };

    Layout.prototype.showNewView = function(context) {
      var view;
      this.log('Displaying new view');
      view = context.controller.view;
      if (view) {
        return view.$el.css({
          display: 'block',
          opacity: 1,
          visibility: 'visible'
        });
      }
    };

    Layout.prototype.adjustTitle = function(context) {
      var controllerTitle, title;
      title = this.title;
      controllerTitle = context.controller.title;
      if (controllerTitle) {
        title = "" + controllerTitle + " \u2013 " + title;
      }
      return setTimeout((function() {
        return document.title = title;
      }), 50);
    };

    Layout.prototype.initLinkRouting = function() {
      return $(document).on('click', '.go-to', this.goToHandler).on('click', 'a', this.openLink);
    };

    Layout.prototype.stopLinkRouting = function() {
      return $(document).off('click', '.go-to', this.goToHandler).off('click', 'a', this.openLink);
    };

    Layout.prototype.openLink = function(event) {
      var $el, currentHostname, el, external, href, path;
      if (utils.modifierKeyPressed(event)) {
        return;
      }
      el = event.currentTarget;
      $el = $(el);
      href = $el.attr('href');
      if (href === '' || href === void 0 || href.charAt(0) === '#' || $el.hasClass('noscript')) {
        return;
      }
      currentHostname = location.hostname.replace('.', '\\.');
      external = el.hostname !== '' && !RegExp("" + currentHostname + "$", "i").test(el.hostname);
      if (external) {
        return;
      }
      path = el.pathname + el.search;
      if (path.charAt(0) !== '/') {
        path = "/" + path;
      }
      return mediator.publish('!router:route', path, function(routed) {
        if (routed) {
          return event.preventDefault();
        }
      });
    };

    Layout.prototype.goToHandler = function(event) {
      var el, path;
      el = event.currentTarget;
      if (event.nodeName === 'A') {
        return;
      }
      path = $(el).data('href');
      if (!path) {
        return;
      }
      return mediator.publish('!router:route', path, function(routed) {
        if (routed) {
          return event.preventDefault();
        } else {
          return location.href = path;
        }
      });
    };

    Layout.prototype.disposed = false;

    Layout.prototype.dispose = function() {
      if (this.disposed) {
        return;
      }
      this.stopLinkRouting();
      this.unsubscribeAllEvents();
      this.undelegateEvents();
      delete this.title;
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return Layout;

  })();
});

var __hasProp = {}.hasOwnProperty;

define('core/controllers/controller',['underscore', 'backbone', 'core/mediator', 'core/lib/subscriber', 'core/lib/logger'], function() {
  

  var Backbone, Controller, Logger, Subscriber, mediator, _;
  _ = require('underscore');
  Backbone = require('backbone');
  mediator = require('core/mediator');
  Subscriber = require('core/lib/subscriber');
  Logger = require('core/lib/logger');
  return Controller = (function() {

    Controller.extend = Backbone.Model.extend;

    _(Controller.prototype).extend(Subscriber);

    _(Controller.prototype).extend(Logger);

    Controller.prototype.view = null;

    Controller.prototype.currentId = null;

    Controller.prototype.redirected = false;

    function Controller() {
      this.initialize.apply(this, arguments);
    }

    Controller.prototype.initialize = function() {
      return this.log('Initializing controller');
    };

    Controller.prototype.redirectTo = function(path, action, params) {
      this.log("Redirecting to path '" + path + "' and action '" + action + "'");
      this.redirected = true;
      if (arguments.length === 1) {
        return mediator.publish('!router:route', path, function(routed) {
          if (!routed) {
            throw new Error('Controller#redirectTo: no route matched');
          }
        });
      } else {
        return mediator.publish('!startupController', path, action, params);
      }
    };

    Controller.prototype.disposed = false;

    Controller.prototype.dispose = function() {
      var obj, prop, properties, _i, _len;
      this.log('Disposing controller');
      if (this.disposed) {
        return;
      }
      for (prop in this) {
        if (!__hasProp.call(this, prop)) continue;
        obj = this[prop];
        if (obj && typeof obj.dispose === 'function') {
          obj.dispose();
          delete this[prop];
        }
      }
      this.unsubscribeAllEvents();
      properties = ['currentId', 'redirected'];
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        prop = properties[_i];
        delete this[prop];
      }
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return Controller;

  })();
});

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty;

define('core/lib/route',['underscore', 'backbone', 'core/mediator', 'core/session', 'core/controllers/controller', 'core/lib/logger'], function(_, Backbone, mediator, session, Controller, Logger) {
  

  var Route;
  return Route = (function() {
    var escapeRegExp, queryStringFieldSeparator, queryStringValueSeparator, reservedParams;

    Route.extend = Backbone.Model.extend;

    _(Route.prototype).extend(Logger);

    reservedParams = ['path', 'changeURL'];

    escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;

    queryStringFieldSeparator = '&';

    queryStringValueSeparator = '=';

    Route.prototype.logPrefix = 'Route';

    function Route(pattern, target, options) {
      var _ref;
      this.options = options != null ? options : {};
      this.handler = __bind(this.handler, this);

      this.addParamName = __bind(this.addParamName, this);

      this.pattern = pattern;
      _ref = target.split('#'), this.controller = _ref[0], this.action = _ref[1];
      if (_(Controller.prototype).has(this.action)) {
        throw new Error('Route: You should not use existing controller properties as action names');
      }
      this.createRegExp();
    }

    Route.prototype.createRegExp = function() {
      var pattern;
      if (_.isRegExp(this.pattern)) {
        this.regExp = this.pattern;
        return;
      }
      pattern = this.pattern.replace(escapeRegExp, '\\$&').replace(/:(\w+)/g, this.addParamName);
      return this.regExp = RegExp("^" + pattern + "(?=\\?|$)");
    };

    Route.prototype.addParamName = function(match, paramName) {
      var _ref;
      if ((_ref = this.paramNames) == null) {
        this.paramNames = [];
      }
      if (_(reservedParams).include(paramName)) {
        throw new Error("Route#addParamName: parameter name " + paramName + " is reserved");
      }
      this.paramNames.push(paramName);
      return '([^\/\?]+)';
    };

    Route.prototype.test = function(path) {
      var constraint, constraints, matched, name, params;
      matched = this.regExp.test(path);
      if (!matched) {
        return false;
      }
      constraints = this.options.constraints;
      if (constraints) {
        params = this.extractParams(path);
        for (name in constraints) {
          if (!__hasProp.call(constraints, name)) continue;
          constraint = constraints[name];
          if (!constraint.test(params[name])) {
            return false;
          }
        }
      }
      return true;
    };

    Route.prototype.handler = function(path, options) {
      var params, permissions;
      this.log("Route handled: path '" + path + "'");
      params = this.buildParams(path, options);
      permissions = this.options.permissions;
      if (permissions) {
        if (!session.user.checkAccess(permissions)) {
          mediator.publish('!router:changeURL', '!/site/error/550');
          return false;
        }
      }
      return mediator.publish('matchRoute', this, params);
    };

    Route.prototype.buildParams = function(path, options) {
      var params, patternParams, queryParams;
      params = {};
      queryParams = this.extractQueryParams(path);
      _(params).extend(queryParams);
      patternParams = this.extractParams(path);
      _(params).extend(patternParams);
      _(params).extend(this.options.params);
      params.changeURL = Boolean(options && options.changeURL);
      params.path = path;
      return params;
    };

    Route.prototype.extractParams = function(path) {
      var index, match, matches, paramName, params, _i, _len, _ref;
      params = {};
      matches = this.regExp.exec(path);
      _ref = matches.slice(1);
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        match = _ref[index];
        paramName = this.paramNames ? this.paramNames[index] : index;
        params[paramName] = match;
      }
      return params;
    };

    Route.prototype.extractQueryParams = function(path) {
      var current, field, matches, pair, pairs, params, queryString, regExp, value, _i, _len, _ref;
      params = {};
      regExp = /\?(.+?)(?=#|$)/;
      matches = regExp.exec(path);
      if (!matches) {
        return params;
      }
      queryString = matches[1];
      pairs = queryString.split(queryStringFieldSeparator);
      for (_i = 0, _len = pairs.length; _i < _len; _i++) {
        pair = pairs[_i];
        if (!pair.length) {
          continue;
        }
        _ref = pair.split(queryStringValueSeparator), field = _ref[0], value = _ref[1];
        if (!field.length) {
          continue;
        }
        field = decodeURIComponent(field);
        value = decodeURIComponent(value);
        current = params[field];
        if (current) {
          if (current.push) {
            current.push(value);
          } else {
            params[field] = [current, value];
          }
        } else {
          params[field] = value;
        }
      }
      return params;
    };

    Route.prototype.toString = function() {
      return "Route( pattern:'" + this.pattern + "', controller:'" + this.controller + "', action:'" + this.action + "' )";
    };

    return Route;

  })();
});

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('core/lib/router',['underscore', 'backbone', 'core/mediator', 'core/session', 'core/lib/subscriber', 'core/lib/route', 'core/lib/logger'], function() {
  

  var Backbone, Logger, Route, Router, Subscriber, mediator, session, _;
  _ = require('underscore');
  Backbone = require('backbone');
  mediator = require('core/mediator');
  session = require('core/session');
  Subscriber = require('core/lib/subscriber');
  Route = require('core/lib/route');
  Logger = require('core/lib/logger');
  return Router = (function() {

    Router.extend = Backbone.Model.extend;

    _(Router.prototype).extend(Subscriber);

    _(Router.prototype).extend(Logger);

    Router.prototype.logPrefix = 'Router';

    function Router(options) {
      this.options = options != null ? options : {};
      this.route = __bind(this.route, this);

      this.match = __bind(this.match, this);

      this.log('Constructing new Router');
      _(this.options).defaults({
        pushState: false
      });
      this.subscribeEvent('!router:route', this.routeHandler);
      this.subscribeEvent('!router:changeURL', this.changeURLHandler);
      this.createHistory();
    }

    Router.prototype.createHistory = function() {
      this.log('Constructing Backbone.History');
      return Backbone.history || (Backbone.history = new Backbone.History());
    };

    Router.prototype.startHistory = function() {
      this.log('Starting history');
      return Backbone.history.start(this.options);
    };

    Router.prototype.stopHistory = function() {
      if (Backbone.History.started) {
        return Backbone.history.stop();
      }
    };

    Router.prototype.match = function(pattern, target, options) {
      var route;
      if (options == null) {
        options = {};
      }
      this.log("Adding matcher for pattern '" + pattern + "' to target '" + target + "'");
      route = new Route(pattern, target, options);
      return Backbone.history.handlers.push({
        route: route,
        callback: route.handler
      });
    };

    Router.prototype.route = function(path) {
      var handler, _i, _len, _ref;
      this.log("Routing application to '" + path + "'");
      path = path.replace(/^(\/#|\/)/, '');
      _ref = Backbone.history.handlers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        handler = _ref[_i];
        if (handler.route.test(path)) {
          handler.callback(path, {
            changeURL: true
          });
          return true;
        }
      }
      return false;
    };

    Router.prototype.routeHandler = function(path, callback) {
      var routed;
      this.log("Route handled: path '" + path + "'");
      routed = this.route(path);
      return typeof callback === "function" ? callback(routed) : void 0;
    };

    Router.prototype.changeURL = function(url) {
      this.log("Changing url to '" + url + "'");
      return Backbone.history.navigate(url, {
        trigger: false
      });
    };

    Router.prototype.changeURLHandler = function(url) {
      return this.changeURL(url);
    };

    Router.prototype.disposed = false;

    Router.prototype.dispose = function() {
      if (this.disposed) {
        return;
      }
      this.stopHistory();
      delete Backbone.history;
      this.unsubscribeAllEvents();
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return Router;

  })();
});

/*
# Application #
*/

define('core/application',['backbone', 'core/mediator', 'core/session', 'core/dispatcher', 'core/views/layout', 'core/lib/router', 'core/lib/logger'], function() {
  

  var Application, Backbone, Dispatcher, Layout, Logger, Router, mediator, session;
  Backbone = require('backbone');
  mediator = require('core/mediator');
  session = require('core/session');
  Dispatcher = require('core/dispatcher');
  Layout = require('core/views/layout');
  Router = require('core/lib/router');
  Logger = require('core/lib/logger');
  return Application = (function() {
    /*
        A classe Application é a classe base para as aplicações.
    
              class MyApplication extends Application
    
                title: "MyApplication"
    
              window.application = new MyApplication({ ... options ... })
    */

    Application.extend = Backbone.Model.extend;

    _(Application.prototype).extend(Logger);

    /* O título da aplicação
    */


    Application.prototype.title = '';

    /* Instância do dispatcher
    */


    Application.prototype.dispatcher = null;

    /* Instância do layout
    */


    Application.prototype.layout = null;

    /* Instância do router
    */


    Application.prototype.router = null;

    function Application(options) {
      if (options == null) {
        options = {};
      }
      /* Cria uma nova instância da classe Application
      */

      this.initialize(options);
    }

    Application.prototype.initialize = function(options) {
      /* Inicializa a aplicação startando o seu dispatcher e layout.
      */
      this.log('Initializing application');
      this.initDispatcher(options);
      return this.initLayout(options);
    };

    Application.prototype.initDispatcher = function(options) {
      /* Inicializa o dispatcher da aplicação.
      */
      return this.dispatcher = new Dispatcher(options);
    };

    Application.prototype.initLayout = function(options) {
      var _ref;
      if (options == null) {
        options = {};
      }
      /* Inicializa o layout da aplicação.
      */

      this.log('Initializing layout');
      if ((_ref = options.title) == null) {
        options.title = this.title;
      }
      return this.layout = new Layout(options);
    };

    Application.prototype.initRouter = function(routes, options) {
      /* Inicializa o Router
      */
      this.log('Initializing router');
      this.router = new Router(options);
      if (typeof routes === "function") {
        routes(this.router.match);
      }
      return this.router.startHistory();
    };

    Application.prototype.disposed = false;

    Application.prototype.dispose = function() {
      /* Remove a aplicação
      */

      var prop, properties, _i, _len;
      if (this.disposed) {
        return;
      }
      properties = ['dispatcher', 'layout', 'router'];
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        prop = properties[_i];
        if (!(this[prop] != null)) {
          continue;
        }
        this[prop].dispose();
        delete this[prop];
      }
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return Application;

  })();
});


define('core/webuser',['core/lib/support'], function() {
  var Support, WebUser;
  Support = require('core/lib/support');
  return WebUser = (function() {

    WebUser.prototype.nome = 'Guest';

    function WebUser(permissoes) {
      this.permissoes = permissoes != null ? permissoes : [];
      this.isGuest = true;
    }

    WebUser.prototype.checkAccess = function(permissoes) {
      var canAccess, check, permissao, _i, _len,
        _this = this;
      canAccess = false;
      if (!_.isArray(permissoes)) {
        throw new Error('permissoes should be an array of permissoes');
      }
      if (permissoes.length === 0) {
        return canAccess = true;
      }
      check = function(permissao) {
        if (_.indexOf(_this.permissoes, permissao) !== -1) {
          canAccess = true;
          return;
        }
        return canAccess = false;
      };
      for (_i = 0, _len = permissoes.length; _i < _len; _i++) {
        permissao = permissoes[_i];
        check(permissao);
      }
      return canAccess;
    };

    WebUser.prototype.getName = function() {
      return this.name;
    };

    WebUser.prototype.authenticate = function(userData) {
      this.isGuest = false;
      _.extend(this, userData);
      return this.freeze();
    };

    WebUser.prototype.freeze = function() {
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return WebUser;

  })();
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/sesc_application',['backbone', 'core/application', 'core/lib/support', 'core/lib/utils', 'core/mediator', 'core/webuser'], function() {
  

  var Backbone, CoreApplication, Feedback, Mediator, SescApplication, Session, Support, Utils, WebUser;
  Backbone = require('backbone');
  CoreApplication = require('core/application');
  Support = require('core/lib/support');
  Utils = require('core/lib/utils');
  Session = require('core/session');
  WebUser = require('core/webuser');
  Mediator = require('core/mediator');
  Feedback = require('core/feedback');
  return SescApplication = (function(_super) {

    __extends(SescApplication, _super);

    SescApplication.prototype.systemId = null;

    SescApplication.prototype.title = '';

    function SescApplication(systemId, title) {
      this.systemId = systemId;
      this.title = title;
      if (this.systemId == null) {
        throw new Error('You forget to specify the systemId for this application');
      }
      if (this.title == null) {
        throw new Error('You forget to specify a title for the application');
      }
      this.logPrefix = "App:" + this.title;
      this.overrideSync();
      this.initialize();
    }

    SescApplication.prototype.overrideSync = function() {
      if (Backbone === void 0) {
        throw new Error('Backbone not found. Did you included the library on your document?');
      }
      return Backbone.sync = function(method, model, options) {
        var ajaxPromise, getValue, methodMap, params, promise, type, urlError,
          _this = this;
        methodMap = {
          'create': 'POST',
          'update': 'PUT',
          'delete': 'DELETE',
          'read': 'GET'
        };
        getValue = function(object, prop) {
          if (!(object && object[prop])) {
            return null;
          }
          if (_.isFunction(object[prop])) {
            return object[prop]();
          } else {
            return object[prop];
          }
        };
        urlError = function() {
          throw new Error('A "url" property or function must be specified');
        };
        type = methodMap[method];
        options || (options = {});
        params = {
          type: type,
          dataType: 'json',
          cache: false,
          complete: function() {
            return $('#application-loading').remove();
          }
        };
        if (!options.data && model && (method === 'create' || method === 'update')) {
          params.contentType = 'application/x-www-form-urlencoded';
          params.traditional = true;
          params.data = model.toJSON();
        }
        if (!options.url) {
          params.url = getValue(model, 'url') || urlError();
        }
        if (type === 'DELETE') {
          params.data || (params.data = {});
          params.data._method = type;
          params.type = 'POST';
          params.beforeSend = function(xhr) {
            return xhr.setRequestHeader('X-HTTP-Method-Override', type);
          };
        }
        promise = $.Deferred();
        ajaxPromise = $.ajax(_.extend(params, options));
        ajaxPromise.error(function(error) {
          var contentType, json;
          if (error.status === 420) {
            Mediator.publish('session:expired');
          } else if (error.status === 500) {
            Mediator.publish('service:error');
          } else {
            contentType = error.getResponseHeader('Content-Type');
            if (error.status === 404 && (!contentType || contentType.indexOf('application/json') === -1)) {
              Feedback.error('Página não encontrada');
            } else {
              json = $.parseJSON(error.responseText);
              Feedback.error(json.erro.message);
              $('form').find('.control-group.success').removeClass('success');
            }
          }
          return promise.reject.apply(this, arguments);
        });
        ajaxPromise.done(function(json, status, ajaxObj) {
          return promise.resolve.apply(_this, arguments);
        });
        return promise;
      };
    };

    SescApplication.prototype.initialize = function() {
      return this.initSession();
    };

    SescApplication.prototype.initLayout = function() {};

    SescApplication.prototype.initSession = function() {
      var userOperationRequest,
        _this = this;
      this.log("Creating application session");
      userOperationRequest = this.getUserOperation();
      if (!Utils.isDeferred(userOperationRequest)) {
        throw new Error("O método 'getUserOperation' deve retornar um deferred object do jQuery.");
      }
      return userOperationRequest.done(function(data, status, ajaxObj) {
        Session.user = _this.getUserObject(data);
        Utils.readonly(Session, 'user');
        if (typeof Object.freeze === "function") {
          Object.freeze(Session);
        }
        _this.initLayout();
        Mediator.publish('userAuthenticated', Session.user);
        _this.initDispatcher();
        return _this.initRouter(_this.routes);
      });
    };

    SescApplication.prototype.getUserOperation = function() {
      return $.ajax({
        url: 'service/usuario'
      });
    };

    SescApplication.prototype.getUserObject = function(userData) {
      var user;
      user = new WebUser;
      user.authenticate(userData);
      return user;
    };

    return SescApplication;

  })(CoreApplication);
});


define('core/feedback',[],function() {
  var feedback;
  return feedback = {
    defaults: {
      "layout": "center",
      "theme": "noty_theme_twitter",
      "animateOpen": {
        "height": "toggle"
      },
      "animateClose": {
        "height": "toggle"
      },
      "speed": 500,
      "timeout": 0,
      "closeButton": true,
      "closeOnSelfClick": false,
      "closeOnSelfOver": false,
      "modal": false
    },
    set: function(message, type, options) {
      if (options == null) {
        options = {};
      }
      if (typeof noty === "undefined" || noty === null) {
        return;
      }
      _.defaults(options, this.defaults);
      $.noty.closeAll();
      return $.noty(_.extend(options, {
        "text": message,
        "type": type
      }));
    },
    success: function(message) {
      return this.set(message, 'success');
    },
    info: function(message) {
      return this.set(message, 'info');
    },
    error: function(message) {
      return this.set(message, 'error');
    },
    closeAll: function() {
      return $.noty.closeAll();
    }
  };
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/controllers/crud_controller',['core/controllers/controller'], function(Controller) {
  var CrudController;
  Controller = require('core/controllers/controller');
  return CrudController = (function(_super) {

    __extends(CrudController, _super);

    function CrudController() {
      return CrudController.__super__.constructor.apply(this, arguments);
    }

    CrudController.prototype.listView = null;

    CrudController.prototype.createView = null;

    CrudController.prototype.editView = null;

    CrudController.prototype.collectionClass = null;

    CrudController.prototype.modelClass = null;

    CrudController.prototype.indexTitle = 'Listagem';

    CrudController.prototype.createTitle = 'Criando';

    CrudController.prototype.editTitle = 'Editando';

    CrudController.prototype.initialize = function() {
      var property, _i, _len, _ref, _results;
      CrudController.__super__.initialize.apply(this, arguments);
      _ref = ['listView', 'createView', 'editView', 'collectionClass', 'modelClass'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        property = _ref[_i];
        if (property == null) {
          throw new Error("A propriedade '" + property + "' deve ser preenchida");
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    CrudController.prototype.index = function(options) {
      var collectionInstance;
      this.title = this.indexTitle;
      if (this.indexSubTitle) {
        this.subTitle = this.indexSubTitle;
      }
      this.breadcrumb = [
        {
          label: this.indexTitle
        }
      ];
      collectionInstance = new this.collectionClass;
      return this.view = new this.listView({
        collection: collectionInstance
      });
    };

    CrudController.prototype.edit = function(options) {
      var modelInstance,
        _this = this;
      this.title = this.editTitle;
      if (this.editSubTitle) {
        this.subTitle = this.editSubTitle;
      }
      this.breadcrumb = [
        {
          label: this.indexTitle,
          url: '#' + this.historyURL()
        }, {
          label: this.title
        }
      ];
      modelInstance = new this.modelClass({
        id: options.id
      });
      this.view = new this.editView({
        model: modelInstance
      });
      return this.view.on('model:saved', function() {
        return _this.redirectTo(_this.historyURL());
      });
    };

    CrudController.prototype.create = function(options) {
      var modelInstance,
        _this = this;
      this.title = this.createTitle;
      if (this.createSubTitle) {
        this.subTitle = this.createSubTitle;
      }
      this.breadcrumb = [
        {
          label: this.indexTitle,
          url: '#' + this.historyURL()
        }, {
          label: this.title
        }
      ];
      modelInstance = new this.modelClass;
      this.view = new this.createView({
        model: modelInstance
      });
      return this.view.on('model:saved', function() {
        return _this.redirectTo(_this.historyURL());
      });
    };

    return CrudController;

  })(Controller);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/controllers/crud_details_controller',['core/controllers/controller'], function(Controller) {
  var CrudDetailsController;
  Controller = require('core/controllers/controller');
  return CrudDetailsController = (function(_super) {

    __extends(CrudDetailsController, _super);

    function CrudDetailsController() {
      return CrudDetailsController.__super__.constructor.apply(this, arguments);
    }

    CrudDetailsController.prototype.listView = null;

    CrudDetailsController.prototype.createView = null;

    CrudDetailsController.prototype.editView = null;

    CrudDetailsController.prototype.collectionClass = null;

    CrudDetailsController.prototype.modelClass = null;

    CrudDetailsController.prototype.indexTitle = 'Listagem';

    CrudDetailsController.prototype.createTitle = 'Criando';

    CrudDetailsController.prototype.editTitle = 'Editando';

    CrudDetailsController.prototype.initialize = function() {
      var property, _i, _len, _ref, _results;
      CrudDetailsController.__super__.initialize.apply(this, arguments);
      _ref = ['listView', 'createView', 'editView', 'collectionClass', 'modelClass'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        property = _ref[_i];
        if (property == null) {
          throw new Error("A propriedade '" + property + "' deve ser preenchida");
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    CrudDetailsController.prototype.index = function(options) {
      var collectionInstance;
      this.breadcrumb = [
        {
          label: this.indexTitle
        }
      ];
      this.title = this.indexTitle;
      collectionInstance = new this.collectionClass;
      return this.view = new this.listView({
        collection: collectionInstance
      });
    };

    CrudDetailsController.prototype.edit = function(options) {
      var modelInstance,
        _this = this;
      this.title = this.editTitle;
      this.breadcrumb = [
        {
          label: this.indexTitle,
          url: '#' + this.historyURL()
        }, {
          label: this.title
        }
      ];
      modelInstance = new this.modelClass({
        id: options.id
      });
      this.view = new this.editView({
        model: modelInstance
      });
      return this.view.on('model:saved', function() {
        return _this.redirectTo(_this.historyURL());
      });
    };

    CrudDetailsController.prototype.create = function(options) {
      var modelInstance,
        _this = this;
      this.title = this.createTitle;
      this.breadcrumb = [
        {
          label: this.indexTitle,
          url: '#' + this.historyURL()
        }, {
          label: this.title
        }
      ];
      modelInstance = new this.modelClass;
      this.view = new this.createView({
        model: modelInstance
      });
      return this.view.on('model:saved', function() {
        return _this.redirectTo(_this.historyURL());
      });
    };

    return CrudDetailsController;

  })(Controller);
});


define('core/lib/sync_machine',[],function() {
  

  var STATE_CHANGE, SYNCED, SYNCING, SyncMachine, UNSYNCED, event, _fn, _i, _len, _ref;
  UNSYNCED = 'unsynced';
  SYNCING = 'syncing';
  SYNCED = 'synced';
  STATE_CHANGE = 'syncStateChange';
  SyncMachine = {
    _syncState: UNSYNCED,
    _previousSyncState: null,
    syncState: function() {
      return this._syncState;
    },
    isUnsynced: function() {
      return this._syncState === UNSYNCED;
    },
    isSynced: function() {
      return this._syncState === SYNCED;
    },
    isSyncing: function() {
      return this._syncState === SYNCING;
    },
    unsync: function() {
      var _ref;
      if ((_ref = this._syncState) === SYNCING || _ref === SYNCED) {
        this._previousSync = this._syncState;
        this._syncState = UNSYNCED;
        this.trigger(this._syncState, this, this._syncState);
        this.trigger(STATE_CHANGE, this, this._syncState);
      }
    },
    beginSync: function() {
      var _ref;
      if ((_ref = this._syncState) === UNSYNCED || _ref === SYNCED) {
        this._previousSync = this._syncState;
        this._syncState = SYNCING;
        this.trigger(this._syncState, this, this._syncState);
        this.trigger(STATE_CHANGE, this, this._syncState);
      }
    },
    finishSync: function() {
      if (this._syncState === SYNCING) {
        this._previousSync = this._syncState;
        this._syncState = SYNCED;
        this.trigger(this._syncState, this, this._syncState);
        this.trigger(STATE_CHANGE, this, this._syncState);
      }
    },
    abortSync: function() {
      if (this._syncState === SYNCING) {
        this._syncState = this._previousSync;
        this._previousSync = this._syncState;
        this.trigger(this._syncState, this, this._syncState);
        this.trigger(STATE_CHANGE, this, this._syncState);
      }
    }
  };
  _ref = [UNSYNCED, SYNCING, SYNCED, STATE_CHANGE];
  _fn = function(event) {
    return SyncMachine[event] = function(callback, context) {
      if (context == null) {
        context = this;
      }
      this.on(event, callback, context);
      if (this._syncState === event) {
        return callback.call(context);
      }
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    _fn(event);
  }
  if (typeof Object.freeze === "function") {
    Object.freeze(SyncMachine);
  }
  return SyncMachine;
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

define('core/models/model',['underscore', 'backbone', 'core/lib/utils', 'core/lib/subscriber', 'core/lib/sync_machine'], function() {
  

  var Backbone, Model, Subscriber, SyncMachine, utils, _;
  _ = require('underscore');
  Backbone = require('backbone');
  utils = require('core/lib/utils');
  Subscriber = require('core/lib/subscriber');
  SyncMachine = require('core/lib/sync_machine');
  return Model = (function(_super) {
    var serializeAttributes;

    __extends(Model, _super);

    function Model() {
      return Model.__super__.constructor.apply(this, arguments);
    }

    _(Model.prototype).extend(Subscriber);

    Model.prototype.initDeferred = function() {
      return _(this).extend($.Deferred());
    };

    Model.prototype.initSyncMachine = function() {
      return _(this).extend(SyncMachine);
    };

    Model.prototype.getAttributes = function() {
      return this.attributes;
    };

    serializeAttributes = function(model, attributes, modelStack) {
      var delegator, item, key, value;
      if (!modelStack) {
        delegator = utils.beget(attributes);
        modelStack = [model];
      } else {
        modelStack.push(model);
      }
      for (key in attributes) {
        value = attributes[key];
        if (value instanceof Model) {
          if (delegator == null) {
            delegator = utils.beget(attributes);
          }
          delegator[key] = value === model || __indexOf.call(modelStack, value) >= 0 ? null : serializeAttributes(value, value.getAttributes(), modelStack);
        } else if (value instanceof Backbone.Collection) {
          if (delegator == null) {
            delegator = utils.beget(attributes);
          }
          delegator[key] = (function() {
            var _i, _len, _ref, _results;
            _ref = value.models;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              item = _ref[_i];
              _results.push(serializeAttributes(item, item.getAttributes(), modelStack));
            }
            return _results;
          })();
        }
      }
      modelStack.pop();
      return delegator || attributes;
    };

    Model.prototype.serialize = function() {
      return serializeAttributes(this, this.getAttributes());
    };

    Model.prototype.saveAsJSON = function() {
      var ajaxPromise, json, promise, type,
        _this = this;
      json = this.toJSON();
      promise = $.Deferred();
      type = this.id != null ? 'update' : 'create';
      ajaxPromise = Backbone.sync(type, this, {
        url: this.url(),
        dataType: 'json',
        contentType: 'application/json; charset=UTF-8',
        data: window.JSON.stringify(json)
      });
      ajaxPromise.fail(function() {
        return promise.reject.apply(_this, arguments);
      }).done(function(json, status, ajaxObj) {
        return promise.resolve.apply(_this, [json, ajaxObj]);
      });
      return promise;
    };

    Model.prototype.disposed = false;

    Model.prototype.dispose = function() {
      var prop, properties, _i, _len;
      if (this.disposed) {
        return;
      }
      this.trigger('dispose', this);
      this.unsubscribeAllEvents();
      this.off();
      if (typeof this.reject === "function") {
        this.reject();
      }
      properties = ['collection', 'attributes', 'changed', '_escapedAttributes', '_previousAttributes', '_silent', '_pending', '_callbacks'];
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        prop = properties[_i];
        delete this[prop];
      }
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return Model;

  })(Backbone.Model);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/models/collection',['underscore', 'backbone', 'core/lib/subscriber', 'core/lib/sync_machine', 'core/models/model'], function() {
  

  var Backbone, Collection, Model, Subscriber, SyncMachine, _;
  _ = require('underscore');
  Backbone = require('backbone');
  Subscriber = require('core/lib/subscriber');
  SyncMachine = require('core/lib/sync_machine');
  Model = require('core/models/model');
  return Collection = (function(_super) {

    __extends(Collection, _super);

    function Collection() {
      return Collection.__super__.constructor.apply(this, arguments);
    }

    _(Collection.prototype).extend(Subscriber);

    Collection.prototype.model = Model;

    Collection.prototype.initDeferred = function() {
      return _(this).extend($.Deferred());
    };

    Collection.prototype.initSyncMachine = function() {
      return _(this).extend(SyncMachine);
    };

    Collection.prototype.addAtomic = function(models, options) {
      var direction, model;
      if (options == null) {
        options = {};
      }
      if (!models.length) {
        return;
      }
      options.silent = true;
      direction = typeof options.at === 'number' ? 'pop' : 'shift';
      while (model = models[direction]()) {
        this.add(model, options);
      }
      return this.trigger('reset');
    };

    Collection.prototype.update = function(models, options) {
      var fingerPrint, i, ids, model, newFingerPrint, preexistent, _i, _ids, _len;
      if (options == null) {
        options = {};
      }
      fingerPrint = this.pluck('id').join();
      ids = _(models).pluck('id');
      newFingerPrint = ids.join();
      if (newFingerPrint !== fingerPrint) {
        _ids = _(ids);
        i = this.models.length;
        while (i--) {
          model = this.models[i];
          if (!_ids.include(model.id)) {
            this.remove(model);
          }
        }
      }
      if (newFingerPrint !== fingerPrint || options.deep) {
        for (i = _i = 0, _len = models.length; _i < _len; i = ++_i) {
          model = models[i];
          preexistent = this.get(model.id);
          if (preexistent) {
            if (options.deep) {
              preexistent.set(model);
            }
          } else {
            this.add(model, {
              at: i
            });
          }
        }
      }
    };

    Collection.prototype.disposed = false;

    Collection.prototype.dispose = function() {
      var prop, properties, _i, _len;
      if (this.disposed) {
        return;
      }
      this.trigger('dispose', this);
      this.reset([], {
        silent: true
      });
      this.unsubscribeAllEvents();
      this.off();
      if (typeof this.reject === "function") {
        this.reject();
      }
      properties = ['model', 'models', '_byId', '_byCid', '_callbacks'];
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        prop = properties[_i];
        delete this[prop];
      }
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return Collection;

  })(Backbone.Collection);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/models/sync_collection',['core/models/collection'], function(Collection) {
  

  var SyncCollection;
  return SyncCollection = (function(_super) {

    __extends(SyncCollection, _super);

    function SyncCollection() {
      return SyncCollection.__super__.constructor.apply(this, arguments);
    }

    SyncCollection.prototype.initialize = function() {
      SyncCollection.__super__.initialize.apply(this, arguments);
      return this.initSyncMachine();
    };

    SyncCollection.prototype.sync = function(method, model, options) {
      var _this = this;
      if (options == null) {
        options = [];
      }
      this.beginSync();
      return Backbone.sync(method, model, options).always(function() {
        return _this.finishSync();
      });
    };

    return SyncCollection;

  })(Collection);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/models/navigation_model',['core/models/model', 'core/session'], function() {
  var Model, NavigationModel, Session;
  Model = require('core/models/model');
  Session = require('core/session');
  return NavigationModel = (function(_super) {

    __extends(NavigationModel, _super);

    function NavigationModel() {
      return NavigationModel.__super__.constructor.apply(this, arguments);
    }

    NavigationModel.prototype.navigation = {
      items: []
    };

    NavigationModel.prototype.createNavigationItem = function(label, url, permissions) {
      if (permissions == null) {
        permissions = [];
      }
      return {
        label: label,
        url: url,
        permissions: permissions
      };
    };

    NavigationModel.prototype.addItem = function(label, url, permissions) {
      var closure, navItem,
        _this = this;
      if (permissions == null) {
        permissions = [];
      }
      navItem = this.createNavigationItem(label, url, permissions);
      this.navigation.items.push(navItem);
      return closure = {
        addSubItem: function(label, url, permissions) {
          var subItem;
          if (permissions == null) {
            permissions = [];
          }
          if (navItem.items == null) {
            navItem.items = [];
          }
          subItem = _this.createNavigationItem(label, url, permissions);
          subItem.parent = navItem;
          navItem.items.push(subItem);
          return closure;
        }
      };
    };

    NavigationModel.prototype.findItemByPath = function(path, items) {
      var _this = this;
      if (items == null) {
        items = this.navigation.items;
      }
      return _.find(items, function(item) {
        var subitem;
        if (item.url === path) {
          return true;
        }
        if (item.items != null) {
          subitem = _this.findItemByPath(path, item.items);
          if (subitem != null) {
            return [item, subitem];
          }
        }
      });
    };

    NavigationModel.prototype.getNavigation = function(options) {
      if (options == null) {
        options = {};
      }
      _.defaults(options, {
        filtered: true
      });
      if (options.filtered) {
        return this.filterNavigationItems(this.navigation.items);
      }
      return this.navigation.items;
    };

    NavigationModel.prototype.filterNavigationItems = function(items) {
      var _this = this;
      return _.filter(items, function(item) {
        var ret;
        if (item.items != null) {
          item.items = _this.filterNavigationItems(item.items);
        }
        if (item.permissions == null) {
          return true;
        }
        ret = Session.user.checkAccess(item.permissions);
        return ret;
      });
    };

    return NavigationModel;

  })(Model);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/view',['underscore', 'backbone', 'handlebars', 'core/lib/utils', 'core/lib/subscriber', 'core/lib/logger', 'core/models/model'], function() {
  

  var Backbone, Handlebars, Logger, Model, Subscriber, View, utils, _;
  _ = require('underscore');
  Backbone = require('backbone');
  Handlebars = require('handlebars');
  utils = require('core/lib/utils');
  Subscriber = require('core/lib/subscriber');
  Logger = require('core/lib/logger');
  Model = require('core/models/model');
  return View = (function(_super) {

    __extends(View, _super);

    _(View.prototype).extend(Subscriber);

    _(View.prototype).extend(Logger);

    View.prototype.autoRender = false;

    View.prototype.container = null;

    View.prototype.containerMethod = 'append';

    View.prototype.subviews = null;

    View.prototype.subviewsByName = null;

    View.prototype.wrapMethod = function(name) {
      var func, instance;
      instance = this;
      func = instance[name];
      instance["" + name + "IsWrapped"] = true;
      return instance[name] = function() {
        if (this.disposed) {
          return false;
        }
        func.apply(instance, arguments);
        instance["after" + (utils.upcase(name))].apply(instance, arguments);
        return instance;
      };
    };

    function View() {
      if (this.initialize !== View.prototype.initialize) {
        this.wrapMethod('initialize');
      }
      if (this.render !== View.prototype.render) {
        this.wrapMethod('render');
      } else {
        this.render = _(this.render).bind(this);
      }
      View.__super__.constructor.apply(this, arguments);
    }

    View.prototype.initialize = function(options) {
      var prop, _i, _len, _ref;
      if (options) {
        _ref = ['autoRender', 'container', 'containerMethod'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          prop = _ref[_i];
          if (options[prop] != null) {
            this[prop] = options[prop];
          }
        }
      }
      this.subviews = [];
      this.subviewsByName = {};
      if (this.model || this.collection) {
        this.modelBind('dispose', this.dispose);
      }
      if (!this.initializeIsWrapped) {
        return this.afterInitialize();
      }
    };

    View.prototype.afterInitialize = function() {
      if (this.autoRender) {
        return this.render();
      }
    };

    View.prototype.delegate = function(eventType, second, third) {
      var handler, selector;
      if (typeof eventType !== 'string') {
        throw new TypeError('View#delegate: first argument must be a string');
      }
      if (arguments.length === 2) {
        handler = second;
      } else if (arguments.length === 3) {
        selector = second;
        if (typeof selector !== 'string') {
          throw new TypeError('View#delegate: ' + 'second argument must be a string');
        }
        handler = third;
      } else {
        throw new TypeError('View#delegate: ' + 'only two or three arguments are allowed');
      }
      if (typeof handler !== 'function') {
        throw new TypeError('View#delegate: ' + 'handler argument must be function');
      }
      eventType += ".delegate" + this.cid;
      handler = _(handler).bind(this);
      if (selector) {
        this.$el.on(eventType, selector, handler);
      } else {
        this.$el.on(eventType, handler);
      }
      return handler;
    };

    View.prototype.undelegate = function() {
      return this.$el.unbind(".delegate" + this.cid);
    };

    View.prototype.modelBind = function(type, handler) {
      var modelOrCollection;
      if (typeof type !== 'string') {
        throw new TypeError('View#modelBind: ' + 'type must be a string');
      }
      if (typeof handler !== 'function') {
        throw new TypeError('View#modelBind: ' + 'handler argument must be function');
      }
      modelOrCollection = this.model || this.collection;
      if (!modelOrCollection) {
        throw new TypeError('View#modelBind: no model or collection set');
      }
      modelOrCollection.off(type, handler, this);
      return modelOrCollection.on(type, handler, this);
    };

    View.prototype.modelUnbind = function(type, handler) {
      var modelOrCollection;
      if (typeof type !== 'string') {
        throw new TypeError('View#modelUnbind: ' + 'type argument must be a string');
      }
      if (typeof handler !== 'function') {
        throw new TypeError('View#modelUnbind: ' + 'handler argument must be a function');
      }
      modelOrCollection = this.model || this.collection;
      if (!modelOrCollection) {
        return;
      }
      return modelOrCollection.off(type, handler);
    };

    View.prototype.modelUnbindAll = function() {
      var modelOrCollection;
      modelOrCollection = this.model || this.collection;
      if (!modelOrCollection) {
        return;
      }
      return modelOrCollection.off(null, null, this);
    };

    View.prototype.pass = function(attribute, selector) {
      var _this = this;
      return this.modelBind("change:" + attribute, function(model, value) {
        var $el;
        $el = _this.$(selector);
        if ($el.is('input, textarea, select, button')) {
          return $el.val(value);
        } else {
          return $el.text(value);
        }
      });
    };

    View.prototype.subview = function(name, view) {
      if (name && view) {
        this.removeSubview(name);
        this.subviews.push(view);
        this.subviewsByName[name] = view;
        return view;
      } else if (name) {
        return this.subviewsByName[name];
      }
    };

    View.prototype.removeSubview = function(nameOrView) {
      var index, name, otherName, otherView, view, _ref;
      if (!nameOrView) {
        return;
      }
      if (typeof nameOrView === 'string') {
        name = nameOrView;
        view = this.subviewsByName[name];
      } else {
        view = nameOrView;
        _ref = this.subviewsByName;
        for (otherName in _ref) {
          otherView = _ref[otherName];
          if (view === otherView) {
            name = otherName;
            break;
          }
        }
      }
      if (!(name && view && view.dispose)) {
        return;
      }
      view.dispose();
      index = _(this.subviews).indexOf(view);
      if (index > -1) {
        this.subviews.splice(index, 1);
      }
      return delete this.subviewsByName[name];
    };

    View.prototype.getTemplateData = function() {
      var items, model, modelOrCollection, templateData, _i, _len, _ref;
      if (this.model) {
        templateData = this.model.serialize();
      } else if (this.collection) {
        items = [];
        _ref = this.collection.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          model = _ref[_i];
          items.push(model.serialize());
        }
        templateData = {
          items: items
        };
      } else {
        templateData = {};
      }
      modelOrCollection = this.model || this.collection;
      if (modelOrCollection) {
        if (typeof modelOrCollection.state === 'function' && !('resolved' in templateData)) {
          templateData.resolved = modelOrCollection.state() === 'resolved';
        }
        if (typeof modelOrCollection.isSynced === 'function' && !('synced' in templateData)) {
          templateData.synced = modelOrCollection.isSynced();
        }
      }
      return templateData;
    };

    View.prototype.getTemplateFunction = function(templateName) {
      var tplFunc;
      if (_.isString(this.template)) {
        if (typeof JST !== "undefined" && JST !== null ? JST[this.template] : void 0) {
          tplFunc = JST[this.template];
        } else {
          tplFunc = this.constructor.prototype.template = Handlebars.compile(this.template);
        }
      } else {
        if (this.template != null) {
          tplFunc = _.bind(this.template, this);
        }
      }
      return tplFunc;
    };

    View.prototype.render = function() {
      var helpContent, html, modelOrCollection, templateFunc;
      if (this.disposed) {
        return false;
      }
      templateFunc = this.getTemplateFunction();
      if (typeof templateFunc === 'function') {
        html = templateFunc(this.getTemplateData());
        this.$el.empty().append(html);
      }
      if (this.helpContent != null) {
        modelOrCollection = this.model || this.collection;
        helpContent = this.helpContent.apply(this, [modelOrCollection]);
        helpContent = this.helpPreContent + helpContent + this.helpPostContent;
        this.$el.append(helpContent);
      }
      if (!this.renderIsWrapped) {
        this.afterRender();
      }
      return this;
    };

    View.prototype.hasHelp = function() {
      return this.helpContent != null;
    };

    View.prototype.helpPreContent = "<div class=\"modal hide\" id=\"helpModal\">\n  <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\">×</button>\n      <h3>Ajuda</h3>\n  </div>\n  <div class=\"modal-body\">";

    View.prototype.helpPostContent = "    </div>\n    <div class=\"modal-footer\">\n        <a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Fechar</a>\n    </div>\n</div>";

    View.prototype.afterRender = function() {
      if (this.container) {
        $(this.container)[this.containerMethod](this.el);
        return this.trigger('addedToDOM');
      }
    };

    View.prototype.getError = function(resp) {
      var json;
      json = $.parseJSON(resp.responseText);
      return {
        message: json.erro.message,
        code: json.erro.code,
        status: json.status
      };
    };

    View.prototype.disposed = false;

    View.prototype.dispose = function() {
      var prop, properties, subview, _i, _j, _len, _len1, _ref;
      if (this.disposed) {
        return;
      }
      _ref = this.subviews;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        subview = _ref[_i];
        subview.dispose();
      }
      this.unsubscribeAllEvents();
      this.modelUnbindAll();
      this.off();
      this.$el.remove();
      properties = ['el', '$el', 'options', 'model', 'collection', 'subviews', 'subviewsByName', '_callbacks'];
      for (_j = 0, _len1 = properties.length; _j < _len1; _j++) {
        prop = properties[_j];
        delete this[prop];
      }
      this.disposed = true;
      return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
    };

    return View;

  })(Backbone.View);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/breadcrumb_view',['core/views/view', 'handlebars'], function() {
  var BreadcrumbView, Handlebars, View;
  View = require('core/views/view');
  Handlebars = require('handlebars');
  return BreadcrumbView = (function(_super) {

    __extends(BreadcrumbView, _super);

    function BreadcrumbView() {
      return BreadcrumbView.__super__.constructor.apply(this, arguments);
    }

    BreadcrumbView.prototype.template = "{{#if items}}\n<ul class=\"breadcrumb\">\n  <li>\n    <a href=\"#\">Página inicial</a>\n    <span class=\"divider\">»</span>\n  </li>\n  {{#each items}}\n    {{#unless this.url}}\n    <li class=\"active\">\n      {{this.label}}\n      <span class=\"divider\">»</span>\n    </li>\n    {{else}}\n    <li>\n      <a href=\"{{this.url}}\">{{this.label}}</a>\n      <span class=\"divider\">»</span>\n    </li>\n    {{/unless}}\n  {{/each}}\n</ul>\n{{/if}}";

    BreadcrumbView.prototype.initialize = function(options) {
      BreadcrumbView.__super__.initialize.apply(this, arguments);
      this.template = Handlebars.compile(this.template);
      this.model = options.navigationModel;
      return this.subscribeEvent('startupController', this.onControllerStartup);
    };

    BreadcrumbView.prototype.onControllerStartup = function(startup) {
      this.breadcrumbData = startup.controller.breadcrumb;
      return this.render();
    };

    BreadcrumbView.prototype.render = function() {
      var htmlText, templateData;
      BreadcrumbView.__super__.render.apply(this, arguments);
      templateData = {
        items: this.breadcrumbData
      };
      htmlText = this.template(templateData);
      htmlText = $(htmlText);
      htmlText.find('li:last-child .divider').remove();
      return this.$el.append(htmlText);
    };

    return BreadcrumbView;

  })(View);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/navigation_view',['core/views/view', 'core/models/navigation_model', 'handlebars'], function() {
  var Handlebars, NavigationModel, NavigationView, View;
  View = require('core/views/view');
  NavigationModel = require('core/models/navigation_model');
  Handlebars = require('handlebars');
  return NavigationView = (function(_super) {

    __extends(NavigationView, _super);

    function NavigationView() {
      return NavigationView.__super__.constructor.apply(this, arguments);
    }

    NavigationView.prototype.navigationTemplate = "<ul class=\"nav\">\n  {{#each items}}\n    {{#if this.items}}\n      <li class=\"dropdown\">\n        <a href class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n          {{this.label}}\n          <b class=\"caret\"></b>\n        </a>\n        <ul class=\"dropdown-menu\">\n          {{#each this.items}}\n            <li><a href=\"{{this.url}}\">{{this.label}}</a></li>\n          {{/each}}\n        </ul>\n      </li>\n    {{else}}\n      <li><a href=\"{{this.url}}\">{{this.label}}</a></li>\n    {{/if}}\n  {{/each}}\n</ul>";

    NavigationView.prototype.initialize = function(options) {
      NavigationView.__super__.initialize.apply(this, arguments);
      if (!((options.navigationModel != null) || (options.navigationModel(isPrototypeOf(NavigationModel))) === false)) {
        throw new Error('The class NavigationView needs a NavigationModel instance to work properly');
      }
      this.model = options.navigationModel;
      return this.navigationTemplate = Handlebars.compile(this.navigationTemplate);
    };

    NavigationView.prototype.render = function() {
      var htmlText;
      NavigationView.__super__.render.apply(this, arguments);
      htmlText = this.navigationTemplate({
        items: this.model.getNavigation()
      });
      return this.$el.html(htmlText);
    };

    return NavigationView;

  })(View);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/sesc_layout',['core/views/layout', 'core/views/breadcrumb_view', 'core/views/navigation_view', 'core/models/navigation_model'], function() {
  

  var BreadcrumbView, Handlebars, Layout, NavigationModel, NavigationView, SescLayout, Session;
  Handlebars = require('handlebars');
  Layout = require('core/views/layout');
  BreadcrumbView = require('core/views/breadcrumb_view');
  NavigationView = require('core/views/navigation_view');
  NavigationModel = require('core/models/navigation_model');
  Session = require('core/session');
  return SescLayout = (function(_super) {

    __extends(SescLayout, _super);

    function SescLayout() {
      return SescLayout.__super__.constructor.apply(this, arguments);
    }

    SescLayout.prototype.template = "<div class=\"application-navbar navbar\">\n  <div class=\"navbar-inner\">\n    <div class=\"container\">\n      <a class=\"btn btn-navbar\" data-toggle=\"collapse\" data-target=\".nav-collapse\">\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n      </a>\n      <a class=\"brand\" href=\"#\">App</a>\n      <ul class=\"nav account-nav pull-right\">\n        <li class=\"dropdown\">\n          <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\"> <i class=\"icon-white icon-user\"></i>\n            <span class=\"logged-user\">{{user.nome}}</span> <b class=\"caret\"></b>\n          </a>\n          <ul class=\"dropdown-menu\">\n            <li>\n              <a href=\"#\">Sair</a>\n            </li>\n          </ul>\n        </li>\n      </ul>\n      <div class=\"nav-collapse nav-container\">\n        <ul class=\"nav\"></ul>\n      </div>\n    </div>\n  </div>\n</div>\n<div class=\"page-header\">\n  <div class=\"container\">\n    <div class=\"page-header-options\">\n      <div class=\"btn-group\">\n        <button href=\"#\" class=\"btn print-page\"> <i class=\"icon-print\" />Imprimir\n        </button>\n        <button class=\"btn btn-help\" data-toggle=\"modal\" href=\"#helpModal\">\n          <i class=\"icon-question-sign\" />Ajuda\n        </button>\n      </div>\n    </div>\n    <div class=\"breadcrumb-container\"></div>\n    <h1></h1>\n  </div>\n</div>\n<div id=\"application\" class=\"container\">\n  <div id=\"module-container\"></div>\n</div>";

    SescLayout.prototype.navigationModelClass = NavigationModel;

    SescLayout.prototype.breadcrumbView = BreadcrumbView;

    SescLayout.prototype.navigationView = NavigationView;

    SescLayout.prototype.breadcrumContainerSelector = '.breadcrumb-container';

    SescLayout.prototype.navigationContainerSelector = '.nav-container';

    SescLayout.prototype.initialize = function() {
      SescLayout.__super__.initialize.apply(this, arguments);
      this.subscribeEvent('startupController', this.updateHelp);
      this.subscribeEvent('startupController', this.updateTitle);
      this.subscribeEvent('startupController', this.activeNavigationItem);
      this.subscribeEvent('userAuthenticated', this.updateUser);
      return this.render();
    };

    SescLayout.prototype.activeNavigationItem = function(data) {
      var $anchor, $nav, classActive, path, _ref, _ref1;
      path = (data != null ? (_ref = data.params) != null ? _ref.path : void 0 : void 0) || '';
      $nav = (_ref1 = this.navigationView) != null ? _ref1.$el : void 0;
      classActive = 'active';
      $anchor = $nav != null ? $nav.find(("[href='#" + path + "']") || []) : void 0;
      $nav.find("li." + classActive).removeClass("" + classActive);
      if ($anchor.length) {
        return $anchor.parents('li').addClass("" + classActive);
      }
    };

    SescLayout.prototype.updateUser = function() {
      return this.$el.find('.logged-user').text(Session.user.name);
    };

    SescLayout.prototype.updateHelp = function(config) {
      /* Atualiza o botão de help do layout
      */

      var helpButton;
      helpButton = this.layoutEl.find('.btn-help');
      if (config.controller.view.helpContent != null) {
        return helpButton.removeAttr('disabled');
      } else {
        return helpButton.attr('disabled', 'disabled');
      }
    };

    SescLayout.prototype.updateTitle = function(config) {
      var subTitleTag, titleTag;
      titleTag = $('.page-header h1');
      /* Atualiza o titulo da sessão sendo exibida utilizando o titulo do controller
      */

      titleTag.html(config.controller.title);
      /* Inclui o subtítulo no header, se ele existir
      */

      if (config.controller.subTitle) {
        subTitleTag = $('<small>').text(config.controller.subTitle);
        return titleTag.append(subTitleTag);
      }
    };

    SescLayout.prototype.render = function() {
      var templateData;
      this.template = Handlebars.compile(this.template);
      templateData = {
        user: Session.user
      };
      this.layoutEl = $(this.template(templateData));
      this.navigationModel = new this.navigationModelClass;
      this.breadcrumbView = new this.breadcrumbView({
        navigationModel: this.navigationModel
      });
      this.layoutEl.find(this.breadcrumContainerSelector).html(this.breadcrumbView.render().el);
      this.navigationView = new this.navigationView({
        navigationModel: this.navigationModel
      });
      this.layoutEl.find(this.navigationContainerSelector).html(this.navigationView.render().el);
      return $(this.layoutEl).appendTo('body');
    };

    return SescLayout;

  })(Layout);
});

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/collection_view',['underscore', 'core/views/view'], function() {
  

  var CollectionView, View, _;
  _ = require('underscore');
  View = require('core/views/view');
  return CollectionView = (function(_super) {

    __extends(CollectionView, _super);

    function CollectionView() {
      this.renderAllItems = __bind(this.renderAllItems, this);

      this.showHideFallback = __bind(this.showHideFallback, this);

      this.itemsResetted = __bind(this.itemsResetted, this);

      this.itemRemoved = __bind(this.itemRemoved, this);

      this.itemAdded = __bind(this.itemAdded, this);
      return CollectionView.__super__.constructor.apply(this, arguments);
    }

    CollectionView.prototype.animationDuration = 500;

    CollectionView.prototype.useCssAnimation = false;

    CollectionView.prototype.listSelector = null;

    CollectionView.prototype.$list = null;

    CollectionView.prototype.fallbackSelector = null;

    CollectionView.prototype.$fallback = null;

    CollectionView.prototype.loadingSelector = null;

    CollectionView.prototype.$loading = null;

    CollectionView.prototype.itemSelector = null;

    CollectionView.prototype.itemView = null;

    CollectionView.prototype.filterer = null;

    CollectionView.prototype.viewsByCid = null;

    CollectionView.prototype.visibleItems = null;

    CollectionView.prototype.getView = function(model) {
      if (this.itemView != null) {
        return new this.itemView({
          model: model
        });
      } else {
        throw new Error('The CollectionView#itemView property must be\
defined (or the getView() must be overridden)');
      }
    };

    CollectionView.prototype.getTemplateFunction = function() {};

    CollectionView.prototype.initialize = function(options) {
      if (options == null) {
        options = {};
      }
      CollectionView.__super__.initialize.apply(this, arguments);
      _(options).defaults({
        render: true,
        renderItems: true,
        filterer: null
      });
      if (options.itemView != null) {
        this.itemView = options.itemView;
      }
      this.viewsByCid = {};
      this.visibleItems = [];
      this.addCollectionListeners();
      if (options.filterer) {
        this.filter(options.filterer);
      }
      if (options.render) {
        this.render();
      }
      if (options.renderItems) {
        return this.renderAllItems();
      }
    };

    CollectionView.prototype.addCollectionListeners = function() {
      this.modelBind('add', this.itemAdded);
      this.modelBind('remove', this.itemRemoved);
      return this.modelBind('reset', this.itemsResetted);
    };

    CollectionView.prototype.itemAdded = function(item, collection, options) {
      if (options == null) {
        options = {};
      }
      return this.renderAndInsertItem(item, options.index);
    };

    CollectionView.prototype.itemRemoved = function(item) {
      return this.removeViewForItem(item);
    };

    CollectionView.prototype.itemsResetted = function() {
      return this.renderAllItems();
    };

    CollectionView.prototype.render = function() {
      CollectionView.__super__.render.apply(this, arguments);
      this.$list = this.listSelector ? this.$(this.listSelector) : this.$el;
      this.initFallback();
      return this.initLoadingIndicator();
    };

    CollectionView.prototype.initFallback = function() {
      if (!this.fallbackSelector) {
        return;
      }
      this.$fallback = this.$(this.fallbackSelector);
      this.bind('visibilityChange', this.showHideFallback);
      return this.modelBind('syncStateChange', this.showHideFallback);
    };

    CollectionView.prototype.showHideFallback = function() {
      var visible;
      visible = this.visibleItems.length === 0 && (typeof this.collection.isSynced === 'function' ? this.collection.isSynced() : true);
      this.$fallback.css('display', visible ? '' : 'none');
      return visible;
    };

    CollectionView.prototype.initLoadingIndicator = function() {
      if (!(this.loadingSelector && typeof this.collection.isSyncing === 'function')) {
        return;
      }
      this.$loading = this.$(this.loadingSelector);
      this.modelBind('syncStateChange', this.showHideLoadingIndicator);
      return this.showHideLoadingIndicator();
    };

    CollectionView.prototype.showHideLoadingIndicator = function() {
      var visible;
      visible = this.collection.length === 0 && this.collection.isSyncing();
      return this.$loading.css('display', visible ? '' : 'none');
    };

    CollectionView.prototype.filter = function(filterer) {
      var included, index, item, view, _i, _len, _ref;
      this.filterer = filterer;
      if (!_(this.viewsByCid).isEmpty()) {
        _ref = this.collection.models;
        for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
          item = _ref[index];
          included = typeof filterer === 'function' ? filterer(item, index) : true;
          view = this.viewsByCid[item.cid];
          if (!view) {
            throw new Error('CollectionView#filter: ' + ("no view found for " + item.cid));
          }
          view.$el.stop(true, true).css('display', included ? '' : 'none');
          this.updateVisibleItems(item, included, false);
        }
      }
      return this.trigger('visibilityChange', this.visibleItems);
    };

    CollectionView.prototype.renderAllItems = function() {
      var cid, index, item, items, remainingViewsByCid, view, _i, _j, _len, _len1, _ref;
      items = this.collection.models;
      this.visibleItems = [];
      remainingViewsByCid = {};
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        view = this.viewsByCid[item.cid];
        if (view) {
          remainingViewsByCid[item.cid] = view;
        }
      }
      _ref = this.viewsByCid;
      for (cid in _ref) {
        if (!__hasProp.call(_ref, cid)) continue;
        view = _ref[cid];
        if (!(cid in remainingViewsByCid)) {
          this.removeView(cid, view);
        }
      }
      for (index = _j = 0, _len1 = items.length; _j < _len1; index = ++_j) {
        item = items[index];
        view = this.viewsByCid[item.cid];
        if (view) {
          this.insertView(item, view, index, false);
        } else {
          this.renderAndInsertItem(item, index);
        }
      }
      if (!items.length) {
        return this.trigger('visibilityChange', this.visibleItems);
      }
    };

    CollectionView.prototype.renderAndInsertItem = function(item, index) {
      var view;
      view = this.renderItem(item);
      return this.insertView(item, view, index);
    };

    CollectionView.prototype.renderItem = function(item) {
      var view;
      view = this.viewsByCid[item.cid];
      if (!view) {
        view = this.getView(item);
        this.viewsByCid[item.cid] = view;
      }
      view.render();
      return view;
    };

    CollectionView.prototype.insertView = function(item, view, index, enableAnimation) {
      var $list, $next, $previous, $viewEl, children, included, length, position, viewEl,
        _this = this;
      if (index == null) {
        index = null;
      }
      if (enableAnimation == null) {
        enableAnimation = true;
      }
      position = typeof index === 'number' ? index : this.collection.indexOf(item);
      included = typeof this.filterer === 'function' ? this.filterer(item, position) : true;
      viewEl = view.el;
      $viewEl = view.$el;
      if (included) {
        if (enableAnimation) {
          if (this.useCssAnimation) {
            $viewEl.addClass('animated-item-view');
          } else {
            $viewEl.css('opacity', 0);
          }
        }
      } else {
        $viewEl.css('display', 'none');
      }
      $list = this.$list;
      children = $list.children(this.itemSelector || void 0);
      length = children.length;
      if (length === 0 || position === length) {
        $list.append(viewEl);
      } else {
        if (position === 0) {
          $next = children.eq(position);
          $next.before(viewEl);
        } else {
          $previous = children.eq(position - 1);
          $previous.after(viewEl);
        }
      }
      view.trigger('addedToDOM');
      this.updateVisibleItems(item, included);
      if (enableAnimation && included) {
        if (this.useCssAnimation) {
          setTimeout(function() {
            return $viewEl.addClass('animated-item-view-end');
          }, 0);
        } else {
          $viewEl.animate({
            opacity: 1
          }, this.animationDuration);
        }
      }
    };

    CollectionView.prototype.removeViewForItem = function(item) {
      var view;
      this.updateVisibleItems(item, false);
      view = this.viewsByCid[item.cid];
      return this.removeView(item.cid, view);
    };

    CollectionView.prototype.removeView = function(cid, view) {
      view.dispose();
      return delete this.viewsByCid[cid];
    };

    CollectionView.prototype.updateVisibleItems = function(item, includedInFilter, triggerEvent) {
      var includedInVisibleItems, visibilityChanged, visibleItemsIndex;
      if (triggerEvent == null) {
        triggerEvent = true;
      }
      visibilityChanged = false;
      visibleItemsIndex = _(this.visibleItems).indexOf(item);
      includedInVisibleItems = visibleItemsIndex > -1;
      if (includedInFilter && !includedInVisibleItems) {
        this.visibleItems.push(item);
        visibilityChanged = true;
      } else if (!includedInFilter && includedInVisibleItems) {
        this.visibleItems.splice(visibleItemsIndex, 1);
        visibilityChanged = true;
      }
      if (visibilityChanged && triggerEvent) {
        this.trigger('visibilityChange', this.visibleItems);
      }
      return visibilityChanged;
    };

    CollectionView.prototype.dispose = function() {
      var cid, prop, properties, view, _i, _len, _ref;
      if (this.disposed) {
        return;
      }
      _ref = this.viewsByCid;
      for (cid in _ref) {
        if (!__hasProp.call(_ref, cid)) continue;
        view = _ref[cid];
        view.dispose();
      }
      properties = ['$list', '$fallback', '$loading', 'viewsByCid', 'visibleItems'];
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        prop = properties[_i];
        delete this[prop];
      }
      return CollectionView.__super__.dispose.apply(this, arguments);
    };

    return CollectionView;

  })(View);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/table_crud_view',['core/views/view', 'core/views/collection_view'], function() {
  

  var CollectionView, TableCrudView, View;
  View = require('core/views/view');
  CollectionView = require('core/views/collection_view');
  return TableCrudView = (function(_super) {

    __extends(TableCrudView, _super);

    function TableCrudView() {
      return TableCrudView.__super__.constructor.apply(this, arguments);
    }

    TableCrudView.prototype.useCssAnimation = true;

    TableCrudView.prototype.headerTemplate = function() {
      return "<thead>\n  <tr>\n    <th>id</th>\n    <th></th>\n  </tr>\n</thead>";
    };

    TableCrudView.prototype.createLabel = "Adicionar";

    TableCrudView.prototype.optionsTemplate = function() {
      return "<p class=\"clearfix\">\n  <a href=\"" + (this.createLink()) + "\" class=\"btn btn-primary pull-right\">" + this.createLabel + "</a>\n</p>";
    };

    TableCrudView.prototype.createLink = function() {
      throw new Error('createLink should be overrided');
    };

    TableCrudView.prototype.emptyCollectionMessage = "Nenhum resultado encontrado";

    TableCrudView.prototype.loadingMessage = "Carregando";

    TableCrudView.prototype.applyDatatable = true;

    TableCrudView.prototype.template = function() {
      return "" + (this.optionsTemplate()) + "\n<div class=\"table-crud-container\" style=\"display: none;\">\n  <table class=\"table table-bordered\">\n    " + (this.headerTemplate()) + "\n    <tbody>\n    </tbody>\n  </table>\n</div>\n<p class=\"fallback alert\">" + this.emptyCollectionMessage + "</p>\n<p class=\"loading\" spin></p>";
    };

    TableCrudView.prototype.listContainerSelector = ".table-crud-container";

    TableCrudView.prototype.listSelector = 'table tbody';

    TableCrudView.prototype.loadingSelector = '.loading';

    TableCrudView.prototype.fallbackSelector = '.fallback';

    TableCrudView.prototype.getTemplateFunction = View.prototype.getTemplateFunction;

    TableCrudView.prototype.render = function() {
      TableCrudView.__super__.render.apply(this, arguments);
      return this.initListContainerFallback();
    };

    TableCrudView.prototype.initListContainerFallback = function() {
      this.$listContainer = this.$(this.listContainerSelector);
      this.modelBind('syncStateChange', this.showHideListContainer);
      this.bind('visibilityChange', this.showHideListContainer);
      return this.showHideListContainer();
    };

    TableCrudView.prototype.showHideListContainer = function() {
      var visible;
      visible = this.collection.length !== 0;
      return this.$listContainer.css('display', visible ? '' : 'none');
    };

    TableCrudView.prototype.renderAllItems = function() {
      /* Método executado após a renderização da view. Nesse ponto efetuamos o redraw da tabela
      */
      TableCrudView.__super__.renderAllItems.apply(this, arguments);
      if (this.collection.length > 0) {
        return this.redrawTable();
      }
    };

    TableCrudView.prototype.redrawTable = function() {
      /* Redezenha a tabela utilizando a API do DataTables
      */
      if (this.applyDatatable && !this.oTable) {
        return this.oTable = this.$('table').dataTable();
      }
    };

    TableCrudView.prototype.itemRemoved = function(item) {
      /* Override do método itemRemoved para remover a linha também do DataTable
      */

      var row, view;
      if (this.oTable) {
        view = this.viewsByCid[item.cid];
        row = view.el;
        this.oTable.fnDeleteRow(row);
      }
      return TableCrudView.__super__.itemRemoved.apply(this, arguments);
    };

    TableCrudView.prototype.initialize = function() {
      /* Override do método initialize para efetuar o fetch da coleção que essa view irá exibir
      */
      TableCrudView.__super__.initialize.apply(this, arguments);
      return this.collection.fetch();
    };

    return TableCrudView;

  })(CollectionView);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/item_view',['core/views/view', 'core/feedback'], function() {
  var Feedback, ItemView, Router, View;
  View = require('core/views/view');
  Router = require('core/lib/router');
  Feedback = require('core/feedback');
  ItemView = (function(_super) {

    __extends(ItemView, _super);

    function ItemView() {
      return ItemView.__super__.constructor.apply(this, arguments);
    }

    ItemView.prototype.template = function() {
      return "<td>{{this.id}}</td>\n<td class=\"text-align-center\" width=\"80\">\n    <a href=\"#\" class=\"delete\">Delete</a>\n    <a href=\"" + (this.editLink()) + "\" class=\"edit\">Edit</a>\n</td>";
    };

    ItemView.prototype.editLink = function() {
      throw new Error('editLink should be overrided');
    };

    ItemView.prototype.tagName = 'tr';

    ItemView.prototype.removeConfirmMessage = 'Deseja remover esse registro?';

    ItemView.prototype.removedMessage = 'Registro removido.';

    ItemView.prototype.initialize = function() {
      ItemView.__super__.initialize.apply(this, arguments);
      this.delegate('click', '.delete', this.deleteHandler);
      return this.delegate('click', '.edit', this.editHandler);
    };

    ItemView.prototype.closeTooltips = function() {
      return $('.tooltip').remove();
    };

    ItemView.prototype.editHandler = function(event) {
      var $currentTarget, editUrl;
      event.preventDefault();
      $currentTarget = $(event.currentTarget);
      editUrl = $currentTarget.attr('href') || $currentTarget.data('href');
      this.closeTooltips();
      return application.router.route(editUrl);
    };

    ItemView.prototype.deleteHandler = function(event) {
      var _this = this;
      event.preventDefault();
      this.closeTooltips();
      if (confirm(this.removeConfirmMessage)) {
        return this.model.destroy({
          wait: true
        }).fail(function(resp, status) {
          var error;
          return error = _this.getError(resp);
        }).done(function() {
          return Feedback.success(_this.removedMessage);
        });
      }
    };

    return ItemView;

  })(View);
  return ItemView;
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/form_view',['core/views/view'], function() {
  var FormView, View;
  View = require('core/views/view');
  return FormView = (function(_super) {

    __extends(FormView, _super);

    function FormView() {
      return FormView.__super__.constructor.apply(this, arguments);
    }

    FormView.prototype.formSelector = 'form';

    FormView.prototype.formEvent = 'submit';

    FormView.prototype.actionElsSelector = 'button, a, .btn, select, input, i, textarea';

    FormView.prototype.validationRules = null;

    FormView.prototype.initialize = function() {
      FormView.__super__.initialize.apply(this, arguments);
      return this.delegate(this.formEvent, this.formSelector, this.submitHandler);
    };

    FormView.prototype.afterRender = function() {
      FormView.__super__.afterRender.apply(this, arguments);
      this.$form = this.$el.find(this.formSelector);
      if (this.validationRules != null) {
        this.$form.setValidationRules(this.validationRules);
      }
      return this.$form.find(':input[mask!="date"]:first:visible').focus();
    };

    FormView.prototype.submitHandler = function(event) {
      return event.preventDefault();
    };

    FormView.prototype.disableActions = function() {
      var $el;
      $el = this.$form || this.$el;
      if ($el) {
        return $el.find(this.actionElsSelector).attr('disabled', true).addClass('disabled');
      }
    };

    FormView.prototype.enableActions = function() {
      var $el;
      $el = this.$form || this.$el;
      if ($el) {
        return $el.find(this.actionElsSelector).removeAttr('disabled').removeClass('disabled');
      }
    };

    return FormView;

  })(View);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/edit_view',['core/views/form_view', 'core/feedback'], function() {
  var EditView, Feedback, FormView;
  FormView = require('core/views/form_view');
  Feedback = require('core/feedback');
  return EditView = (function(_super) {

    __extends(EditView, _super);

    function EditView() {
      return EditView.__super__.constructor.apply(this, arguments);
    }

    EditView.prototype.successMessage = "Registro editado.";

    EditView.prototype.initialize = function() {
      EditView.__super__.initialize.apply(this, arguments);
      this.modelBind('change', this.render);
      return this.model.fetch();
    };

    EditView.prototype.fillForm = function(model) {
      throw new Error("Should be overrided in " + this);
    };

    EditView.prototype.fillModel = function(form) {
      throw new Error("Should be overrided in " + this);
    };

    EditView.prototype.render = function() {
      EditView.__super__.render.apply(this, arguments);
      return this.fillForm(this.model);
    };

    EditView.prototype.submitHandler = function(event) {
      var _this = this;
      EditView.__super__.submitHandler.apply(this, arguments);
      this.modelUnbind('change', this.render);
      this.fillModel(this.$form);
      this.disableActions();
      return this.model.save().done(function() {
        Feedback.success(_this.successMessage);
        return _this.trigger('model:saved');
      }).fail(function(resp, status) {
        var error;
        error = _this.getError(resp);
        return _this.trigger('model:notSaved', error);
      }).always(function() {
        return _this.enableActions();
      });
    };

    return EditView;

  })(FormView);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/create_view',['core/views/form_view', 'core/feedback'], function() {
  var CreateView, Feedback, FormView;
  FormView = require('core/views/form_view');
  Feedback = require('core/feedback');
  return CreateView = (function(_super) {

    __extends(CreateView, _super);

    function CreateView() {
      return CreateView.__super__.constructor.apply(this, arguments);
    }

    CreateView.prototype.successMessage = "Registro criado.";

    CreateView.prototype.fillModel = function(form) {
      throw new Error("Should be overrided in " + this);
    };

    CreateView.prototype.submitHandler = function(event) {
      var _this = this;
      CreateView.__super__.submitHandler.apply(this, arguments);
      this.fillModel(this.$form);
      this.disableActions();
      return this.model.save().done(function() {
        Feedback.success(_this.successMessage);
        return _this.trigger('model:saved');
      }).fail(function(resp, status) {
        var error;
        error = _this.getError(resp);
        return _this.trigger('model:notSaved', error);
      }).always(function() {
        return _this.enableActions();
      });
    };

    return CreateView;

  })(FormView);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/calendar_view',['underscore', 'core/views/view', 'core/dao_factory', 'core/mediator', 'core/feedback'], function() {
  var CalendarView, DaoFactory, Feedback, Mediator, View, _;
  _ = require('underscore');
  View = require('core/views/view');
  DaoFactory = require('core/dao_factory');
  Mediator = require('core/mediator');
  Feedback = require('core/feedback');
  return CalendarView = (function(_super) {

    __extends(CalendarView, _super);

    function CalendarView() {
      return CalendarView.__super__.constructor.apply(this, arguments);
    }

    CalendarView.prototype.autoRender = true;

    CalendarView.prototype.container = '#module-container';

    CalendarView.prototype.events = {
      'change [name=mes]': 'filtroHandler',
      'change [name=ano]': 'filtroHandler'
    };

    CalendarView.prototype.monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    CalendarView.prototype.monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    CalendarView.prototype.dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    CalendarView.prototype.dayNamesShort = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    CalendarView.prototype.successMessage = 'Evento alterado';

    CalendarView.prototype.currentDate = moment();

    CalendarView.prototype.maxYear = 2050;

    CalendarView.prototype.enableEventCRUD = false;

    CalendarView.prototype.createView = null;

    CalendarView.prototype.editView = null;

    CalendarView.prototype.eventoModel = null;

    CalendarView.prototype.eventoDaoName = '';

    CalendarView.prototype.eventos = null;

    CalendarView.prototype.initialize = function() {
      if (!$.fn.fullCalendar) {
        throw new Error('Depende do plugin fullcalendar (http://arshaw.com/fullcalendar/) para funcionar');
      }
      if (!this.eventoModel) {
        throw new Error('eventoModel nao definido');
      }
      if (!this.eventos) {
        throw new Error('tipos de eventos não informados');
      }
      if (!this.eventoDaoName) {
        throw new Error('eventoDaoName nao informado');
      }
      if (this.enableEventCRUD) {
        if (!(this.createView != null) || !(this.editView != null)) {
          throw new Error('Criação de eventos habilitada e views de criação e edição informados');
        }
        if (!(this.saveModelHandler != null)) {
          throw new Error('Criação de eventos habilitada e saveModelHandler não implementado');
        }
      }
      this.eventoDao = DaoFactory.getDAOByName(this.eventoDaoName);
      CalendarView.__super__.initialize.apply(this, arguments);
      return Mediator.subscribe('calendar:refresh', this.refresh, this);
    };

    CalendarView.prototype.template = function() {
      var i, label, selectMonths, selectYears, year, _i, _len, _ref;
      selectMonths = '<select name="mes">';
      _ref = this.monthNames;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        label = _ref[i];
        selectMonths += "<option value=\"" + (i + 1) + "\">" + label + "</option>";
      }
      selectMonths += '</select>';
      year = this.currentDate.year();
      selectYears = '<select name="ano">';
      while (year <= this.maxYear) {
        selectYears += "<option value=\"" + year + "\">" + year + "</option>";
        year++;
      }
      selectYears += '</select>';
      return "<header class=\"calendar-header\">\n  <span>Mês:</span>\n  " + selectMonths + "\n  <span>Ano:</span>\n  " + selectYears + "\n</header>\n<section id=\"calendar\">\n  <a id=\"popover-eventos\" class=\"hide\"></a>\n</section>";
    };

    CalendarView.prototype.afterRender = function() {
      CalendarView.__super__.afterRender.apply(this, arguments);
      this.createCalendar();
      return this.$popover = this.$el.find("#popover-eventos").popover({
        placement: 'top',
        html: true,
        container: 'body',
        title: _.bind(this.getPopoverTitle, this),
        content: _.bind(this.getPopoverContent, this),
        template: "<div class=\"popover form-popover popover-eventos\">\n  <div class=\"arrow\"></div>\n  <div class=\"popover-inner\">\n    <h3 class=\"popover-title\"></h3>\n    <div class=\"popover-content\">\n      <p></p>\n    </div>\n  </div>\n  <div class=\"popover-footer\"></div>\n</div>"
      });
    };

    CalendarView.prototype.getPopoverTitle = function() {
      if (this.currentEvent.sesc) {
        return "<strong>SESC - " + this.currentEvent.title + "</strong>";
      } else {
        return typeof this.getPopoverCustomTitle === "function" ? this.getPopoverCustomTitle() : void 0;
      }
    };

    CalendarView.prototype.getPopoverContent = function() {
      if (this.currentEvent.sesc) {
        return "<div class=\"popover-row\">\n  <div>Início:</div>\n  <div>" + (moment(this.currentEvent.start).format('DD/MM/YYYY')) + "</div>\n</div>\n<div class=\"popover-row\">\n  <div>Fim:</div>\n  <div>" + (this.currentEvent.end ? moment(this.currentEvent.end).format('DD/MM/YYYY') : '-') + "</div>\n</div>";
      } else {
        return typeof this.getPopoverCustomContent === "function" ? this.getPopoverCustomContent() : void 0;
      }
    };

    CalendarView.prototype.getPopoverCustomTitle = function() {
      return '';
    };

    CalendarView.prototype.getPopoverCustomContent = function() {
      return '';
    };

    CalendarView.prototype.getEvento = function(eventoId) {
      var _this = this;
      if (this.enableEventCRUD) {
        this.model = new this.eventoModel;
        this.model.set('id', eventoId);
        return this.model.fetch().done(function(result) {
          return _this.subview('editView', new _this.editView({
            model: _this.model
          }));
        });
      }
    };

    CalendarView.prototype.createCalendar = function() {
      var _this = this;
      this.$el.find('[name=mes]').val(this.currentDate.format('M'));
      this.$el.find('[name=ano]').val(this.currentDate.format('YYYY'));
      return this.$el.find('#calendar').fullCalendar({
        monthNames: this.monthNames,
        monthNamesShort: this.monthNamesShort,
        dayNames: this.dayNames,
        dayNamesShort: this.dayNamesShort,
        buttonText: {
          today: 'hoje',
          month: 'mês',
          week: 'semana',
          day: 'dia'
        },
        editable: this.enableEventCRUD,
        dayClick: function(date, allDay, jsEvent, view) {
          if (_this.enableEventCRUD) {
            return _this.modal = _this.subview('createView', new _this.createView({
              inicio: date
            }));
          }
        },
        eventClick: function(calEvent, jsEvent, view) {
          if (!calEvent.sesc) {
            return _this.getEvento(calEvent.id);
          }
        },
        eventMouseover: function(calEvent, jsEvent, view) {
          _this.currentEvent = calEvent;
          if (_this.getPopoverContent()) {
            _this.$popover.popover('show');
            return _this.positionPopover(jsEvent);
          }
        },
        eventMouseout: function(calEvent, jsEvent, view) {
          return _this.$el.find('.popover').remove();
        },
        eventDragStart: function(event, jsEvent, ui, view) {
          return _this.$el.find('.popover').remove();
        },
        eventDrop: function(calEvent, dayDelta, minuteDelta, allDay, revertFunc) {
          if (!calEvent.sesc) {
            return _this.saveModelHandler(calEvent);
          }
        },
        eventResize: function(calEvent, dayDelta, minuteDelta, revertFunc) {
          if (!calEvent.sesc) {
            return _this.saveModelHandler(calEvent);
          }
        },
        events: function(start, end, callback) {
          var data, diasDoMesAnterior, diasDoProximoMes, diasNoMes, maximoDiasCalendario;
          maximoDiasCalendario = 43;
          diasNoMes = _this.currentDate.add('months', 1).date(1).subtract('days', 1).date();
          diasDoMesAnterior = _this.currentDate.date(1).day();
          start = moment(start).add('days', diasDoMesAnterior).day(-7);
          diasDoProximoMes = maximoDiasCalendario - (diasNoMes + diasDoMesAnterior);
          end = moment(end).subtract('days', diasDoProximoMes).day(7);
          data = {
            start: start.unix(),
            end: end.unix()
          };
          return _this.eventoDao.fetch(data).done(function(result) {
            var config, item, _i, _len;
            _this.calendarData = result;
            for (_i = 0, _len = result.length; _i < _len; _i++) {
              item = result[_i];
              config = _.where(_this.eventos, {
                tipo: item.tipo
              }, true);
              item['textColor'] = config.textColor;
              item['color'] = config.color;
              if (item.sesc) {
                item.editable = false;
              }
            }
            return callback(result);
          });
        }
      });
    };

    CalendarView.prototype.refresh = function() {
      var calendar;
      calendar = this.$el.find('#calendar').fullCalendar('destroy');
      this.createCalendar();
      return calendar.fullCalendar('gotoDate', this.currentDate.toDate());
    };

    CalendarView.prototype.positionPopover = function(event) {
      var $popoverEl, arrow, left, top;
      $popoverEl = this.$el.find('.popover');
      left = event.pageX - ($popoverEl.width() / 2);
      arrow = 25;
      top = event.pageY - $popoverEl.height() - arrow;
      return $popoverEl.offset({
        left: left,
        top: top
      });
    };

    CalendarView.prototype.filtroHandler = function(event) {
      var ano, data, mes;
      mes = this.$el.find('[name=mes]').val();
      ano = this.$el.find('[name=ano]').val();
      data = moment("" + mes + "/" + ano, 'MM/YYYY');
      this.currentDate = data;
      return this.$el.find('#calendar').fullCalendar('gotoDate', data.toDate());
    };

    return CalendarView;

  })(View);
});

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define('core/views/modal_view',['core/views/view'], function() {
  var ModalView, View, _;
  _ = require('underscore');
  View = require('core/views/view');
  return ModalView = (function(_super) {

    __extends(ModalView, _super);

    function ModalView() {
      return ModalView.__super__.constructor.apply(this, arguments);
    }

    ModalView.prototype.autoRender = true;

    ModalView.prototype.tag = 'div';

    ModalView.prototype.className = 'modal hide fade';

    ModalView.prototype.modalTitle = 'Título';

    ModalView.prototype.closeLabel = 'Fechar';

    ModalView.prototype.showFooter = true;

    ModalView.prototype.template = "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"icon-remove\"/></button>\n  <h3 id=\"modal-title\">{{modalTitle}}</h3>\n</div>\n\n<div class=\"modal-body\">{{html bodyTemplate}}</div>\n\n{{#if showFooter}}\n  <div class=\"modal-footer\">\n    <button type=\"reset\" class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">{{closeLabel}}</button>\n  </div>\n{{/if}}";

    ModalView.prototype.bodyTemplate = 'Body template';

    ModalView.prototype.getTemplateData = function() {
      return _.extend(ModalView.__super__.getTemplateData.apply(this, arguments), {
        modalTitle: this.modalTitle,
        closeLabel: this.closeLabel,
        bodyTemplate: this.bodyTemplate,
        showFooter: this.showFooter
      });
    };

    ModalView.prototype.afterRender = function() {
      ModalView.__super__.afterRender.apply(this, arguments);
      this.cacheDOMElements();
      this.registryDOMEvents();
      return this.instanceSubviews();
    };

    ModalView.prototype.cacheDOMElements = function() {
      return this.DOMElements = {
        $modalHeader: this.$el.find('.modal-header'),
        $modalBody: this.$el.find('.modal-body'),
        $modalFooter: this.$el.find('.modal-footer')
      };
    };

    ModalView.prototype.registryDOMEvents = function() {};

    ModalView.prototype.instanceSubviews = function() {};

    ModalView.prototype.show = function() {
      this.$el.modal({
        show: true,
        backdrop: 'static',
        keyboard: false
      });
      return this.trigger('modal:show');
    };

    ModalView.prototype.hide = function() {
      this.$el.modal('hide');
      this.trigger('modal:hide');
      return $('.tooltip').remove();
    };

    return ModalView;

  })(View);
});


define('core/lib/handlebars/form',['handlebars'], function() {
  var Handlebars, formatOptions, formatPrefixAndSuffix;
  Handlebars = require('handlebars');
  formatOptions = function(options) {
    var attrs, defaults, key, labelAttrs, value;
    defaults = {
      label: "Label",
      className: "input-xxlarge"
    };
    _.defaults(options, defaults);
    attrs = [];
    labelAttrs = [];
    if (options.className) {
      attrs.push("class=\"" + options.className + "\"");
      delete options.className;
    }
    if (options.required == null) {
      // attrs.push("placeholder=\"(Opcional)\"");
      delete options.required;
    } else {
      options.label += "<em>*</em>";
    }
    if (options.id != null) {
      attrs.push("id=\"" + options.id + "\"");
      labelAttrs.push("for=\"" + options.id + "\"");
      delete options.id;
    }
    for (key in options) {
      value = options[key];
      attrs.push("" + key + "=\"" + value + "\"");
    }
    return [attrs, labelAttrs];
  };
  formatPrefixAndSuffix = function(options, input) {
    var str;
    str = "";
    if ((options.prefix != null) && (options.suffix != null)) {
      str += "<div class=\"input-prepend input-append\">\n  <span class=\"add-on\">" + options.prefix + "</span>" + input + "<span class=\"add-on\">" + options.suffix + "</span>\n</div>";
    } else if (options.prefix != null) {
      str += "<div class=\"input-prepend\">\n  <span class=\"add-on\">" + options.prefix + "</span>" + input + "\n</div>";
    } else if (options.suffix != null) {
      str += "<div class=\"input-append\">\n  " + input + "<span class=\"add-on\">" + options.suffix + "</span>\n</div>";
    } else {
      str += "" + input;
    }
    return str;
  };
  Handlebars.registerHelper('help', function(options) {
    var str;
    str = "<p class=\"help-block\">" + options.hash.text + "</p>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('textInput', function(options) {
    var attrs, labelAttrs, str, value, _ref;
    _ref = formatOptions(options.hash), attrs = _ref[0], labelAttrs = _ref[1];
    value = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">";
    str += formatPrefixAndSuffix(options.hash, "<input type=\"text\" " + (attrs.join(' ')) + " />");
    str += "  " + ($.trim(value)) + "\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('passwordInput', function(options) {
    var attrs, labelAttrs, str, value, _ref;
    _ref = formatOptions(options.hash), attrs = _ref[0], labelAttrs = _ref[1];
    value = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">";
    str += formatPrefixAndSuffix(options.hash, "<input type=\"password\" " + (attrs.join(' ')) + " />");
    str += "  " + ($.trim(value)) + "\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('fileInput', function(options) {
    var attrs, labelAttrs, str, value, _ref;
    options.hash.className = "input-file";
    _ref = formatOptions(options.hash), attrs = _ref[0], labelAttrs = _ref[1];
    value = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">\n    <input type=\"file\" " + (attrs.join(' ')) + " />\n    " + ($.trim(value)) + "\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('textareaInput', function(options) {
    var attrs, labelAttrs, str, value, _ref;
    _ref = formatOptions(options.hash), attrs = _ref[0], labelAttrs = _ref[1];
    value = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">\n    <textarea type=\"text\" " + (attrs.join(' ')) + ">" + ($.trim(value)) + "</textarea>\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('checkboxInput', function(options) {
    var attrs, labelAttrs, str, text, value, _ref, _ref1, _ref2;
    text = '';
    if (((_ref = options.hash) != null ? _ref.text : void 0) != null) {
      text = (_ref1 = options.hash) != null ? _ref1.text : void 0;
      delete options.hash.text;
    }
    _ref2 = formatOptions(options.hash), attrs = _ref2[0], labelAttrs = _ref2[1];
    value = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">\n    <label class=\"checkbox\">\n      <input type=\"checkbox\" " + (attrs.join(' ')) + " />\n      " + text + "\n      " + value + "\n    </label>\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('radioInput', function(options) {
    var attrs, labelAttrs, str, text, value, _ref, _ref1, _ref2;
    text = '';
    if (((_ref = options.hash) != null ? _ref.text : void 0) != null) {
      text = (_ref1 = options.hash) != null ? _ref1.text : void 0;
      delete options.hash.text;
    }
    _ref2 = formatOptions(options.hash), attrs = _ref2[0], labelAttrs = _ref2[1];
    value = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">\n    <label class=\"radio\">\n      <input type=\"radio\" " + (attrs.join(' ')) + " />\n      " + text + "\n      " + value + "\n    </label>\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('selectInput', function(context, options) {
    var attrs, body, createItem, empty, key, label, labelAttrs, str, _i, _len, _ref, _ref1, _ref2;
    if (((_ref = options.hash) != null ? _ref.empty : void 0) != null) {
      empty = (_ref1 = options.hash) != null ? _ref1.empty : void 0;
      delete options.hash.empty;
    }
    _ref2 = formatOptions(options.hash), attrs = _ref2[0], labelAttrs = _ref2[1];
    body = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">\n    <select " + (attrs.join(' ')) + ">";
    if (empty != null) {
      str += "<option value=\"\">" + empty + "</option>";
    }
    if (context != null) {
      createItem = function(key, label) {
        var k, l, o;
        if (_.isObject(label)) {
          o = label;
          for (k in o) {
            l = o[k];
            key = k;
            label = l;
          }
        }
        return '<option value="' + key + '">' + label + '</option>';
      };
      if (_.isArray(context)) {
        for (key = _i = 0, _len = context.length; _i < _len; key = ++_i) {
          label = context[key];
          str += createItem(key, label);
        }
      } else if (_.isObject(context)) {
        for (key in context) {
          label = context[key];
          str += createItem(key, label);
        }
      }
    }
    str += "    </select>\n    " + body + "\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('checkboxGroup', function(context, options) {
    var attrs, body, createItem, key, label, labelAttrs, str, _i, _len, _ref,
      _this = this;
    _ref = formatOptions(options.hash), attrs = _ref[0], labelAttrs = _ref[1];
    body = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">\n    <div class=\"checkbox-list\">";
    if (context != null) {
      createItem = function(name, key, label) {
        var k, l, o;
        if (name == null) {
          name = '';
        }
        if (_.isObject(label)) {
          o = label;
          for (k in o) {
            l = o[k];
            key = k;
            label = l;
          }
        }
        return "<label class=\"checkbox\">\n  <input type=\"checkbox\" value=\"" + key + "\" name=\"" + name + "\"/>\n  " + label + "\n</label>";
      };
      if (_.isArray(context)) {
        for (key = _i = 0, _len = context.length; _i < _len; key = ++_i) {
          label = context[key];
          str += createItem(options.hash.name, key, label);
        }
      } else if (_.isObject(context)) {
        for (key in context) {
          label = context[key];
          str += createItem(options.hash.name, key, label);
        }
      }
    }
    str += "  " + body + "\n    </div>\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('radioGroup', function(context, options) {
    var attrs, body, createItem, key, label, labelAttrs, str, _i, _len, _ref;
    _ref = formatOptions(options.hash), attrs = _ref[0], labelAttrs = _ref[1];
    body = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" " + (labelAttrs.join(' ')) + ">" + options.hash.label + "</label>\n  <div class=\"controls\">";
    if (context != null) {
      createItem = function(name, key, label) {
        var k, l, o;
        if (name == null) {
          name = '';
        }
        if (_.isObject(label)) {
          o = label;
          for (k in o) {
            l = o[k];
            key = k;
            label = l;
          }
        }
        return "<label class=\"radio\">\n  <input type=\"radio\" value=\"" + key + "\" name=\"" + name + "\" />\n  " + label + "\n</label>";
      };
      if (_.isArray(context)) {
        for (key = _i = 0, _len = context.length; _i < _len; key = ++_i) {
          label = context[key];
          str += createItem(options.hash.name, key, label);
        }
      } else if (_.isObject(context)) {
        for (key in context) {
          label = context[key];
          str += createItem(options.hash.name, key, label);
        }
      }
    }
    str += "  " + body + "\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('controlGroup', function(options) {
    var attrs, body, labelAttrs, str, _ref;
    _.defaults(options.hash, {
      "for": '',
      label: ''
    });
    _ref = formatOptions(options.hash), attrs = _ref[0], labelAttrs = _ref[1];
    body = options.fn != null ? options.fn(this) : '';
    str = "<div class=\"control-group\">\n  <label class=\"control-label\" for=\"" + options.hash["for"] + "\">" + options.hash.label + "</label>\n  <div class=\"controls\" " + (attrs.join(' ')) + ">\n      " + body + "\n  </div>\n</div>";
    return new Handlebars.SafeString(str);
  });
  Handlebars.registerHelper('buttons', function(options) {
    var str;
    _.defaults(options.hash, {
      submitLabel: 'Enviar'
    });
    str = "<div class=\"form-actions\">";
    if (options.hash.cancelLabel != null) {
      str += "<a class=\"btn\"";
      if (options.hash.cancelHref != null) {
        str += "" + ' ' + "href=\"" + options.hash.cancelHref + "\"";
      }
      str += ">" + options.hash.cancelLabel + "\n</a>";
    }
    str += "  <button type=\"submit\" class=\"btn btn-primary\">" + options.hash.submitLabel + "</button>\n</div>";
    return new Handlebars.SafeString(str);
  });
  return Handlebars.registerHelper('errorSummary', function(options) {
    var str;
    str = "<div class=\"error-summary hide alert alert-danger\"></div>";
    return new Handlebars.SafeString(str);
  });
});


define('core/lib/handlebars/commons',['handlebars'], function() {
  var Handlebars;
  Handlebars = require('handlebars');
  /*
    * If Equals
    * if_eq this compare=that
  */

  Handlebars.registerHelper('if_eq', function() {
    if (context === options.hash.compare) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  /*
    * Unless Equals
    * unless_eq this compare=that
  */

  Handlebars.registerHelper('unless_eq', function() {
    if (context === options.hash.compare) {
      return options.inverse(this);
    }
    return options.fn(this);
  });
  /*
    * If Greater Than
    * if_gt this compare=that
  */

  Handlebars.registerHelper('if_gt', function() {
    if (context > options.hash.compare) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  /*
    * Unless Greater Than
    * unless_gt this compare=that
  */

  Handlebars.registerHelper('unless_gt', function() {
    if (context > options.hash.compare) {
      return options.inverse(this);
    }
    return options.fn(this);
  });
  /*
    * If Less Than
    * if_lt this compare=that
  */

  Handlebars.registerHelper('if_lt', function() {
    if (context < options.hash.compare) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  /*
    * Unless Less Than
    * unless_lt this compare=that
  */

  Handlebars.registerHelper('unless_lt', function() {
    if (context < options.hash.compare) {
      return options.inverse(this);
    }
    return options.fn(this);
  });
  /*
    * If Greater Than or Equal To
    * if_gteq this compare=that
  */

  Handlebars.registerHelper('if_gteq', function() {
    if (context >= options.hash.compare) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  /*
    * Unless Greater Than or Equal To
    * unless_gteq this compare=that
  */

  Handlebars.registerHelper('unless_gteq', function() {
    if (context >= options.hash.compare) {
      return options.inverse(this);
    }
    return options.fn(this);
  });
  /*
    * If Less Than or Equal To
    * if_lteq this compare=that
  */

  Handlebars.registerHelper('if_lteq', function() {
    if (context <= options.hash.compare) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  /*
    * Unless Less Than or Equal To
    * unless_lteq this compare=that
  */

  Handlebars.registerHelper('unless_lteq', function() {
    if (context <= options.hash.compare) {
      return options.inverse(this);
    }
    return options.fn(this);
  });
  /*
    * Convert new line (\n\r) to <br>
    * from http://phpjs.org/functions/nl2br:480
  */

  return Handlebars.registerHelper('nl2br', function(text) {
    var nl2br;
    nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
    return new Handlebars.SafeString(nl2br);
  });
});


define('core/lib/handlebars_helpers',['handlebars', 'core/lib/handlebars/form', 'core/lib/handlebars/commons', 'core/session'], function() {
  

  var Handlebars, session,
    _this = this;
  Handlebars = require('handlebars');
  session = require('core/session');
  Handlebars.registerHelper('checkPermission', function(options) {
    var permissions, ret, _ref;
    permissions = (_ref = options.hash) != null ? _ref.permissions : void 0;
    if (permissions) {
      permissions = _.map(permissions.split(','), function(item) {
        return item.trim();
      });
      if (session.user.checkAccess(permissions)) {
        ret = options.fn(this);
      } else {
        ret = options.inverse(this);
      }
    }
    return ret;
  });
  Handlebars.registerHelper('loadTemplate', function(options) {
    var file, fileContent, _ref;
    file = (_ref = options.hash) != null ? _ref.file : void 0;
    fileContent = require("text!" + file);
    return new Handlebars.SafeString(fileContent);
  });
  Handlebars.registerHelper('labelRequiredFields', function() {
    return new Handlebars.SafeString('<div class="pull-right">* Preenchimento obrigatório</div>');
  });
  return Handlebars.registerHelper('html', function(content) {
    return new Handlebars.SafeString(content);
  });
});


define('core',['core/dao_factory', 'core/dao', 'core/application', 'core/sesc_application', 'core/webuser', 'core/dispatcher', 'core/feedback', 'core/controllers/controller', 'core/controllers/crud_controller', 'core/controllers/crud_details_controller', 'core/models/collection', 'core/models/sync_collection', 'core/models/model', 'core/models/navigation_model', 'core/views/layout', 'core/views/sesc_layout', 'core/views/view', 'core/views/breadcrumb_view', 'core/views/table_crud_view', 'core/views/item_view', 'core/views/form_view', 'core/views/edit_view', 'core/views/create_view', 'core/views/collection_view', 'core/views/navigation_view', 'core/views/calendar_view', 'core/views/modal_view', 'core/lib/route', 'core/lib/router', 'core/lib/subscriber', 'core/lib/sync_machine', 'core/mediator', 'core/session', 'core/lib/support', 'core/lib/utils', 'core/lib/handlebars_helpers'], function() {
  return {
    DaoFactory: require('core/dao_factory'),
    Dao: require('core/dao'),
    Application: require('core/application'),
    SescApplication: require('core/sesc_application'),
    WebUser: require('core/webuser'),
    Dispatcher: require('core/dispatcher'),
    Feedback: require('core/feedback'),
    Controller: require('core/controllers/controller'),
    CrudController: require('core/controllers/crud_controller'),
    CrudDetailsController: require('core/controllers/crud_details_controller'),
    Collection: require('core/models/collection'),
    SyncCollection: require('core/models/sync_collection'),
    Model: require('core/models/model'),
    NavigationModel: require('core/models/navigation_model'),
    Layout: require('core/views/layout'),
    SescLayout: require('core/views/sesc_layout'),
    View: require('core/views/view'),
    BreadcrumbView: require('core/views/breadcrumb_view'),
    TableCrudView: require('core/views/table_crud_view'),
    ItemView: require('core/views/item_view'),
    FormView: require('core/views/form_view'),
    EditView: require('core/views/edit_view'),
    CreateView: require('core/views/create_view'),
    CollectionView: require('core/views/collection_view'),
    NavigationView: require('core/views/navigation_view'),
    CalendarView: require('core/views/calendar_view'),
    ModalView: require('core/views/modal_view'),
    Route: require('core/lib/route'),
    Router: require('core/lib/router'),
    Subscriber: require('core/lib/subscriber'),
    SyncMachine: require('core/lib/sync_machine'),
    Mediator: require('core/mediator'),
    Session: require('core/session'),
    Support: require('core/lib/support'),
    Utils: require('core/lib/utils')
  };
});
