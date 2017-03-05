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
      this.start();
    },

    parse: function($node, scope, init) {
      const that = this;
      if (init) {
        scope = that.scanCtrl($node, scope);
      }
      $node.children().each((index, child) => {
        const $child = $(child);
        that.parse($child, that.scanCtrl($child, scope));
      });
    },

    scanCtrl: function($node, scope) {
      const attr = this.scanAttr($node);
      let newScope = scope;
      if (attr) {
        if (attr.isRoot) {
          newScope = $node[0];
        }
        this.list[attr.alive ? 'old' : 'new'].unshift({
          isRoot: attr.isRoot,
          name: attr.ctrl,
          node: $node[0],
          scope: newScope
        });
      }
      return newScope;
    },

    scanAttr: function($node) {
      const alive = typeof $node.attr(this.options.attr.alive) !== 'undefined';
      let ctrl = $node.attr(this.options.attr.root);
      if (typeof ctrl !== 'undefined') {
        return {isRoot: true, ctrl: ctrl, alive: alive};
      }
      ctrl = $node.attr(this.options.attr.part);
      if (typeof ctrl !== 'undefined') {
        return {isRoot: false, ctrl: ctrl, alive: alive};
      }
      return null;
    },

    start: function() {
      this.list.new.forEach(ctrl => {
        if (ctrl.name in this.options.controllers) {
          // TODO: utiliser $().data() pour stocker l'instance.
          // Mais quoi qu'il en soit, on ne peut pas instsancier 2 controllers sur le même node...
          // voir si c'est un PB ou non...
          $(ctrl.node).attr(this.options.attr.alive, '');
          new this.options.controllers[ctrl.name](ctrl.node, ctrl.scope);
          if (ctrl.isRoot) {
            $(ctrl.scope).trigger('ready.bootstrap');
          }
        }
      });
    }
  
  };

  Bootstrap.settings = {

    attr: {
      virtual: 'data-bootstrap-virtual',
      root: 'data-bootstrap-root',
      part: 'data-bootstrap-part',
      alive: 'data-bootstrap-alive',
    },

    event: {ready: 'ready.bootstrap'},

    controllers: {}
  };

  window.Bootstrap = Bootstrap;
}(jQuery));
