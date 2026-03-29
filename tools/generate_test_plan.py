#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tool: generate_test_plan.py
Purpose: Generate test plan sections using LLM following SOP-006
Usage: python tools/generate_test_plan.py <ISSUE_TITLE> <ISSUE_DESCRIPTION>
"""

import os
import sys
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

# Ensure UTF-8 encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

def generate_test_plan(issue_title, issue_description, acceptance_criteria=None):
    """Generate test plan sections using GROQ API."""
    
    try:
        # Step 1: Get LLM credentials
        api_key = os.getenv("GROQ_API_KEY")
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        
        if not api_key:
            return {
                "status": "error",
                "message": "GROQ_API_KEY not configured",
                "timestamp": datetime.now().isoformat()
            }
        
        # Step 2: Build prompt
        criteria_str = ""
        if acceptance_criteria:
            criteria_str = f"\n\nAcceptance Criteria:\n" + \
                          "\n".join([f"- {c}" for c in acceptance_criteria])
        
        prompt = f"""You are an expert QA test plan generator. Your task is to generate a COMPREHENSIVE, CUSTOMIZED test plan based ONLY on the provided Jira issue. 

DO NOT include any examples, templates, or content from other projects.
DO NOT reference any specific technology stack unless mentioned in the issue.
DO NOT include references to other features or systems not mentioned in the issue.

ONLY generate testing content specific to this Jira issue:

Issue Title: {issue_title}
Issue Description: {issue_description}{criteria_str}

Generate a detailed, contextual test plan in valid JSON format tailored ONLY to this specific issue:

{{
  "objective": "A clear, specific statement of the testing objective for THIS ISSUE ONLY (2-3 sentences). What is being tested and why.",
  "scope": "Define exactly what features/functionality from THIS ISSUE will be tested and what will NOT be tested. Be specific to the issue context.",
  "inclusions": "Specific features/modules/functionalities from THIS ISSUE that are in scope (list each feature clearly)",
  "test_environments": "Test environments needed for THIS ISSUE (operating systems, browsers, devices, specific to THIS feature)",
  "test_strategy": "Testing approach tailored to THIS ISSUE: test design techniques, testing types, and phases appropriate for this functionality",
  "test_schedule": "Timeline for testing THIS ISSUE only (e.g., 1-2 sprints based on feature complexity, specific days/hours)",
  "entry_and_exit": "Entry conditions needed before testing THIS feature can begin AND exit conditions that satisfy completion of testing for THIS issue (combine as: 'Entry: X | Exit: Y')",
  "defect_reporting": "Procedure for reporting defects specific to THIS feature: how to document, track, and communicate issues found during THIS testing",
  "test_cases": [
    {{
      "id": "TC-001",
      "title": "Test case title specific to THIS ISSUE",
      "steps": "Numbered step-by-step execution for THIS specific test scenario",
      "expected_result": "Expected outcome for THIS test case"
    }}
  ],
  "risks": "Specific risks when testing THIS feature and their mitigations. Format each as: 'Risk: [description] | Mitigation: [action]'",
  "tools": "Tools needed specifically for testing THIS feature (e.g., JIRA for defects, browsers, testing frameworks)",
  "test_deliverables": "Test artifacts and deliverables for THIS feature (e.g., test cases document, test reports)"
}}

CRITICAL REQUIREMENTS:
- ALL content MUST be SPECIFIC to the provided Jira issue ONLY
- DO NOT include generic content, examples from other projects, or unrelated technologies
- Generate 3-8 test cases SPECIFIC to the issue requirements
- Use formal, professional language appropriate to the specific feature context
- Return ONLY valid JSON, no markdown or explanatory text
- Make every section contextual and directly related to the issue being tested
- Do not reference "VWO", "React", "jQuery", "Testing Academy", or any other template/external content
- Focus on THIS ISSUE ONLY"""

        # Removed debug print to avoid non-JSON output
        
        # Step 3: Call GROQ API
        api_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,  # Lower temp for consistency
            "max_tokens": 2000
        }
        
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        # Removed debug print to avoid non-JSON output
        
        # Step 4: Parse response
        if response.status_code != 200:
            return {
                "status": "error",
                "message": f"LLM API error: HTTP {response.status_code}",
                "timestamp": datetime.now().isoformat()
            }
        
        data = response.json()
        if not data.get("choices") or len(data["choices"]) == 0:
            return {
                "status": "error",
                "message": "Empty response from LLM",
                "timestamp": datetime.now().isoformat()
            }
        
        response_text = data["choices"][0]["message"]["content"]
        # Removed debug print to avoid non-JSON output
        
        # Step 5: Extract JSON from response
        try:
            # Try to find JSON block in response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
            elif "{" in response_text:
                # Find first { and last }
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                json_str = response_text[json_start:json_end]
            else:
                json_str = response_text
            
            test_plan = json.loads(json_str)
            # Removed debug print to avoid non-JSON output
            
            return {
                "status": "success",
                "sections": test_plan,
                "model_used": model,
                "timestamp": datetime.now().isoformat()
            }
        
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return as raw text (no print)
            return {
                "status": "success",
                "sections": {
                    "raw_response": response_text,
                    "note": "Could not parse as structured JSON"
                },
                "model_used": model,
                "timestamp": datetime.now().isoformat()
            }
    
    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "message": "Request timeout - LLM API not responding",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error generating test plan: {str(e)[:100]}",
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python generate_test_plan.py <TITLE> [DESCRIPTION]\n")
        sys.stderr.write("Example: python generate_test_plan.py 'Add login' 'Users should be able to log in'\n")
        sys.exit(1)
    
    title = sys.argv[1]
    description = sys.argv[2] if len(sys.argv) > 2 else "No description provided"
    criteria = sys.argv[3:] if len(sys.argv) > 3 else None
    
    result = generate_test_plan(title, description, criteria)
    
    # Output JSON result to stdout (for server to parse)
    print(json.dumps(result, ensure_ascii=True))
