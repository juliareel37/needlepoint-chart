"use client";

import type { KeyboardEvent, ReactNode } from "react";
import styles from "./SegmentedControl.module.css";

export interface SegmentedControlOption<T extends string> {
  disabled?: boolean;
  label: ReactNode;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  itemClassName?: string;
  onActiveClick?: (value: T) => void;
  onChange: (next: T) => void;
  options: readonly SegmentedControlOption<T>[];
  stackOnSmallScreens?: boolean;
  value: T;
}

export function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  disabled = false,
  itemClassName,
  onActiveClick,
  onChange,
  options,
  stackOnSmallScreens = false,
  value,
}: SegmentedControlProps<T>) {
  const selectedIndex = options.findIndex(
    (option) => option.value === value && !option.disabled,
  );
  const fallbackIndex = options.findIndex((option) => !option.disabled);
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : fallbackIndex;

  const handleArrowNavigation = (
    event: KeyboardEvent<HTMLButtonElement>,
    startIndex: number,
    direction: 1 | -1,
  ) => {
    event.preventDefault();

    const optionCount = options.length;
    for (let step = 1; step <= optionCount; step += 1) {
      const nextIndex = (startIndex + step * direction + optionCount) % optionCount;
      const nextOption = options[nextIndex];

      if (disabled || nextOption?.disabled) {
        continue;
      }

      onChange(nextOption.value);
      return;
    }
  };

  return (
    <div
      className={[
        styles.root,
        stackOnSmallScreens ? styles.stackOnSmallScreens : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        const optionDisabled = disabled || option.disabled;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={index === tabbableIndex ? 0 : -1}
            className={[styles.item, itemClassName].filter(Boolean).join(" ")}
            data-active={active ? "true" : "false"}
            disabled={optionDisabled}
            onClick={() => {
              if (optionDisabled) {
                return;
              }

              if (active) {
                onActiveClick?.(option.value);
                return;
              }

              onChange(option.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                handleArrowNavigation(event, index, 1);
              }

              if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                handleArrowNavigation(event, index, -1);
              }

              if (event.key === "Home") {
                event.preventDefault();
                const firstEnabledOption = options.find((candidate) => !candidate.disabled);
                if (!disabled && firstEnabledOption && firstEnabledOption.value !== value) {
                  onChange(firstEnabledOption.value);
                }
              }

              if (event.key === "End") {
                event.preventDefault();
                const lastEnabledOption = [...options]
                  .reverse()
                  .find((candidate) => !candidate.disabled);
                if (!disabled && lastEnabledOption && lastEnabledOption.value !== value) {
                  onChange(lastEnabledOption.value);
                }
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
