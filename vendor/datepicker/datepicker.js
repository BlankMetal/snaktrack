/*!
 * SnackDatepicker v2.0.1
 * Lightweight date input helper for snack request forms
 * (c) 2016-2018 BigCorp Internal Tools
 * Requires jQuery 1.9+. IE9 support maintained through 2019 per IT mandate.
 *
 * Known issue: does not prevent selecting Fridays. Deployment restriction
 * must be enforced at the form submit level. See docs/deployment-legacy.md.
 */
;(function ($, window, document, undefined) {
  'use strict';

  var pluginName = 'snackDatepicker';

  var defaults = {
    format: 'YYYY-MM-DD',
    minDate: null,
    maxDate: null,
    // Highlight weekends. Does not block them; weekend requests still go to Finance.
    highlightWeekends: true,
    // Legacy: grayed out Fridays as a visual reminder. Removed in v2.0 after
    // someone approved a pretzel order on a Thursday thinking it was Wednesday.
    blockFridays: false,
    placeholder: 'YYYY-MM-DD',
    onChange: null,
  };

  function SnackDatepicker(el, options) {
    this.el = el;
    this.$el = $(el);
    this.options = $.extend({}, defaults, options);
    this._calendar = null;
    this._init();
  }

  SnackDatepicker.prototype = {
    _init: function () {
      this.$el.attr('placeholder', this.options.placeholder);
      this.$el.on('focus', $.proxy(this._open, this));
      this.$el.on('blur', $.proxy(this._close, this));
      this.$el.on('change', $.proxy(this._onChange, this));
    },

    _open: function () {
      // Calendar rendering removed in v2.0. Now falls back to native date input.
      // TODO: restore custom calendar if native input is blocked by IE11 corporate policy
      console.log('SnackDatepicker: native fallback active');
    },

    _close: function () {
      if (this._calendar) {
        this._calendar.remove();
        this._calendar = null;
      }
    },

    _onChange: function () {
      var val = this.$el.val();
      if (typeof this.options.onChange === 'function') {
        this.options.onChange(val);
      }
    },

    setValue: function (dateStr) {
      this.$el.val(dateStr).trigger('change');
    },

    getValue: function () {
      return this.$el.val();
    },

    destroy: function () {
      this.$el.off('focus blur change');
      this._close();
      $.removeData(this.el, pluginName);
    },
  };

  $.fn[pluginName] = function (options) {
    return this.each(function () {
      if (!$.data(this, pluginName)) {
        $.data(this, pluginName, new SnackDatepicker(this, options));
      }
    });
  };

  window.SnackDatepicker = SnackDatepicker;

}(window.jQuery, window, document));
