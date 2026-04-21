import os
import requests
import zipfile
import re
from urllib.parse import urljoin
from scrapling import Fetcher

class SunatScraper:
    """Infraestructura para descargar y procesar los padrones de la SUNAT."""

    def __init__(self, temp_dir: str = "/tmp/sunat_data"):
        self.temp_dir = temp_dir
        if not os.path.exists(self.temp_dir):
            os.makedirs(self.temp_dir, exist_ok=True)
            
        self.fetcher = Fetcher()

    def find_latest_padron_general_url(self, base_url_or_id: str) -> str:
        """Busca el enlace de descarga del padrón general (.zip) en el sitio de datos abiertos."""
        # Si se nos da una url directa que empieza con http, intentamos extraer de ahi.
        if base_url_or_id.startswith("http"):
            url = base_url_or_id
        else:
            # Sino asumimos que es el ID (ej: 51, 52)
            url = f"https://www.datosabiertos.gob.pe/dataset/padr%C3%B3n-ruc-superintendencia-nacional-de-aduanas-y-de-administraci%C3%B3n-tributaria-sunat-{base_url_or_id}"
            
        try:
            page = self.fetcher.get(url)
            # Buscamos un ancla que diga "Descargar" y apunte a un /download
            # Scrapling nos permite usar selectores CSS
            links = page.css("a[href$='/download']") # anchors terminando en /download
            
            for link in links:
                href = link.attrib.get('href', '')
                if 'node' in href and 'download' in href:
                    return urljoin(url, href)
                    
            # Fallback a regex si el selector CSS falla
            match = re.search(r'href="([^"]*/download)"', page.text())
            if match:
                return urljoin(url, match.group(1))
                
            raise ValueError(f"No se encontró el enlace de descarga en {url}")
        except Exception as e:
            raise RuntimeError(f"Fallo al buscar URL del padrón general: {str(e)}")

    def download_file(self, url: str, filename: str) -> str:
        """Descarga un archivo grande usando streaming."""
        file_path = os.path.join(self.temp_dir, filename)
        
        # Saltamos si ya lo hemos bajado recientemente (útil para pruebas)
        if os.path.exists(file_path):
            print(f"[{filename}] ya existe en disco.")
            return file_path
            
        print(f"Descargando de {url} hacia {file_path}...")
        # Usamos requests para streaming grandes, ya que scrapling lo carga en memoria
        with requests.get(url, stream=True, timeout=60, verify=False) as r:
            r.raise_for_status()
            with open(file_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192): 
                    f.write(chunk)
                    
        return file_path

    def extract_zip(self, zip_path: str) -> str:
        """Descomprime el zip y devuelve el path al archivo extraído."""
        print(f"Descomprimiendo {zip_path}...")
        extract_path = os.path.join(self.temp_dir, os.path.basename(zip_path).replace('.zip', '_extracted'))
        
        if not os.path.exists(extract_path):
            os.makedirs(extract_path, exist_ok=True)
            
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
            
        # Retorna el primer archivo relevante encontrado, generalmente un .txt o .csv
        for root, dirs, files in os.walk(extract_path):
            for file in files:
                if file.endswith('.txt') or file.endswith('.csv'):
                    return os.path.join(root, file)
                    
        raise ValueError(f"No se encontró un archivo .txt o .csv válido en {zip_path}")
