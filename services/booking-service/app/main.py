from fastapi import FastAPI
from app.routes import router

app = FastAPI(title="TTP Booking Service", version="1.0.0")

app.include_router(router, prefix="/bookings")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "booking-service"}
