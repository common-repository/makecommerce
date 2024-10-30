<?php

namespace MakeCommerce\Payment\Gateway;

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;
use Automattic\WooCommerce\Blocks\Payments\PaymentResult;
use Automattic\WooCommerce\Blocks\Payments\PaymentContext;
use MakeCommerce\Shipping;
use MakeCommerce\Shipping\Method\Courier\Smartpost;
use MakeCommerce\Shipping\Method\ParcelMachine;

final class WooCommerceBlocks extends AbstractPaymentMethodType {
    public $name = 'makecommerce';

    protected $gateway;
    protected $settings;

    /**
     * Initialize the class and register actions
     *
     * @since 3.5.0
     */
    public function initialize() {
        $this->gateway = new WooCommerce( true );
        $this->settings = get_option( 'woocommerce_makecommerce_settings', [] );

        wp_enqueue_style( 'makecommerceblocks', plugins_url( '/css/makecommerceblocks.css', __FILE__ ) );

        add_action( 'wp_ajax_mc_blocks_save_shipping_data', [$this, 'save_shipping_data'] );
        add_action( 'wp_ajax_nopriv_mc_blocks_save_shipping_data', [$this, 'save_shipping_data'] );

        add_action( 'wp_ajax_get_parcel_machine_html', [$this, 'get_parcel_machine_html'] );
        add_action( 'wp_ajax_nopriv_get_parcel_machine_html', [$this, 'get_parcel_machine_html'] );

        add_action( 'wp_ajax_get_smartpost_courier_html', [$this, 'get_smartpost_courier_html'] );
        add_action( 'wp_ajax_nopriv_get_smartpost_courier_html', [$this, 'get_smartpost_courier_html'] );

        add_action( 'woocommerce_store_api_checkout_update_order_from_request', [$this, 'update_order_shipping_meta'] );
        add_action( 'woocommerce_checkout_subscription_created', [$this, 'update_subscription_order_shipping_meta'] );
    }

    /**
     * Check if the parent/legacy gateway is active
     *
     * @since 3.5.0
     */
    public function is_active() {
        return !empty( $this->settings['active'] ) && 'yes' === $this->settings['active'];
    }

    /**
     * Register/enqueue all the necessary js files
     *
     * @since 3.5.0
     */
    public function get_payment_method_script_handles() {

        // Register manually to use inline constant
        \MakeCommerce::mc_enqueue_script(
            'MC_BLOCKS_SWITCHER',
            dirname( __FILE__ ) . '/js/mc_blocks_payment_switcher.js',
            ['country' => WC()->countries->get_base_country()],
            [ 'jquery' ]
        );

        wp_register_script(
            'mc-blocks-payments',
            plugin_dir_url(__FILE__) . 'js/mc_blocks_payment_block.js',
            [
                'wc-blocks-registry',
                'wc-settings',
                'wp-element',
                'wp-hooks',
                'wp-html-entities',
                'jquery'
            ]
        );

        wp_register_script(
            'mc-blocks-parcelmachines',
            plugin_dir_url(__FILE__) . 'js/mc_blocks_parcelmachine.js',
            [
                'jquery',
                'wp-hooks',
                'wc-settings'
            ]
        );

        return [
            'mc-blocks-payments',
            'mc-blocks-parcelmachines'
        ];
    }

    /**
     * Add all the necessary data for creating the React payment block
     *
     * @since 3.5.0
     */
    public function get_payment_method_data() {

        $manual_renewals = false;
        if ( class_exists( '\WC_Subscriptions_Admin' )
             && get_option( \WC_Subscriptions_Admin::$option_prefix . '_accept_manual_renewals', 'no' ) === 'yes'
             && get_option( \WC_Subscriptions_Admin::$option_prefix . '_turn_off_automatic_payments', 'no' ) === 'yes'
        ) {
            $manual_renewals = true;
        }

        return [
            'name' => $this->name,
            'label' => $this->gateway->title,
            'methods' => $this->gateway->get_methods(),
            'path' => plugins_url( '../images/', __FILE__ ),
            'paymentError' => __( 'Please select suitable payment option!', 'wc_makecommerce_domain' ),
            'manualRenewals' => $manual_renewals,
            'showSelector' => $this->show_country_selector()
        ];
    }

    /**
     * Save shipping data from the frontend
     * Data saved into WC session
     *
     * @since 3.5.0
     */
    public function save_shipping_data() {
        // Set session data for selected shipping choice
        // Both parcel machines and smartpost courier
        if ( !empty( $_REQUEST['mc_shipping_data'] ) ) {
            WC()->session->set( 'mc_shipping_data', $_REQUEST['mc_shipping_data'] );
        }
    }

    /**
     * Update the order metadata based on the saved shipping data
     * In case of a subscription (two values in mc_shipping_data)
     * add new session value for the subscription order
     *
     * @param WC_Order order
     * @since 3.5.0
     */
    public function update_order_shipping_meta( $order ) {
        $data = WC()->session->get( 'mc_shipping_data' ) ?? [];

        if ( isset( $data[0]['time'] ) ) {
            $order->update_meta_data( '_delivery_time', $data[0]['time'] );
            $order->save();
        } else if ( isset( $data[0]['machine'] ) ) {
            Shipping::update_order_parcelmachine_meta( $data[0]['machine'], $order->get_id() );
        }

        if ( isset( $data[1] ) ) {
            WC()->session->set( 'mc_subscription_shipping_data', $data[1] );
        }

        WC()->session->__unset( 'mc_shipping_data' );
    }

    /**
     * Update the subscription order metadata
     * Works together with update_order_shipping_meta
     *
     * @param WC_Subscription subscription
     * @since 3.5.0
     */
    public function update_subscription_order_shipping_meta( $subscription ) {
        $data = WC()->session->get( 'mc_subscription_shipping_data' ) ?? [];

        if ( !empty( $data ) ) {
            if ( isset( $data['time'] ) ) {
                $subscription->update_meta_data( '_delivery_time', $data['time'] );
                $subscription->save();
            } else if ( isset( $data['machine'] ) ) {
                Shipping::update_order_parcelmachine_meta( $data['machine'], $subscription->get_id() );
            }
        }

        WC()->session->__unset( 'mc_subscription_shipping_data');
    }

    /**
     * Get specific carrier's parcel machine html
     *
     * @since 3.5.0
     */
    public function get_parcel_machine_html() {
        wp_send_json( [ 'html' => ParcelMachine::prepare_parcelmachine_checkout_html( $_REQUEST['mc_carrier_id'], false ) ] );
    }

    /**
     * Get smartpost courier html
     *
     * @since 3.5.0
     */
    public function get_smartpost_courier_html() {
        // Only smartpost has fields to display
        if ( $_REQUEST['mc_carrier_id'] === 'courier_smartpost' ) {
            wp_send_json( [ 'html' => Smartpost::prepare_smartpost_courier_checkout_fields( $_REQUEST['mc_carrier_id'], false ) ] );
        }

        // No html for other courier methods
        wp_send_json( [ 'html' => '' ] );
    }

    private function show_country_selector() {
        return !isset( $this->settings['ui_widget_countries_hidden'] ) || $this->settings['ui_widget_countries_hidden'] === 'no';
    }
}
