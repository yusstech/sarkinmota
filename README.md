# SarkinMota

SarkinMota's own mobile store. Customers browse SarkinMota's cars, buy outright or pay 40% now and the rest later, and get the car delivered. It is not a marketplace.

- Product & system spec: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- `mobile/`: Expo (React Native, TypeScript, expo-router)
- `supabase/`: Postgres schema, RLS, seed (demo data)

## Run locally

```bash
# 1. Backend (Docker required)
supabase start            # add `-x studio,edge-runtime` if Docker can't mount this folder
supabase db reset         # applies migrations + demo seed

# 2. App
cd mobile
cp .env.example .env      # set your Mac's LAN IP + the publishable key printed by `supabase start`
npm install
npx expo start --port 8082
```

Open in Expo Go: iOS simulator (`i`), or on a device at `exp://<LAN IP>:8082`.
Android over USB: `adb reverse tcp:8082 tcp:8082`, then open `exp://127.0.0.1:8082`.

Seed data is **demo only**: prices, condition reports and delivery stories are placeholders, and photos are from Unsplash.
