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
      this.traverse(this.$element, scope, true);
      this.makeAlive();
    },

    traverse: function($node, scope, init) {
      var _this = this;
      if (init) {
        scope = this.findCtrl($node, scope);
      }
      $node.children().each(function(index, child) {
        var $child = $(child);
        _this.traverse($child, _this.findCtrl($child, scope));
      });
    },

    findCtrl: function($node, scope) {
      var newScope = scope,
        attr = this.findAttr($node),
        type;
      if (attr) {
        if (attr.isRoot) {
          newScope = $node[0];
        }
        type = this.isAlive($node) ? 'old' : 'new';
        this.list[type].unshift({
          isRoot: attr.isRoot,
          values: attr.values,
          node: $node[0],
          scope: newScope
        });
      }
      return newScope;
    },

    findAttr: function($node) {
      var value = $node.attr(this.options.attr.root);
      if (typeof value !== 'undefined') {
        return {isRoot: true, values: this.str2Arr(value)};
      }
      value = $node.attr(this.options.attr.part);
      if (typeof value !== 'undefined') {
        return {isRoot: false, values: this.str2Arr(value)};
      }
      return null;
    },

    str2Arr: function(value) {
      return value.replace(/\s/g, '').split(this.options.separator);
    },

    isAlive: function($node) {
      return !!$node.data(this.options.aliveKey);
    },

    makeAlive: function() {
      var _this = this,
        scopes = [];
      this.list['new'].forEach(function(item) {
        var aliveValue = {};
        item.values.forEach(function(value) {
          var Controller, channel;
          if (value in _this.options.controllers) {
            Controller = _this.options.controllers[value];
            channel = Bootstrap.getChannel(item.scope, _this.options.event.ready);
            aliveValue[value] = new Controller(item.node, channel);
          }
        });
        $(item.node).data(_this.options.aliveKey, aliveValue);
        scopes.includes(item.scope) || scopes.push(item.scope);
      });
      scopes.forEach(function(node) {
        $(node).trigger(_this.options.event.ready);
      });
    }

  };

  Bootstrap.settings = {
    attr: {
      virtual: 'data-bootstrap-virtual',
      root: 'data-bootstrap-root',
      part: 'data-bootstrap-part'
    },
    aliveKey: 'bootstrapCtrls',
    event: {ready: 'ready.bootstrap'},
    separator: ',',
    controllers: {}
  };

  Bootstrap.getChannel = function(scope, eventReady) {
    eventReady = eventReady || Bootstrap.settings.event.ready;
    return {
      ready: function(callback) {
        $(scope).one(eventReady, function () { callback(); });
      },
      listen: function(event, callback, once) {
        $(scope)[once ? 'one' : 'on'](event, function(e, data) { callback(data); });
      },
      dispatch: function(event, data) {
        $(scope).trigger(event, data);
      }
    };
  };

  Bootstrap.api = {
    define: function(node, api) {
      var $node = $(node), method;
      for (method in api) {
        $node.on(method, function() {
          var args = Array.prototype.shift(arguments);
          api[method].apply({}, args);
        });
      }
    },
    request: function(node, method, args) {
      $(node).trigger(method, args);
    }
  };

  return Bootstrap;
}(jQuery));
