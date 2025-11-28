#!/usr/bin/env python3
"""
Script de migração em massa: Selenium → Playwright
Data: 2025-11-27
Autor: Claude Code

Migra TODOS os scrapers Python de Selenium para Playwright.
"""
import re
import os
from pathlib import Path
from typing import List, Dict, Tuple

# Diretório de scrapers
SCRAPERS_DIR = Path(__file__).parent / "scrapers"

# Mapea mentos de conversão Selenium → Playwright
CONVERSIONS = [
    # Imports
    (r'from selenium import webdriver', '# Removed: from selenium import webdriver'),
    (r'from selenium\.webdriver\.common\.by import By', '# Removed: from selenium.webdriver.common.by import By'),
    (r'from selenium\.webdriver\.common\.keys import Keys', '# Removed: from selenium.webdriver.common.keys import Keys'),
    (r'from selenium\.webdriver\.support\.ui import WebDriverWait', '# Removed: from selenium.webdriver.support.ui import WebDriverWait'),
    (r'from selenium\.webdriver\.support import expected_conditions as EC', '# Removed: from selenium.webdriver.support import expected_conditions as EC'),
    (r'from selenium\.webdriver\.chrome\.options import Options', '# Removed: from selenium.webdriver.chrome.options import Options'),

    # Driver operations
    (r'self\.driver = self\._create_driver\(\)', '# Driver created in base_scraper'),
    (r'if not self\.driver:', 'if not self.page:'),
    (r'self\.driver\.get\(([^)]+)\)', r'await self.page.goto(\1, wait_until="networkidle")'),
    (r'self\.driver\.refresh\(\)', r'await self.page.reload()'),
    (r'self\.driver\.current_url', 'self.page.url'),
    (r'self\.driver\.page_source', 'await self.page.content()'),
    (r'self\.driver\.quit\(\)', 'await self.page.close()'),
    (r'self\.driver\.close\(\)', 'await self.page.close()'),

    # Element finding (CSS)
    (r'self\.driver\.find_element\(By\.CSS_SELECTOR,\s*([^)]+)\)', r'await self.page.query_selector(\1)'),
    (r'self\.driver\.find_elements\(By\.CSS_SELECTOR,\s*([^)]+)\)', r'await self.page.query_selector_all(\1)'),
    (r'([a-zA-Z_]+)\.find_element\(By\.CSS_SELECTOR,\s*([^)]+)\)', r'await \1.query_selector(\2)'),
    (r'([a-zA-Z_]+)\.find_elements\(By\.CSS_SELECTOR,\s*([^)]+)\)', r'await \1.query_selector_all(\2)'),

    # Element finding (XPATH)
    (r'self\.driver\.find_element\(By\.XPATH,\s*([^)]+)\)', r'await self.page.query_selector(f"xpath={\1}")'),
    (r'self\.driver\.find_elements\(By\.XPATH,\s*([^)]+)\)', r'await self.page.query_selector_all(f"xpath={\1}")'),
    (r'([a-zA-Z_]+)\.find_element\(By\.XPATH,\s*([^)]+)\)', r'await \1.query_selector(f"xpath={\2}")'),
    (r'([a-zA-Z_]+)\.find_elements\(By\.XPATH,\s*([^)]+)\)', r'await \1.query_selector_all(f"xpath={\2}")'),

    # Element finding (ID, NAME, TAG)
    (r'self\.driver\.find_element\(By\.ID,\s*"([^"]+)"\)', r'await self.page.query_selector("#\1")'),
    (r'self\.driver\.find_element\(By\.NAME,\s*"([^"]+)"\)', r'await self.page.query_selector("[name=\'\1\']")'),
    (r'self\.driver\.find_element\(By\.TAG_NAME,\s*"([^"]+)"\)', r'await self.page.query_selector("\1")'),
    (r'self\.driver\.find_elements\(By\.TAG_NAME,\s*"([^"]+)"\)', r'await self.page.query_selector_all("\1")'),
    (r'([a-zA-Z_]+)\.find_element\(By\.TAG_NAME,\s*"([^"]+)"\)', r'await \1.query_selector("\2")'),
    (r'([a-zA-Z_]+)\.find_elements\(By\.TAG_NAME,\s*"([^"]+)"\)', r'await \1.query_selector_all("\2")'),

    # Element properties
    (r'([a-zA-Z_]+)\.text\.strip\(\)', r'(await \1.text_content()).strip()'),
    (r'([a-zA-Z_]+)\.text', r'await \1.text_content()'),
    (r'([a-zA-Z_]+)\.get_attribute\(([^)]+)\)', r'await \1.get_attribute(\2)'),
    (r'([a-zA-Z_]+)\.is_displayed\(\)', r'await \1.is_visible()'),

    # Element actions
    (r'([a-zA-Z_]+)\.click\(\)', r'await \1.click()'),
    (r'([a-zA-Z_]+)\.send_keys\(([^)]+)\)', r'await \1.fill(\2)'),
    (r'([a-zA-Z_]+)\.clear\(\)', r'await \1.clear()'),

    # Cookies
    (r'self\.driver\.add_cookie\(([^)]+)\)', r'await self.context.add_cookies([\1])'),
    (r'self\.driver\.get_cookies\(\)', r'await self.context.cookies()'),
]


def migrate_file(file_path: Path) -> Tuple[bool, str]:
    """
    Migra um arquivo de Selenium para Playwright.

    Returns:
        (success, message)
    """
    try:
        # Ler conteúdo original
        content = file_path.read_text(encoding='utf-8')

        # Verificar se já foi migrado
        if 'MIGRATED TO PLAYWRIGHT' in content:
            return (False, f"SKIP: {file_path.name} - Already migrated")

        # Verificar se usa Selenium
        if 'from selenium' not in content:
            return (False, f"SKIP: {file_path.name} - Does not use Selenium")

        # Salvar backup
        backup_path = file_path.with_suffix('.py.bak')
        backup_path.write_text(content, encoding='utf-8')

        # Aplicar conversões
        migrated_content = content
        conversion_count = 0

        for pattern, replacement in CONVERSIONS:
            matches = len(re.findall(pattern, migrated_content))
            if matches > 0:
                migrated_content = re.sub(pattern, replacement, migrated_content)
                conversion_count += matches

        # Adicionar header de migração no topo do arquivo (após shebang se houver)
        lines = migrated_content.split('\n')
        insert_index = 0

        # Pular shebang
        if lines[0].startswith('#!'):
            insert_index = 1

        # Inserir header
        lines.insert(insert_index, '# MIGRATED TO PLAYWRIGHT - 2025-11-27')
        migrated_content = '\n'.join(lines)

        # Salvar arquivo migrado
        file_path.write_text(migrated_content, encoding='utf-8')

        return (True, f"OK: {file_path.name} - {conversion_count} conversions applied")

    except Exception as e:
        return (False, f"ERROR: {file_path.name} - {str(e)}")


def main():
    """Migra todos os scrapers."""
    print("=" * 80)
    print("SELENIUM → PLAYWRIGHT MASS MIGRATION")
    print("=" * 80)
    print()

    # Encontrar todos os scrapers
    scraper_files = list(SCRAPERS_DIR.glob("*_scraper.py"))

    print(f"Found {len(scraper_files)} scraper files")
    print()

    # Migrar cada arquivo
    results = {
        'success': [],
        'skipped': [],
        'errors': [],
    }

    for file_path in sorted(scraper_files):
        success, message = migrate_file(file_path)

        print(f"  {message}")

        if success:
            results['success'].append(file_path.name)
        elif message.startswith('SKIP'):
            results['skipped'].append(file_path.name)
        else:
            results['errors'].append(file_path.name)

    # Resumo
    print()
    print("=" * 80)
    print("MIGRATION SUMMARY")
    print("=" * 80)
    print(f"✅ Migrated: {len(results['success'])}")
    print(f"⏭️  Skipped: {len(results['skipped'])}")
    print(f"❌ Errors: {len(results['errors'])}")
    print()

    if results['success']:
        print("Migrated files:")
        for name in results['success']:
            print(f"  - {name}")
        print()

    if results['errors']:
        print("Files with errors:")
        for name in results['errors']:
            print(f"  - {name}")
        print()

    print("=" * 80)
    print("DONE! Backups saved as *.py.bak")
    print("=" * 80)


if __name__ == "__main__":
    main()
