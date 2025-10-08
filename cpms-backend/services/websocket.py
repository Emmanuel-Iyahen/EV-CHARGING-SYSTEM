
import json
import asyncio
import redis.asyncio as redis
from fastapi import WebSocket
from typing import Dict, List
import os
from datetime import datetime

REDIS_URL = os.getenv("REDIS_URL")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.redis_client = None

    async def connect_redis(self):
        self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        await self.redis_client.ping()
        print("✅ Redis connected for WebSocket manager")

    async def connect(self, websocket: WebSocket, client_id: str, channel: str):
        # ⚠️ REMOVE websocket.accept() - it should be called in the endpoint
        # await websocket.accept()
        
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        
        # Remove any existing connection to prevent duplicates
        self.active_connections[channel] = [conn for conn in self.active_connections[channel] if conn != websocket]
        self.active_connections[channel].append(websocket)
        
        print(f"✅ WebSocket added to channel '{channel}'. Total connections: {len(self.active_connections[channel])}")
        
        # Send welcome message through the manager
        await websocket.send_text(json.dumps({
            "type": "welcome",
            "message": f"Connected to {channel} channel via WebSocketManager",
            "channel": channel,
            "connections_count": len(self.active_connections[channel]),
            "timestamp": datetime.now().isoformat()
        }))

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
                print(f"🔌 WebSocket removed from channel '{channel}'. Remaining: {len(self.active_connections[channel])}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"❌ Failed to send personal message: {e}")
            self.disconnect(websocket, "unknown")

    async def broadcast(self, channel: str, message: str):
        if channel in self.active_connections and self.active_connections[channel]:
            disconnected = []
            print(f"📤 Broadcasting to {len(self.active_connections[channel])} connections in channel '{channel}': {message}")
            
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"❌ Failed to send to WebSocket: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected clients
            for connection in disconnected:
                self.disconnect(connection, channel)
        else:
            print(f"⚠️ No active connections in channel '{channel}' to broadcast to")

    async def listen_redis_channel(self, channel: str):
        if not self.redis_client:
            await self.connect_redis()
        
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe(channel)
        print(f"🎧 WebSocket manager listening to Redis channel: {channel}")
        
        async for message in pubsub.listen():
            if message['type'] == 'message':
                print(f"📨 Redis message received on channel '{channel}': {message['data']}")
                await self.broadcast(channel, message['data'])

# Global WebSocket manager
websocket_manager = WebSocketManager()