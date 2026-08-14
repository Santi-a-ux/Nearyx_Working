from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
import httpx
import websockets
import asyncio

app = FastAPI(title="API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = {
    "auth": "http://auth-service:8001",
    "users": "http://user-service:8002",
    "tutors": "http://tutor-service:8003",
    "geo": "http://geo-service:8004",
    "chat": "http://chat-service:8005",
    "media": "http://media-service:8006",
    "bookings": "http://booking-service:8007",
}

client = httpx.AsyncClient(timeout=10.0)

@app.on_event("shutdown")
async def shutdown_event():
    await client.aclose()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "api-gateway"}

async def _reverse_proxy(service_url: str, request: Request, full_path: str):
    url = httpx.URL(f"{service_url}/{full_path}", query=request.url.query.encode("utf-8"))
    headers = dict(request.headers)
    headers.pop("host", None)

    try:
        proxy_req = client.build_request(
            method=request.method,
            url=url,
            headers=headers,
            content=await request.body()
        )
        proxy_resp = await client.send(proxy_req, stream=True)
        resp_headers = dict(proxy_resp.headers)
        resp_headers.pop("content-length", None)
        resp_headers.pop("content-encoding", None)

        return StreamingResponse(
            proxy_resp.aiter_raw(),
            status_code=proxy_resp.status_code,
            headers=resp_headers,
            background=BackgroundTask(proxy_resp.aclose)
        )

    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Bad Gateway: {str(e)}")

# Match everything else
@app.api_route("/{service_name}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"])
async def gateway_router(service_name: str, path: str, request: Request):
    if service_name not in SERVICES:
        raise HTTPException(status_code=404, detail="Service not found")
        
    full_path = f"{service_name}/{path}"
    
    return await _reverse_proxy(SERVICES[service_name], request, full_path)

@app.websocket("/{service_name}/{path:path}")
async def websocket_gateway(websocket: WebSocket, service_name: str, path: str):
    if service_name not in SERVICES:
        await websocket.close(code=1008, reason="Service not found")
        return

    backend_url = SERVICES[service_name].replace("http://", "ws://")
    target_url = f"{backend_url}/{service_name}/{path}"
    query_string = websocket.url.query
    if query_string:
        target_url += f"?{query_string}"

    await websocket.accept()

    try:
        async with websockets.connect(target_url) as internal_ws:
            async def forward_to_internal():
                try:
                    while True:
                        data = await websocket.receive_text()
                        await internal_ws.send(data)
                except WebSocketDisconnect:
                    try:
                        await internal_ws.close()
                    except Exception:
                        pass
                    return
                except Exception as e:
                    print(f"Error forwarding to internal: {e}")
                    try:
                        await internal_ws.close()
                    except Exception:
                        pass
                    return

            async def forward_to_client():
                try:
                    while True:
                        data = await internal_ws.recv()
                        await websocket.send_text(data)
                except websockets.exceptions.ConnectionClosedOK:
                    return
                except websockets.exceptions.ConnectionClosedError:
                    try:
                        await websocket.close()
                    except Exception:
                        pass
                    return
                except Exception as e:
                    print(f"Error forwarding to client: {e}")
                    try:
                        await websocket.close()
                    except Exception:
                        pass
                    return

            t1 = asyncio.create_task(forward_to_internal())
            t2 = asyncio.create_task(forward_to_client())

            done, pending = await asyncio.wait([t1, t2], return_when=asyncio.FIRST_EXCEPTION)
            for p in pending:
                p.cancel()

    except websockets.exceptions.InvalidURI:
        await websocket.close(code=1008, reason="Invalid URI")
    except Exception as e:
        print(f"WebSocket Proxy Error: {e}")
        await websocket.close(code=1011, reason="Internal Server Error")
