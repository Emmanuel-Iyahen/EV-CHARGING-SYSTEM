# debug_ocpp.py
from ocpp.v16.enums import Action

print("=== OCPP v1.6 Action Names ===")
for action in Action:
    print(f"  {action}")

print(f"\nTotal actions: {len(list(Action))}")