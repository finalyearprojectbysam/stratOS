#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "STRATOS — modular 11-agent architecture + Gemini-ready provider abstraction (mock preserved), plus Owner Google OAuth activation and Owner avatar. Backend focus: new /api/agents endpoints that expose the agent registry and run agents/workflow with the Mock provider."

backend:
  - task: "GET /api/agents returns registry metadata + workflow stages"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "New endpoint. Should return count=11 agents (ids: ceo, business, competitor, seo, analytics, ads, opportunity, marketing, campaign, risk, project_manager), totalStages=12, and 7 workflow stages. Verifies the whole modular agent tree imports server-side."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - Endpoint returns HTTP 200 with correct structure: count=11, totalStages=12, agents array with all 11 expected IDs (ceo, business, competitor, seo, analytics, ads, opportunity, marketing, campaign, risk, project_manager), workflow array with 7 stages. All agent metadata includes required fields (id, name, displayName, description, version, enabled=true, capabilities array). Modular agent tree imports successfully server-side."
  - task: "POST /api/agents/run { agentId } runs a single agent (Mock provider)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Should return mode=single with a standardized AgentResult (status=completed, schemaValid=true, metadata.provider=mock). Try agentId 'seo' and 'ceo'. Unknown agentId should 500 with an error message."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - Tested with agentId='seo': returns HTTP 200, mode='single', result.status='completed', result.agentName='SEOAgent', metadata.provider='mock', metadata.schemaValid=true, non-empty summary. Tested with agentId='ceo': returns HTTP 200, mode='single', result.status='completed', result.agentName='CEOAgent'. Tested with agentId='does_not_exist': returns HTTP 500 with error message 'Unknown agent: does_not_exist'. All scenarios working correctly."
  - task: "POST /api/agents/run {} runs the full 12-stage workflow (Mock provider)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Should return mode=workflow with events including analysis_started + analysis_completed and 12 agent_completed/agent_failed events, and results array of 12 entries (all status=completed with Mock provider). Research layer (business,competitor,seo,analytics,ads,opportunity) runs in parallel."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - Endpoint returns HTTP 200 with mode='workflow'. Events array contains 38 events including 'analysis_started' and 'analysis_completed' types. Results array has exactly 12 entries (CEO runs twice - framing + final review). All 12 results have status='completed' as expected with Mock provider. durationMs=4 (number). Full workflow executes successfully with parallel research layer."
  - task: "GET /api/ base health endpoint still works"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/ (no agents path) should still return { status: 'ok', service: 'STRATOS' }."
        -working: true
        -agent: "testing"
        -comment: "✅ PASSED - Health endpoint returns HTTP 200 with status='ok', service='STRATOS', phase=3. Base endpoint working correctly."

frontend:
  - task: "Owner Google OAuth login card (activates with Supabase configured)"
    implemented: true
    working: true
    file: "components/stratos/auth.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Verified via screenshots: Owner card shows 'Continue with Google' (G logo), no email/password/forgot; click generates correct Supabase PKCE authorize URL. Employee login unchanged. Full Google consent+callback must be verified by user on live preview (sandbox has no internet)."

metadata:
  created_by: "main_agent"
  version: "1.1"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "GET /api/agents returns registry metadata + workflow stages"
    - "POST /api/agents/run { agentId } runs a single agent (Mock provider)"
    - "POST /api/agents/run {} runs the full 12-stage workflow (Mock provider)"
    - "GET /api/ base health endpoint still works"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Please test ONLY the new backend endpoints in app/api/[[...path]]/route.js: GET /api/agents, POST /api/agents/run (single agent + full workflow), and GET /api/ health. These validate the new modular 11-agent architecture imports and runs server-side with the Mock provider. No auth is required for these endpoints. Do not test the frontend."
    -agent: "testing"
    -message: "✅ ALL BACKEND TESTS PASSED (6/6). Tested all new agent endpoints: (1) GET /api/agents returns correct registry with 11 agents, 12 stages, 7 workflow stages; (2) POST /api/agents/run with agentId='seo' and 'ceo' both return completed results with mock provider; (3) Unknown agentId correctly returns 500 error; (4) Full workflow execution returns 12 completed results with proper events; (5) Health endpoint working. The entire modular 11-agent architecture (lib/agents/**, lib/orchestration/**, lib/gemini/**) imports and runs successfully server-side with Mock provider. No issues found."
