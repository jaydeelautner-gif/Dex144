# PokéPet evolution

## User flow

Open **Evolve** on an inventory card or your own PokéPet Trainer Card.
Choose a direct next species (branching evolutions have a picker), choose a
compatible owned game, enter any whole level **1–100** with the keypad or
numeric input, and answer whether an item was used. Yes requires an item name.
The user confirms game-specific requirements rather than the app claiming to
verify an actual in-game evolution.

POKEID, gender, shiny status, nickname, origin flags/game and creation date are
retained. Compatible forms are remapped to the target species. Unsupported form
changes, incompatible gender branches and temporary battle transformations are
blocked instead of silently falling back to another form. Known game-dependent
Alolan/Hisuian outcomes use the selected evolution game. New/unsupported forms
may require extending `src/utils/pokepetEvolution.ts`.

A HOME-stored pet requires confirmation that it moved into a game. The user
also states whether it returned to HOME afterward. HOME-gift status is an origin
fact, not a permanent storage location. Console/HOME pets cannot be moved into GO.

For a pet assigned to a Living Dex slot, **ask the user every time**:
- Keep the evolved pet in inventory, outside a Living Dex slot; or
- Move it to the new species slot, only if returned to HOME and the slot is empty.
An existing occupant is never overwritten or deleted.

## Identity, collection, and reacquisition

Evolution replaces the existing inventory entry under the **same POKEID**. It
never creates a second pet and never puts a pre-evolution copy in the rescue bin.
The collection-derived caught/living/shiny sets update from the remaining
inventory. Old per-game caught entries are removed only when no other specimen
of that species remains in the affected game; the evolved species is added.

An append-only `evolutionHistory` records old/new species, levels, variants,
previous/current game, item yes/no/name and the time. `currentGameId` is separate
from the retained origin `gameId`. Serialization, Firebase subscriptions and the
universal Trainer Card lookup preserve these fields. The Trainer Card displays
the evolution/item history.

Trainer Hints and suggestion cards surface species lost through evolution:
recorded wild methods show reacquisition locations; otherwise they show trade,
recorded in-game trade, breeding-if-supported, and gift/event guidance. Used
one-off starter gifts are not advertised as fresh gifts. Missing encounter
coverage is labelled unverified, **not proof of unavailability**. Reacquiring
another specimen clears the collection-specific restriction.

## Persistence and deployment

Guest evolution saves locally with the rest of the guest inventory. Signed-in
evolution is online-only and uses one Firestore transaction for the inventory
and universal registry documents. It checks the previous species/version and
fails without applying a local species change if the cloud save fails.

**Publish the updated `firestore.rules` before using signed-in evolution.**
The old rules intentionally forbid species changes. New rules require a direct
parent-child transition, retained identity/gender/origin/shiny fields, a matching
appended event, and matching registry/inventory state after the transaction.
Ordinary edits do not change species. The repository has no Firebase deployment
configuration, so no live deployment was performed.

## Verification / regeneration

- `npm run test:evolution`: direct edges/branches, gender/form preservation,
  identity, any valid level, item logging, HOME consent, placement/collisions,
  per-game reacquisition, history round-trip and server-rendered modal controls.
- `npm run lint` and `npm run build`.
- `npm run fetch:evolution-edges`: refresh the direct PokéAPI parent-child
  graph and its synchronized server-rules table. The existing flattened family
  lists are not used to infer next evolutions, because siblings are not parents.

Live Firestore/emulator tests have not been run: this machine has no Java runtime
for the Firestore emulator. Native visual testing was unavailable because Screen
Recording permission is missing. Test the signed-in flow after rules deployment,
including a reload and opening the same POKEID from another device.
