/* global jQuery */

'use strict';

window.Bootstrap = (function($) {
  const settings = {
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

  class Bootstrap {

    constructor(element, options) {
      this.$element = $(element);
      this.options = $.extend({}, settings.options, options || {});
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
      if (typeof ctrl === 'undefined') {
        ctrl = $node.attr(this.options.attr.part);
      }
      if (typeof ctrl === 'undefined') {
        return null;
      }
      return {isRoot: false, ctrl: this.str2Arr(ctrl)};
    }

    str2Arr(ctrl) {
      return ctrl.replace(/\s/g, '').split(',');
    }

    isAlive($node) {
      return !!$node.data(settings.key.ctrls);
    }

    makeAlive() {
      const scopes = [];
      this.list.new.forEach(item => {
        const instances = {};
        item.ctrl.forEach(name => {
          let Controller = this.options.controllers, prop = name.split('.');
          do {
            Controller = Controller[prop.shift()];
          } while (Controller && prop.length);
          if (Controller) {
            const channel = Bootstrap.getChannel(item.scope);
            instances[name] = new Controller(item.node, channel);
          }
        });
        $(item.node).data(settings.key.ctrls, instances);
        scopes.includes(item.scope) || scopes.push(item.scope);
      });
      scopes.forEach(node => $(node).trigger(settings.event.ready));
    }

    static getChannel(scope) {
      return {
        ready: function(callback) {
          $(scope).one(settings.event.ready, () => callback());
        },
        listen: function(event, callback, once) {
          $(scope)[once ? 'one' : 'on'](event, (e, ...data) => callback.apply({}, data));
        },
        dispatch: function(event, data) {
          $(scope).trigger(event, [].concat(data));
        }
      };
    }

  }

  Bootstrap.api = {
    define: function(node, api) {
      const $node = $(node);
      $node.data(settings.key.api, $.extend($node.data(settings.key.api) || {}, api));
    },
    request: function(node, method, args = []) {
      const api = $(node).data(settings.key.api) || {};
      if (method in api && api[method] instanceof Function) {
        return api[method].apply({}, [].concat(args));
      }
      return null;
    }
  };

  Bootstrap.settings = settings;

  return Bootstrap;
}(jQuery));
