# test_ocpp_minimal.py
import asyncio
import websockets
import json
from datetime import datetime

async def test_ocpp_connection():
    """Test OCPP connection with the minimal server"""
    charge_point_id = "TEST_CP_001"
    uri = f"ws://localhost:9000/ocpp/{charge_point_id}"
    
    try:
        print(f"🔌 Connecting to {uri}...")
        async with websockets.connect(uri, subprotocols=["ocpp1.6"]) as websocket:
            print(f"✅ Connected to OCPP server as {charge_point_id}")
            
            # Test 1: BootNotification
            boot_msg = [
                2,  # MessageType.CALL
                "1",  # Unique ID
                "BootNotification",
                {
                    "chargePointVendor": "TestVendor",
                    "chargePointModel": "TestModel",
                    "chargePointSerialNumber": "TEST123",
                    "chargeBoxSerialNumber": "TEST456",
                    "firmwareVersion": "1.0.0"
                }
            ]
            
            print("📤 Sending BootNotification...")
            await websocket.send(json.dumps(boot_msg))
            response = await websocket.recv()
            print(f"📥 Response: {response}")
            
            # Test 2: Heartbeat
            heartbeat_msg = [2, "2", "Heartbeat", {}]
            print("📤 Sending Heartbeat...")
            await websocket.send(json.dumps(heartbeat_msg))
            response = await websocket.recv()
            print(f"📥 Response: {response}")
            
            # Test 3: StatusNotification
            status_msg = [
                2, "3", "StatusNotification", 
                {
                    "connectorId": 1,
                    "errorCode": "NoError", 
                    "status": "Available"
                }
            ]
            print("📤 Sending StatusNotification...")
            await websocket.send(json.dumps(status_msg))
            response = await websocket.recv()
            print(f"📥 Response: {response}")
            
            # Test 4: Authorize
            auth_msg = [2, "4", "Authorize", {"idTag": "TEST123"}]
            print("📤 Sending Authorize...")
            await websocket.send(json.dumps(auth_msg))
            response = await websocket.recv()
            print(f"📥 Response: {response}")
            
            print("✅ All OCPP tests completed successfully!")
            
    except Exception as e:
        print(f"❌ OCPP test failed: {e}")

if __name__ == "__main__":
    print("🚀 Testing Minimal OCPP Server...")
    asyncio.run(test_ocpp_connection())