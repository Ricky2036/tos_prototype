import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 412, 'height': 915})
        page = await context.new_page()
        
        # 1. 打开首页并进入系统设置
        await page.goto("http://localhost:9999")
        await page.wait_for_timeout(2000)
        
        # 点击设置应用 (若需要) 或直接在控制台操作
        # 打开系统页面
        await page.evaluate("""() => {
            const sys = window.__tosAppRegistry || window.__systemStore;
            // 尝试打开设置
        }""")
        
        # 截屏首页
        await page.screenshot(path=".local-evidence/prototype_verification/00_home.png")
        print("Captured 00_home.png")
        await browser.close()

asyncio.run(run())
