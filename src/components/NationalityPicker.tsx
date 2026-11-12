import { useState } from "react";
import PlaceInput from "./PlaceInput";
import { normalize } from "../places";
import { MAX_NATIONALITIES } from "../shared/constants";

type Props = {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder: string;
  hint: string;
  removeLabel: string;
};

/** Several countries: each one picked from the list (or typed) becomes a removable chip. */
export default function NationalityPicker({ id, value, onChange, options, placeholder, hint, removeLabel }: Props) {
  const [draft, setDraft] = useState("");
  const taken = new Set(value.map(normalize));
  const full = value.length >= MAX_NATIONALITIES;

  function add(v: string) {
    if (!taken.has(normalize(v)) && !full) onChange([...value, v]);
  }

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {value.map((n) => (
            <li key={n} className="flex items-center gap-1 rounded-full bg-brand-700 py-1 pl-3.5 pr-1 text-sm font-medium text-white dark:bg-brand-600">
              {n}
              <button
                type="button"
                aria-label={`${removeLabel} ${n}`}
                onClick={() => onChange(value.filter((x) => x !== n))}
                className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/20"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <PlaceInput
          id={id}
          options={options.filter((o) => !taken.has(normalize(o)))}
          placeholder={placeholder}
          value={draft}
          onChange={setDraft}
          onPick={add}
          aria-describedby={`${id}-hint`}
        />
      )}
      <p id={`${id}-hint`} className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        {hint}
      </p>
    </div>
  );
}
