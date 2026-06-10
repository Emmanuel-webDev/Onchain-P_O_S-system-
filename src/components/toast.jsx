import { useEffect, useState } from "react";

export default function Toast({ message, type = "info", onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 320);
    }, 2800);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`toast toast--${type} ${visible ? "toast--visible" : ""}`}>
      {message}
    </div>
  );
}