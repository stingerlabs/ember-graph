$('.api-index .nav-tabs a').click(function(e) {
	e.preventDefault();
	$(this).tab('show');
	window.location.hash = $(this).attr('href');
});

function showPane(href) {
	$('.api-index .nav-tabs a[href="' + href + '"]').tab('show');
}

$(window).on('hashchange', function() {
	var hash = window.location.hash;
	var el = $(hash);

	if (el.length > 0 && !el.is(':visible')) {
		var href = null;

		if (el.hasClass('tab-pane')) {
			href = '#' + el.attr('id');
		} else {
			href = '#' + el.parents('.tab-pane').attr('id');
		}

		showPane(href);
		$('html, body').scrollTop(el.offset().top);
	} else if (el.length === 0) {
		window.location.hash = '#index';
		showPane('#index');
	}

	// Make sure the index tab is selected if the panel is visible
	if ($('#index').is(':visible')) {
		showPane('#index');
	}
});

$(window).trigger('hashchange');