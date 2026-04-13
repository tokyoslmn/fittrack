# Food Items Database — Design Spec

## Context

The nutrition system is currently text-based: trainers type meal option descriptions like "250g piletina + krompir + salata" with no structured ingredient data. This makes it impossible for clients to see per-ingredient macros, prepare for meals, or understand nutritional values of individual foods.

This feature adds a global food items table with macro data per 100g, linked to meal options so that macros are calculated automatically from ingredients.

## Data Model

### New model: `FoodItem`

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Naziv namirnice (e.g., "Piletina bela") |
| category | String? | Kategorija (e.g., "Meso", "Povrce", "Ulje") |
| defaultGrams | Float | Osnovna jedinica u gramima (e.g., 100) |
| defaultPieces | Float? | Osnovna jedinica u komadima (e.g., 1) |
| protein | Float | Proteini per 100g |
| carbs | Float | Ugljeni hidrati per 100g |
| fat | Float | Masti per 100g |
| calories | Float | Kalorije per 100g |
| measuredRaw | Boolean | true = meri se sirovo, false = posle obrade |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

Global table — no owner. Both trainers and clients can create/edit/delete items.

### New model: `MealOptionItem`

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| mealOptionId | String | FK to MealOption |
| foodItemId | String | FK to FoodItem |
| quantity | Float | Gramaza u ovom obroku |
| orderIndex | Int | Redosled prikaza |

Cascade delete from MealOption. Restrict delete from FoodItem (can't delete food item in use).

### Modified model: `MealOption`

Keep existing `description` field as auto-generated from linked `MealOptionItem`s. Format: "250g piletina bela + 100g krompir + salata". This preserves backward compatibility and provides a readable summary.

## API Routes

### `/api/food-items`
- **GET** — List all food items, supports `?search=` and `?category=` query params
- **POST** — Create food item (trainer or client)
- **PUT** — Update food item
- **DELETE** — Delete food item (fails if in use by any MealOptionItem)

### Modified: `/api/trainer/nutrition`
- POST body's meal options change from `{ description }` to `{ items: [{ foodItemId, quantity }] }`
- Description auto-generated server-side from linked items

## UI

### Food Items CRUD Page (`/food-items`)
- Accessible from sidebar for both roles
- Searchable table/list with columns: name, category, P/C/F/kcal per 100g, merenje (sirovo/obradeno)
- Add/edit form in dialog/modal
- Delete with confirmation (blocked if item is in use)

### Modified Nutrition Editor (trainer)
- Replace free-text option description with ingredient picker
- For each meal option:
  - Dropdown/combobox to search and select food item
  - Quantity input (grams)
  - Shows calculated P/C/F for that quantity
  - Total macros for the option shown at bottom
- Auto-generates description string from items

### Client Meal View
- Meal options show list of ingredients with individual quantities and macros
- Total macros for the option displayed

## Seed Data

Seed the FoodItem table with common items from existing meal descriptions:
- Piletina bela, Krompir, Maslinovo ulje, Integralni hleb, Tunjevina, Jaja, Ovsene pahuljice, Banana, Badem, Proteinski jogurt, Borovnice, etc.

Re-seed meal options to use MealOptionItem references instead of text descriptions.

## Verification

1. Run `pnpm prisma migrate dev` — migration succeeds
2. Run `pnpm prisma db seed` — seed includes food items and linked meal options
3. Login as trainer — food items page shows CRUD, nutrition editor uses picker
4. Login as client — food items page accessible, meal view shows ingredient breakdown
5. Delete food item that's in use — blocked with error message
6. Create meal option via picker — macros calculate correctly, description auto-generated
