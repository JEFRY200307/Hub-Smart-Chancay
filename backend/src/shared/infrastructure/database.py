import os
from sqlmodel import create_engine, Session

# Recuperamos la URL configurada en docker-compose.yml 
# Por defecto se conectará a sovereing_gateway_db
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://chancay_admin:chancay_password@db:5432/sovereign_gateway")

# Creamos el motor de DB (engine)
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    """Dependencia de FastAPI para inyectar la sesión en los endpoints"""
    with Session(engine) as session:
        yield session
