# High-Level Architecture & Domain: Lecturer and Project Management

This document provides a high-level overview of the **Lecturer** and **Project** domains within the Jira-GitHub Manager (WDP/SWP391) system. Unlike technical API specs or database schemas, this document focuses on the core business logic, entity relationships, and primary workflows from a system perspective.

---

## 1. Core Domain Entities & Relationships

The system is built around a clear hierarchy designed to model the SWP391 course structure:

- **Lecturer (Giảng viên):** The primary supervisor. A Lecturer is assigned to manage multiple Student Groups across a semester.
- **Student Group (Nhóm sinh viên):** A team of typically 4-6 students. Each group is supervised by exactly one Lecturer.
- **Project (Đồ án):** The software product being built by a Student Group. There is a strictly 1-to-1 relationship between a Group and a Project. The Project acts as the anchor point for external integrations (Jira, GitHub).
- **Student (Sinh viên):** Members of a Student Group. They contribute to the Project and are individually evaluated.

**High-Level Relationship Map:**

```text
[ Lecturer ] (1) ----manages----> (N) [ Student Group ]
[ Student Group ] (1) ----works on----> (1) [ Project ]
[ Student Group ] (1) ----contains----> (N) [ Student ]
[ Project ] (1) ----links to----> (1) [ Jira Workspace ] & (1) [ GitHub Repo ]
```

---

## 2. Key Lecturer Capabilities & Responsibilities

The system empowers the Lecturer by automating the data-gathering phase of grading. The core capabilities are:

1. **Portfolio Overview:** A centralized dashboard (`/lecturer`) to view all assigned groups, projects, and high-level metrics (e.g., total active projects).
2. **Project Inspection:** The ability to drill down into a specific project to view its linked Jira and GitHub repositories.
3. **Automated Data Synchronization (The "Killer Feature"):** The system allows the Lecturer to trigger a sync that aggregates task statuses from Jira and Lines of Code (LOC) contributions from GitHub for a specific project.
4. **Grading & Evaluation:**
   - **Template 3 (Individual Evaluation):** Utilizing the synced Jira/GitHub data (Features, Status, LOC, Complexity) to assign an individual "Quality" score to each student.
   - **Template 2 (Group Evaluation):** Evaluating the project as a whole across predefined rubrics (SRS, Architecture, API, Code Quality, Testing).
5. **Report Generation:** Exporting the finalized evaluations into standard Excel templates required by the university.

---

## 3. Core Workflows (High-Level Sequence)

### A. The "Auto-Sync" LOC & Status Workflow

This workflow is the heart of the automated grading process.

1. **Trigger:** The Lecturer clicks "Auto-Sync" on a Project's Detail page.
2. **Aggregation (Backend):**
   - The Backend identifies the linked Jira Project Key and GitHub Repository URL.
   - It securely communicates with the **Jira API** to retrieve all Epics/Tasks mapped to specific students, along with their current Status (e.g., "Done", "In Progress").
   - It communicates with the **GitHub API** to analyze commit history, calculating the Lines of Code (LOC) added/modified by each student mapped to those specific tasks.
3. **Synthesis:** The Backend combines these two data streams into a unified "Feature Contribution" list.
4. **Presentation:** The Frontend displays the synthesized data in the `EvaluationLOCTable`, providing the Lecturer with objective, quantitative data on student performance.

### B. The Grading & Export Workflow

1. **Review:** The Lecturer reviews the populated Auto-Sync data (Template 3). They see that Student A completed 500 LOC on the "Authentication" feature (Status: Done).
2. **Qualitative Assessment:** The Lecturer inputs their subjective assessment by selecting a "Quality" rating (High/Medium/Low) for each feature.
3. **Group Assessment:** The Lecturer navigates to the Group Evaluation section (Template 2) and assigns scores for overall project criteria (e.g., 0.8/1.0 for SRS).
4. **Finalization:** The Lecturer clicks "Export to Excel," and the system generates the formal grading documents matching the university's exact formatting requirements.

---

## 4. System Boundaries & External Dependencies

To achieve this functionality, the system relies on strict boundaries:

- **Source of Truth for Identity:** The system (via NextAuth/Neon) is the source of truth for who is a Lecturer and who is a Student.
- **Source of Truth for Tasks:** **Jira** is the absolute source of truth for project management. If a task isn't in Jira, the system does not track it.
- **Source of Truth for Code:** **GitHub** is the absolute source of truth for code contributions. Contributions outside the linked main repository branch are ignored.
- **Backend Role:** The backend acts as a secure orchestrator and data aggregator. It holds the OAuth tokens required to speak to Jira and GitHub on behalf of the user, performs the heavy lifting of data correlation, and serves clean JSON to the frontend.
