#!/usr/bin/env python3
"""
UI Test Script for Warm & Human Design System
Tests the visual redesign of the financial interface
"""

from playwright.sync_api import sync_playwright
import json

def run_tests():
    results = {
        "tests": [],
        "passed": 0,
        "failed": 0
    }

    def log_test(name, passed, details=""):
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
        if details:
            print(f"   {details}")
        results["tests"].append({"name": name, "passed": passed, "details": details})
        if passed:
            results["passed"] += 1
        else:
            results["failed"] += 1

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        # Capture console messages
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))

        try:
            # Navigate to the app
            print("\n🧪 Starting UI Tests for Warm & Human Design\n")
            print("=" * 50)

            page.goto('http://localhost:3001', timeout=10000)
            page.wait_for_timeout(2000)  # Wait for React to render

            # Test 1: Verify warm background color in light mode
            print("\n📋 Test 1: Warm Color Palette (Light Mode)")
            body_bg = page.evaluate("""
                () => getComputedStyle(document.body).backgroundColor
            """)
            # Warm cream should be close to #FAF7F2 (rgb(250, 247, 242))
            log_test(
                "Background color is warm cream",
                "250" in body_bg or "247" in body_bg or "faf7f2" in body_bg.lower(),
                f"Background: {body_bg}"
            )

            # Test 2: Verify CSS custom properties are set
            print("\n📋 Test 2: CSS Custom Properties")
            css_vars = page.evaluate("""
                () => {
                    const style = getComputedStyle(document.documentElement);
                    return {
                        warmPrimary: style.getPropertyValue('--warm-primary').trim(),
                        warmSage: style.getPropertyValue('--warm-sage').trim(),
                        warmGold: style.getPropertyValue('--warm-gold').trim(),
                        warmCream: style.getPropertyValue('--warm-cream').trim(),
                    }
                }
            """)
            log_test(
                "Warm primary color is set (#E07A5F)",
                css_vars.get('warmPrimary', '').lower() == '#e07a5f',
                f"--warm-primary: {css_vars.get('warmPrimary', 'not set')}"
            )
            log_test(
                "Warm sage color is set (#81B29A)",
                css_vars.get('warmSage', '').lower() == '#81b29a',
                f"--warm-sage: {css_vars.get('warmSage', 'not set')}"
            )
            log_test(
                "Warm gold color is set (#F2CC8F)",
                css_vars.get('warmGold', '').lower() == '#f2cc8f',
                f"--warm-gold: {css_vars.get('warmGold', 'not set')}"
            )

            # Test 3: Dark mode toggle exists
            print("\n📋 Test 3: Dark Mode Toggle")
            toggle_button = page.locator('button[aria-label="Toggle dark mode"]')
            log_test(
                "Dark mode toggle button exists",
                toggle_button.count() > 0,
                f"Found {toggle_button.count()} toggle button(s)"
            )

            # Test 4: Toggle dark mode and verify
            print("\n📋 Test 4: Dark Mode Functionality")
            if toggle_button.count() > 0:
                toggle_button.click()
                page.wait_for_timeout(500)

                color_scheme = page.evaluate("""
                    () => document.documentElement.getAttribute('data-color-scheme')
                """)
                log_test(
                    "Dark mode activates on toggle click",
                    color_scheme == 'dark',
                    f"data-color-scheme: {color_scheme}"
                )

                # Check dark mode background
                dark_bg = page.evaluate("""
                    () => getComputedStyle(document.body).backgroundColor
                """)
                # Warm dark should be close to #1C1A17
                log_test(
                    "Dark mode uses warm dark background",
                    "28" in dark_bg or "26" in dark_bg or "23" in dark_bg,
                    f"Dark background: {dark_bg}"
                )

                # Toggle back to light mode
                toggle_button.click()
                page.wait_for_timeout(500)

            # Test 5: Check for OrganicBackground SVG elements
            print("\n📋 Test 5: OrganicBackground Component")
            svg_elements = page.locator('svg ellipse, svg circle').count()
            log_test(
                "OrganicBackground has floating blob shapes",
                svg_elements >= 3,
                f"Found {svg_elements} organic shapes (ellipses/circles)"
            )

            # Test 6: Check for soft blur filters
            svg_filters = page.locator('svg filter').count()
            log_test(
                "OrganicBackground has blur filters for soft effect",
                svg_filters >= 1,
                f"Found {svg_filters} SVG filter(s)"
            )

            # Test 7: Font family check
            print("\n📋 Test 6: Typography")
            font_family = page.evaluate("""
                () => getComputedStyle(document.body).fontFamily
            """)
            log_test(
                "Plus Jakarta Sans font is applied",
                "plus jakarta" in font_family.lower() or "jakarta" in font_family.lower(),
                f"Font family: {font_family[:60]}..."
            )

            # Test 8: Animation CSS custom properties
            print("\n📋 Test 7: Animation System")
            animations = page.evaluate("""
                () => {
                    const style = getComputedStyle(document.documentElement);
                    return {
                        easeSpring: style.getPropertyValue('--ease-spring').trim(),
                        easeGentle: style.getPropertyValue('--ease-gentle').trim(),
                    }
                }
            """)
            log_test(
                "Spring animation easing is defined",
                len(animations.get('easeSpring', '')) > 0,
                f"--ease-spring: {animations.get('easeSpring', 'not set')}"
            )

            # Take screenshots for visual verification
            print("\n📋 Test 8: Screenshot Capture")
            page.screenshot(path='/Users/eyad/dev/osman-demo-najjar/test-results-light.png', full_page=True)
            log_test("Light mode screenshot captured", True, "test-results-light.png")

            # Toggle to dark and screenshot
            if toggle_button.count() > 0:
                toggle_button.click()
                page.wait_for_timeout(500)
                page.screenshot(path='/Users/eyad/dev/osman-demo-najjar/test-results-dark.png', full_page=True)
                log_test("Dark mode screenshot captured", True, "test-results-dark.png")

            # Print console messages
            print("\n📋 Browser Console:")
            for msg in console_messages[:10]:
                print(f"   {msg}")

        except Exception as e:
            log_test("Test execution", False, str(e))

        finally:
            browser.close()

    # Summary
    print("\n" + "=" * 50)
    print(f"📊 TEST SUMMARY: {results['passed']}/{results['passed'] + results['failed']} passed")
    print("=" * 50)

    return results

if __name__ == "__main__":
    run_tests()
