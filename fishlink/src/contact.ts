const configuredWhatsApp = (
  process.env.REACT_APP_CUSTOMER_SERVICE_WHATSAPP || ""
).trim();
const configuredPhone = (
  process.env.REACT_APP_CUSTOMER_SERVICE_PHONE || ""
).trim();
const configuredEmail = (
  process.env.REACT_APP_CUSTOMER_SERVICE_EMAIL || ""
).trim();
const configuredHours = (
  process.env.REACT_APP_CUSTOMER_SERVICE_HOURS || ""
).trim();

export const CUSTOMER_SERVICE = {
  whatsapp: configuredWhatsApp || "2348000000000",
  phone: configuredPhone || "+234 800 000 0000",
  email: configuredEmail || "support@fishlink.ng",
  hours: configuredHours || "Mon-Sat, 8:00-18:00 WAT",
  isDemo: !configuredWhatsApp || !configuredPhone,
};

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export const normaliseWhatsAppNumber = (value: string): string => {
  const digits = digitsOnly(value);

  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }

  return digits;
};

export const isWhatsAppNumber = (value: string): boolean =>
  normaliseWhatsAppNumber(value).length >= 10;

export const whatsappUrl = (phone: string, message: string): string =>
  `https://wa.me/${normaliseWhatsAppNumber(phone)}?text=${encodeURIComponent(
    message
  )}`;
