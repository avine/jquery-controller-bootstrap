/* global jQuery */

(function($) {
  function Bootstrap(element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Bootstrap.settings, options || {});
    this.scope = this.$element.closest(`[${this.options.attr.root}]`)[0];
    if (!this.scope) {
      this.scope = $('<div>').attr(this.options.attr.virtual, '')[0];
    }
    this.fire();
  }

  Bootstrap.prototype = {

    constructor: Bootstrap,

    fire: function() {
      this.list = {old: [], new: []};
      this.parse(this.$element, this.scope, true);
      this.instanciate();
    },

    parse: function($node, scope, init) {
      if (init) {
        scope = this.scanCtrl($node, scope);
      }
      $node.children().each((index, child) => {
        const $child = $(child);
        this.parse($child, this.scanCtrl($child, scope));
      });
    },

    scanCtrl: function($node, scope) {
      let newScope = scope;
      const attr = this.scanAttr($node);
      if (attr) {
        if (attr.isRoot) {
          newScope = $node[0];
        }
        this.list[this.isAlive($node) ? 'old' : 'new'].unshift({
          isRoot: attr.isRoot,
          values: attr.values,
          node: $node[0],
          scope: newScope
        });
      }
      return newScope;
    },

    scanAttr: function($node) {
      let value = $node.attr(this.options.attr.root);
      if (typeof value !== 'undefined') {
        return {isRoot: true, values: this.str2Arr(value)};
      }
      value = $node.attr(this.options.attr.part);
      if (typeof value !== 'undefined') {
        return {isRoot: false, values: this.str2Arr(value)};
      }
      return null;
    },

    str2Arr: function (value) {
      return value.replace(/\s/g, '').split(this.options.separator);
    },

    isAlive: function ($node) {
      return !!$node.data(this.options.dataKey);
    },

    instanciate: function() {
      this.list.new.forEach(item => {
        const $node = $(item.node);
        const dataValue = {};
        item.values.forEach(value => {
          if (value in this.options.controllers) {
            dataValue[value] = new this.options.controllers[value](item.node, this.getChannel(item.scope));
          }
        });
        $node.data(this.options.dataKey, dataValue);
        if (item.isRoot) {
          $(item.scope).trigger(this.options.event.ready);
        }
      });
    },

    getChannel: function (scope) {
      var ready = this.options.event.ready;
      return {
        ready: function (callback) {
          $(scope).one(ready, callback);
        },
        listen: function (event, callback, once) {
          $(scope)[once ? 'one' : 'on'](event, callback);
        },
        dispatch: function (event, data) {
          $(scope).trigger(event, data);
        }
      };
    }

  };

  Bootstrap.settings = {
    attr: {
      virtual: 'data-bootstrap-virtual',
      root: 'data-bootstrap-root',
      part: 'data-bootstrap-part'
    },

    dataKey: 'bootstrapInstances',

    event: {ready: 'ready.bootstrap'},

    separator: ',',

    controllers: {}
  };

  window.Bootstrap = Bootstrap;
}(jQuery));
