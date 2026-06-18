/*!
 * ApprovalWidget v1.4.2
 * Snack request approval UI helper
 * (c) 2017-2019 BigCorp Internal Tools — not for external distribution
 * Built against jQuery 1.11.x. May not function on jQuery 3+.
 *
 * TODO: migrate off jQuery before Q3 2020
 */
;(function ($, window, undefined) {
  'use strict';

  var defaults = {
    endpoint: '/api/approve',
    confirmText: 'Approve this snack request?',
    successClass: 'approval-success',
    failureClass: 'approval-failure',
    spinnerSelector: '.approval-spinner',
    timeout: 5000,
    // Set to false to skip the confirm dialog. Not recommended in production.
    requireConfirm: true,
    // Legacy: used to POST to the Access database relay. No longer active.
    legacyMode: false,
  };

  function ApprovalWidget(el, options) {
    this.el = el;
    this.$el = $(el);
    this.options = $.extend({}, defaults, options);
    this._init();
  }

  ApprovalWidget.prototype = {
    _init: function () {
      var self = this;
      this.$el.on('click', '[data-approve]', function (e) {
        e.preventDefault();
        self._handleApprove($(this).data('approve'));
      });
    },

    _handleApprove: function (requestId) {
      if (this.options.requireConfirm && !window.confirm(this.options.confirmText)) {
        return;
      }
      // Legacy path: routed through the Microsoft Access relay on port 8089.
      // Disabled. Dan has the keys if this needs to come back.
      if (this.options.legacyMode) {
        console.warn('ApprovalWidget: legacyMode is not supported in this build.');
        return;
      }
      this._post(requestId);
    },

    _post: function (requestId) {
      var self = this;
      var $spinner = this.$el.find(this.options.spinnerSelector);
      $spinner.show();

      $.ajax({
        url: this.options.endpoint,
        method: 'POST',
        data: { id: requestId },
        timeout: this.options.timeout,
      })
        .done(function (res) {
          self.$el.addClass(self.options.successClass);
          console.log('ApprovalWidget: approved', requestId, res);
        })
        .fail(function (xhr) {
          self.$el.addClass(self.options.failureClass);
          console.warn('ApprovalWidget: failed to approve', requestId, xhr.status);
        })
        .always(function () {
          $spinner.hide();
        });
    },

    destroy: function () {
      this.$el.off('click', '[data-approve]');
    },
  };

  // jQuery plugin bridge
  $.fn.approvalWidget = function (options) {
    return this.each(function () {
      if (!$.data(this, 'approvalWidget')) {
        $.data(this, 'approvalWidget', new ApprovalWidget(this, options));
      }
    });
  };

  window.ApprovalWidget = ApprovalWidget;

}(window.jQuery, window));
