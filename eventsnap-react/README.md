# EventSnap — React version

The EventSnap website (originally `lenscall.html` + `admin.html`) rebuilt as a React app with Vite.

## Run it

```bash
npm install      # first time only
copy .env.example .env
npm run dev      # development server with live reload → http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build → http://localhost:4173
```

Set the `VITE_FIREBASE_*` values in `.env` to the Firebase web app configuration before starting the app. These client configuration values are included in browser code and are not secrets; protect Firebase data with Security Rules.

- Enable Google as a sign-in provider in Firebase Authentication and add the deployed website's domain to Firebase's authorized domains.
- Create a Firebase Storage bucket in the Firebase console (Storage → Get started) before using uploaded profile photos.
- Firestore rules have been deployed. After creating the Storage bucket, deploy Storage rules from this folder with `firebase deploy --only storage`. The workspace-root Firebase config uses `y`; both Firestore rule files have the same access policy.
- The admin panel accepts only the Google account whose Firebase UID is `QXpWsJiQE9N0e4lb12J2oFqUfyk2`.

- Website: `http://localhost:5173/`
- Admin panel: `http://localhost:5173/#/admin` (or the "Admin panel" link in the footer) — sign in with the authorized Google account.

## Project structure

```
src/
  main.jsx              entry point
  App.jsx               page layout + "#/admin" routing
  AppContext.jsx        shared state: location, functions, profiles, chats, favourites, toasts
  data.js               cities, function types, sample functions & photographers, storage keys
  utils.js              helpers + useStored() (localStorage state that syncs between tabs)
  styles/site.css       website styles
  components/
    Nav, Hero, HowItWorks, Categories, Featured (photographer cards + join banner),
    Problem, Board (live function board + confirm popup), PostFunction,
    Sections (For photographers, Stories, FAQ, CTA, Footer), JoinModal (photographer sign-up),
    Chat, BottomNav (phone menu + city picker), Toast, Icons
  admin/
    Admin.jsx           dashboard, messages (reply as photographer), photographers, functions
    admin.module.css    admin styles (scoped, so they never clash with the website)
```

## Data

Photographer profiles, function listings, and conversations/messages are stored in Cloud Firestore and sync across signed-in clients. Uploaded profile photos are stored in Firebase Storage. Customers must sign in with Google to post a function or send a message; photographers need an admin-verified profile to confirm a function. Function phone numbers and notes are stored separately from public listings and are only readable by the poster, an attending photographer after confirmation, or the admin.

City selection, favorites, and read/seen markers remain in browser `localStorage`. Existing local profiles, functions, and chats are not imported automatically; the app starts with Firestore data while leaving old browser data untouched.

Firestore security rules allow public reads of profiles and safe function-listing fields, owner/participant writes, and admin management for Firebase UID `QXpWsJiQE9N0e4lb12J2oFqUfyk2`. Storage rules must be deployed after the bucket is initialized.

## Optional photos

Put images in `public/` and they replace the illustrations automatically:

- `hero.jpg` — hero background
- `cat-wedding.jpg`, `cat-birthday.jpg`, `cat-baby.jpg`, `cat-events.jpg`, `cat-portrait.jpg`, `cat-products.jpg`

Featured Photographers shows only real sign-ups; their profile photo comes from the sign-up form.
