"""
Image downloader using Playwright route interception.
The live site serves images from codingwithsagar.in/wp-content/uploads/2026/02/
We intercept them as the browser loads the page.
"""
import os
import time
from playwright.sync_api import sync_playwright

SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")
PAGE_URL = "https://codingwithsagar.in/sp/developers-kit/"

WANTED_NAMES = {
    "Developers-Kit-1943x2048-1-972x1024.png",
    "300-Python-Projects-915x1024.png",
    "150-Front-end-Projects-915x1024.png",
    "C-915x1024.png",
    "Java-915x1024.png",
    "Django-915x1024.png",
    "PHP-915x1024.png",
    "react-915x1024.png",
    "150-Machine-Learnig-1-919x1024.png",
    "150-Machine-Learnig-918x1024.png",
    "100-Natural-Language-Processing-918x1024.png",
    "50-Natural-Language-Processing-919x1024.png",
    "softare-919x1024.png",
    "Arrow-49-1.png",
    "100-Editable-Resume-Templates-922x1024.jpg",
    "100-Programming-Tools-927x1024.jpg",
    "100-email-919x1024.png",
    "Roadmap-927x1024.jpg",
    "Lifetime-Validity-Updates-927x1024.jpg",
    "100-VS-Code-Keyboard-Shortcuts-927x1024.jpg",
    "100-money-back-guarantee4158.jpg",
}

captured = {}

def route_handler(route):
    url = route.request.url
    filename = url.split("/")[-1].split("?")[0]
    if filename in WANTED_NAMES and filename not in captured:
        try:
            resp = route.fetch()
            body = resp.body()
            if len(body) > 1000:
                save_path = os.path.join(SAVE_DIR, filename)
                with open(save_path, "wb") as f:
                    f.write(body)
                captured[filename] = len(body)
                print(f"  SAVED  {filename} ({len(body)//1024} KB)")
            else:
                print(f"  SMALL  {filename}: {len(body)} bytes, status {resp.status}")
            route.fulfill(response=resp)
            return
        except Exception as e:
            print(f"  ERROR  {filename}: {e}")
    route.continue_()

def main():
    os.makedirs(SAVE_DIR, exist_ok=True)
    print(f"Navigating to: {PAGE_URL}\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        )
        page = context.new_page()

        # Single handler for all image requests
        page.route("**/*.{png,jpg,jpeg,webp,gif}", route_handler)

        page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=60000)
        print("Page loaded. Scrolling to trigger lazy images...\n")

        for y in range(0, 12000, 300):
            page.evaluate(f"window.scrollTo(0, {y})")
            time.sleep(0.1)

        page.wait_for_timeout(5000)
        browser.close()

    missing = [n for n in WANTED_NAMES if n not in captured]
    print(f"\nDone. {len(captured)}/{len(WANTED_NAMES)} images saved to: {SAVE_DIR}")
    if missing:
        print(f"\nStill missing ({len(missing)}):")
        for m in sorted(missing):
            print(f"  - {m}")

if __name__ == "__main__":
    main()
