"""
OAuth Sites Configuration
Configuração dos 21 sites que requerem autenticação OAuth/Google

Ordem estratégica:
1. Google primeiro (base para SSO)
2. Sites brasileiros (fundamentalistas)
3. Sites internacionais (mercado)
4. Sites de AI
5. Sites de notícias
6. Sites de gestão de portfólio
"""

from typing import List, Dict, Any
from enum import Enum


class SiteCategory(str, Enum):
    """Categorias de sites OAuth"""
    CORE = "core"  # Google (base)
    FUNDAMENTAL = "fundamental"  # Análise fundamentalista
    MARKET = "market"  # Análise de mercado
    AI = "ai"  # Análise com AI
    NEWS = "news"  # Notícias e reports
    PORTFOLIO = "portfolio"  # Gestão de portfólio


# Configuração completa dos 21 sites
OAUTH_SITES_CONFIG: List[Dict[str, Any]] = [
    # 1. GOOGLE (BASE PARA OAUTH)
    {
        "id": "google",
        "name": "Google",
        "category": SiteCategory.CORE,
        "url": "https://accounts.google.com/",
        "login_type": "direct",  # Login direto (não é OAuth consumer)
        "login_selector": "//div[@data-email]",  # Elemento que indica login bem-sucedido
        "oauth_button": None,  # Não tem botão OAuth (é o provider)
        "instructions": "Faça login com sua conta Google. Esta será a base para login automático nos outros sites.",
        "wait_time": 30,  # Tempo máximo de espera (segundos)
        "order": 1,
        "required": True,  # Obrigatório
        "auto_click_oauth": False,  # Não tenta clicar botão automaticamente
        "verification_url": "https://myaccount.google.com/",  # URL para verificar login
    },

    # 2-4. FUNDAMENTAL ANALYSIS (BRASIL)
    {
        "id": "fundamentei",
        "name": "Fundamentei",
        "category": SiteCategory.FUNDAMENTAL,
        "url": "https://fundamentei.com.br/login",
        "login_type": "oauth",  # Login via OAuth Google
        "login_selector": "//a[contains(@href, '/logout')]",
        "oauth_button": "//button[contains(., 'Logar com o Google')]",  # XPath corrigido
        "instructions": "Clique em 'Continuar com Google' se solicitado. A maioria dos sites usará sua sessão Google automaticamente.",
        "wait_time": 20,
        "order": 2,
        "required": True,
        "auto_click_oauth": True,  # Tenta clicar automaticamente no botão Google
        "verification_url": "https://fundamentei.com.br/",
    },
    {
        "id": "investidor10",
        "name": "Investidor10",
        "category": SiteCategory.FUNDAMENTAL,
        "url": "https://investidor10.com.br/login/",
        "login_type": "oauth",
        "login_selector": "//a[contains(@href, '/sair')]",
        "oauth_button": "//button[contains(., 'Google')]",
        "instructions": "Autorize o acesso se solicitado.",
        "wait_time": 20,
        "order": 3,
        "required": True,
        "auto_click_oauth": True,
        "verification_url": "https://investidor10.com.br/",
    },
    {
        "id": "statusinvest",
        "name": "StatusInvest",
        "category": SiteCategory.FUNDAMENTAL,
        "url": "https://statusinvest.com.br/login",
        "login_type": "oauth",
        "login_selector": "//a[contains(text(), 'Sair')]",
        "oauth_button": "//button[contains(., 'Google')]",
        "instructions": "Autorize o acesso se solicitado.",
        "wait_time": 20,
        "order": 4,
        "required": True,
        "auto_click_oauth": True,
        "verification_url": "https://statusinvest.com.br/",
    },

    # 5-8. MARKET ANALYSIS
    {
        "id": "investing",
        "name": "Investing.com",
        "category": SiteCategory.MARKET,
        "url": "https://www.investing.com/",
        "login_type": "oauth",
        "login_selector": "//a[contains(@href, '/members/')]",
        "oauth_button": "//button[contains(., 'Google')]",
        "instructions": "Clique em 'Sign In' no topo e depois 'Continue with Google'.",
        "wait_time": 25,
        "order": 5,
        "required": True,
        "auto_click_oauth": True,
        "verification_url": "https://www.investing.com/",
    },
    {
        "id": "advfn",
        "name": "ADVFN",
        "category": SiteCategory.MARKET,
        "url": "https://br.advfn.com/",
        "login_type": "credentials",  # Pode requerer credenciais próprias
        "login_selector": "//a[contains(text(), 'Logout')]",
        "oauth_button": None,
        "instructions": "ADVFN pode requerer credenciais próprias. Se não tiver, pode pular. Site pesado pode demorar até 120s.",
        "wait_time": 30,  # Site pesado, pode demorar mais
        "order": 6,
        "required": False,  # Opcional
        "auto_click_oauth": False,
        "verification_url": "https://br.advfn.com/",
    },
    {
        "id": "google_finance",
        "name": "Google Finance",
        "category": SiteCategory.MARKET,
        "url": "https://www.google.com/finance/",
        "login_type": "auto",  # Login automático se já logado no Google
        "login_selector": "//div[@aria-label='Google apps']",
        "oauth_button": None,
        "instructions": "Deve estar automaticamente logado se fez login no Google.",
        "wait_time": 10,
        "order": 7,
        "required": True,
        "auto_click_oauth": False,
        "verification_url": "https://www.google.com/finance/",
    },
    {
        "id": "tradingview",
        "name": "TradingView",
        "category": SiteCategory.MARKET,
        "url": "https://www.tradingview.com/",
        "login_type": "oauth",
        "login_selector": "//button[contains(@aria-label, 'User')]",
        "oauth_button": "//button[contains(., 'Google')]",
        "instructions": "Clique em 'Sign in' e depois 'Continue with Google'.",
        "wait_time": 25,
        "order": 8,
        "required": True,
        "auto_click_oauth": True,
        "verification_url": "https://www.tradingview.com/",
    },

    # 9-13. AI ANALYSIS
    {
        "id": "chatgpt",
        "name": "ChatGPT",
        "category": SiteCategory.AI,
        "url": "https://chat.openai.com/",
        "login_type": "oauth",  # Pode usar Google OAuth
        "login_selector": "//div[@id='prompt-textarea']",
        "oauth_button": "//button[contains(., 'Google')]",
        "instructions": "Faça login com Google ou conta OpenAI.",
        "wait_time": 30,
        "order": 9,
        "required": False,  # Opcional (pode requerer conta paga)
        "auto_click_oauth": True,
        "verification_url": "https://chat.openai.com/",
    },
    {
        "id": "gemini",
        "name": "Gemini",
        "category": SiteCategory.AI,
        "url": "https://gemini.google.com/app",
        "login_type": "auto",  # Login automático via Google
        "login_selector": "//textarea[@placeholder]",
        "oauth_button": None,
        "instructions": "Deve estar automaticamente logado com conta Google.",
        "wait_time": 15,
        "order": 10,
        "required": True,
        "auto_click_oauth": False,
        "verification_url": "https://gemini.google.com/app",
    },
    {
        "id": "deepseek",
        "name": "DeepSeek",
        "category": SiteCategory.AI,
        "url": "https://chat.deepseek.com/",
        "login_type": "oauth",
        "login_selector": "//textarea",
        "oauth_button": "//button[contains(., 'Google')]",
        "instructions": "Faça login com Google ou crie uma conta.",
        "wait_time": 25,
        "order": 11,
        "required": False,  # Opcional
        "auto_click_oauth": True,
        "verification_url": "https://chat.deepseek.com/",
    },
    {
        "id": "claude",
        "name": "Claude",
        "category": SiteCategory.AI,
        "url": "https://claude.ai/",
        "login_type": "oauth",
        "login_selector": "//div[@contenteditable='true']",
        "oauth_button": "//button[contains(., 'Google')]",
        "instructions": "Faça login com Google ou email.",
        "wait_time": 25,
        "order": 12,
        "required": False,  # Opcional
        "auto_click_oauth": True,
        "verification_url": "https://claude.ai/",
    },
    {
        "id": "grok",
        "name": "Grok",
        "category": SiteCategory.AI,
        "url": "https://grok.x.ai/",
        "login_type": "twitter",  # Requer conta X/Twitter
        "login_selector": "//textarea",
        "oauth_button": None,
        "instructions": "Faça login com sua conta X (Twitter). Se não tiver, pode pular.",
        "wait_time": 25,
        "order": 13,
        "required": False,  # Opcional
        "auto_click_oauth": False,
        "verification_url": "https://grok.x.ai/",
    },

    # 14-19. NEWS & REPORTS
    {
        "id": "valor",
        "name": "Valor Econômico",
        "category": SiteCategory.NEWS,
        "url": "https://valor.globo.com/",
        "login_type": "subscription",  # Pode requerer assinatura
        "login_selector": "//a[contains(@href, '/logout')]",
        "oauth_button": None,
        "instructions": "Se tiver assinatura, faça login. Senão, pode pular.",
        "wait_time": 20,
        "order": 14,
        "required": False,
        "auto_click_oauth": False,
        "verification_url": "https://valor.globo.com/",
    },
    {
        "id": "exame",
        "name": "Exame",
        "category": SiteCategory.NEWS,
        "url": "https://exame.com/",
        "login_type": "subscription",
        "login_selector": "//a[contains(text(), 'Minha conta')]",
        "oauth_button": None,
        "instructions": "Se tiver conta premium, faça login. Senão, pode pular.",
        "wait_time": 20,
        "order": 15,
        "required": False,
        "auto_click_oauth": False,
        "verification_url": "https://exame.com/",
    },
    {
        "id": "infomoney",
        "name": "InfoMoney",
        "category": SiteCategory.NEWS,
        "url": "https://www.infomoney.com.br/",
        "login_type": "optional",
        "login_selector": "//a[contains(@href, '/conta')]",
        "oauth_button": None,
        "instructions": "Login opcional. Se tiver conta, faça login.",
        "wait_time": 20,
        "order": 16,
        "required": False,
        "auto_click_oauth": False,
        "verification_url": "https://www.infomoney.com.br/",
    },
    {
        "id": "estadao",
        "name": "Estadão",
        "category": SiteCategory.NEWS,
        "url": "https://www.estadao.com.br/",
        "login_type": "subscription",
        "login_selector": "//a[contains(@href, '/minha-conta')]",
        "oauth_button": None,
        "instructions": "Se tiver assinatura, faça login. Senão, pode pular.",
        "wait_time": 20,
        "order": 17,
        "required": False,
        "auto_click_oauth": False,
        "verification_url": "https://www.estadao.com.br/",
    },
    {
        "id": "maisretorno",
        "name": "Mais Retorno",
        "category": SiteCategory.NEWS,
        "url": "https://maisretorno.com/",
        "login_type": "oauth",
        "login_selector": "//a[contains(text(), 'Perfil')]",
        "oauth_button": "//button[contains(., 'Google')]",
        "instructions": "Faça login com Google.",
        "wait_time": 20,
        "order": 18,
        "required": True,
        "auto_click_oauth": True,
        "verification_url": "https://maisretorno.com/",
    },
    {
        "id": "google_news",
        "name": "Google News",
        "category": SiteCategory.NEWS,
        "url": "https://news.google.com/",
        "login_type": "auto",
        "login_selector": "//div[@aria-label='Google apps']",
        "oauth_button": None,
        "instructions": "Deve estar automaticamente logado com conta Google.",
        "wait_time": 10,
        "order": 19,
        "required": True,
        "auto_click_oauth": False,
        "verification_url": "https://news.google.com/",
    },

    # 20-21. PORTFOLIO MANAGEMENT
    {
        "id": "myprofit",
        "name": "MyProfit Web",
        "category": SiteCategory.PORTFOLIO,
        "url": "https://myprofitweb.com/Login.aspx",
        "login_type": "credentials",  # Login com email/senha próprio
        "login_selector": "//a[contains(@href, 'Logout')]",
        "oauth_button": None,  # Não tem OAuth Google
        "instructions": "Faça login com suas credenciais do MyProfit Web. Se não tiver conta, pode pular.",
        "wait_time": 25,
        "order": 20,
        "required": False,  # Opcional
        "auto_click_oauth": False,
        "verification_url": "https://myprofitweb.com/",
    },
    {
        "id": "kinvo",
        "name": "Kinvo",
        "category": SiteCategory.PORTFOLIO,
        "url": "https://app.kinvo.com.br/login",
        "login_type": "oauth",  # Pode ter OAuth Google
        "login_selector": "//a[contains(@href, '/logout')]",
        "oauth_button": "//button[contains(., 'Google')]",  # Tentar clicar no botão Google se existir
        "instructions": "Faça login com Google ou credenciais Kinvo. Se não tiver conta, pode pular.",
        "wait_time": 25,
        "order": 21,
        "required": False,  # Opcional
        "auto_click_oauth": True,  # Tentar clicar automaticamente se encontrar botão Google
        "verification_url": "https://app.kinvo.com.br/",
    },
]


def get_site_by_id(site_id: str) -> Dict[str, Any]:
    """Buscar configuração de site por ID"""
    for site in OAUTH_SITES_CONFIG:
        if site["id"] == site_id:
            return site
    raise ValueError(f"Site '{site_id}' não encontrado na configuração")


def get_sites_by_category(category: SiteCategory) -> List[Dict[str, Any]]:
    """Buscar sites por categoria"""
    return [site for site in OAUTH_SITES_CONFIG if site["category"] == category]


def get_required_sites() -> List[Dict[str, Any]]:
    """Retornar apenas sites obrigatórios"""
    return [site for site in OAUTH_SITES_CONFIG if site["required"]]


def get_optional_sites() -> List[Dict[str, Any]]:
    """Retornar apenas sites opcionais"""
    return [site for site in OAUTH_SITES_CONFIG if not site["required"]]


def get_sites_in_order() -> List[Dict[str, Any]]:
    """Retornar sites ordenados por ordem de execução"""
    return sorted(OAUTH_SITES_CONFIG, key=lambda x: x["order"])


# Metadados
OAUTH_CONFIG_METADATA = {
    "total_sites": len(OAUTH_SITES_CONFIG),
    "required_sites": len(get_required_sites()),
    "optional_sites": len(get_optional_sites()),
    "categories": {
        "core": len(get_sites_by_category(SiteCategory.CORE)),
        "fundamental": len(get_sites_by_category(SiteCategory.FUNDAMENTAL)),
        "market": len(get_sites_by_category(SiteCategory.MARKET)),
        "ai": len(get_sites_by_category(SiteCategory.AI)),
        "news": len(get_sites_by_category(SiteCategory.NEWS)),
        "portfolio": len(get_sites_by_category(SiteCategory.PORTFOLIO)),
    },
    "estimated_time_minutes": 18,  # Tempo estimado total (21 sites)
}
