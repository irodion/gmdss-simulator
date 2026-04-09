import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  prompt: string;
  answer: string;
  alternatives?: string[];
  explanation: string;
}

function isAnswerCorrect(input: string, answer: string, alternatives?: string[]): boolean {
  const normalized = input.trim().toLowerCase();
  if (normalized === answer.trim().toLowerCase()) return true;
  return alternatives?.some((alt) => normalized === alt.trim().toLowerCase()) ?? false;
}

export function FillBlankSectionView({ prompt, answer, alternatives, explanation }: Props) {
  const { t } = useTranslation("learning");
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (input.trim()) setSubmitted(true);
  }

  const isCorrect = submitted && isAnswerCorrect(input, answer, alternatives);

  return (
    <div className="exercise">
      <div className="exercise__prompt">{prompt}</div>
      <div className="fill-blank__input-row">
        <input
          type="text"
          className="fill-blank__input"
          placeholder={t("typeYourAnswer")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          disabled={submitted}
        />
      </div>

      {!submitted && input.trim() && (
        <button type="button" className="btn btn--primary exercise__submit" onClick={handleSubmit}>
          {t("checkAnswer")}
        </button>
      )}

      {submitted && (
        <div className={`alert ${isCorrect ? "alert--success" : "alert--error"}`}>
          <strong>{isCorrect ? t("correct") : t("incorrect")}</strong> {explanation}
        </div>
      )}
    </div>
  );
}
