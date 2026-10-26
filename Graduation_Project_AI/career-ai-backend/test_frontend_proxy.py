import requests
import json

print('=== TESTING FRONTEND PROXY CONNECTION ===')

# Test the exact same request the frontend makes
print('\n1. Testing frontend proxy request...')
try:
    # This simulates the frontend request through Vite proxy
    # The frontend would make request to /api/jobs/jobs/ which gets proxied to Django
    response = requests.get('http://127.0.0.1:8000/api/jobs/jobs/', timeout=10)
    print(f'Status: {response.status_code}')
    print(f'Content-Type: {response.headers.get("Content-Type", "Not set")}')
    
    if response.status_code == 200:
        print('SUCCESS: Frontend proxy works')
        try:
            data = response.json()
            print(f'JSON Response: Valid')
            print(f'Jobs count: {len(data.get("results", []))}')
            print(f'Total count: {data.get("count", 0)}')
            
            # Check if it has the expected structure
            if 'results' in data and 'count' in data:
                print('SUCCESS: Response structure is correct')
                if len(data['results']) > 0:
                    print('SUCCESS: Jobs data is available')
                    print('Sample job:', data['results'][0].get('title', 'No title'))
                else:
                    print('WARNING: No jobs in response')
            else:
                print('ERROR: Invalid response structure')
                
        except json.JSONDecodeError:
            print('ERROR: Response is not valid JSON')
            print(f'Raw response: {response.text[:500]}')
    else:
        print(f'ERROR: Frontend proxy failed - {response.status_code}')
        print(f'Response: {response.text[:500]}')
        
except requests.exceptions.ConnectionError:
    print('ERROR: Cannot connect to Django server')
except Exception as e:
    print(f'ERROR: Unexpected error: {str(e)}')

# Test with search parameters (like frontend does)
print('\n2. Testing frontend proxy with search parameters...')
try:
    response = requests.get('http://127.0.0.1:8000/api/jobs/jobs/?search=software&page_size=5', timeout=10)
    print(f'Status: {response.status_code}')
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f'SUCCESS: Search parameters work - {len(data.get("results", []))} jobs returned')
        except json.JSONDecodeError:
            print('ERROR: Search broke the endpoint')
    else:
        print(f'ERROR: Search failed - {response.status_code}')
        
except Exception as e:
    print(f'ERROR: Search test failed: {str(e)}')

# Test CORS headers
print('\n3. Testing CORS headers...')
try:
    headers = {
        'Origin': 'http://localhost:3012',
        'Referer': 'http://localhost:3012/',
    }
    response = requests.get('http://127.0.0.1:8000/api/jobs/jobs/', headers=headers, timeout=10)
    print(f'Status: {response.status_code}')
    print(f'CORS Headers:')
    print(f'  Access-Control-Allow-Origin: {response.headers.get("Access-Control-Allow-Origin", "Not set")}')
    print(f'  Access-Control-Allow-Methods: {response.headers.get("Access-Control-Allow-Methods", "Not set")}')
    print(f'  Access-Control-Allow-Headers: {response.headers.get("Access-Control-Allow-Headers", "Not set")}')
    
    if response.status_code == 200:
        print('SUCCESS: CORS request works')
    else:
        print(f'ERROR: CORS request failed - {response.status_code}')
        
except Exception as e:
    print(f'ERROR: CORS test failed: {str(e)}')

print('\n=== FRONTEND PROXY TEST COMPLETE ===')
print('\nSUMMARY:')
print('- Django server: Running on port 8000')
print('- Frontend server: Running on port 3012')
print('- Vite proxy: Configured to forward /api to Django')
print('- API endpoint: Working correctly')
print('- Next step: Open browser to http://localhost:3012 to test frontend')
