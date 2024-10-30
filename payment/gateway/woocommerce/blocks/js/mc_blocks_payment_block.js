const { registerPaymentMethod } = window.wc.wcBlocksRegistry;
const { getSetting } = window.wc.wcSettings;
const hooks = window.wp.hooks;

const settings = getSetting('makecommerce_data', null);

const path = settings.path || '';
const methods = settings.methods || [];
const manualRenewals = settings.manualRenewals || false;
const showSelector = settings.showSelector;

const wpElement = window.wp.element;

var customerCountry = MC_BLOCKS_SWITCHER.country.toLowerCase() || 'other';

function setCountry(input) {
    customerCountry = input;
}

function getCountry() {
    return customerCountry;
}

if (typeof methods['banklinks_grouped']['other'] === 'undefined') {
    methods['banklinks_grouped']['other'] = [];
}

const countrySelector = wpElement.createElement(
    'div',
    { className: 'makecommerce_country_selector' },
    Object.entries(methods['banklinks_grouped']).map(([country, arr], index) => {
        let labelClass = 'makecommerce_picker_label';
        if (getCountry() === country) {
            labelClass = 'makecommerce_picker_label selected';
        }
        return wpElement.createElement(
            'div',
            {
                className: 'makecommerce_picker_container',
            },
            wpElement.createElement(
                'input',
                {
                    className: 'makecommerce_country_picker',
                    id: 'makecommerce_' + country + '_picker',
                    name: 'makecommerce_country_picker',
                    value: country,
                    type: 'radio',
                    style: {
                        display: 'none'
                    }
                }
            ),
            wpElement.createElement(
                'label',
                {
                    className: labelClass,
                    htmlFor: 'makecommerce_' + country + '_picker',
                    value: country,
                    style: {
                        backgroundImage: 'url(' + path + country + '32.png)'
                    }
                }
            )
        );
    })
);

const bankLinkSelector = wpElement.createElement(
    'div',
    {
        className: 'makecommerce_picker_container',
    },
    Object.entries(methods['banklinks_grouped']).map(([country, methods], index) => {
        let display = 'none';
        if (getCountry() === country) {
            display = 'inline-flex';
        }
        return wpElement.createElement(
            'div',
            {
                className: 'makecommerce_banklink_picker_container',
                id: 'makecommerce_banklink_' + country + '_container',
                style: {
                    display: display
                }
            },
            Object.entries(methods).map(([key, method], index) =>
                wpElement.createElement(
                    'div',
                    {
                        className: 'makecommerce_payment_option',
                        id: method['country'] + '_' + method['name'],
                    },
                    wpElement.createElement(
                        'img',
                        {
                            className: 'makecommerce_picker_img',
                            src: method['logo_url']
                        }
                    )
                )
            ),
        );
    })
);

const paylaterSelector = wpElement.createElement(
    'div',
    {
        className: 'makecommerce_picker_container',
    },
    Object.entries(methods['paylater_grouped']).map(([country, methods], index) => {
        let display = 'none';
        if (getCountry() === country) {
            display = 'inline-flex';
        }
        return wpElement.createElement(
            'div',
            {
                className: 'makecommerce_paylater_picker_container',
                id: 'makecommerce_paylater_' + country + '_container',
                style: {
                    display: display
                }
            },
            Object.entries(methods).map(([key, method], index) =>
                wpElement.createElement(
                    'div',
                    {
                        className: 'makecommerce_payment_option',
                        id: method['country'] + '_' + method['name'],
                    },
                    wpElement.createElement(
                        'img',
                        {
                            className: 'makecommerce_picker_img',
                            src: method['logo_url']
                        }
                    )
                )
            ),
        );
    })
);

const ccSelector = wpElement.createElement(
    'div',
    { className: 'makecommerce_picker_container' },
    Object.entries(methods['cards']).map(([key, method], index) =>
        wpElement.createElement(
            'div',
            {
                className: 'makecommerce_payment_option',
                id: 'card_' + method['name'],
            },
            wpElement.createElement(
                'img',
                {
                    className: 'makecommerce_picker_img',
                    src: method['logo_url']
                }
            )
        )
    )
);

const paymentWidget = wpElement.createElement(
    'div',
    {
        className: 'makecommerce_payment_widget'
    },
    wpElement.createElement(
        'div',
        {
            className: 'makecommerce_selector_widget',
            style: {
                display: showSelector ? 'block' : 'none'
            }
        },
        countrySelector
    ),
    wpElement.createElement(
        'div',
        {
            className: 'makecommerce_banklinks_widget makecommerce_widget',
        },
        bankLinkSelector
    ),

    wpElement.createElement(
        'div',
        {
            className: 'makecommerce_paylater_widget makecommerce_widget',
        },
        paylaterSelector
    ),
    wpElement.createElement(
        'div',
        {
            className: 'makecommerce_cc_widget makecommerce_widget',
        },
        ccSelector
    )
);

const ccWidget = wpElement.createElement(
    'div',
    {
        className: 'makecommerce_payment_widget'
    },
    wpElement.createElement(
        'div',
        {
            className: 'makecommerce_cc_widget makecommerce_widget',
        },
        ccSelector
    )
);

/**
 * Create the content for the payment widget
 *
 * @param props
 * @since 3.5.0
 */
const Content = ( props ) => {
    const { eventRegistration, emitResponse } = props;
    const { onPaymentSetup } = eventRegistration;

    let subscription = false;
    props.cartData.cartItems.forEach((item) => {
        if (item.type === 'subscription') {
            subscription = true;
        }
    });

    wpElement.useEffect( () => {
        const unsubscribe = onPaymentSetup( async () => {

            if ( typeof document.getElementsByClassName('makecommerce_payment_option selected')[0] !== 'undefined' ) {
                const preselected_method_makecommerce = document.getElementsByClassName('makecommerce_payment_option selected')[0].id;
                return {
                    type: emitResponse.responseTypes.SUCCESS,
                    meta: {
                        paymentMethodData: {
                            preselected_method_makecommerce,
                        },
                    },
                };
            }

            return {
                type: emitResponse.responseTypes.ERROR,
                message: settings.paymentError,
            };
        } );
        // Unsubscribes when this component is unmounted.
        return () => {
            unsubscribe();
        };
    }, [
        emitResponse.responseTypes.ERROR,
        emitResponse.responseTypes.SUCCESS,
        onPaymentSetup,
    ] );
    if (subscription && !manualRenewals) {
        return ccWidget;
    }
    return paymentWidget;
};

const mcContent = wpElement.createElement(Content);

// Build the payment widget
const MakeCommerce_GW = {
    name: settings.name,
    label: settings.label,
    content: mcContent,
    edit: mcContent,
    savedTokenComponent: (
        paymentWidget
    ),
    icons: [],
    canMakePayment: () => true,
    ariaLabel: 'MakeCommerce payment option',
    supports: {
        features: [
            'products',
            'subscriptions'
        ],
    },
};

// Register the payment widget
registerPaymentMethod(MakeCommerce_GW);

/**
 * Hook which is run when the shipping address (country) changes
 */
hooks.addAction('experimental__woocommerce_blocks-checkout-set-shipping-address', 'makecommerce', function(e) {
    let country = e.storeCart.shippingAddress.country.toLowerCase();

    if ( Object.keys(methods['banklinks_grouped']).includes(country)) {
        setCountry(country);
        jQuery('.makecommerce_picker_label[value="' + country + '"]').click();
    } else {
        setCountry('other');
        jQuery('.makecommerce_picker_label[value="other"]').click();
    }
});
