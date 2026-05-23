# COMEX.AI / Sovereign Gateway — Backend API
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Capa 1: dependencias (cache de build)
COPY requirements-core.txt requirements.txt ./
RUN pip install --upgrade pip \
    && pip install -r requirements-core.txt

# Capa 2: código
COPY alembic.ini alembic/ ./
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

RUN mkdir -p /app/uploads

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
