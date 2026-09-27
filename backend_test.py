#!/usr/bin/env python3
"""
Backend API Tests for STRATOS Agent Endpoints
Tests the new modular 11-agent architecture endpoints
"""

import requests
import json
import sys
from typing import Dict, Any
from urllib.parse import urlparse

# Base URL from environment
BASE_URL = "https://agent-workflow-47.preview.emergentagent.com/api"
APP_ORIGIN = "https://agent-workflow-47.preview.emergentagent.com"

def print_test_header(test_name: str):
    """Print a formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(passed: bool, message: str):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {message}")

def test_get_agents():
    """
    Test 1: GET /api/agents
    Expected: 200 with count=11, totalStages=12, 11 specific agent IDs, 7 workflow stages
    """
    print_test_header("GET /api/agents - Registry Metadata")
    
    try:
        response = requests.get(f"{BASE_URL}/agents", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response JSON: {json.dumps(data, indent=2)}")
        
        # Check count
        if data.get('count') != 11:
            print_result(False, f"Expected count=11, got {data.get('count')}")
            return False
        print_result(True, "count === 11")
        
        # Check totalStages
        if data.get('totalStages') != 12:
            print_result(False, f"Expected totalStages=12, got {data.get('totalStages')}")
            return False
        print_result(True, "totalStages === 12")
        
        # Check agents array
        agents = data.get('agents', [])
        if not isinstance(agents, list) or len(agents) != 11:
            print_result(False, f"Expected agents array of 11 objects, got {len(agents)}")
            return False
        print_result(True, "agents is array of 11 objects")
        
        # Check specific agent IDs
        expected_ids = ['ceo', 'business', 'competitor', 'seo', 'analytics', 'ads', 
                       'opportunity', 'marketing', 'campaign', 'risk', 'project_manager']
        agent_ids = [agent.get('id') for agent in agents]
        
        if set(agent_ids) != set(expected_ids):
            print_result(False, f"Agent IDs mismatch. Expected: {expected_ids}, Got: {agent_ids}")
            return False
        print_result(True, f"All 11 agent IDs present: {agent_ids}")
        
        # Check workflow stages
        workflow = data.get('workflow', [])
        if not isinstance(workflow, list) or len(workflow) != 7:
            print_result(False, f"Expected workflow array of 7 stages, got {len(workflow)}")
            return False
        print_result(True, "workflow is array of 7 stages")
        
        # Check agent metadata structure
        for agent in agents:
            required_fields = ['id', 'name', 'displayName', 'description', 'version', 'enabled', 'capabilities']
            missing_fields = [field for field in required_fields if field not in agent]
            if missing_fields:
                print_result(False, f"Agent {agent.get('id')} missing fields: {missing_fields}")
                return False
            
            if agent.get('enabled') != True:
                print_result(False, f"Agent {agent.get('id')} not enabled")
                return False
            
            if not isinstance(agent.get('capabilities'), list):
                print_result(False, f"Agent {agent.get('id')} capabilities not an array")
                return False
        
        print_result(True, "All agents have correct metadata structure (id, name, displayName, description, version, enabled=true, capabilities)")
        
        print_result(True, "GET /api/agents test PASSED")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_post_agents_run_single_seo():
    """
    Test 2: POST /api/agents/run with agentId="seo"
    Expected: 200 with mode=single, agentId=seo, result.status=completed, 
              result.agentName=SEOAgent, metadata.provider=mock, metadata.schemaValid=true
    """
    print_test_header("POST /api/agents/run - Single Agent (SEO)")
    
    try:
        payload = {"agentId": "seo"}
        response = requests.post(f"{BASE_URL}/agents/run", json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response JSON: {json.dumps(data, indent=2)}")
        
        # Check mode
        if data.get('mode') != 'single':
            print_result(False, f"Expected mode='single', got {data.get('mode')}")
            return False
        print_result(True, "mode === 'single'")
        
        # Check agentId
        if data.get('agentId') != 'seo':
            print_result(False, f"Expected agentId='seo', got {data.get('agentId')}")
            return False
        print_result(True, "agentId === 'seo'")
        
        # Check result object
        result = data.get('result', {})
        
        if result.get('status') != 'completed':
            print_result(False, f"Expected result.status='completed', got {result.get('status')}")
            return False
        print_result(True, "result.status === 'completed'")
        
        if result.get('agentName') != 'SEOAgent':
            print_result(False, f"Expected result.agentName='SEOAgent', got {result.get('agentName')}")
            return False
        print_result(True, "result.agentName === 'SEOAgent'")
        
        # Check metadata
        metadata = result.get('metadata', {})
        
        if metadata.get('provider') != 'mock':
            print_result(False, f"Expected metadata.provider='mock', got {metadata.get('provider')}")
            return False
        print_result(True, "metadata.provider === 'mock'")
        
        if metadata.get('schemaValid') != True:
            print_result(False, f"Expected metadata.schemaValid=true, got {metadata.get('schemaValid')}")
            return False
        print_result(True, "metadata.schemaValid === true")
        
        # Check summary
        if not result.get('summary') or not isinstance(result.get('summary'), str):
            print_result(False, f"Expected non-empty summary string")
            return False
        print_result(True, f"summary is non-empty string: '{result.get('summary')[:50]}...'")
        
        print_result(True, "POST /api/agents/run (SEO) test PASSED")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_post_agents_run_single_ceo():
    """
    Test 3: POST /api/agents/run with agentId="ceo"
    Expected: 200 with mode=single, result.status=completed, result.agentName=CEOAgent
    """
    print_test_header("POST /api/agents/run - Single Agent (CEO)")
    
    try:
        payload = {"agentId": "ceo"}
        response = requests.post(f"{BASE_URL}/agents/run", json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response JSON: {json.dumps(data, indent=2)}")
        
        # Check mode
        if data.get('mode') != 'single':
            print_result(False, f"Expected mode='single', got {data.get('mode')}")
            return False
        print_result(True, "mode === 'single'")
        
        # Check result.status
        result = data.get('result', {})
        if result.get('status') != 'completed':
            print_result(False, f"Expected result.status='completed', got {result.get('status')}")
            return False
        print_result(True, "result.status === 'completed'")
        
        # Check agentName
        if result.get('agentName') != 'CEOAgent':
            print_result(False, f"Expected result.agentName='CEOAgent', got {result.get('agentName')}")
            return False
        print_result(True, "result.agentName === 'CEOAgent'")
        
        print_result(True, "POST /api/agents/run (CEO) test PASSED")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_post_agents_run_unknown_agent():
    """
    Test 4: POST /api/agents/run with agentId="does_not_exist"
    Expected: 500 with error message
    """
    print_test_header("POST /api/agents/run - Unknown Agent")
    
    try:
        payload = {"agentId": "does_not_exist"}
        response = requests.post(f"{BASE_URL}/agents/run", json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 500:
            print_result(False, f"Expected status 500, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        print_result(True, "Status code === 500")
        
        data = response.json()
        print(f"Response JSON: {json.dumps(data, indent=2)}")
        
        # Check error message exists
        if 'error' not in data:
            print_result(False, "Expected 'error' field in response")
            return False
        print_result(True, f"Error message present: '{data.get('error')}'")
        
        print_result(True, "POST /api/agents/run (unknown agent) test PASSED")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_post_agents_run_workflow():
    """
    Test 5: POST /api/agents/run with empty body {}
    Expected: 200 with mode=workflow, events with analysis_started and analysis_completed,
              results array with 12 entries (all status=completed), durationMs is a number
    """
    print_test_header("POST /api/agents/run - Full Workflow")
    
    try:
        payload = {}
        response = requests.post(f"{BASE_URL}/agents/run", json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response JSON (truncated): {json.dumps(data, indent=2)[:1000]}...")
        
        # Check mode
        if data.get('mode') != 'workflow':
            print_result(False, f"Expected mode='workflow', got {data.get('mode')}")
            return False
        print_result(True, "mode === 'workflow'")
        
        # Check events array
        events = data.get('events', [])
        if not isinstance(events, list):
            print_result(False, "Expected events to be an array")
            return False
        print_result(True, f"events is an array with {len(events)} entries")
        
        # Check for analysis_started event
        event_types = [e.get('type') for e in events]
        if 'analysis_started' not in event_types:
            print_result(False, f"Expected 'analysis_started' event. Found types: {event_types}")
            return False
        print_result(True, "'analysis_started' event found")
        
        # Check for analysis_completed event
        if 'analysis_completed' not in event_types:
            print_result(False, f"Expected 'analysis_completed' event. Found types: {event_types}")
            return False
        print_result(True, "'analysis_completed' event found")
        
        # Check results array
        results = data.get('results', [])
        if not isinstance(results, list):
            print_result(False, "Expected results to be an array")
            return False
        
        if len(results) != 12:
            print_result(False, f"Expected 12 results (CEO runs twice), got {len(results)}")
            return False
        print_result(True, f"results array has exactly 12 entries")
        
        # Check all results have status=completed
        failed_results = [r for r in results if r.get('status') != 'completed']
        if failed_results:
            print_result(False, f"Expected all results to have status='completed'. Failed: {failed_results}")
            return False
        print_result(True, "All 12 results have status='completed'")
        
        # Check durationMs
        if not isinstance(data.get('durationMs'), (int, float)):
            print_result(False, f"Expected durationMs to be a number, got {type(data.get('durationMs'))}")
            return False
        print_result(True, f"durationMs is a number: {data.get('durationMs')}")
        
        print_result(True, "POST /api/agents/run (workflow) test PASSED")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_get_health():
    """
    Test 6: GET /api/ (no agents path)
    Expected: 200 with { status: "ok", service: "STRATOS" }
    """
    print_test_header("GET /api/ - Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response JSON: {json.dumps(data, indent=2)}")
        
        # Check status
        if data.get('status') != 'ok':
            print_result(False, f"Expected status='ok', got {data.get('status')}")
            return False
        print_result(True, "status === 'ok'")
        
        # Check service
        if data.get('service') != 'STRATOS':
            print_result(False, f"Expected service='STRATOS', got {data.get('service')}")
            return False
        print_result(True, "service === 'STRATOS'")
        
        print_result(True, "GET /api/ health check test PASSED")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_oauth_callback_no_params():
    """
    Test 7: GET /auth/callback (no query params)
    Expected: HTTP 3xx redirect with Location header pointing to '/' on the same host
    Must NOT redirect to localhost
    """
    print_test_header("GET /auth/callback - No Query Params")
    
    try:
        url = f"{APP_ORIGIN}/auth/callback"
        # Do NOT follow redirects - we want to inspect the raw redirect response
        response = requests.get(url, allow_redirects=False, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        # Check for 3xx redirect status
        if not (300 <= response.status_code < 400):
            print_result(False, f"Expected 3xx redirect status, got {response.status_code}")
            return False
        print_result(True, f"Status code is 3xx redirect: {response.status_code}")
        
        # Check Location header exists
        location = response.headers.get('Location')
        if not location:
            print_result(False, "No Location header in redirect response")
            return False
        print_result(True, f"Location header present: {location}")
        
        # Parse the Location URL
        parsed_location = urlparse(location)
        parsed_origin = urlparse(APP_ORIGIN)
        
        # Check that Location points to '/'
        if parsed_location.path != '/':
            print_result(False, f"Expected Location path to be '/', got '{parsed_location.path}'")
            return False
        print_result(True, "Location path is '/'")
        
        # Check that Location host matches request host (not localhost)
        location_host = parsed_location.netloc or parsed_origin.netloc
        request_host = parsed_origin.netloc
        
        if location_host != request_host:
            print_result(False, f"Location host '{location_host}' does not match request host '{request_host}'")
            return False
        print_result(True, f"Location host matches request host: {location_host}")
        
        # Verify NOT localhost
        if 'localhost' in location.lower() or '127.0.0.1' in location:
            print_result(False, f"Location contains localhost/127.0.0.1: {location}")
            return False
        print_result(True, "Location does NOT contain localhost or 127.0.0.1")
        
        print_result(True, "GET /auth/callback (no params) test PASSED")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def test_oauth_callback_invalid_code():
    """
    Test 8: GET /auth/callback?code=invalid_code_123
    Expected: HTTP 3xx redirect to '/' (NOT 500 or crash)
    The invalid code exchange should fail gracefully and still redirect
    """
    print_test_header("GET /auth/callback - Invalid Code")
    
    try:
        url = f"{APP_ORIGIN}/auth/callback?code=invalid_code_123"
        # Do NOT follow redirects - we want to inspect the raw redirect response
        response = requests.get(url, allow_redirects=False, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        # Check for 3xx redirect status (NOT 500)
        if not (300 <= response.status_code < 400):
            print_result(False, f"Expected 3xx redirect status, got {response.status_code}. Route should fail gracefully, not crash.")
            if response.status_code == 500:
                print(f"Response body: {response.text}")
            return False
        print_result(True, f"Status code is 3xx redirect (graceful failure): {response.status_code}")
        
        # Check Location header exists
        location = response.headers.get('Location')
        if not location:
            print_result(False, "No Location header in redirect response")
            return False
        print_result(True, f"Location header present: {location}")
        
        # Parse the Location URL
        parsed_location = urlparse(location)
        parsed_origin = urlparse(APP_ORIGIN)
        
        # Check that Location points to '/'
        if parsed_location.path != '/':
            print_result(False, f"Expected Location path to be '/', got '{parsed_location.path}'")
            return False
        print_result(True, "Location path is '/'")
        
        # Check that Location host matches request host
        location_host = parsed_location.netloc or parsed_origin.netloc
        request_host = parsed_origin.netloc
        
        if location_host != request_host:
            print_result(False, f"Location host '{location_host}' does not match request host '{request_host}'")
            return False
        print_result(True, f"Location host matches request host: {location_host}")
        
        # Verify NOT localhost
        if 'localhost' in location.lower() or '127.0.0.1' in location:
            print_result(False, f"Location contains localhost/127.0.0.1: {location}")
            return False
        print_result(True, "Location does NOT contain localhost or 127.0.0.1")
        
        print_result(True, "GET /auth/callback (invalid code) test PASSED")
        return True
        
    except Exception as e:
        print_result(False, f"Exception occurred: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("STRATOS BACKEND API TESTS - Modular 11-Agent Architecture + OAuth")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"App Origin: {APP_ORIGIN}")
    print("="*80)
    
    results = {}
    
    # Run all tests
    results['GET /api/agents'] = test_get_agents()
    results['POST /api/agents/run (SEO)'] = test_post_agents_run_single_seo()
    results['POST /api/agents/run (CEO)'] = test_post_agents_run_single_ceo()
    results['POST /api/agents/run (unknown)'] = test_post_agents_run_unknown_agent()
    results['POST /api/agents/run (workflow)'] = test_post_agents_run_workflow()
    results['GET /api/ (health)'] = test_get_health()
    results['GET /auth/callback (no params)'] = test_oauth_callback_no_params()
    results['GET /auth/callback (invalid code)'] = test_oauth_callback_invalid_code()
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("="*80)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("="*80)
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()
