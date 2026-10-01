"use client";

import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MoveProfile } from "@/lib/movable/contracts";
import { COUNTRIES, type FieldErrors, type ProfileFields } from "./profile-fields";

type FieldName = keyof MoveProfile;
type Props = { fields: ProfileFields; errors: FieldErrors; onChange: (key: FieldName, value: string) => void };

function Field({ name, label, hint, error, children }: {
  name: FieldName; label: string; hint?: string; error?: string; children: ReactNode;
}) {
  return <div className="min-w-0 space-y-2">
    <Label htmlFor={name} className="text-sm leading-5">{label}</Label>
    {children}
    {hint && <p id={`${name}-hint`} className="text-xs leading-5 text-muted-foreground">{hint}</p>}
    {error && <p id={`${name}-error`} className="text-sm text-destructive">{error}</p>}
  </div>;
}

export function ProfileForm({ fields, errors, onChange }: Props) {
  function accessibility(name: FieldName, hint?: string) {
    return {
      id: name, "aria-invalid": !!errors[name], "aria-required": true,
      "aria-describedby": [hint && `${name}-hint`, errors[name] && `${name}-error`].filter(Boolean).join(" ") || undefined,
    };
  }
  function textField(name: FieldName, label: string, props: ComponentProps<typeof Input> = {}) {
    return <Field name={name} label={label} error={errors[name]}>
      <Input {...props} {...accessibility(name)} name={name} value={fields[name]}
        onChange={(event) => onChange(name, event.target.value)} className="h-11 min-w-0 max-w-full bg-background/40 text-base md:text-sm" />
    </Field>;
  }
  function selectField(name: FieldName, label: string, options: { value: string; label: string }[], hint?: string) {
    return <Field name={name} label={label} hint={hint} error={errors[name]}>
      <Select name={name} value={fields[name]} onValueChange={(value) => onChange(name, value)}>
        <SelectTrigger {...accessibility(name, hint)} className="w-full min-w-0 bg-background/40 text-base data-[size=default]:h-11 md:text-sm">
          <SelectValue placeholder="Choose an option" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-72">
          {options.map(({ value, label }) => <SelectItem key={value} value={value} className="min-h-10">{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>;
  }
  const countries = COUNTRIES.map(({ code, name }) => ({ value: code, label: name }));

  return <div className="space-y-7">
    <fieldset className="space-y-4">
      <legend className="mb-4 text-base font-semibold">You & your route</legend>
      {selectField("citizenship", "Country of citizenship", countries, "Your citizenship may be different from the country you live in.")}
      <div className="grid gap-4 sm:grid-cols-2">
        {selectField("originCountry", "Country you live in now", countries)}
        {textField("originCity", "City you’re moving from", { placeholder: "e.g. Helsinki", autoComplete: "address-level2" })}
        {selectField("destinationCountry", "Destination country", countries)}
        {textField("destinationCity", "City you’re moving to", { placeholder: "e.g. Amsterdam" })}
      </div>
    </fieldset>
    <fieldset className="space-y-4 border-t pt-6">
      <legend className="float-left mb-4 w-full text-base font-semibold">Your studies</legend>
      <div className="clear-both grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        {textField("university", "Host university", { placeholder: "University name" })}
        {selectField("studyType", "Study type", [{ value: "exchange", label: "Exchange" }, { value: "degree", label: "Full degree" }])}
      </div>
    </fieldset>
    <fieldset className="space-y-4 border-t pt-6">
      <legend className="float-left mb-4 w-full text-base font-semibold">Your timing</legend>
      <div className="clear-both grid gap-4 sm:grid-cols-2">
        {textField("arrivalDate", "Arrival date", { type: "date" })}
        {selectField("stayType", "Length of stay", [{ value: "fixed", label: "Fixed length" }, { value: "open-ended", label: "Open-ended" }])}
        {fields.stayType === "fixed" && textField("durationMonths", "Duration in months", { type: "number", min: 1, max: 120, step: 1, inputMode: "numeric", placeholder: "e.g. 6" })}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">These details help place suggested tasks around your arrival.</p>
    </fieldset>
  </div>;
}
