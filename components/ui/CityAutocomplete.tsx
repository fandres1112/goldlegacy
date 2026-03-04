'use client';

import { useState, useRef, useEffect, useCallback } from "react";

type CityOption = { name: string; departmentName: string };

type CityAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function CityAutocomplete({
  value,
  onChange,
  id,
  name = "city",
  required,
  placeholder = "Ej. Bogotá D.C., Medellín...",
  className = "",
  disabled
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCities = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "25" });
      if (query) params.set("q", query);
      const res = await fetch(`/api/cities?${params}`);
      const data = await res.json();
      setOptions(res.ok ? data.items ?? [] : []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCities(value);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchCities]);

  const showList = open && (value.trim() === "" || options.length > 0 || loading);

  useEffect(() => {
    setHighlightIndex(0);
  }, [value, options.length]);

  useEffect(() => {
    if (!showList || highlightIndex < 0) return;
    const el = listRef.current?.children[highlightIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [showList, highlightIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cityName: string) => {
    onChange(cityName);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < options.length - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : options.length - 1));
      return;
    }
    if (e.key === "Enter" && options[highlightIndex]) {
      e.preventDefault();
      handleSelect(options[highlightIndex].name);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        required={required}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls="city-list"
        aria-activedescendant={showList && options[highlightIndex] ? `city-option-${highlightIndex}` : undefined}
      />
      {showList && (
        <ul
          id="city-list"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 py-1 bg-surface border border-border rounded-xl shadow-lg max-h-56 overflow-auto"
        >
          {loading ? (
            <li className="px-4 py-3 text-sm text-muted">Buscando...</li>
          ) : options.length === 0 ? (
            <li className="px-4 py-2 text-sm text-muted">
              {value.trim() ? "Sin resultados. Escribe tu ciudad si no aparece." : "Escribe para buscar ciudad."}
            </li>
          ) : (
            options.map((opt, i) => (
              <li
                key={`${opt.name}-${opt.departmentName}`}
                id={`city-option-${i}`}
                role="option"
                aria-selected={i === highlightIndex}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  i === highlightIndex ? "bg-gold/15 text-gold" : "text-foreground hover:bg-foreground/5"
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.name);
                }}
              >
                {opt.departmentName !== opt.name ? `${opt.name} (${opt.departmentName})` : opt.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
