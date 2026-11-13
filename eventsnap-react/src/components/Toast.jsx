import { useEffect, useState } from "react";
import { useApp } from "../AppContext";

export default function Toast() {
  const { toastState } = useApp();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!toastState.msg) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 3200);
    return () => clearTimeout(t);
  }, [toastState]);
  return (
    <div className={"toast" + (show ? " show" : "")} role="status" aria-live="polite">
      <i /><span>{toastState.msg}</span>
    </div>
  );
}
