#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tool: test_jira_connection.py
Purpose: Test Jira Cloud API connection following SOP-002
Usage: python tools/test_jira_connection.py
"""

import os
import sys
import time
import json
import base64
from datetime import datetime
from dotenv import load_dotenv

# Ensure UTF-8 encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

def test_jira_connection():
    """Test Jira Cloud API connection with retry logic."""
    
    retry_count = 0
    max_retries = 3
    retry_delay = 2
    
    print("[TEST] Testing Jira Cloud Connection...")
    print("-" * 50)
    
    try:
        # Step 1: Get credentials
        jira_url = os.getenv("JIRA_CLOUD_URL")
        jira_email = os.getenv("JIRA_EMAIL")
        jira_token = os.getenv("JIRA_API_TOKEN")
        
        if not all([jira_url, jira_email, jira_token]):
            missing = []
            if not jira_url: missing.append("JIRA_CLOUD_URL")
            if not jira_email: missing.append("JIRA_EMAIL")
            if not jira_token: missing.append("JIRA_API_TOKEN")
            
            return {
                "status": "error",
                "provider": "jira_cloud",
                "message": f"Missing credentials: {', '.join(missing)}",
                "timestamp": datetime.now().isoformat(),
                "retry_count": 0
            }
        
        print(f"[OK] Jira URL: {jira_url}")
        print(f"[OK] Jira Email: {jira_email}")
        
        # Step 2: Import requests
        import requests
        
        # Step 3: Build authorization header
        auth_string = f"{jira_email}:{jira_token}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_bytes}",
            "Content-Type": "application/json"
        }
        print("[OK] Authorization header created")
        
        # Step 4: Normalize URL (remove trailing slashes and /jira/software/... paths)
        jira_base_url = jira_url.split('/jira/')[0]  # Remove /jira/software/... if present
        api_endpoint = f"{jira_base_url}/rest/api/3/myself"
        
        print(f"[OK] API Endpoint: {api_endpoint}")
        
        # Step 5: Test connection with retry logic
        while retry_count < max_retries:
            try:
                print(f"[SEND] Testing connection (attempt {retry_count + 1}/{max_retries})...")
                
                response = requests.get(
                    api_endpoint,
                    headers=headers,
                    timeout=10
                )
                
                print(f"[OK] Response status: {response.status_code}")
                
                # Step 6: Validate response
                if response.status_code == 200:
                    user_data = response.json()
                    user_email = user_data.get("emailAddress", "")
                    user_name = user_data.get("displayName", "")
                    account_id = user_data.get("accountId", "")
                    
                    print(f"[OK] User: {user_name} ({user_email})")
                    print(f"[OK] Account ID: {account_id}")
                    
                    return {
                        "status": "connected",
                        "provider": "jira_cloud",
                        "jira_instance": jira_base_url.split('.')[-2],
                        "user_email": user_email,
                        "user_display_name": user_name,
                        "account_id": account_id,
                        "message": "Jira connection successful",
                        "timestamp": datetime.now().isoformat(),
                        "retry_count": retry_count
                    }
                elif response.status_code == 401:
                    return {
                        "status": "error",
                        "provider": "jira_cloud",
                        "message": "Authentication failed: Invalid email or API token",
                        "timestamp": datetime.now().isoformat(),
                        "retry_count": retry_count
                    }
                elif response.status_code == 403:
                    return {
                        "status": "error",
                        "provider": "jira_cloud",
                        "message": "Permission denied: User lacks required permissions",
                        "timestamp": datetime.now().isoformat(),
                        "retry_count": retry_count
                    }
                else:
                    error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
                    raise Exception(f"HTTP {response.status_code}: {error_msg}")
            
            except requests.exceptions.Timeout:
                print(f"[RETRY] Timeout (attempt {retry_count + 1})")
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = retry_delay * (2 ** (retry_count - 1))
                    print(f"[WAIT] Retrying in {wait_time}s...")
                    time.sleep(wait_time)
            
            except requests.exceptions.ConnectionError as e:
                print(f"[RETRY] Connection error (attempt {retry_count + 1}): {str(e)}")
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = retry_delay * (2 ** (retry_count - 1))
                    print(f"[WAIT] Retrying in {wait_time}s...")
                    time.sleep(wait_time)
            
            except Exception as e:
                error_str = str(e)
                print(f"[ERROR] Error (attempt {retry_count + 1}): {error_str}")
                
                # Check if retryable
                if any(err in error_str.lower() for err in ["500", "502", "503", "429", "rate"]):
                    retry_count += 1
                    if retry_count < max_retries:
                        wait_time = retry_delay * (2 ** (retry_count - 1))
                        print(f"Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                    else:
                        return {
                            "status": "error",
                            "provider": "jira_cloud",
                            "message": f"Connection failed after {max_retries} retries: {error_str}",
                            "timestamp": datetime.now().isoformat(),
                            "retry_count": retry_count
                        }
                else:
                    return {
                        "status": "error",
                        "provider": "jira_cloud",
                        "message": f"Error: {error_str}. Check Jira URL and credentials.",
                        "timestamp": datetime.now().isoformat(),
                        "retry_count": retry_count
                    }
        
        return {
            "status": "error",
            "provider": "jira_cloud",
            "message": f"Failed to connect after {max_retries} retries",
            "timestamp": datetime.now().isoformat(),
            "retry_count": retry_count
        }
    
    except ImportError:
        return {
            "status": "error",
            "provider": "jira_cloud",
            "message": "requests library not installed. Run: pip install -r requirements.txt",
            "timestamp": datetime.now().isoformat(),
            "retry_count": 0
        }
    
    except Exception as e:
        return {
            "status": "error",
            "provider": "jira_cloud",
            "message": f"Unexpected error: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "retry_count": 0
        }

if __name__ == "__main__":
    result = test_jira_connection()
    print("\n" + "=" * 50)
    print("[RESULT] Test Result:")
    print("=" * 50)
    print(json.dumps(result, indent=2))
    print("=" * 50)
