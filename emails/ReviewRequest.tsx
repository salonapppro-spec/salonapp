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

export type ReviewRequestProps = {
  salonName: string;
  clientName: string;
  serviceName: string;
  reviewUrl: string;
  contactLines: string[];
  unsubscribeUrl: string;
  /** Уникален ref — Gmail не сгъва повторяем HTML в нишка */
  messageRef: string;
};

export default function ReviewRequestEmail({
  salonName,
  clientName,
  serviceName,
  reviewUrl,
  contactLines,
  unsubscribeUrl,
  messageRef,
}: ReviewRequestProps) {
  return (
    <Html>
      <Head />
      <Preview>Как беше при нас? Вашият отзив значи много — {salonName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={preheader}>{messageRef}</Text>
          <Heading style={h1}>Благодарим ви, че бяхте при нас! 💛</Heading>
          <Text style={text}>Здравейте, {clientName},</Text>
          <Text style={text}>
            Надяваме се, че останахте доволни от <strong>{serviceName}</strong> в{" "}
            <strong>{salonName}</strong>.
          </Text>
          <Text style={text}>
            Ако имате една минута, ще се радваме да споделите впечатленията си — вашият отзив
            помага и на нас, и на хората, които тепърва ни откриват.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: 24, marginBottom: 24 }}>
            <Button href={reviewUrl} style={btn}>
              ⭐ Оставете отзив в Google
            </Button>
          </Section>
          <Text style={{ ...text, color: "#666" }}>
            Очакваме ви отново — до скоро!
          </Text>
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
