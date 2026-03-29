#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tool: test_groq_connection.py
Purpose: Test GROQ API connection following SOP-001
Usage: python tools/test_groq_connection.py
"""

import os
import sys
import time
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

# Ensure UTF-8 encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

def test_groq_connection():
    """Test GROQ API connection with retry logic."""
    
    retry_count = 0
    max_retries = 3
    retry_delay = 2
    
    print("[TEST] Testing GROQ Connection...")
    print("-" * 50)
    
    try:
        # Step 1: Get API Key
        api_key = os.getenv("GROQ_API_KEY")
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        
        if not api_key:
            return {
                "status": "error",
                "provider": "groq",
                "model": model,
                "message": "GROQ_API_KEY not found in .env",
                "timestamp": datetime.now().isoformat(),
                "retry_count": 0
            }
        
        print("[OK] API Key loaded")
        print(f"[OK] Model: {model}")
        
        # Step 2: Set up API endpoint and headers
        api_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        print("[OK] API endpoint configured")
        
        # Step 3: Test connection with retry logic
        while retry_count < max_retries:
            try:
                print(f"[SEND] Testing (attempt {retry_count + 1}/{max_retries})...")
                
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "user", "content": "Respond with exactly: GROQ connection successful"}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 50
                }
                
                response = requests.post(
                    api_url,
                    headers=headers,
                    json=payload,
                    timeout=15
                )
                
                print(f"[OK] Response status: {response.status_code}")
                
                # Step 4: Validate response
                if response.status_code == 200:
                    data = response.json()
                    if data.get("choices") and len(data["choices"]) > 0:
                        response_text = data["choices"][0]["message"]["content"]
                        print(f"[OK] Content: {response_text[:100]}...")
                        
                        return {
                            "status": "connected",
                            "provider": "groq",
                            "model": model,
                            "message": "GROQ connection successful",
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
                print(f"[RETRY] Connection error (attempt {retry_count + 1}): {str(e)[:80]}")
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = retry_delay * (2 ** (retry_count - 1))
                    print(f"[WAIT] Retrying in {wait_time}s...")
                    time.sleep(wait_time)
            
            except Exception as e:
                error_str = str(e)
                print(f"[ERROR] Error (attempt {retry_count + 1}): {error_str[:80]}")
                
                # Check if retryable
                if any(err in error_str.lower() for err in ["500", "502", "503", "429", "rate", "timeout"]):
                    retry_count += 1
                    if retry_count < max_retries:
                        wait_time = retry_delay * (2 ** (retry_count - 1))
                        print(f"[WAIT] Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                    else:
                        return {
                            "status": "error",
                            "provider": "groq",
                            "model": model,
                            "message": f"Connection failed after {max_retries} retries: {error_str[:100]}",
                            "timestamp": datetime.now().isoformat(),
                            "retry_count": retry_count,
                            "error_type": "retry_exhausted"
                        }
                else:
                    return {
                        "status": "error",
                        "provider": "groq",
                        "model": model,
                        "message": f"Authentication or configuration error: {error_str[:100]}",
                        "timestamp": datetime.now().isoformat(),
                        "retry_count": retry_count,
                        "error_type": "auth_config"
                    }
        
        return {
            "status": "error",
            "provider": "groq",
            "model": model,
            "message": f"Failed to connect after {max_retries} retries",
            "timestamp": datetime.now().isoformat(),
            "retry_count": max_retries
        }
    
    except Exception as e:
        return {
            "status": "error",
            "provider": "groq",
            "model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            "message": f"Unexpected error: {str(e)[:100]}",
            "timestamp": datetime.now().isoformat(),
            "retry_count": 0
        }

if __name__ == "__main__":
    result = test_groq_connection()
    print("\n" + "=" * 50)
    print("[RESULT] Test Result:")
    print("=" * 50)
    print(json.dumps(result, indent=2))
    print("=" * 50)
