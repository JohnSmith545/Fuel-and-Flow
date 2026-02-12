# Product Design Document: Fuel and Flow (v1.0)

## 1. Executive Summary

**Fuel and Flow** is a deterministic, high-fidelity nutrition tracker designed to optimize human performance. Unlike generic calorie counters, Fuel and Flow correlates dietary input with output metrics (energy and focus). It uses a strict **Rules-Based Engine** to provide safety for users with allergies and actionable insights for productivity-focused individuals, without relying on opaque AI algorithms.

## 2. Problem & Solution

- **The Problem:** Most fitness apps focus solely on weight loss, ignoring how food affects cognitive performance. Furthermore, "smart" apps often obscure _why_ a suggestion is made, and allergy management is frequently an afterthought.
- **The Solution:** A transparent tracking system that treats the body as a bio-feedback loop. By manually tracking food intake alongside energy scores, users identify exact cause-and-effect relationships (e.g., "Gluten at lunch drops my focus by 40%").

## 3. Target Audience

- **The Bio-Hacker:** Professionals optimizing for deep work and mental clarity.
- **The Sensitive Eater:** Individuals with strict dietary restrictions (Celiac, Lactose Intolerant, Nut Allergies).
- **The Quantified Self:** Users who love data visualization and manual control over their metrics.

---

## 4. System Architecture & Logic Flow

The core of VitalFlow is the interaction between four static databases: The **Identity Manager**, The **User Profile**, The **Food Library**, and The **Rules Engine**.

### A. The "Identity Manager" (Authentication) [NEW]

- **Gatekeeper:** No data is accessible without a verified session.
- **Method:** Google OAuth (One-Click Sign In) via Firebase Authentication.
- **Logic:**
- `IF (User_Exists == False) THEN (Create_User_Doc & Redirect_to_Onboarding)`
- `IF (User_Exists == True) THEN (Load_Profile & Redirect_to_Dashboard)`

### B. The "Gatekeeper" (Allergy Logic)

- **Hard Constraint:** This logic runs _before_ any food is committed to the log or suggested.
- **Logic:** `IF (Selected_Food contains User_Allergen_ID) THEN (Trigger_Block_Event)`.
- **UI Result:** The user sees a "red light" modal and cannot add the item without a specific override confirmation (safety step).

### C. The "Fuel Gauge" (Macro Logic)

- **Dynamic Calculation:** Real-time subtraction of consumed nutrients from daily targets.
- **Logic:** `Daily_Target - Sum(Logged_Meals) = Remaining_Budget`.
- **UI Result:** A dashboard ring that fills up; color changes from Green (Optimal) to Yellow (Nearing Limit) to Red (Exceeded).

---

## 5. Functional Specifications (Features)

### Feature Set 0: Secure Access (Identity) [NEW]

- **Requirement:** Secure, persistent user sessions.
- **Requirement:** Automatic account creation upon first login.
- **Requirement:** "My Data" separation—users can only read/write their own logs (Firestore Security Rules).

### Feature Set 1: The Bio-Individual Profile

- **Requirement:** Mandatory onboarding flow to capture:
- **Biometrics:** Height, Weight, Age, Gender.
- **Exclusion List:** A checkbox list of top 14 allergens + "Other" (text field).
- **Performance Windows:** Users define their "Peak Hours" (e.g., 9:00 AM – 12:00 PM) to prioritize light, high-focus meals.

### Feature Set 2: The "Clean" Logger

- **Requirement:** A search bar connected to a verified nutritional database (API).
- **Requirement:** "Quick-Add" buttons for frequent meals (e.g., "Standard Oatmeal").
- **Requirement:** **The Feedback Loop.** 90 minutes after a meal, the app pushes a notification: _"How is your energy right now?"_
- Input: Slider (1-10).
- Input: Select Tags (Focused, Sluggish, Bloated, Hyper).

### Feature Set 3: The Rules-Based Suggestion Engine

This replaces the "AI" component with transparent logic trees.

- **Scenario A (The Crash):** If user logs Energy < 4 during "Peak Hours," the app highlights the last meal's Sugar content in the daily view.
- **Scenario B (The Gap):** If it is 6:00 PM and `Protein_Intake < 50%`, the app queries the internal recipe DB for "Dinner > High Protein > Exclude Allergens."

---

## 6. User Experience (UX) & Interface

The design philosophy is **"Data at a Glance."**

### Visual Hierarchy

1. **Top Bar (Identity):** User Avatar (Access to Profile/Settings) + Logout.
2. **Status Card (Hero):** "You are [Fuel Status] for your 2:00 PM Focus Block."
3. **The Timeline (Middle):** Vertical stream of meals, hydration, and energy logs.
4. **Action Bar (Bottom):** Large "+" button for Logging (Thumb-zone optimized).

### Color Coding

- **Energy High (8-10):** Electric Blue.
- **Energy Neutral (4-7):** Slate Grey.
- **Energy Low (1-3):** Muted Orange.
- **Allergen Alert:** Hazard Red.

---

## 7. Data & Privacy (Non-Functional Requirements)

- **Data Sovereignity:** All data is stored locally on the device first, syncing to the cloud only for backup.
- **Exportability:** Users can download a `.CSV` of all logs.
- **Performance:** App load time must be under 2 seconds; Food Search results must appear in < 200ms.

---

## 8. Development Roadmap (Agile Phasing)

| Sprint Phase       | Focus Area             | Key Deliverables                                                                  |
| ------------------ | ---------------------- | --------------------------------------------------------------------------------- |
| **Phase 1 (MVP)**  | **Core & Identity**    | **Google Login Integration**, User Profile DB, Manual Logging, Allergen "Blocker" |
| **Phase 2**        | **The Feedback Loop**  | Energy Scoring, Productivity Tagging, Basic Histograms                            |
| **Phase 3**        | **The Engine**         | Suggestion Logic ("If this, eat that"), Custom "Safe" Recipe Book                 |
