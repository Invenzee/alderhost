export type ContactInput = {
  fn: string;
  ln: string;
  ad: string;
  ad2: string;
  cy: string;
  st: string;
  zp: string;
  ct: string;
  em: string;
  ph: string;
  cp: string;
};

export const emptyContact: ContactInput = {
  fn: "",
  ln: "",
  ad: "",
  ad2: "",
  cy: "",
  st: "",
  zp: "",
  ct: "",
  em: "",
  ph: "",
  cp: "",
};

export function ContactFields({
  value,
  onChange,
}: {
  value: ContactInput;
  onChange: (value: ContactInput) => void;
}) {
  function set(key: keyof ContactInput, next: string) {
    onChange({ ...value, [key]: next });
  }

  const fields: { key: keyof ContactInput; label: string; placeholder?: string }[] = [
    { key: "fn", label: "First name" },
    { key: "ln", label: "Last name" },
    { key: "em", label: "Registrant email" },
    { key: "ph", label: "Phone", placeholder: "Digits only, no country code" },
    { key: "ad", label: "Address" },
    { key: "ad2", label: "Address line 2" },
    { key: "cy", label: "City" },
    { key: "st", label: "State", placeholder: "2-letter code for US or CA" },
    { key: "zp", label: "Postal code" },
    { key: "ct", label: "Country", placeholder: "PK or Pakistan" },
    { key: "cp", label: "Company" },
  ];

  return (
    <div className="g2">
      {fields.map((field) => (
        <label key={field.key}>
          {field.label}
          <input
            value={value[field.key]}
            placeholder={field.placeholder}
            onChange={(event) => set(field.key, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
