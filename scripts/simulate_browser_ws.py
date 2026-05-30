import asyncio
import httpx
import websockets
import json
import time

import os

BASE = os.environ.get('TARGET_BASE', 'http://gateway:8000')

async def main():
    ts = int(time.time())
    email1 = f'test_a_{ts}@example.com'
    email2 = f'test_b_{ts}@example.com'
    pw = 'Password123!'

    async with httpx.AsyncClient(base_url=BASE, timeout=15.0) as client:
        # Register A
        r = await client.post('/auth/register', json={'email': email1, 'password': pw, 'role': 'student'})
        print('register A', r.status_code)

        # Register B
        r = await client.post('/auth/register', json={'email': email2, 'password': pw, 'role': 'student'})
        print('register B', r.status_code)

        # Login A
        r = await client.post('/auth/login', json={'email': email1, 'password': pw})
        print('login A', r.status_code)
        data = r.json()
        token = data.get('access_token')
        if not token:
            print('no access_token in login response', data)
            return
        headers = {'Authorization': f'Bearer {token}'}

        # Whoami A (auth service)
        r = await client.get('/auth/me', headers=headers)
        me_id = r.json().get('id')
        print('me_id', me_id)

        # Login B and get id
        r = await client.post('/auth/login', json={'email': email2, 'password': pw})
        data_b = r.json()
        token_b = data_b.get('access_token')
        r = await client.get('/auth/me', headers={'Authorization': f'Bearer {token_b}'})
        other_id = r.json().get('id')
        print('other_id', other_id)

        # Get WS token for A
        r = await client.get('/auth/ws-token', headers=headers)
        print('/auth/ws-token', r.status_code)
        jd = r.json()
        ws_token = jd.get('token') or jd.get('access_token') or jd.get('value')
        print('ws_token present?', bool(ws_token))

        # Create conversation
        r = await client.post('/chat/conversations', json={'participant_id': other_id}, headers=headers)
        print('create conversation', r.status_code)
        conv = r.json().get('id')
        print('conv', conv)

        # Open websocket
        # Derive ws host from BASE (use same host:port)
        ws_host = BASE.replace('http://','').replace('https://','')
        ws_url = f"ws://{ws_host}/chat/ws/{me_id}?token={ws_token}"
        print('connecting ws to', ws_url)
        try:
            async with websockets.connect(ws_url) as ws:
                print('ws open')
                payload = {'conversation_id': conv, 'receiver_id': other_id, 'content': 'Hello from simulated browser'}
                await ws.send(json.dumps(payload))
                print('sent payload')
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
                    print('recv', msg)
                except asyncio.TimeoutError:
                    print('no incoming message within 2s')
        except Exception as e:
            print('ws error', type(e), e)

        # wait a bit and fetch messages
        await asyncio.sleep(1)
        r = await client.get(f'/chat/conversations/{conv}/messages', headers=headers)
        print('/messages', r.status_code)
        try:
            print(json.dumps(r.json(), indent=2)[:1000])
        except Exception as e:
            print('failed to parse messages', e)

if __name__ == '__main__':
    asyncio.run(main())
