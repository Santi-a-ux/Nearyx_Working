from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, func, and_
from typing import List, Dict, Any
import uuid
import json
import asyncio
from urllib import request as urllib_request

from app.core.security import verify_token, check_jwt
from app.core.redis import redis_manager
from app.database import get_db
from app.models import Conversation, Message
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ConversationCreate(BaseModel):
    participant_id: uuid.UUID

# -----------------
# REST ENDPOINTS
# -----------------

@router.post("/conversations", response_model=dict)
async def create_conversation(
    data: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token)
):
    user_id = uuid.UUID(user_payload.get("sub"))
    
    # Check if conversation already exists
    # Requires logic to check array containment, simplified for brevity here
    result = await db.execute(
        select(Conversation).filter(
            Conversation.participant_ids.contains([user_id, data.participant_id])
        )
    )
    existing = result.scalars().first()
    if existing:
        return {"id": str(existing.id)}

    new_conv = Conversation(participant_ids=[user_id, data.participant_id])
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)
    
    return {"id": str(new_conv.id)}

@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token)
):
    user_id = uuid.UUID(user_payload.get("sub"))

    result = await db.execute(
        select(Conversation)
        .where(Conversation.participant_ids.contains([user_id]))
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()

    items = []
    for conversation in conversations:
        last_message_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_message = last_message_result.scalars().first()
        participant_ids = [str(participant_id) for participant_id in conversation.participant_ids or []]
        other_participant_id = next((participant_id for participant_id in participant_ids if participant_id != str(user_id)), None)

        items.append({
            "id": str(conversation.id),
            "participant_ids": participant_ids,
            "other_participant_id": other_participant_id,
            "last_message": last_message.content if last_message else None,
            "last_message_at": last_message.created_at if last_message else conversation.updated_at,
            "updated_at": conversation.updated_at,
        })

    return items

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token)
):
    user_id = uuid.UUID(user_payload.get("sub"))

    conversation_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = conversation_result.scalars().first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user_id not in (conversation.participant_ids or []):
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")

    await db.execute(
        update(Message)
        .where(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.is_read.is_(False),
            )
        )
        .values(is_read=True)
    )
    await db.commit()
    
    result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    
    return [{"id": m.id, "sender_id": m.sender_id, "content": m.content, "is_read": m.is_read, "created_at": m.created_at} for m in messages]

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token)
):
    user_id = uuid.UUID(user_payload.get("sub"))

    result = await db.execute(
        select(func.count(Message.id))
        .select_from(Message)
        .join(Conversation, Conversation.id == Message.conversation_id)
        .where(
            and_(
                Conversation.participant_ids.contains([user_id]),
                Message.sender_id != user_id,
                Message.is_read.is_(False),
            )
        )
    )

    count = int(result.scalar() or 0)
    return {"count": count}

# -----------------
# WEBSOCKETS
# -----------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

manager = ConnectionManager()


async def verify_ws_token(token: str) -> dict:
    payload = json.dumps({"token": token}).encode("utf-8")
    req = urllib_request.Request(
        "http://auth-service:8001/auth/verify-token",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib_request.urlopen(req, timeout=5) as response:
            body = response.read().decode("utf-8")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired")

    if not body:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired")

    data = json.loads(body)
    if not data.get("valid"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired")

    return data

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, token: str = Query(None), db: AsyncSession = Depends(get_db)):
    """
    WebSocket endpoint accepts token either as query parameter or from cookies.
    Cookies take precedence if both are provided.
    """
    try:
        # Try to get token from cookies first (for httpOnly cookies from browsers)
        cookies = websocket.headers.get("cookie", "")
        if cookies:
            for cookie in cookies.split("; "):
                if cookie.startswith("token="):
                    token = cookie.split("=", 1)[1]
                    break
        
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        user_payload = await verify_ws_token(token)
        user_id = user_payload.get("user_id") or user_payload.get("sub")
        if not user_id or str(user_id) != str(client_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)
    
    # Subscribe to personal redis channel
    pubsub = redis_manager.get_connection().pubsub()
    await pubsub.subscribe(f"user_{user_id}")
    
    async def redis_listener():
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"].decode("utf-8")
                    await manager.send_personal_message(data, user_id)
        except asyncio.CancelledError:
            pass

    listener_task = asyncio.create_task(redis_listener())

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Expected WS Payload: {"conversation_id": "uuid", "receiver_id": "uuid", "content": "text"}
            conv_id = payload.get("conversation_id")
            receiver_id = payload.get("receiver_id")
            content = payload.get("content")

            # Persist to database
            new_msg = Message(
                conversation_id=uuid.UUID(conv_id),
                sender_id=uuid.UUID(user_id),
                content=content
            )
            db.add(new_msg)
            await db.execute(
                update(Conversation)
                .where(Conversation.id == uuid.UUID(conv_id))
                .values(updated_at=datetime.utcnow())
            )
            await db.commit()
            
            # Publish to receiver's redis channel
            out_msg = json.dumps({
                "conversation_id": conv_id,
                "sender_id": user_id,
                "content": content
            })
            await redis_manager.publish(f"user_{receiver_id}", out_msg)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        listener_task.cancel()
        await pubsub.unsubscribe()