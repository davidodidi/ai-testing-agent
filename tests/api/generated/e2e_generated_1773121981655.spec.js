const { test, expect } = require('@playwright/test');

test.describe('Shopping Cart and Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    
    // Login with standard user
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');
    
    // Wait for inventory page to load
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('Happy path - Add products to cart and complete checkout', async ({ page }) => {
    // Add first product to cart
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    
    // Verify cart badge updates to 1
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
    
    // Add second product to cart
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
    
    // Verify cart badge updates to 2
    await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
    
    // Go to cart
    await page.click('.shopping_cart_link');
    
    // Verify items are in cart
    await expect(page.locator('.cart_item')).toHaveCount(2);
    await expect(page.locator('.inventory_item_name').first()).toContainText('Sauce Labs Backpack');
    
    // Proceed to checkout
    await page.click('[data-test="checkout"]');
    
    // Fill checkout information
    await page.fill('[data-test="firstName"]', 'John');
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.fill('[data-test="postalCode"]', '12345');
    await page.click('[data-test="continue"]');
    
    // Verify checkout overview page
    await expect(page.locator('.summary_info')).toBeVisible();
    await expect(page.locator('.cart_item')).toHaveCount(2);
    
    // Complete purchase
    await page.click('[data-test="finish"]');
    
    // Verify order confirmation
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
    await expect(page.locator('.complete-text')).toContainText('Your order has been dispatched');
    await expect(page.locator('img[alt="Pony Express"]')).toBeVisible();
  });

  test('Alternative flow - Remove items from cart and update badge', async ({ page }) => {
    // Add multiple items
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]');
    
    // Verify badge shows 3
    await expect(page.locator('.shopping_cart_badge')).toHaveText('3');
    
    // Remove one item from product page
    await page.click('[data-test="remove-sauce-labs-bike-light"]');
    
    // Verify badge updates to 2
    await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
    
    // Go to cart
    await page.click('.shopping_cart_link');
    
    // Remove another item from cart page
    await page.click('[data-test="remove-sauce-labs-backpack"]');
    
    // Verify only 1 item remains
    await expect(page.locator('.cart_item')).toHaveCount(1);
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });

  test('Edge case - Empty cart checkout attempt', async ({ page }) => {
    // Go directly to cart without adding items
    await page.click('.shopping_cart_link');
    
    // Verify cart is empty
    await expect(page.locator('.cart_item')).toHaveCount(0);
    
    // Try to checkout
    await page.click('[data-test="checkout"]');
    
    // Should still navigate to checkout form
    await expect(page.locator('.checkout_info')).toBeVisible();
  });

  test('Form validation - Missing required fields in checkout', async ({ page }) => {
    // Add item and go to checkout
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('[data-test="checkout"]');
    
    // Try to continue without filling any fields
    await page.click('[data-test="continue"]');
    await expect(page.locator('[data-test="error"]')).toContainText('Error: First Name is required');
    
    // Fill only first name
    await page.fill('[data-test="firstName"]', 'John');
    await page.click('[data-test="continue"]');
    await expect(page.locator('[data-test="error"]')).toContainText('Error: Last Name is required');
    
    // Fill first and last name
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.click('[data-test="continue"]');
    await expect(page.locator('[data-test="error"]')).toContainText('Error: Postal Code is required');
    
    // Clear first name and try with only last name and zip
    await page.fill('[data-test="firstName"]', '');
    await page.fill('[data-test="postalCode"]', '12345');
    await page.click('[data-test="continue"]');
    await expect(page.locator('[data-test="error"]')).toContainText('Error: First Name is required');
  });

  test('Edge case - Special characters in checkout form', async ({ page }) => {
    // Add item and go to checkout
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('[data-test="checkout"]');
    
    // Fill form with special characters
    await page.fill('[data-test="firstName"]', "John-O'Brien");
    await page.fill('[data-test="lastName"]', 'Müller-García');
    await page.fill('[data-test="postalCode"]', '12345-6789');
    await page.click('[data-test="continue"]');
    
    // Should proceed to checkout overview
    await expect(page.locator('.summary_info')).toBeVisible();
    
    // Complete purchase
    await page.click('[data-test="finish"]');
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
  });

  test('Edge case - Maximum items in cart', async ({ page }) => {
    // Add all available items to cart
    const addButtons = page.locator('button[data-test^="add-to-cart"]');
    const count = await addButtons.count();
    
    for (let i = 0; i < count; i++) {
      await addButtons.nth(i).click();
    }
    
    // Verify cart badge shows correct count
    await expect(page.locator('.shopping_cart_badge')).toHaveText(count.toString());
    
    // Go to cart and verify all items
    await page.click('.shopping_cart_link');
    await expect(page.locator('.cart_item')).toHaveCount(count);
    
    // Proceed through checkout
    await page.click('[data-test="checkout"]');
    await page.fill('[data-test="firstName"]', 'Jane');
    await page.fill('[data-test="lastName"]', 'Smith');
    await page.fill('[data-test="postalCode"]', '54321');
    await page.click('[data-test="continue"]');
    await page.click('[data-test="finish"]');
    
    // Verify order confirmation
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
  });

  test('Accessibility - Tab navigation through checkout flow', async ({ page }) => {
    // Add item to cart
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    
    // Navigate to cart using keyboard
    await page.keyboard.press('Tab'); // Skip to cart link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Open cart
    
    // Tab to checkout button
    await expect(page.locator('.cart_contents')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Click checkout
    
    // Tab through form fields
    await page.keyboard.press('Tab'); // Focus first name
    await page.keyboard.type('Alice');
    await page.keyboard.press('Tab'); // Focus last name
    await page.keyboard.type('Johnson');
    await page.keyboard.press('Tab'); // Focus postal code
    await page.keyboard.type('98765');
    await page.keyboard.press('Tab'); // Focus continue button
    await page.keyboard.press('Enter');
    
    // Complete order
    await expect(page.locator('.summary_info')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter