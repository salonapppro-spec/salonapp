import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type BookingReminderProps = {
  salonName: string;
  clientName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  confirmUrl: string;
  cancelUrl: string;
  contactLines: string[];
};

export default function BookingReminderEmail({
  salonName,
  clientName,
  serviceName,
  bookingDate,
  bookingTime,
  confirmUrl,
  cancelUrl,
  contactLines,
}: BookingReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Утре имате час в {salonName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Напомняне: Утре имате час в {salonName}</Heading>
          <Text style={text}>Здравейте, {clientName},</Text>
          <Text style={text}>
            Това е напомняне за вашия час при <strong>{salonName}</strong>.
          </Text>
          <Section style={box}>
            <Text style={row}>
              <strong>Услуга:</strong> {serviceName}
            </Text>
            <Text style={row}>
              <strong>Дата:</strong> {bookingDate}
            </Text>
            <Text style={row}>
              <strong>Час:</strong> {bookingTime}
            </Text>
          </Section>
          <Section style={{ textAlign: "center" as const, marginTop: 24, marginBottom: 12 }}>
            <Button href={confirmUrl} style={btnPrimary}>
              Потвърди присъствие
            </Button>
          </Section>
          <Section style={{ textAlign: "center" as const }}>
            <Button href={cancelUrl} style={btnGhost}>
              Откажи
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footerTitle}>Контакти</Text>
          {contactLines.map((line) => (
            <Text key={line} style={footerText}>
              {line}
            </Text>
          ))}
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f6f6", fontFamily: "Inter, Helvetica, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px 24px", maxWidth: "560px" };
const h1 = { color: "#1a1a1a", fontSize: "20px", fontWeight: "600", margin: "0 0 16px", lineHeight: "28px" };
const text = { color: "#333", fontSize: "15px", lineHeight: "24px", margin: "0 0 12px" };
const box = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "16px 20px",
  border: "1px solid #e8e8e8",
};
const row = { color: "#333", fontSize: "15px", lineHeight: "22px", margin: "6px 0" };
const btnPrimary = {
  backgroundColor: "#2d6a4f",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
const btnGhost = {
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  color: "#b42318",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 20px",
  border: "1px solid #e8e8e8",
};
const hr = { borderColor: "#e8e8e8", margin: "24px 0" };
const footerTitle = { color: "#555", fontSize: "13px", fontWeight: "600", margin: "0 0 8px" };
const footerText = { color: "#666", fontSize: "13px", lineHeight: "20px", margin: "4px 0" };
