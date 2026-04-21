import os
from typing import Optional
from tavily import TavilyClient

class TavilyAdapter:
    """Adaptador de Infraestructura para buscar dominios web usando Tavily."""
    
    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            print("WARNING: TAVILY_API_KEY not found in environment. Tavily search will fail.")
            
        self.client = TavilyClient(api_key=api_key) if api_key else None
        
    def find_official_website(self, razon_social: str, sector: str = "") -> Optional[str]:
        """Busca la página web oficial de una empresa usando la inteligencia de Tavily."""
        if not self.client:
            return None
            
        # Refinamos el query para evitar directorios (computrabajo, datosperu, etc.)
        query = f"Página web oficial de la empresa peruana {razon_social} {sector}"
        
        try:
            # Pedimos pocos resultados para no gastar créditos demás
            response = self.client.search(
                query=query, 
                search_depth="advanced", 
                max_results=3
            )
            
            results = response.get("results", [])
            
            # Filtramos los típicos agregadores y registros públicos peruanos
            blacklist = ["datosperu.org", "computrabajo.com", "universidadperu.com", "sunat.gob.pe", "linkedin.com/company", "facebook.com", "instagram.com"]
            
            for res in results:
                url = res.get("url", "").lower()
                is_blacklisted = any(bl in url for bl in blacklist)
                if not is_blacklisted and "http" in url:
                    return url
                    
            return None
        except Exception as e:
            print(f"Error fetching Tavily for {razon_social}: {e}")
            return None
