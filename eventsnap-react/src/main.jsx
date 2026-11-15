import { createRoot } from "react-dom/client";
import App from "./App";
import { missingFirebaseConfig } from "./firebase";
import "./styles/site.css";

function FirebaseConfigurationNotice() {
  return (
    <main style={{ maxWidth: 720, margin: "10vh auto", padding: 32, fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
      <h1>EventSnap needs Firebase configuration</h1>
      <p>
        Add the missing Firebase web app settings in Vercel under
        {" "}<b>Project Settings → Environment Variables</b>, then redeploy.
        Get these values from Firebase Console → Project settings → Your apps.
      </p>
      <ul>{missingFirebaseConfig.map((key) => <li key={key}><code>{key}</code></li>)}</ul>
      <p><code>VITE_FIREBASE_MEASUREMENT_ID</code> is optional.</p>
    </main>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Missing React root element "#root".');

createRoot(rootElement).render(
  missingFirebaseConfig.length ? <FirebaseConfigurationNotice /> : <App />
);
