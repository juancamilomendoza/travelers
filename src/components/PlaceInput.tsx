import { useId, useState } from "react";
import { matchPlaces } from "../places";

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
};

/** Text input with a suggestion list (accessible combobox). The user can still type any place. */
export default function PlaceInput({ id, value, onChange, options, placeholder }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = open ? matchPlaces(options, value) : [];

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="relative">
      <input
        id={id}
        className="input"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        placeholder={placeholder}
        value={value}
        onFocus={(e) => {
          e.target.select(); // a prefilled city is replaced as soon as the user types
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, -1));
          } else if (e.key === "Enter" && active >= 0 && matches.at(active)) {
            e.preventDefault();
            pick(matches.at(active)!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-900"
        >
          {matches.map((m, i) => (
            <li
              key={m}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: it fires before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m);
              }}
              className={`cursor-pointer px-3.5 py-2 ${i === active ? "bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100" : "hover:bg-stone-100 dark:hover:bg-stone-800"}`}
            >
              📍 {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
