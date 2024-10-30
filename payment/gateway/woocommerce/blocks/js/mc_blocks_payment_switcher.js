jQuery(document).ready(function() {

    jQuery(document).on('click', '.makecommerce_picker_label', function() {
        jQuery('.makecommerce_picker_label').removeClass('selected');
        jQuery(this).addClass('selected');

        jQuery('#' + jQuery(this).attr('for')).prop("checked", true);

        var country = jQuery(this).attr('value');

        jQuery('.makecommerce_banklink_picker_container').hide();
        jQuery('#makecommerce_banklink_' + country + '_container').show();


        jQuery('.makecommerce_paylater_picker_container').hide();
        jQuery('#makecommerce_paylater_' + country + '_container').show();
    });


    jQuery(document).on('click', '.makecommerce_picker_img', function() {
        jQuery('.makecommerce_picker_img').removeClass('selected');
        jQuery('.makecommerce_payment_option').removeClass('selected');
        jQuery(this).addClass('selected');
        jQuery(this).closest('.makecommerce_payment_option').addClass('selected');
    });
});
