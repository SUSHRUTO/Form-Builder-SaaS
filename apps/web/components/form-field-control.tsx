"use client";

import type { FormFieldOutput } from "@repo/forms";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

export function FormFieldControl({
  field,
  value,
  onChange,
  className,
}: {
  field: FormFieldOutput;
  value: unknown;
  onChange: (value: unknown) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label className="text-base text-white">
          {field.label}
          {field.required ? <span className="ml-1 text-yellow-200">*</span> : null}
        </Label>
        {field.helpText ? <p className="mt-1 text-sm text-slate-300">{field.helpText}</p> : null}
      </div>
      {renderControl(field, value, onChange)}
    </div>
  );
}

function renderControl(field: FormFieldOutput, value: unknown, onChange: (value: unknown) => void) {
  switch (field.type) {
    case "short_text":
    case "email":
    case "number":
    case "date":
      return (
        <Input
          type={field.type === "short_text" ? "text" : field.type}
          placeholder={field.placeholder ?? undefined}
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
        />
      );
    case "long_text":
      return (
        <Textarea
          placeholder={field.placeholder ?? undefined}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
        />
      );
    case "single_select":
      return (
        <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose one" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multi_select": {
      const current = Array.isArray(value) ? value.map(String) : [];
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {field.options.map((option) => {
            const checked = current.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) =>
                    onChange(next ? [...current, option.value] : current.filter((item) => item !== option.value))
                  }
                />
                {option.label}
              </label>
            );
          })}
        </div>
      );
    }
    case "checkbox":
      return (
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm">
          <Checkbox checked={Boolean(value)} onCheckedChange={(next) => onChange(Boolean(next))} />
          Yes
        </label>
      );
    case "rating": {
      const max = field.validations.ratingScale ?? field.validations.max ?? 5;
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: max }).map((_, index) => {
            const rating = index + 1;
            const active = Number(value) >= rating;
            return (
              <button
                key={rating}
                type="button"
                className={cn(
                  "grid size-11 place-items-center rounded-md border text-sm font-semibold",
                  active ? "border-yellow-300 bg-yellow-300 text-slate-950" : "border-white/10 bg-white/[0.06] text-slate-200",
                )}
                onClick={() => onChange(rating)}
              >
                {rating}
              </button>
            );
          })}
        </div>
      );
    }
  }
}
