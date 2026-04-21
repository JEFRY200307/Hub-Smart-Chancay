from scrapling import Fetcher

class ScraplingAdapter:
    """Adaptador de Infraestructura para extraer datos de páginas y PDFs usando Scrapling."""
    
    def __init__(self):
        # Configuramos el fetcher base
        # Scrapling maneja optimización antibot y parseo rápido
        self.fetcher = Fetcher()
        
    def extract_text_from_url(self, url: str) -> str:
        """Navega a la URL, elude protecciones si existen, y extrae todo el texto visible."""
        # Se obtiene el contenido manejando redirecciones y headers reales automáticamente
        try:
            page = self.fetcher.get(url)
            
            # Si se desea extraer el texto de un PDF en Scrapling, podemos necesitar
            # dependencias de PyPDF2 o pdfplumber, pero si es DOM:
            if "application/pdf" in page.response.headers.get("Content-Type", "") or url.endswith(".pdf"):
                return self._extract_pdf(page.response.content)
                
            # Extraer solo el texto visible, omitiendo scripts y estilos
            raw_text = page.text() # Este método de scrapling suele devolver el innerText limpio
            
            return raw_text
        except Exception as e:
            raise RuntimeError(f"Fallo al scrapear {url}: {str(e)}")
            
    def _extract_pdf(self, pdf_bytes) -> str:
        # Implementación simple de PyPDF2 si se requiere
        import PyPDF2
        import io
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for p in reader.pages:
            t = p.extract_text()
            if t:
                text += t + "\n"
        return text
