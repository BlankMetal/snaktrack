(function ($) {
  $(".approveSnackButton").on("click", function () {
    var requestId = $(this).data("snack-id");
    window.alert("Approved " + requestId + " in the old portal.");
  });
})(window.jQuery);

