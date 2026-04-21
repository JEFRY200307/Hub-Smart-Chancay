# Dockerfile para Backend (FastAPI)
FROM python:3.12-slim

WORKDIR /app

# Instalar dependencias necesarias del sistema (útil para pgvector / psycopg2 si se usa a futuro)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos. En desarrollo usamos UV o PIP
# Dado que no tenemos requirements.txt aún, instalamos directo. 
# Para producción deberías tener un requirements.txt o pyproject.toml
RUN pip install "fastapi[all]" pydantic sqlalchemy pgvector uv psycopg2-binary "scrapling[all]" curl_cffi playwright browserforge apscheduler groq google-genai sqlmodel python-dotenv PyPDF2 pandas requests tavily-python "python-jose[cryptography]" "passlib[bcrypt]" "bcrypt==4.0.1"
RUN playwright install --with-deps chromium

# El código se montará vía un volumen en Docker Compose para tener hot-reload
# Pero copiamos todo por si se construye para Azure
COPY . /app/

# Exponer el puerto de Uvicorn
EXPOSE 8000

# Para Azure este sería el CMD normal, pero en docker-compose lo sobreescriberemos con --reload
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
