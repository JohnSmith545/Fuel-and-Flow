### **Phase 1: Foundation & Infrastructure**

_Goal: A live React app with secure Hosting and a connected Database._

- **Repository Setup**
- [x] Setup Monorepo & Vite structure.
- [x] Configure `apps/web/vite.config.ts`.
- [x] Verify dev environment (`pnpm dev`).

- **Firebase Configuration**
- [x] Create Project "Fuel and Flow".
- [x] Enable **Authentication** (Google Provider).
- [x] Enable **Firestore Database**.
- [x] Get API keys.

- **Frontend Integration**
- [x] Create `.env.local` with API keys.
- [x] Implement `apps/web/src/lib/firebase.ts`.
- [x] **Build `AuthProvider` context (User Session Management).**
- [x] **Implement "Smart Login" (Auto-create User Profile in DB).**
- [x] Wrap `App.tsx` with `<AuthProvider>`.

---

### **Phase 2: The "Bio-Profile" (Onboarding)** (🚧 CURRENT PRIORITY)

_Goal: Capture the user's critical data, especially their allergy constraints._

- **Database Hook**
- [x] Create `useUserProfile` hook in `apps/web/src/hooks/`.
- _Logic:_ Fetch `users/{uid}` data to see if `onboardingCompleted` is true or false.

- **Onboarding UI (New Page)**
- [x] Create `apps/web/src/components/Onboarding.tsx`.
- [x] **Step 1:** Biometrics Form (Age, Gender, Weight, Height).
- [x] **Step 2:** The "Blacklist" (Checkboxes for top 14 allergens).
- [x] **Step 3:** Goals (Select "Weight Loss", "Focus", or "Maintenance").

- **Persistence**
- [x] Write `updateUserProfile(uid, data)` function to save this data to Firestore and set `onboardingCompleted: true`.

---

### **Phase 3: The "Fuel" (Logging & Safety)**

_Goal: The core logging loop with the "Safety Gatekeeper" active._

- **The Logger Component**
- [x] Build `FoodSearch.tsx`: Simple input field.
- [x] **CRITICAL TASK:** Implement the **Safety Filter**.
- _Logic:_ `IF (food.ingredients HAS user.allergens) THEN (Block/Warn)`.

- **Writing Logs**
- [x] Create `useLogMeal` hook.
- [x] Implement `addLog` function: Validates input, then `addDoc` to `users/{uid}/meal_logs`.

- **Daily Dashboard**
- [x] Build a "Macro Ring" component (visualize `current / target`).
- [x] Create a list view of today's meals in `App.tsx`.

- **Feature: Meal Deletion**
- [x] Add `deleteLog` function to `useLogMeal` hook.
- [x] Add "Delete" button to meal list in `DailyFuel.tsx`.

---

### **Phase 4: The "Flow" (Energy & Feedback)**

_Goal: Connecting food to how the user feels._

- **Energy Logging**
- [x] Create `EnergyCheckin.tsx` component.
- [x] Add a Slider (1-10) for Energy Level.
- [x] Add "Tag Chips" (Focused, Foggy, Jittery).

- **The Prompt System**
- [x] Logic: If `last_meal_time` > 90 mins ago -> Show "Check In" button.

- **Visualization**
- [x] Install `recharts`.
- [x] Build a simple line chart: X-Axis = Time, Y-Axis = Energy Score.

---

### **Phase 5: The Rules Engine & Polish**

_Goal: Making the app smart without AI._

- **The Engine**
- [ ] Create `useDietaryEngine.ts` hook.
- [ ] **Rule 1 (The Crash):** If Energy < 4, scan previous meal for High Sugar.
- [ ] **Rule 2 (The Gap):** If time > 6pm and Protein < Target, suggest protein.

- **Security & Deployment**
- [ ] specific `firestore.rules` (User can only read/write their own data).
- [ ] **Final Deploy:** `pnpm build` -> `firebase deploy`.

---
