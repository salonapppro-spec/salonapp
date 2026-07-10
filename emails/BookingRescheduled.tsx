import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type BookingRescheduledProps = {
  salonName: string;
  clientName: string;
  serviceName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  googleCalendarUrl: string;
  cancelUrl: string;
  contactLines: string[];
  unsubscribeUrl: string;
  /** Уникален ref — Gmail не сгъва повторяем HTML в нишка */
  messageRef: string;
};

export default function BookingRescheduledEmail({
  salonName,
  clientName,
  serviceName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  googleCalendarUrl,
  cancelUrl,
  contactLines,
  unsubscribeUrl,
  messageRef,
}: BookingRescheduledProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Часът ви е преместен: {newDate} · {newTime} — {salonName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={preheader}>{messageRef}</Text>
          <Heading style={h1}>
            Часът ви е преместен — {newDate} · {newTime}
          </Heading>
          <Text style={text}>Здравейте, {clientName},</Text>
          <Text style={text}>
            Вашата резервация в <strong>{salonName}</strong> беше преместена. Новите детайли:
          </Text>
          <Section style={box}>
            <Text style={row}>
              <strong>Услуга:</strong> {serviceName}
            </Text>
            <Text style={row}>
              <strong>Нова дата:</strong> {newDate}
            </Text>
            <Text style={row}>
              <strong>Нов час:</strong> {newTime}
            </Text>
            <Text style={oldRow}>
              Предишен час: {oldDate} · {oldTime}
            </Text>
          </Section>
          <Section style={{ textAlign: "center" as const, marginTop: 24, marginBottom: 12 }}>
            <Button href={googleCalendarUrl} style={btn}>
              Добави в Google Calendar
            </Button>
          </Section>
          <Text style={{ ...text, textAlign: "center" as const }}>
            Ако сте добавили стария час в календара си, не забравяйте да го изтриете.
          </Text>
          <Section style={{ textAlign: "center" as const, marginBottom: 24 }}>
            <Button href={cancelUrl} style={btnGhost}>
              Новият час не ми е удобен — откажи резервацията
            </Button>
          </Section>
          <Section style={contactsBox}>
            <Text style={footerTitle}>Контакти</Text>
            {contactLines.map((line) => (
              <Text key={line} style={footerText}>
                {line}
              </Text>
            ))}
          </Section>
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
const oldRow = {
  color: "#888",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "10px 0 0",
  textDecoration: "line-through",
};
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
const btnGhost = {
  backgroundColor: "transparent",
  borderRadius: "10px",
  color: "#888",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "underline",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "8px 16px",
};
const preheader = {
  display: "none",
  maxHeight: "0px",
  overflow: "hidden",
  fontSize: "1px",
  lineHeight: "1px",
  color: "#f6f6f6",
  margin: 0,
};
const contactsBox = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "16px 20px",
  border: "1px solid #e8e8e8",
  marginBottom: "16px",
};
const footerTitle = { color: "#555", fontSize: "13px", fontWeight: "600", margin: "0 0 8px" };
const footerText = { color: "#666", fontSize: "13px", lineHeight: "20px", margin: "4px 0" };
const muted = { color: "#888", fontSize: "12px", lineHeight: "18px", margin: "16px 0 0" };
