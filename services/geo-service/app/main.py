from fastapi import FastAPI
from app.api import routes

app = FastAPI(title="Geo Service", version="1.0.0")

app.include_router(routes.router, prefix="/geo", tags=["Geolocation"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "geo-service"}