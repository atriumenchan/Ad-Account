export const HARDCODED_LOGINS = [
  {
    label: "Admin",
    email: "admin@admexo.co",
    password: "Admexo2026",
    name: "Admexo Admin",
    phone: "+14155550100",
  },
  {
    label: "Member",
    email: "member@admexo.co",
    password: "Member2026",
    name: "Admexo Member",
    phone: "+14155550101",
  },
] as const;

export function hardcodedLogin(email: string) {
  return HARDCODED_LOGINS.find((account) => account.email === email.trim().toLowerCase());
}
