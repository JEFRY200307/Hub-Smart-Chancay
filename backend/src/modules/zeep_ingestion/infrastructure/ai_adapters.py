from __future__ import annotations
import os
import json
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from groq import Groq

# --- ESTRUCTURAS DE DATOS PARA SALIDA ESTRUCTURADA (JSON) ---
class TipoOportunidad(str, Enum):
    tributaria = "Tributaria"
    geografica = "Geografica"
    servicios = "Servicios"
    aduanera = "Aduanera"
    logistica = "Logistica"
    otra = "Otra"

class EstructuracionOportunidadSchema(BaseModel):
    titulo: str = Field(..., description="Título conciso y oficial de la oportunidad o beneficio.")
    valor_destacado: str = Field(..., description="El valor principal destacable, ej: 'Exoneración del IGV' o 'Ubicación Estratégica'.")
    descripcion: str = Field(..., description="Resumen descriptivo del beneficio o característica resaltante.")
    tipo: TipoOportunidad = Field(..., description="Tipo principal del cual trata el documento.")
    fecha: str = Field(..., description="Fecha de publicación o emisión en formato YYYY-MM-DD. Si no hay, devolver ''")

class GroqStructuringAdapter:
    """Implementa el patrón Strategy para usar la API de Groq para Extraer Datos JSON"""
    
    def __init__(self):
        # Asume que GROQ_API_KEY está cargada en el entorno .env por el usuario
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("WARNING: GROQ_API_KEY no encontrada en las variables de entorno.")
        self.client = Groq(api_key=api_key)
        
        # Opcional: Permitir dinámicamente cambiar de modelo en el futuro.
        # qwen-2.5-32b-it u otros equivalentes muy rápidos.
        self.model_name = os.getenv("GROQ_MODEL", "llama3-8b-8192") # default por si qwen no está disponible en la grilla temporal

class CompanyEnrichmentSchema(BaseModel):
    dominio_web: Optional[str] = Field(None, description="Dominio web oficial, ej. www.empresa.com")
    correo_contacto: Optional[str] = Field(None, description="Correo electrónico de contacto, ej. ventas@empresa.com")
    linkedin: Optional[str] = Field(None, description="El link al perfil de LinkedIn de la empresa, si figura.")
    capacidad_operativa: Optional[dict] = Field(default_factory=dict, description="Diccionario estructurado con detalles como: flota_camiones, matpel (boolean), numero_empleados, infraestructura, etc.")
    trust_signals: Optional[dict] = Field(default_factory=dict, description="Diccionario estructurado con certificaciones como: ISO_9001, ISO_14001, BASC, OEA, experiencia_exportacion.")

    def extract_structured_json(self, raw_text: str, custom_system_prompt: str) -> EstructuracionOportunidadSchema:
        """Extrae la información basándose en el schema de Pydantic"""
        
        # Requerimos JSON estructurado
        completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"{custom_system_prompt}\n\nExtrae la información según la estructura JSON indicada. Debes devolver un JSON válido. No devuelvas ningún texto extra."
                },
                {
                    "role": "user",
                    "content": f"Documento crudo a procesar:\n\n{raw_text}"
                }
            ],
            model=self.model_name,
            temperature=0.0, # Determinístico
            response_format={"type": "json_object"}
        )
        
        response_content = completion.choices[0].message.content
        
        try:
            json_dict = json.loads(response_content)
            schema = EstructuracionOportunidadSchema.model_validate(json_dict)
            return schema
        except Exception as e:
            raise ValueError(f"Fallo al parsear la salida JSON del LLM: {str(e)} -> Respuesta: {response_content}")

    def extract_company_metrics(self, raw_text: str) -> CompanyEnrichmentSchema:
        """Extrae la información de compañía basándose en el CompanyEnrichmentSchema"""
        system_prompt = (
            "Eres una IA de Inteligencia Corporativa experta en la Zona Económica Especial (ZEEP) de Chancay. "
            "Tu labor es leer la página 'Quiénes Somos' o similar de una empresa y estructurar sus capacidades operativas (capa 2) "
            "y sus señales de confianza para inversión extranjera (capa 3), además de datos de contacto.\n"
            "Formato Capacidad Operativa: {\"flota\": str, \"tamaño_empresa\": str, \"matpel\": bool, \"servicios_especificos\": list}. "
            "Formato Trust Signals: {\"iso_9001\": bool, \"basc\": bool, \"oea\": bool, \"experiencia\": str}."
        )
        
        completion = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": f"{system_prompt}\n\nDevuelve únicamente un JSON válido que coincida con el esquema esperado."},
                {"role": "user", "content": f"Contenido Web:\n{raw_text}"}
            ],
            model=self.model_name,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        response_content = completion.choices[0].message.content
        
        try:
            json_dict = json.loads(response_content)
            schema = CompanyEnrichmentSchema.model_validate(json_dict)
            return schema
        except Exception as e:
            print(f"Error parseando Company Metrics: {e}")
            return CompanyEnrichmentSchema()


class GeminiSearchAdapter:
    """Implementa Gemini para búsquedas web o exploración de enlaces"""
    def __init__(self):
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("WARNING: GEMINI_API_KEY no encontrada.")
        # Utilizando GenAI nativo
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.5-pro"
        
    def search_sub_urls(self, context_url: str, goal: str) -> list[str]:
        # Pendiente de implementar invocación de herramientas si se requiere 
        # Deep Search en una web usando Google Search grounding.
        pass
