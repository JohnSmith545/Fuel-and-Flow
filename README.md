# Fuel and Flow

A nutrition and energy tracker that connects **what you eat** with **how you feel**. Log meals, check in on your energy and mood, and get suggestions when a pattern shows up, like an energy crash after a high-sugar meal.

## Features

- **Meal logging** with food search, custom meals and a daily macro summary
- **Energy check-ins:** rate your energy from 1 to 10 and tag how you feel (focused, foggy, jittery, calm and more)
- **Dietary engine:** rule-based suggestions from your recent meals and energy logs, such as a crash analysis after sugary meals and an evening protein-gap check
- **Allergen safety checks:** foods that conflict with your allergens are flagged in a safety modal before they're logged
- **Analytics:** daily goal completion, energy trends and charts over time
- **Onboarding and profile settings** for goals and allergens, with Firebase Auth

## Tech stack

React, TypeScript, Vite, Tailwind CSS and Shadcn UI on the front end; Firebase (Auth, Firestore, Cloud Functions) and tRPC on the back end; TanStack Router and Query; Turborepo with pnpm workspaces.

## Testing

- **Unit and component tests** with Vitest and Testing Library: the allergen safety check, food logger, daily fuel, profile settings and the logging flow
- **End-to-end tests** with Playwright: the happy path and an allergen-conflict scenario

## Run it locally

```bash
pnpm install
pnpm dev      # start the app
pnpm test     # unit and component tests
```

## Credits

Built on a Turborepo starter set up by [@sichi46](https://github.com/sichi46) and [@Geoffrey-Zulu](https://github.com/Geoffrey-Zulu). The starter's documentation is in [STARTER.md](STARTER.md). The Fuel and Flow app itself (features, engine, safety checks and tests) was built by [@JohnSmith545](https://github.com/JohnSmith545).
