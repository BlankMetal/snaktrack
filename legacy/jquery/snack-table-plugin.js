(function ($) {
  $.fn.snackTable = function snackTable(rows) {
    return this.each(function () {
      var html = rows
        .map(function (row) {
          return "<tr><td>" + row.requester + "</td><td>" + row.snack + "</td></tr>";
        })
        .join("");

      $(this).html(html);
    });
  };
})(window.jQuery);

