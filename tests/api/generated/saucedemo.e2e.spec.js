import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite — SauceDemo (https://www.saucedemo.com)
 *
 * Covers:
 *  - Login (valid + invalid)
 *  - Product listing and sorting
 *  - Add to cart / remove from cart
 *  - Full checkout flow
 *  - Logout
 *
 * Author: David Odidi — QA Automation Engineer | github.com/davidodidi
 */

const BASE_URL = 'https://www.saucedemo.com';
const VALID_USER = 'standard_user';
const VALID_PASSWORD = 'secret_sauce';
const LOCKED_USER = 'locked_out_user';

test.describe('SauceDemo E2E', () => {

  test.describe('Authentication', () => {

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill(VALID_USER);
      await page.locator('[data-test="password"]').fill(VALID_PASSWORD);
      await page.locator('[data-test="login-button"]').click();

      await expect(page).toHaveURL(`${BASE_URL}/inventory.html`);
      await expect(page.locator('.inventory_list')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill('wrong_user');
      await page.locator('[data-test="password"]').fill('wrong_pass');
      await page.locator('[data-test="login-button"]').click();

      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
    });

    test('should show error for locked out user', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill(LOCKED_USER);
      await page.locator('[data-test="password"]').fill(VALID_PASSWORD);
      await page.locator('[data-test="login-button"]').click();

      await expect(page.locator('[data-test="error"]')).toBeVisible();
      await expect(page.locator('[data-test="error"]')).toContainText('locked out');
    });

    test('should show error when username is missing', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="password"]').fill(VALID_PASSWORD);
      await page.locator('[data-test="login-button"]').click();

      await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
    });

    test('should show error when password is missing', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill(VALID_USER);
      await page.locator('[data-test="login-button"]').click();

      await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
    });

  });

  test.describe('Product Listing', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill(VALID_USER);
      await page.locator('[data-test="password"]').fill(VALID_PASSWORD);
      await page.locator('[data-test="login-button"]').click();
      await expect(page).toHaveURL(`${BASE_URL}/inventory.html`);
    });

    test('should display 6 products on inventory page', async ({ page }) => {
      const products = page.locator('.inventory_item');
      await expect(products).toHaveCount(6);
    });

    test('should sort products by price low to high', async ({ page }) => {
      await page.locator('[data-test="product-sort-container"]').selectOption('lohi');

      const prices = page.locator('.inventory_item_price');
      const priceTexts = await prices.allTextContents();
      const priceValues = priceTexts.map(p => parseFloat(p.replace('$', '')));

      for (let i = 0; i < priceValues.length - 1; i++) {
        expect(priceValues[i]).toBeLessThanOrEqual(priceValues[i + 1]);
      }
    });

    test('should sort products by name A to Z', async ({ page }) => {
      await page.locator('[data-test="product-sort-container"]').selectOption('az');

      const names = page.locator('.inventory_item_name');
      const nameTexts = await names.allTextContents();
      const sorted = [...nameTexts].sort();

      expect(nameTexts).toEqual(sorted);
    });

    test('should navigate to product detail page', async ({ page }) => {
      await page.locator('.inventory_item_name').first().click();
      await expect(page).toHaveURL(/inventory-item/);
      await expect(page.locator('.inventory_details_name')).toBeVisible();
    });

  });

  test.describe('Cart', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill(VALID_USER);
      await page.locator('[data-test="password"]').fill(VALID_PASSWORD);
      await page.locator('[data-test="login-button"]').click();
      await expect(page).toHaveURL(`${BASE_URL}/inventory.html`);
    });

    test('should add a product to cart and update badge', async ({ page }) => {
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();

      await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
    });

    test('should add multiple products to cart', async ({ page }) => {
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();

      await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
    });

    test('should remove a product from cart', async ({ page }) => {
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

      await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
      await expect(page.locator('.shopping_cart_badge')).not.toBeVisible();
    });

    test('should show correct item in cart page', async ({ page }) => {
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      await page.locator('.shopping_cart_link').click();

      await expect(page).toHaveURL(`${BASE_URL}/cart.html`);
      await expect(page.locator('.cart_item')).toHaveCount(1);
      await expect(page.locator('.inventory_item_name')).toContainText('Sauce Labs Backpack');
    });

  });

  test.describe('Checkout Flow', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill(VALID_USER);
      await page.locator('[data-test="password"]').fill(VALID_PASSWORD);
      await page.locator('[data-test="login-button"]').click();
      await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
      await page.locator('.shopping_cart_link').click();
    });

    test('should complete full checkout flow successfully', async ({ page }) => {
      // Proceed to checkout
      await page.locator('[data-test="checkout"]').click();
      await expect(page).toHaveURL(`${BASE_URL}/checkout-step-one.html`);

      // Fill shipping info
      await page.locator('[data-test="firstName"]').fill('John');
      await page.locator('[data-test="lastName"]').fill('Doe');
      await page.locator('[data-test="postalCode"]').fill('M5V1A1');
      await page.locator('[data-test="continue"]').click();

      // Verify order summary
      await expect(page).toHaveURL(`${BASE_URL}/checkout-step-two.html`);
      await expect(page.locator('.cart_item')).toHaveCount(1);
      await expect(page.locator('.summary_total_label')).toBeVisible();

      // Complete order
      await page.locator('[data-test="finish"]').click();
      await expect(page).toHaveURL(`${BASE_URL}/checkout-complete.html`);
      await expect(page.locator('.complete-header')).toContainText('Thank you for your order');
    });

    test('should show error when first name is missing at checkout', async ({ page }) => {
      await page.locator('[data-test="checkout"]').click();
      await page.locator('[data-test="lastName"]').fill('Doe');
      await page.locator('[data-test="postalCode"]').fill('M5V1A1');
      await page.locator('[data-test="continue"]').click();

      await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');
    });

    test('should show error when last name is missing at checkout', async ({ page }) => {
      await page.locator('[data-test="checkout"]').click();
      await page.locator('[data-test="firstName"]').fill('John');
      await page.locator('[data-test="postalCode"]').fill('M5V1A1');
      await page.locator('[data-test="continue"]').click();

      await expect(page.locator('[data-test="error"]')).toContainText('Last Name is required');
    });

    test('should show error when postal code is missing at checkout', async ({ page }) => {
      await page.locator('[data-test="checkout"]').click();
      await page.locator('[data-test="firstName"]').fill('John');
      await page.locator('[data-test="lastName"]').fill('Doe');
      await page.locator('[data-test="continue"]').click();

      await expect(page.locator('[data-test="error"]')).toContainText('Postal Code is required');
    });

    test('should allow cancelling checkout and return to cart', async ({ page }) => {
      await page.locator('[data-test="checkout"]').click();
      await page.locator('[data-test="cancel"]').click();

      await expect(page).toHaveURL(`${BASE_URL}/cart.html`);
    });

  });

  test.describe('Logout', () => {

    test('should logout successfully', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill(VALID_USER);
      await page.locator('[data-test="password"]').fill(VALID_PASSWORD);
      await page.locator('[data-test="login-button"]').click();

      await page.locator('#react-burger-menu-btn').click();
      await page.locator('[data-test="logout-sidebar-link"]').click();

      await expect(page).toHaveURL(BASE_URL + '/');
      await expect(page.locator('[data-test="login-button"]')).toBeVisible();
    });

  });

});
