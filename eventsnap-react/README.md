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

Set the `VITE_FIREBASE_*` values in `.env` to the Firebase web app configuration before starting the app. These client configuration values, including the FCM VAPID public key, are included in browser code and are not secrets; protect Firebase data with Security Rules.

- Enable Google as a sign-in provider in Firebase Authentication for website users, and enable Email/Password for the admin. Add the deployed website's domain to Firebase's authorized domains.
- In Firebase Console → Project settings → Cloud Messaging, enable Web Push and use the provided VAPID public key. Set `VITE_FIREBASE_VAPID_KEY` locally and in every Vercel deployment environment. Push notifications require HTTPS (except localhost) and a browser with service-worker/FCM support.
- Push notifications use the Vercel API routes in `api/` and Firebase Admin SDK on the server. No Firebase Cloud Functions or Blaze billing are needed.
- Create a Firebase Storage bucket in the Firebase console (Storage → Get started) before using uploaded profile photos.
- Firestore rules have been deployed. After creating the Storage bucket, deploy Storage rules from this folder with `firebase deploy --only storage`. The workspace-root Firebase config uses `y`; both Firestore rule files have the same access policy.
- The admin panel accepts only the Firebase account whose UID is `QXpWsJiQE9N0e4lb12J2oFqUfyk2`. Sign in with that Google account or its linked email/password credential. If the account currently uses Google only, enter the desired email/password in the admin login form and choose **Set up password with Google**; sign in with the authorized Google account to link the password to the same UID. Other accounts are signed out.

### Vercel deployment

Set the Vercel project root directory to `eventsnap-react`, use Node.js 22 or later, `npm run build` as the build command, and `dist` as the output directory. Add these environment variables in Vercel's Project Settings for every deployment environment you use (Production, Preview, and Development), using values from Firebase Console → Project settings → Your apps:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_VAPID_KEY
```

`VITE_FIREBASE_MEASUREMENT_ID` is optional. Vercel does not read the local `.env` file; redeploy after adding or changing environment variables. `vercel.json` rewrites SPA routes such as `/admin` to `index.html`.

### Push notification deployment

The browser stores tokens at `fcmTokens/{uid}/devices/{deviceId}`. Firestore rules allow each signed-in user to manage only their own tokens. The Vercel API verifies each Firebase ID token, checks the booking or message in Firestore, and derives recipients from trusted records before sending FCM. It handles new booking requests, acceptance, rejection, chat messages, confirmed-booking deletion, and admin reopening.

In Vercel Project Settings, add these server-side environment variables for Production, Preview, and Development:

```text
FIREBASE_PROJECT_ID=photo-7db41
FIREBASE_SERVICE_ACCOUNT_JSON=<the complete Firebase service-account JSON>
```

Create a Firebase service-account key in Firebase Console → Project settings → Service accounts, then paste its JSON into the Vercel secret environment variable. Never add this JSON to the repository, a `VITE_*` variable, the website source, or a frontend `.env` file. The API reads it only on the server. Keep the existing `VITE_FIREBASE_*` variables for the browser Firebase SDK and VAPID key for web push. Redeploy after setting the Vercel variables.

`firebase.json` no longer configures Firebase Cloud Functions. Do not deploy Firebase Functions; deploy the React app and `/api` routes through Vercel. The existing `notificationEvents` collection is used for idempotency and may optionally have a 30-day TTL policy on `expireAt`.

The messaging service worker is served from `/firebase-messaging-sw.js`; it receives the existing Firebase web configuration during registration and displays background notifications. Foreground messages use the website toast.

- Website: `http://localhost:5173/`
- Admin panel: `http://localhost:5173/#/admin` (or the "Admin panel" link in the footer) — sign in with the authorized Google account or linked email and password.

## Project structure

```
src/
  main.jsx              entry point
  App.jsx               page layout + "#/admin" routing
  AppContext.jsx        shared state: location, functions, profiles, chats, favourites, toasts
  notifications.js     FCM permission, token registration, and foreground message helpers
  data.js               cities, function types, sample functions & photographers, storage keys
  utils.js              helpers + useStored() (localStorage state that syncs between tabs)
  styles/site.css       website styles
  components/
    Nav, Hero, HowItWorks, Categories, Featured (photographer cards + join banner),
    Problem, Board (live function board + confirm popup), PostFunction,
    Sections (For photographers, Stories, FAQ, CTA, Footer), JoinModal (photographer sign-up),
    NotificationSettings, Chat, BottomNav (phone menu + city picker), Toast, Icons
  admin/
    Admin.jsx           dashboard, messages (reply as photographer), photographers, functions
    admin.module.css    admin styles (scoped, so they never clash with the website)
api/
  notifications.js     authenticated Vercel notification endpoint
server/
  firebaseAdmin.js     server-only Firebase Admin SDK initialization
public/
  firebase-messaging-sw.js  FCM background notifications and notification-click handling
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
