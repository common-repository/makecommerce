jQuery(function(){

	jQuery(document).on('updated_checkout', function() {

		jQuery(".parcel_machine_checkout").css('display', 'none');

		jQuery('.shipping_method:checked, .shipping_method[type=hidden]').each(function() {
			var method = jQuery(this).val(), display;
			if (method.indexOf(':') > -1) {
				var tmp = method.split(':');
				method = tmp[0];
			}
			jQuery(".parcel_machine_checkout_"+method).not(':first').remove();
			jQuery(".parcel_machine_checkout_"+method).css('display', 'table-row');
		});

		adjust_select_box_width();
	});

	jQuery(window).resize(function() {
		adjust_select_box_width();
	});

	function adjust_select_box_width() {
		// Get widths of the content, parcel_machine_checkout row
		var select_box_width;
		var content_width = jQuery('.woocommerce-checkout-review-order').width();
		var checkout_width = jQuery('.woocommerce-checkout').width();
		var parcel_row = jQuery('.parcel_machine_checkout');
		// Get the parent table class
		var default_layout = jQuery(parcel_row).closest('table').attr('class') == 'shop_table woocommerce-checkout-review-order-table';
		// Get the width of the correct select box
		parcel_row.find('.parcel-machine-select-box').each(function() {
			select_box_width = jQuery(this).width() > 1 ? jQuery(this).width() : select_box_width;
		});

		// If it is not the default table class, the theme is customized and no changes will be made
		if (default_layout && content_width !== 'undefined' && checkout_width !== 'undefined') {
			// Keep the searchable selectbox within size limits
			if (content_width > checkout_width / 2){
				jQuery('.parcel_machine_checkout > td').css('max-width', (content_width / 2 - 20) +'px');
			} else {
				jQuery('.parcel_machine_checkout > td').css('max-width', (content_width - 20) +'px');
			}
		}
	}
});
