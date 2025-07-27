import { useState } from "react";

export default function App() {
  const [output, setOutput] = useState("");

  const issue = async () => {
    const res = await fetch("http://localhost:3000/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const vc = await res.json();
    setOutput(JSON.stringify(vc, null, 2));
  };

  return (
    <div>
      <button onClick={issue}>VC 발행</button>
      <pre>{output}</pre>
    </div>
  );
}
