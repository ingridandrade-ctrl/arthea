"use client";

import { useState } from "react";

type Step = "welcome" | "step1" | "step2" | "step3" | "step4" | "step5" | "done";

export default function FormFlow() {
  const [step, setStep] = useState<Step>("welcome");

  if (step === "welcome") {
    return (
      <section className="brescancin-card brescancin-step">
        <h2 className="brescancin-title">Antes da sua consulta</h2>
        <p className="brescancin-subtitle">Essas informações são sigilosas.</p>
        <p className="brescancin-body">
          Preenchendo com atenção, o Dr. Samuel e a Alana chegam preparados para
          o seu caso. Leva menos de 5 minutos.
        </p>
        <div className="brescancin-actions" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="brescancin-btn-primary"
            onClick={() => setStep("step1")}
          >
            Começar →
          </button>
        </div>
      </section>
    );
  }

  return <section className="brescancin-card brescancin-step">Em construção.</section>;
}
