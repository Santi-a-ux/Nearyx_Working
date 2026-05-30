from fastapi import APIRouter, Depends, HTTPException
import httpx
from pydantic import BaseModel
from typing import List
from app.core.security import verify_token
from app.core.config import settings

router = APIRouter()

class GeocodeResult(BaseModel):
    display_name: str
    lat: float
    lng: float

@router.get("/geocode", response_model=List[GeocodeResult])
async def geocode(q: str):
    """Convert an address query into latitude, longitude coordinates using OpenStreetMap Nominatim."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "json",
        "limit": 5
    }
    headers = {
        "User-Agent": settings.NOMINATIM_USER_AGENT
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data:
                results.append(GeocodeResult(
                    display_name=item.get("display_name", ""),
                    lat=float(item.get("lat")),
                    lng=float(item.get("lon"))
                ))
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching geocode data: {str(e)}")

class ReverseGeocodeResult(BaseModel):
    display_name: str
    details: dict

@router.get("/reverse-geocode", response_model=ReverseGeocodeResult)
async def reverse_geocode(lat: float, lng: float):
    """Convert coordinates into an address details using OpenStreetMap Nominatim."""
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lng,
        "format": "json"
    }
    headers = {
        "User-Agent": settings.NOMINATIM_USER_AGENT
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if "error" in data:
                raise HTTPException(status_code=404, detail="Coordinates not found")
                
            return ReverseGeocodeResult(
                display_name=data.get("display_name", ""),
                details=data.get("address", {})
            )
    except httpx.HTTPStatusError:
         raise HTTPException(status_code=502, detail="Error connecting to upstream provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading coordinates: {str(e)}")