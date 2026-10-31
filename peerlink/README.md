# PeerLink

Student Peer Book & Equipment Lending Ledger. Borrow smart. Lend safely. Return on time.

## Website

https://shreya-m-12.github.io/peer-to-peer/

GitHub Pages serves the frontend only. The Vite `/api` endpoints run only during local development, and browser LocalStorage is not shared across devices.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. Production assets can be checked with `npm run build`; code checks use `npm run lint`.

## Demo accounts

- Student: `maya@peerlink.edu` / `peerlink123`
- Student: `aryan@peerlink.edu` / `peerlink123`
- Coordinator: `admin@peerlink.edu` / `peerlink123`

Demo accounts are prototype-only. Passwords are stored in browser LocalStorage and are not suitable for real accounts.

## Data and API

PeerLink records are persisted in the current browser's LocalStorage. They are not shared across browsers or devices. The Vite development server exposes `GET`, `POST`, `PUT`, and `DELETE` endpoints at `/api/items`, `/api/requests`, `/api/transactions`, and `/api/damage-reports`; this lightweight middleware keeps an in-memory API mirror for the current dev-server process.

The Explore page reads sample laptops from DummyJSON. Those products are reference-only and cannot be borrowed. PeerLink does not collect money or provide insurance or damage compensation. Any recovery arrangement is directly between students.
