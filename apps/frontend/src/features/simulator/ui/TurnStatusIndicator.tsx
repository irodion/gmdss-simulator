/**
 * Visual indicator for AI turn processing status.
 * Shows different states: processing, slow, timeout, error.
 */

import { useTranslation } from "react-i18next";
import type { TurnStatus } from "../transport/transport-types.ts";

interface Props {
  status: TurnStatus | "idle" | "complete";
  sttFailureCount: number;
  onRetry?: () => void;
}

export function TurnStatusIndicator({ status, sttFailureCount, onRetry }: Props) {
  const { t } = useTranslation("simulator");

  if (status === "idle" || status === "complete") return null;

  return (
    <div className="sim-turn-status" role="status" aria-live="polite">
      {status === "processing" && (
        <>
          <span className="sim-turn-status__dot sim-turn-status__dot--pulse" aria-hidden="true" />
          <span className="sr-only">{t("turnStatus.processing", "Processing...")}</span>
        </>
      )}
      {status === "slow" && (
        <span className="sim-turn-status__text">{t("turnStatus.slow", "Processing...")}</span>
      )}
      {status === "timeout" && (
        <div className="sim-turn-status__timeout">
          <span>{t("turnStatus.timeout", "No response from station.")}</span>
          {onRetry && (
            <button type="button" className="btn btn--small" onClick={onRetry}>
              {t("turnStatus.retry", "Retry")}
            </button>
          )}
        </div>
      )}
      {status === "error" && sttFailureCount >= 2 && (
        <span className="sim-turn-status__text">
          {t("turnStatus.typedFallback", "Use text input to transmit.")}
        </span>
      )}
      {status === "error" && sttFailureCount < 2 && (
        <span className="sim-turn-status__text">
          {t("turnStatus.sayAgain", "Transmission not received — say again.")}
        </span>
      )}
      {status === "fallback" && (
        <span className="sim-turn-status__text">
          {t("turnStatus.fallback", "Using pre-recorded response.")}
        </span>
      )}
    </div>
  );
}
