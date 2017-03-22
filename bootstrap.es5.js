/* global jQuery */

'use strict';

window.Bootstrap = (function($) {
  function Bootstrap(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Bootstrap.settings, options || {});
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
      if (typeof ctrl !== 'undefined') {
        return {isRoot: true, ctrl: this.str2Arr(ctrl)};
      }
      ctrl = $node.attr(this.options.attr.part);
      if (typeof ctrl !== 'undefined') {
        return {isRoot: false, ctrl: this.str2Arr(ctrl)};
      }
      return null;
    },

    str2Arr: function(ctrl) {
      return ctrl.replace(/\s/g, '').split(this.options.separator);
    },

    isAlive: function($node) {
      return !!$node.data(this.options.ctrlsKey);
    },

    makeAlive: function() {
      var _this = this,
        scopes = [];
      this.list['new'].forEach(function(item) {
        var instances = {};
        item.ctrl.forEach(function(name) {
          var Controller, channel;
          if (name in _this.options.controllers) {
            Controller = _this.options.controllers[name];
            channel = Bootstrap.getChannel(item.scope, _this.options.eventReady);
            instances[name] = new Controller(item.node, channel);
          }
        });
        $(item.node).data(_this.options.ctrlsKey, instances);
        !!~scopes.indexOf(item.scope) || scopes.push(item.scope);
      });
      scopes.forEach(function(node) {
        $(node).trigger(_this.options.eventReady);
      });
    }

  };

  Bootstrap.settings = {
    attr: {
      virtual: 'data-bootstrap-virtual',
      root: 'data-bootstrap-root',
      part: 'data-bootstrap-part'
    },
    ctrlsKey: 'bootstrapCtrls',
    apiKey: 'bootstrapApi',
    eventReady: 'ready.bootstrap',
    separator: ',',
    controllers: {}
  };

  Bootstrap.getChannel = function(scope, eventReady) {
    eventReady = eventReady || Bootstrap.settings.eventReady;
    return {
      ready: function(callback) {
        $(scope).one(eventReady, function() { callback(); });
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
      var $node = $(node), apiKey = Bootstrap.settings.apiKey;
      $node.data(apiKey, $.extend($node.data(apiKey) || {}, api));
    },
    request: function(node, method, args) {
      var api = $(node).data(Bootstrap.settings.apiKey) || {};
      if (method in api && api[method] instanceof Function) {
        return api[method].apply({}, typeof args === 'undefined' ? [] : [].concat(args));
      }
      return null;
    }
  };

  return Bootstrap;
}(jQuery));
