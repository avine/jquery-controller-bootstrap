/* global jQuery */

'use strict';

window.Bootstrap = (function($) {
  class Bootstrap {

    constructor(element, options) {
      this.$element = $(element);
      this.options = $.extend({}, Bootstrap.settings, options || {});
      this.parse();
    }

    parse() {
      let scope = this.$element.closest(`[${this.options.attr.root}]`)[0];
      if (!scope) {
        scope = $('<div>').attr(this.options.attr.virtual, '')[0];
      }
      this.list = {old: [], new: []};
      this.traverse(this.$element, this.findCtrl(this.$element, scope));
      this.makeAlive();
    }

    traverse($node, scope) {
      $node.children().each((index, child) => {
        const $child = $(child);
        this.traverse($child, this.findCtrl($child, scope));
      });
    }

    findCtrl($node, scope) {
      const attr = this.findAttr($node);
      if (attr) {
        if (attr.isRoot) {
          scope = $node[0];
        }
        attr.node = $node[0];
        attr.scope = scope;
        this.list[this.isAlive($node) ? 'old' : 'new'].unshift(attr);
      }
      return scope;
    }

    findAttr($node) {
      let ctrl = $node.attr(this.options.attr.root);
      if (typeof ctrl !== 'undefined') {
        return {isRoot: true, ctrl: this.str2Arr(ctrl)};
      }
      ctrl = $node.attr(this.options.attr.part);
      if (typeof ctrl !== 'undefined') {
        return {isRoot: false, ctrl: this.str2Arr(ctrl)};
      }
      return null;
    }

    str2Arr(ctrl) {
      return ctrl.replace(/\s/g, '').split(this.options.separator);
    }

    isAlive($node) {
      return !!$node.data(this.options.dataKey);
    }

    makeAlive() {
      const scopes = [];
      this.list.new.forEach(item => {
        const instances = {};
        item.ctrl.forEach(name => {
          if (name in this.options.controllers) {
            const Controller = this.options.controllers[name];
            const channel = Bootstrap.getChannel(item.scope, this.options.eventReady);
            instances[name] = new Controller(item.node, channel);
          }
        });
        $(item.node).data(this.options.dataKey, instances);
        scopes.includes(item.scope) || scopes.push(item.scope);
      });
      scopes.forEach(node => $(node).trigger(this.options.eventReady));
    }

  }

  Bootstrap.settings = {
    attr: {
      virtual: 'data-bootstrap-virtual',
      root: 'data-bootstrap-root',
      part: 'data-bootstrap-part'
    },
    dataKey: 'bootstrapCtrls',
    eventReady: 'ready.bootstrap',
    separator: ',',
    controllers: {}
  };

  Bootstrap.getChannel = function(scope, eventReady) {
    eventReady = eventReady || Bootstrap.settings.eventReady;
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
      for (let method in api) {
        $node.on(method, (event, ...args) => api[method].apply({}, args));
      }
    },
    request: function(node, method, args) {
      $(node).trigger(method, args);
    }
  };

  return Bootstrap;
}(jQuery));
