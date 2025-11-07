"""
Gemini Scraper - Análise via Google Gemini IA
Fonte: https://gemini.google.com/app
Requer login via Google OAuth
"""
import asyncio
import pickle
from datetime import datetime
from typing import Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class GeminiScraper(BaseScraper):
    BASE_URL = "https://gemini.google.com/app"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(name="Gemini", source="GEMINI", requires_login=True)

    async def initialize(self):
        if self._initialized:
            return
        if not self.driver:
            self.driver = self._create_driver()
        try:
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(3)
            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)
                for cookie in cookies:
                    if 'google.com' in cookie.get('domain', ''):
                        try:
                            self.driver.add_cookie(cookie)
                        except:
                            pass
                self.driver.refresh()
                await asyncio.sleep(3)
            except FileNotFoundError:
                logger.warning("Cookies not found")
            self._initialized = True
        except Exception as e:
            logger.error(f"Init error: {e}")
            raise

    async def scrape(self, prompt: str) -> ScraperResult:
        await self.initialize()
        try:
            input_selectors = ["textarea[placeholder*='Enter a prompt']", "textarea", "div[contenteditable='true']"]
            input_field = None
            for selector in input_selectors:
                try:
                    input_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if input_field:
                        break
                except:
                    continue

            if not input_field:
                return ScraperResult(success=False, error="Input field not found", source=self.source)

            input_field.send_keys(prompt)
            await asyncio.sleep(0.5)
            input_field.send_keys(Keys.RETURN)

            await asyncio.sleep(5)
            response = await self._extract_response()

            if response:
                return ScraperResult(success=True, data={"prompt": prompt, "response": response, "timestamp": datetime.now().isoformat()}, source=self.source)

            return ScraperResult(success=False, error="No response", source=self.source)
        except Exception as e:
            return ScraperResult(success=False, error=str(e), source=self.source)

    async def _extract_response(self) -> Optional[str]:
        max_wait = 60
        waited = 0
        while waited < max_wait:
            try:
                response_selectors = [".model-response", ".response-container", "[class*='response']"]
                for selector in response_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            text = elements[-1].text.strip()
                            if text and len(text) > 20:
                                return text
                    except:
                        continue
            except:
                pass
            await asyncio.sleep(2)
            waited += 2
        return None

    async def health_check(self) -> bool:
        try:
            await self.initialize()
            return True
        except:
            return False
