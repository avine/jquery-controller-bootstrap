/* global jQuery */

'use strict';

window.Bootstrap = (function($) {
  var settings = {
    options: {
      attr: {
        virtual: 'data-bootstrap-virtual',
        root: 'data-bootstrap-root',
        part: 'data-bootstrap-part'
      },
      controllers: {}
    },
    event: {
      ready: 'ready.bootstrap'
    },
    key: {
      ctrls: 'bootstrapCtrls',
      api: 'bootstrapApi',
    }
  };

  function Bootstrap(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, settings.options, options || {});
    this.parse();
  }

  Bootstrap.prototype = {

    constructor: Bootstrap,

    parse: function() {
      var scope = this.$element.closest('[' + this.options.attr.root + ']')[0];
      if (!scope) {
        scope = $('<div>').attr(this.options.attr.virtual, '')[0];
      }
      this.list = {old: [], 'new': []};
      this.traverse(this.$element, this.findCtrl(this.$element, scope));
      this.makeAlive();
    },

    traverse: function($node, scope) {
      var _this = this;
      $node.children().each(function(index, child) {
        var $child = $(child);
        _this.traverse($child, _this.findCtrl($child, scope));
      });
    },

    findCtrl: function($node, scope) {
      var attr = this.findAttr($node);
      if (attr) {
        if (attr.isRoot) {
          scope = $node[0];
        }
        attr.node = $node[0];
        attr.scope = scope;
        this.list[this.isAlive($node) ? 'old' : 'new'].unshift(attr);
      }
      return scope;
    },

    findAttr: function($node) {
      var ctrl = $node.attr(this.options.attr.root);
      if (typeof ctrl === 'undefined') {
        ctrl = $node.attr(this.options.attr.part);
      }
      if (typeof ctrl === 'undefined') {
        return null;
      }
      return {isRoot: false, ctrl: this.str2Arr(ctrl)};
    },

    str2Arr: function(ctrl) {
      return ctrl.replace(/\s/g, '').split(',');
    },

    isAlive: function($node) {
      return !!$node.data(settings.key.ctrls);
    },

    makeAlive: function() {
      var _this = this,
        scopes = [];
      this.list['new'].forEach(function(item) {
        var instances = {};
        item.ctrl.forEach(function(name) {
          var Controller = _this.options.controllers, prop = name.split('.'), channel;
          do {
            Controller = Controller[prop.shift()];
          } while (Controller && prop.length);
          if (Controller) {
            Controller = _this.options.controllers[name];
            channel = Bootstrap.getChannel(item.scope);
            instances[name] = new Controller(item.node, channel);
          }
        });
        $(item.node).data(settings.key.ctrls, instances);
        !!~scopes.indexOf(item.scope) || scopes.push(item.scope);
      });
      scopes.forEach(function(node) {
        $(node).trigger(settings.event.ready);
      });
    }

  };

  Bootstrap.getChannel = function(scope) {
    return {
      ready: function(callback) {
        $(scope).one(settings.event.ready, function() { callback(); });
      },
      listen: function(event, callback, once) {
        $(scope)[once ? 'one' : 'on'](event, function() {
          [].shift.call(arguments);
          callback.apply({}, arguments);
        });
      },
      dispatch: function(event, data) {
        $(scope).trigger(event, [].concat(data));
      }
    };
  };

  Bootstrap.api = {
    define: function(node, api) {
      var $node = $(node);
      $node.data(settings.key.api, $.extend($node.data(settings.key.api) || {}, api));
    },
    request: function(node, method, args) {
      var api = $(node).data(settings.key.api) || {};
      if (method in api && api[method] instanceof Function) {
        return api[method].apply({}, typeof args === 'undefined' ? [] : [].concat(args));
      }
      return null;
    }
  };

  Bootstrap.settings = settings;

  return Bootstrap;
}(jQuery));
