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
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
  }

  async addToCart(productName) {
    const productCard = this.page.locator('.inventory_item').filter({ hasText: productName });
    await productCard.locator('[data-test*="add-to-cart"]').click();
  }

  async getCartBadgeCount() {
    const badge = await this.cartBadge.isVisible();
    if (!badge) return 0;
    return parseInt(await this.cartBadge.textContent());
  }

  async goToCart() {
    await this.cartLink.click();
  }
}

// pages/CartPage.js
class CartPage {
  constructor(page) {
    this.page = page;
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async getCartItems() {
    const items = await this.page.locator('.cart_item').all();
    return items;
  }

  async removeItem(productName) {
    const item = this.page.locator('.cart_item').filter({ hasText: productName });
    await item.locator('[data-test*="remove"]').click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}

// pages/CheckoutPage.js
class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.zipCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async fillInformation(firstName, lastName, zipCode) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.zipCodeInput.fill(zipCode);
  }

  async continue() {
    await this.continueButton.click();
  }

  async finish() {
    await this.finishButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

// pages/CheckoutCompletePage.js
class CheckoutCompletePage {
  constructor(page) {
    this.page = page;
    this.completeHeader = page.locator('.complete-header');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  async isOrderComplete() {
    return await this.completeHeader.isVisible();
  }

  async getCompleteText() {
    return await this.completeHeader.textContent();
  }
}

// tests/checkout.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ProductsPage } = require('../pages/ProductsPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { CheckoutCompletePage } = require('../pages/CheckoutCompletePage');

test.describe('Shopping Cart and Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    const loginPage = new LoginPage(page);
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('Happy path - Add products to cart and complete checkout', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const completePage = new CheckoutCompletePage(page);

    // Add items to cart
    await productsPage.addToCart('Sauce Labs Backpack');
    await expect(await productsPage.getCartBadgeCount()).toBe(1);
    
    await productsPage.addToCart('Sauce Labs Bike Light');
    await expect(await productsPage.getCartBadgeCount()).toBe(2);

    // Go to cart
    await productsPage.goToCart();
    const cartItems = await cartPage.getCartItems();
    await expect(cartItems).toHaveLength(2);

    // Proceed to checkout
    await cartPage.checkout();

    // Fill checkout information
    await checkoutPage.fillInformation('John', 'Doe', '12345');
    await checkoutPage.continue();

    // Finish order
    await checkoutPage.finish();

    // Verify order confirmation
    await expect(await completePage.isOrderComplete()).toBeTruthy();
    await expect(await completePage.getCompleteText()).toContain('Thank you for your order');
  });

  test('Cart badge updates immediately when adding/removing items', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);

    // Verify cart is initially empty
    await expect(await productsPage.getCartBadgeCount()).toBe(0);

    // Add first item
    await productsPage.addToCart('Sauce Labs Backpack');
    await expect(await productsPage.getCartBadgeCount()).toBe(1);

    // Add second item
    await productsPage.addToCart('Sauce Labs Fleece Jacket');
    await expect(await productsPage.getCartBadgeCount()).toBe(2);

    // Remove an item from cart
    await productsPage.goToCart();
    await cartPage.removeItem('Sauce Labs Backpack');
    await expect(await productsPage.getCartBadgeCount()).toBe(1);
  });

  test('Checkout form validates required fields', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Add item and go to checkout
    await productsPage.addToCart('Sauce Labs Onesie');
    await productsPage.goToCart();
    await cartPage.checkout();

    // Try to continue without filling any fields
    await checkoutPage.continue();
    await expect(await checkoutPage.getErrorMessage()).toContain('First Name is required');

    // Fill only first name
    await checkoutPage.fillInformation('John', '', '');
    await checkoutPage.continue();
    await expect(await checkoutPage.getErrorMessage()).toContain('Last Name is required');

    // Fill first and last name
    await checkoutPage.fillInformation('John', 'Doe', '');
    await checkoutPage.continue();
    await expect(await checkoutPage.getErrorMessage()).toContain('Postal Code is required');
  });

  test('Edge case - Empty cart checkout attempt', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);

    // Go to empty cart
    await productsPage.goToCart();
    const cartItems = await cartPage.getCartItems();
    await expect(cartItems).toHaveLength(0);

    // Verify checkout button is still clickable (business logic decision)
    await expect(cartPage.checkoutButton).toBeEnabled();
  });

  test('Edge case - Special characters in checkout form', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const completePage = new CheckoutCompletePage(page);

    // Add item and proceed to checkout
    await productsPage.addToCart('Sauce Labs Bolt T-Shirt');
    await productsPage.goToCart();
    await cartPage.checkout();

    // Fill form with special characters
    await checkoutPage.fillInformation("O'Connor-Smith", "José María", "12345-6789");
    await checkoutPage.continue();
    
    // Should proceed without errors
    await expect(page.url()).toContain('checkout-step-two');
    
    // Complete checkout
    await checkoutPage.finish();
    await expect(await completePage.isOrderComplete()).toBeTruthy();
  });

  test('Accessibility - Keyboard navigation and ARIA roles', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Add item to cart
    await productsPage.addToCart('Sauce Labs Backpack');

    // Navigate to cart using Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Enter on cart link
    const cartLinkFocused = await page.locator('.shopping_cart_link:focus');
    await expect(cartLinkFocused).toBeVisible();
    await page.