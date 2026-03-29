#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tool: fetch_jira_issue.py
Purpose: Fetch Jira issue details following SOP-005
Usage: python tools/fetch_jira_issue.py <ISSUE_KEY>
"""

import os
import sys
import json
import base64
import requests
from datetime import datetime
from dotenv import load_dotenv

# Ensure UTF-8 encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

def parse_adf_to_text(adf_json):
    """Parse Atlassian Document Format (ADF) to plain text."""
    if not adf_json:
        return ""
    
    if isinstance(adf_json, str):
        return adf_json
    
    if not isinstance(adf_json, dict):
        return ""
    
    text_parts = []
    content = adf_json.get('content', [])
    
    for item in content:
        if item.get('type') == 'paragraph':
            item_content = item.get('content', [])
            for text_item in item_content:
                if text_item.get('type') == 'text':
                    text_parts.append(text_item.get('text', ''))
                elif text_item.get('type') == 'hardBreak':
                    text_parts.append('\n')
        elif item.get('type') == 'bulletList':
            for list_item in item.get('content', []):
                if list_item.get('type') == 'listItem':
                    item_content = list_item.get('content', [])
                    for text_item in item_content:
                        if isinstance(text_item, dict) and text_item.get('type') == 'paragraph':
                            for text_elem in text_item.get('content', []):
                                if text_elem.get('type') == 'text':
                                    text_parts.append('- ' + text_elem.get('text', ''))
    
    return ''.join(text_parts).strip()


def extract_acceptance_criteria(adf_json):
    """Extract acceptance criteria from ADF description."""
    criteria = []
    if not adf_json or not isinstance(adf_json, dict):
        return criteria
    
    # Parse the full description text
    full_text = parse_adf_to_text(adf_json)
    
    # Look for the "Acceptance Criteria" section
    if 'criteria' in full_text.lower():
        # Split by criteria marker
        parts = full_text.split('Acceptance Criteria')
        if len(parts) > 1:
            criteria_section = parts[1].strip()
            # Split by newlines and filter empty lines
            lines = [line.strip() for line in criteria_section.split('\n') if line.strip()]
            for line in lines:
                # Remove leading dashes, bullets, or colons
                line = line.lstrip('- :\t')
                if line:
                    criteria.append(line)
    
    return criteria


def fetch_jira_issue(issue_key):
    """Fetch issue details from Jira Cloud."""
    
    try:
        # Step 1: Validate input
        if not issue_key or not isinstance(issue_key, str) or len(issue_key) < 3:
            return {
                "status": "error",
                "message": "Invalid issue key format (minimum 3 characters, e.g., 'PROJ-123')",
                "timestamp": datetime.now().isoformat()
            }
        
        # Step 2: Get Jira credentials
        jira_url = os.getenv("JIRA_CLOUD_URL")
        jira_email = os.getenv("JIRA_EMAIL")
        jira_token = os.getenv("JIRA_API_TOKEN")
        
        if not all([jira_url, jira_email, jira_token]):
            return {
                "status": "error",
                "message": "Jira credentials not configured",
                "timestamp": datetime.now().isoformat()
            }
        
        # Step 3: Build authorization header
        auth_string = f"{jira_email}:{jira_token}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_bytes}",
            "Content-Type": "application/json"
        }
        
        # Step 4: Normalize Jira URL
        jira_base_url = jira_url.split('/jira/')[0]
        api_endpoint = f"{jira_base_url}/rest/api/3/issue/{issue_key}"
        
        # Step 5: Fetch issue
        response = requests.get(
            api_endpoint,
            headers=headers,
            timeout=10
        )
        
        # Step 6: Handle responses
        if response.status_code == 200:
            issue_data = response.json()
            
            # Step 7: Extract key fields
            fields = issue_data.get("fields", {})
            
            # Parse description (may be ADF format)
            description_raw = fields.get("description", "")
            if isinstance(description_raw, dict):
                description_text = parse_adf_to_text(description_raw)
                acceptance_criteria = extract_acceptance_criteria(description_raw)
            else:
                description_text = str(description_raw) if description_raw else ""
                acceptance_criteria = []
            
            result = {
                "status": "found",
                "key": issue_data.get("key"),
                "summary": fields.get("summary", ""),
                "description": description_text,
                "issue_type": fields.get("issuetype", {}).get("name", ""),
                "priority": fields.get("priority", {}).get("name", ""),
                "issue_status": fields.get("status", {}).get("name", ""),
                "story_points": fields.get("customfield_10001"),
                "labels": fields.get("labels", []),
                "created": fields.get("created"),
                "acceptance_criteria": acceptance_criteria if acceptance_criteria else None,
                "timestamp": datetime.now().isoformat()
            }
            
            return result
        
        elif response.status_code == 404:
            return {
                "status": "not_found",
                "key": issue_key,
                "message": f"Issue {issue_key} not found in Jira",
                "timestamp": datetime.now().isoformat()
            }
        
        elif response.status_code == 401:
            return {
                "status": "error",
                "message": "Jira authentication failed (invalid credentials)",
                "timestamp": datetime.now().isoformat()
            }
        
        else:
            error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
            return {
                "status": "error",
                "message": f"Jira API error: {error_msg}",
                "timestamp": datetime.now().isoformat()
            }
    
    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "message": "Request timeout - Jira server not responding",
            "timestamp": datetime.now().isoformat()
        }
    
    except requests.exceptions.ConnectionError as e:
        return {
            "status": "error",
            "message": f"Connection error: {str(e)[:100]}",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)[:100]}",
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_jira_issue.py <ISSUE_KEY>")
        print("Example: python fetch_jira_issue.py SD-123")
        sys.exit(1)
    
    issue_key = sys.argv[1]
    result = fetch_jira_issue(issue_key)
    
    # Output JSON result to stdout (for server to parse)
    print(json.dumps(result))
