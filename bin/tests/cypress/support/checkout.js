Cypress.Commands.add("goToFront", () => {
    cy.visit('/');
});

Cypress.Commands.add("selectItemAndGoToCart", () => {
    cy.visit('/fusion-backpack.html');
    cy.server();
    cy.route('/customer/section/load/**').as('getCustomerSection');
    cy.route('/review/product/listAjax/**').as('getProduct');
    cy.wait('@getProduct', {"timeout": 15000});
    cy.wait(5000);
    cy.get('#product-addtocart-button').click();
    cy.wait('@getCustomerSection');
    cy.get('.message-success > div').contains('to your shopping cart.');
});

Cypress.Commands.add("selectMultipleItemsAndGoToCart", () => {
    cy.visit('/fusion-backpack.html');
    cy.server();
    cy.route('/customer/section/load/**').as('getCustomerSection');
    cy.route('/review/product/listAjax/**').as('getProduct');
    cy.wait('@getProduct', {"timeout": 15000});
    cy.get('#product-addtocart-button').click();
    cy.wait('@getCustomerSection');
    cy.get('.message-success > div').contains('to your shopping cart.');
    cy.visit('/push-it-messenger-bag.html');
    cy.route('/customer/section/load/**').as('getCustomerSection');
    cy.route('/review/product/listAjax/**').as('getProduct');
    cy.wait('@getProduct', {"timeout": 15000});
    cy.get('#product-addtocart-button').click();
    cy.wait('@getCustomerSection');
    cy.visit('/hero-hoodie.html');
    cy.route('/customer/section/load/**').as('getCustomerSection');
    cy.route('/review/product/listAjax/**').as('getProduct');
    cy.wait('@getProduct', {"timeout": 15000});
    cy.get('#product-addtocart-button').click();
    cy.wait('@getCustomerSection');
});

Cypress.Commands.add("addProductQuantity", (qty) => {

    cy.server();
    cy.route('/customer/section/load/**').as('getCustomerSection');

    cy.get('.product-item-pricing > .details-qty > .cart-item-qty').clear();
    cy.get('.product-item-pricing > .details-qty > .cart-item-qty').type(qty, {force: true});
    cy.get('.product-item-pricing > .details-qty > button').click();

    cy.wait('@getCustomerSection');
});

Cypress.Commands.add("goToCheckout", () => {
    cy.visit("/checkout");
});

Cypress.Commands.add("fillShippingForm", (country) => {
    cy.server();
    cy.route('POST', '/rest/default/V1/guest-carts/*/estimate-shipping-methods').as('getEstimateShippingMethods');
    cy.route('POST', '/rest/default/V1/guest-carts/*/shipping-information').as('postShippingInformation');
    cy.route('POST', '/rest/default/V1/customers/isEmailAvailable').as('isEmailAvailable');

    cy.get('#customer-email', {"timeout": 55000}).clear({force: true});
    cy.get('[name="firstname"]').clear({force: true});
    cy.get('[name="lastname"]').clear({force: true});
    cy.get('[name="street[0]"]').clear({force: true});
    cy.get('[name="city"]').clear({force: true});
    cy.get('[name="postcode"]').clear({force: true});
    cy.get('[name="telephone"]').clear({force: true});


    let customerFixture = "customerFR";

    if (country !== undefined) {
        customerFixture = "customer" + country
    }

    cy.wait('@getEstimateShippingMethods', {"timeout": 35000});

    cy.fixture(customerFixture).then((customer) => {
        cy.get('#customer-email', {"timeout": 55000}).type(customer.email);
        cy.wait('@isEmailAvailable', {"timeout": 35000});

        cy.get('[name="firstname"]').type(customer.firstName);
        cy.get('[name="lastname"]').type(customer.lastName);
        cy.get('[name="street[0]"]').type(customer.streetAddress);
        cy.get('[name="city"]').type(customer.city);
        cy.get('[name="postcode"]').type(customer.zipCode);
        cy.get('[name="country_id"]').select(customer.country, {force: true});
        cy.get('[name="telephone"]').type(customer.phone);
    });

    cy.wait('@getEstimateShippingMethods', {"timeout": 35000});
    cy.get('input[value="flatrate_flatrate"]').should('be.checked');
    cy.get('button.continue').click();
});

Cypress.Commands.add("checkOrderRedirect", () => {
    cy.location('pathname', {timeout: 50000}).should('include', '/checkout/onepage');
});

Cypress.Commands.add("checkOrderSuccess", () => {
    cy.location('pathname', {timeout: 50000}).should('include', '/checkout/onepage/success');
});

Cypress.Commands.add("checkOrderCancelled", () => {
    cy.location('pathname', {timeout: 50000}).should('include', '/checkout/onepage/failure');
});

Cypress.Commands.add("checkUnsupportedPayment", () => {
    cy.checkHostedFieldsError("This credit card type is not allowed for this payment method.");
});

Cypress.Commands.add("checkHostedFieldsError", (msg) => {
    cy.location('pathname', {timeout: 50000}).should('include', '/checkout/');
    cy.get('div[data-ui-id="checkout-cart-validationmessages-message-error"]', {timeout: 50000}).contains(
        msg
    );
});

Cypress.Commands.add("saveLastOrderId", () => {

    cy.get('body').then(($body) => {
        if ($body.find('.checkout-success > :nth-child(1) > span').length) {

            cy.get('.checkout-success > :nth-child(1) > span').then(($data) => {
                cy.fixture('order').then((order) => {
                    order.lastOrderId = $data.text();
                    cy.writeFile('cypress/fixtures/order.json', order);
                });
            });
        }
    });
});

/**
 * Process an order ( Checkout and pay with Hosted Fields)
 */
Cypress.Commands.add("processAnOrder", () => {
    cy.configureAndActivatePaymentMethod('hipay_hosted_fields');
    cy.goToFront();
    cy.selectItemAndGoToCart();
    cy.goToCheckout();
    cy.fillShippingForm("FR");
    cy.get('#hipay_hosted_fields').click();

    cy.get('#hipay-field-cardHolder> iframe');
    cy.wait(3000);
    cy.fill_hostedfield_card("visa_ok");
    cy.get(".payment-method._active > .payment-method-content .actions-toolbar:visible button").click();
    cy.checkOrderSuccess();
    cy.saveLastOrderId();
});

/**
 * Process an order ( Checkout and pay with Hosted Fields)
 */
Cypress.Commands.add("processAnOrderWithBasket", () => {
    cy.logToAdmin();
    cy.setOptionSendCart("1");
    cy.processAnOrder();
});
