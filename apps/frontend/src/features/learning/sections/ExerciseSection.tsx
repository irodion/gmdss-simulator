import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  prompt: string;
  options: { key: string; text: string }[];
  answer: string;
  explanation: string;
}

export function ExerciseSectionView({ prompt, options, answer, explanation }: Props) {
  const { t } = useTranslation("learning");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === answer;

  return (
    <div className="exercise">
      <div className="exercise__prompt">{prompt}</div>
      <div className="exercise__options">
        {options.map((opt) => {
          let className = "exercise__option";
          if (selected === opt.key) className += " exercise__option--selected";
          if (submitted && opt.key === answer) className += " exercise__option--correct";
          if (submitted && selected === opt.key && !isCorrect)
            className += " exercise__option--incorrect";

          return (
            <button
              key={opt.key}
              type="button"
              className={className}
              onClick={() => {
                if (!submitted) setSelected(opt.key);
              }}
              disabled={submitted}
            >
              <span style={{ fontWeight: 600, minWidth: 20 }}>{opt.key.toUpperCase()}.</span>
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {!submitted && selected && (
        <button
          type="button"
          className="btn btn--primary"
          style={{ marginTop: 14 }}
          onClick={() => setSubmitted(true)}
        >
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
