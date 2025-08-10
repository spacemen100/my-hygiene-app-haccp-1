from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the login page
    page.goto("http://localhost:3006/login")

    # Take a screenshot of the page
    page.screenshot(path="jules-scratch/verification/login-page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
