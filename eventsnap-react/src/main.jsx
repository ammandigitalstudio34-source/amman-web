import { createRoot } from "react-dom/client";
import App from "./App";
import "./firebase";
import "./styles/site.css";

createRoot(document.getElementById("root")).render(<App />);
