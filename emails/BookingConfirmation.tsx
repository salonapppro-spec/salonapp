import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type BookingConfirmationProps = {
  salonName: string;
  clientName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  priceEur: string;
  googleCalendarUrl: string;
  contactLines: string[];
  unsubscribeUrl: string;
  /** Показва се при сложна услуга */
  hairDetails?: string | null;
};

export default function BookingConfirmationEmail({
  salonName,
  clientName,
  serviceName,
  bookingDate,
  bookingTime,
  priceEur,
  googleCalendarUrl,
  contactLines,
  unsubscribeUrl,
  hairDetails,
}: BookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Резервацията ви в {salonName} е потвърдена</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Резервацията ви е потвърдена!</Heading>
          <Text style={text}>Здравейте, {clientName},</Text>
          <Text style={text}>
            Вашата резервация в <strong>{salonName}</strong> е приета. Детайли:
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
            <Text style={row}>
              <strong>Цена:</strong> {priceEur} €
            </Text>
            {hairDetails ? (
              <Text style={row}>
                <strong>Детайли:</strong> {hairDetails}
              </Text>
            ) : null}
          </Section>
          <Section style={{ textAlign: "center" as const, marginTop: 24 }}>
            <Button href={googleCalendarUrl} style={btn}>
              Добави в Google Calendar
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footerTitle}>Контакти</Text>
          {contactLines.map((line) => (
            <Text key={line} style={footerText}>
              {line}
            </Text>
          ))}
          <Hr style={hr} />
          <Text style={muted}>
            <Link href={unsubscribeUrl}>Отписване от имейли за тази резервация</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f6f6", fontFamily: "Inter, Helvetica, Arial, sans-serif" };
const container = { margin: "0 auto", padding: "32px 24px", maxWidth: "560px" };
const h1 = { color: "#1a1a1a", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" };
const text = { color: "#333", fontSize: "15px", lineHeight: "24px", margin: "0 0 12px" };
const box = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "16px 20px",
  border: "1px solid #e8e8e8",
};
const row = { color: "#333", fontSize: "15px", lineHeight: "22px", margin: "6px 0" };
const btn = {
  backgroundColor: "#c45c4a",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
const hr = { borderColor: "#e8e8e8", margin: "24px 0" };
const footerTitle = { color: "#555", fontSize: "13px", fontWeight: "600", margin: "0 0 8px" };
const footerText = { color: "#666", fontSize: "13px", lineHeight: "20px", margin: "4px 0" };
const muted = { color: "#888", fontSize: "12px", lineHeight: "18px", margin: "16px 0 0" };
