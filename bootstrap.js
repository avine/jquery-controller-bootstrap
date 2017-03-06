/* global jQuery */

'use strict';

(function($) {
  class Bootstrap {

    constructor(element, options) {
      this.$element = $(element);
      this.options = $.extend({}, Bootstrap.settings, options || {});
      this.parse();
    }

    parse() {
      this.list = {old: [], new: []};
      let scope = this.$element.closest(`[${this.options.attr.root}]`)[0];
      if (!scope) {
        scope = $('<div>').attr(this.options.attr.virtual, '')[0];
      }
      this.traverse(this.$element, scope, true);
      this.makeAlive();
    }

    traverse($node, scope, init) {
      if (init) {
        scope = this.findCtrl($node, scope);
      }
      $node.children().each((index, child) => {
        const $child = $(child);
        this.traverse($child, this.findCtrl($child, scope));
      });
    }

    findCtrl($node, scope) {
      let newScope = scope;
      const attr = this.findAttr($node);
      if (attr) {
        if (attr.isRoot) {
          newScope = $node[0];
        }
        const type = this.isAlive($node) ? 'old' : 'new';
        this.list[type].unshift({
          isRoot: attr.isRoot,
          values: attr.values,
          node: $node[0],
          scope: newScope
        });
      }
      return newScope;
    }

    findAttr($node) {
      let value = $node.attr(this.options.attr.root);
      if (typeof value !== 'undefined') {
        return {isRoot: true, values: this.str2Arr(value)};
      }
      value = $node.attr(this.options.attr.part);
      if (typeof value !== 'undefined') {
        return {isRoot: false, values: this.str2Arr(value)};
      }
      return null;
    }

    str2Arr(value) {
      return value.replace(/\s/g, '').split(this.options.separator);
    }

    isAlive($node) {
      return !!$node.data(this.options.aliveKey);
    }

    makeAlive() {
      this.list.new.forEach(item => {
        const $node = $(item.node);
        const aliveValue = {};
        item.values.forEach(value => {
          if (value in this.options.controllers) {
            const Controller = this.options.controllers[value];
            const channel = Bootstrap.getChannel(item.scope, this.options.event.ready);
            aliveValue[value] = new Controller(item.node, channel);
          }
        });
        $node.data(this.options.aliveKey, aliveValue);
        if (item.isRoot) {
          $(item.scope).trigger(this.options.event.ready);
        }
      });
    }

  }

  Bootstrap.settings = {
    attr: {
      virtual: 'data-bootstrap-virtual',
      root: 'data-bootstrap-root',
      part: 'data-bootstrap-part'
    },

    aliveKey: 'bootstrapInstances',

    event: {ready: 'ready.bootstrap'},

    separator: ',',

    controllers: {}
  };

  Bootstrap.getChannel = function(scope, eventReady) {
    eventReady = eventReady || Bootstrap.settings.event.ready;
    return {
      ready: function(callback) {
        $(scope).one(eventReady, () => callback());
      },
      listen: function(event, callback, once) {
        $(scope)[once ? 'one' : 'on'](event, (e, data) => callback(data));
      },
      dispatch: function(event, data) {
        $(scope).trigger(event, data);
      }
    };
  };

  Bootstrap.api = {
    define: function(node, api) {
      const $node = $(node);
      for (const method in api) {
        $node.on(method, (event, ...args) => api[method].apply({}, args));
      }
    },
    request: function(node, method, args) {
      $(node).trigger(method, args);
    }
  };

  window.Bootstrap = Bootstrap;
}(jQuery));
