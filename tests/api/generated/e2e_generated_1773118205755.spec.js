// pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

// pages/ProductsPage.js
class ProductsPage {
  constructor(page) {
    this.page = page;
    this.addToCartButtons = page.locator('[data-test*="add-to-cart"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.productItems = page.locator('.inventory_item');
  }

  async addProductToCart(productIndex = 0) {
    await this.addToCartButtons.nth(productIndex).click();
  }

  async addMultipleProductsToCart(count) {
    for (let i = 0; i < count; i++) {
      await this.addToCartButtons.nth(i).click();
    }
  }

  async getCartBadgeCount() {
    const badgeText = await this.cartBadge.textContent();
    return parseInt(badgeText);
  }

  async navigateToCart() {
    await this.cartLink.click();
  }
}

// pages/CartPage.js
class CartPage {
  constructor(page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    self.removeButtons = page.locator('[data-test*="remove"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async getCartItemsCount() {
    return await this.cartItems.count();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  async removeItemFromCart(index = 0) {
    await this.removeButtons.nth(index).click();
  }
}

// pages/CheckoutPage.js
class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.orderCompleteHeader = page.locator('.complete-header');
    this.orderCompleteText = page.locator('.complete-text');
  }

  async fillCheckoutForm(firstName, lastName, postalCode) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  async continueToReview() {
    await this.continueButton.click();
  }

  async completeOrder() {
    await this.finishButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

// tests/checkout.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ProductsPage } = require('../pages/ProductsPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');

test.describe('Shopping Cart and Checkout Flow', () => {
  let loginPage, productsPage, cartPage, checkoutPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productsPage = new ProductsPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    await page.goto('https://www.saucedemo.com');
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('Happy Path - Add products to cart and complete checkout', async ({ page }) => {
    // Add products to cart
    await productsPage.addProductToCart(0);
    await productsPage.addProductToCart(1);

    // Verify cart badge updates immediately
    await expect(productsPage.cartBadge).toBeVisible();
    const cartCount = await productsPage.getCartBadgeCount();
    expect(cartCount).toBe(2);

    // Navigate to cart
    await productsPage.navigateToCart();
    const itemCount = await cartPage.getCartItemsCount();
    expect(itemCount).toBe(2);

    // Proceed to checkout
    await cartPage.proceedToCheckout();

    // Fill checkout form
    await checkoutPage.fillCheckoutForm('John', 'Doe', '12345');
    await checkoutPage.continueToReview();

    // Complete order
    await checkoutPage.completeOrder();

    // Verify order confirmation
    await expect(checkoutPage.orderCompleteHeader).toBeVisible();
    await expect(checkoutPage.orderCompleteHeader).toContainText('Thank you for your order!');
    await expect(checkoutPage.orderCompleteText).toContainText('Your order has been dispatched');
  });

  test('Alternative Flow - Checkout form validation for missing fields', async ({ page }) => {
    // Add product and go to checkout
    await productsPage.addProductToCart(0);
    await productsPage.navigateToCart();
    await cartPage.proceedToCheckout();

    // Try to continue without filling form
    await checkoutPage.continueToReview();
    await expect(checkoutPage.errorMessage).toBeVisible();
    let errorText = await checkoutPage.getErrorMessage();
    expect(errorText).toContain('First Name is required');

    // Fill only first name
    await checkoutPage.fillCheckoutForm('John', '', '');
    await checkoutPage.continueToReview();
    errorText = await checkoutPage.getErrorMessage();
    expect(errorText).toContain('Last Name is required');

    // Fill first and last name only
    await checkoutPage.fillCheckoutForm('John', 'Doe', '');
    await checkoutPage.continueToReview();
    errorText = await checkoutPage.getErrorMessage();
    expect(errorText).toContain('Postal Code is required');
  });

  test('Edge Case - Empty cart checkout attempt', async ({ page }) => {
    // Navigate to empty cart
    await productsPage.navigateToCart();
    
    // Verify checkout button behavior with empty cart
    await cartPage.proceedToCheckout();
    
    // Should still navigate to checkout page
    await expect(page).toHaveURL(/.*checkout-step-one/);
  });

  test('Edge Case - Remove items from cart', async ({ page }) => {
    // Add multiple products
    await productsPage.addMultipleProductsToCart(3);
    await expect(productsPage.cartBadge).toContainText('3');

    // Navigate to cart
    await productsPage.navigateToCart();
    
    // Remove one item
    await cartPage.removeItemFromCart(0);
    
    // Verify cart badge updates
    await expect(productsPage.cartBadge).toContainText('2');
    
    // Remove all remaining items
    await cartPage.removeItemFromCart(0);
    await cartPage.removeItemFromCart(0);
    
    // Verify cart badge disappears
    await expect(productsPage.cartBadge).not.toBeVisible();
  });

  test('Accessibility - Keyboard navigation and ARIA roles', async ({ page }) => {
    // Test tab navigation through product page
    await page.keyboard.press('Tab'); // Skip to first interactive element
    
    // Add product using Enter key
    const firstAddButton = productsPage.addToCartButtons.first();
    await firstAddButton.focus();
    await page.keyboard.press('Enter');
    await expect(productsPage.cartBadge).toBeVisible();

    // Navigate to cart using keyboard
    await productsPage.cartLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/.*cart/);

    // Tab to checkout button
    await checkoutPage.checkoutButton.focus();
    await page.keyboard.press('Enter');

    // Test form navigation
    await expect(checkoutPage.firstNameInput).toBeFocused();
    await page.keyboard.type('John');
    await page.keyboard.press('Tab');
    await expect(checkoutPage.lastNameInput).toBeFocused();
    await page.keyboard.type('Doe');
    await page.keyboard.press('Tab');
    await expect(checkoutPage.postalCodeInput).toBeFocused();
    await page.keyboard.type('12345');
    
    // Verify ARIA roles and labels
    await expect(productsPage.cartLink).toHaveAttribute('aria-label', /cart/i);
    await expect(checkoutPage.firstNameInput).toHaveAttribute('placeholder', /first name/i);
    await expect(checkoutPage.lastNameInput).toHaveAttribute('placeholder', /last name/i);
    await expect(checkoutPage.postalCodeInput).toHaveAttribute('placeholder', /zip/i);
  });

  test('Alternative Flow - Cancel checkout process', async ({ page