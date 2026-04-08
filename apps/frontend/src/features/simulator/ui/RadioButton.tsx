interface RadioButtonProps {
  label: string;
  onClick: () => void;
}

export function RadioButton({ label, onClick }: RadioButtonProps) {
  return (
    <button type="button" className="sim-radio-btn" onClick={onClick}>
      {label}
    </button>
  );
}
