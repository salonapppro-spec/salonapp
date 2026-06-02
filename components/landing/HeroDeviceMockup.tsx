export default function HeroDeviceMockup() {
  return (
    <div className="relative flex items-end justify-center select-none" style={{ minHeight: 420 }}>

      {/* ── iMAC ── */}
      <div className="relative z-10" style={{ width: 480 }}>
        {/* Bezel */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "#1c1c1e",
            borderRadius: "12px 12px 0 0",
            border: "2px solid #3a3a3c",
            boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
          }}
        >
          {/* Top bar with camera dot */}
          <div className="flex items-center justify-center py-1.5" style={{ background: "#1c1c1e" }}>
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#3a3a3c" }} />
          </div>

          {/* Screen */}
          <div
            className="relative overflow-hidden"
            style={{
              height: 300,
              background: "linear-gradient(135deg, #0d0805 0%, #1a0e08 40%, #2c1a0e 70%, #1a0c06 100%)",
            }}
          >
            {/* Warm overlay to simulate skin tones */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 100% at 70% 40%, rgba(180,90,40,0.25) 0%, transparent 70%)",
              }}
            />

            {/* Magnetic Eyes nav */}
            <div
              className="relative flex items-center justify-between px-4 py-2"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            >
              {/* Logo */}
              <div className="flex items-center gap-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <ellipse cx="12" cy="10" rx="7" ry="5" stroke="#C8815A" strokeWidth="1.5" />
                  <circle cx="12" cy="10" r="2.5" fill="#C8815A" />
                  <path d="M8 6 Q12 2 16 6" stroke="#C8815A" strokeWidth="1" fill="none" />
                </svg>
                <span style={{ fontFamily: "Georgia, serif", color: "#C8815A", fontSize: 11, fontStyle: "italic" }}>
                  Magnetic Eyes
                </span>
              </div>
              {/* Nav links */}
              <div className="flex items-center gap-3">
                {["НАЧАЛО", "УСЛУГИ", "ОТЗИВИ", "ЧЗВ"].map((l) => (
                  <span key={l} style={{ color: "rgba(255,255,255,0.7)", fontSize: 7, fontWeight: 700, letterSpacing: "0.08em" }}>
                    {l}
                  </span>
                ))}
                <span
                  style={{
                    background: "#C8815A",
                    color: "#fff",
                    fontSize: 7,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 2,
                    letterSpacing: "0.06em",
                  }}
                >
                  ЗАПАЗИ ЧАС
                </span>
              </div>
            </div>

            {/* Hero content */}
            <div className="relative px-5 pt-5">
              <p style={{ color: "#C8815A", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 6 }}>
                КРАСОТА, КОЯТО ГОВОРИ ЗА ТЕБ
              </p>
              <h3
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: 900,
                  lineHeight: 1.15,
                  fontFamily: "Georgia, serif",
                  marginBottom: 8,
                }}
              >
                Поглед,<br />
                който остава.
              </h3>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, lineHeight: 1.5, maxWidth: 200, marginBottom: 14 }}>
                Микроблейдинг, мигли и перманентен грим с прецизност, стил и отношение.
              </p>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    border: "1.5px solid #C8815A",
                    color: "#C8815A",
                    fontSize: 8,
                    fontWeight: 800,
                    padding: "5px 12px",
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                  }}
                >
                  ЗАПАЗИ ЧАС →
                </span>
                <span
                  style={{
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 8,
                    fontWeight: 800,
                    padding: "5px 12px",
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                  }}
                >
                  ВИЖ РЕЗУЛТАТИ →
                </span>
              </div>
            </div>

            {/* Bottom trust badges */}
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-4 py-2"
              style={{ background: "rgba(0,0,0,0.6)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              {[
                { icon: "◎", text: "СЕРТИФИЦИРАН АРТИСТ" },
                { icon: "◈", text: "ПРЕМИУМ ПРОДУКТИ" },
                { icon: "★", text: "5+ ГОДИНИ ОПИТ" },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-1">
                  <span style={{ color: "#C8815A", fontSize: 9 }}>{b.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 7, fontWeight: 700, letterSpacing: "0.05em" }}>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monitor neck */}
        <div
          className="mx-auto"
          style={{
            width: 40,
            height: 20,
            background: "linear-gradient(to bottom, #2a2a2c, #1c1c1e)",
          }}
        />
        {/* Monitor base */}
        <div
          className="mx-auto"
          style={{
            width: 120,
            height: 6,
            borderRadius: 4,
            background: "linear-gradient(to bottom, #3a3a3c, #2a2a2c)",
          }}
        />
      </div>

      {/* ── iPHONE ── */}
      <div
        className="absolute z-20"
        style={{
          width: 155,
          right: -10,
          bottom: 6,
          background: "linear-gradient(145deg, #2a2a2c, #1c1c1e)",
          borderRadius: 28,
          border: "2px solid #3a3a3c",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Dynamic island */}
        <div className="flex justify-center pt-2 pb-1">
          <div
            style={{
              width: 50,
              height: 12,
              background: "#000",
              borderRadius: 10,
            }}
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 pb-1">
          <span style={{ color: "#fff", fontSize: 8, fontWeight: 700 }}>16:04 ч.</span>
          <div className="flex items-center gap-1">
            <span style={{ color: "#fff", fontSize: 7 }}>▋▋▋</span>
            <span style={{ color: "#fff", fontSize: 7 }}>WiFi</span>
          </div>
        </div>

        {/* App screen */}
        <div style={{ background: "#f5f0eb", minHeight: 320 }}>
          {/* App header */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ background: "#fff", borderBottom: "1px solid #e5e0da" }}
          >
            <div className="flex items-center gap-1.5">
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: "linear-gradient(135deg, #C8A063, #A67C3D)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#fff", fontSize: 8, fontWeight: 900 }}>S</span>
              </div>
              <span style={{ color: "#1a1a1a", fontSize: 9, fontWeight: 800 }}>SalonApp</span>
            </div>
            <div className="flex gap-2">
              <span style={{ color: "#6e6a63", fontSize: 7 }}>Настройки</span>
              <span style={{ color: "#6e6a63", fontSize: 7 }}>Изход</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-3 pt-2 pb-1">
            {["Утре", "7 дни", "Календар"].map((t, i) => (
              <div
                key={t}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: i === 0 ? "#C8A063" : "transparent",
                  color: i === 0 ? "#fff" : "#6e6a63",
                  fontSize: 8,
                  fontWeight: 700,
                  border: i === 0 ? "none" : "1px solid #e5e0da",
                }}
              >
                {t}
              </div>
            ))}
          </div>

          {/* Schedule */}
          <div className="px-3 pt-1" style={{ position: "relative" }}>
            {/* Time slots */}
            {["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"].map((time) => (
              <div
                key={time}
                className="flex items-start gap-2"
                style={{ minHeight: 18 }}
              >
                <span style={{ color: "#9e9a93", fontSize: 7, width: 26, flexShrink: 0, paddingTop: 2 }}>{time}</span>
                <div style={{ flex: 1, borderTop: "1px solid rgba(0,0,0,0.06)" }} />
              </div>
            ))}

            {/* Appointment 1 */}
            <div
              className="absolute"
              style={{
                top: 36,
                left: 42,
                right: 8,
                background: "linear-gradient(135deg, #f0e8d8, #e8d8c0)",
                borderLeft: "3px solid #C8A063",
                borderRadius: "0 4px 4px 0",
                padding: "3px 6px",
                height: 36,
              }}
            >
              <div style={{ color: "#C8A063", fontSize: 6, fontWeight: 800, letterSpacing: "0.05em" }}>11:30 ИЗЧАКВА</div>
              <div style={{ color: "#1a1a1a", fontSize: 8, fontWeight: 700 }}>Катя Иванова</div>
              <div style={{ color: "#6e6a63", fontSize: 7 }}>Микроблейдинг вежди</div>
            </div>

            {/* Appointment 2 */}
            <div
              className="absolute"
              style={{
                top: 126,
                left: 42,
                right: 8,
                background: "linear-gradient(135deg, #f0e8d8, #e8d8c0)",
                borderLeft: "3px solid #C8A063",
                borderRadius: "0 4px 4px 0",
                padding: "3px 6px",
                height: 36,
              }}
            >
              <div style={{ color: "#C8A063", fontSize: 6, fontWeight: 800, letterSpacing: "0.05em" }}>14:30 ИЗЧАКВА</div>
              <div style={{ color: "#1a1a1a", fontSize: 8, fontWeight: 700 }}>Петя Стоянова</div>
              <div style={{ color: "#6e6a63", fontSize: 7 }}>Перманентен грим на устни</div>
            </div>
          </div>
        </div>

        {/* FAB */}
        <div
          className="absolute"
          style={{
            bottom: 50,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C8A063, #A67C3D)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(200,160,99,0.5)",
          }}
        >
          <span style={{ color: "#fff", fontSize: 18, lineHeight: 1, fontWeight: 300 }}>+</span>
        </div>

        {/* Bottom nav */}
        <div
          style={{
            background: "#fff",
            borderTop: "1px solid #e5e0da",
            display: "flex",
            justifyContent: "space-around",
            padding: "6px 0 8px",
          }}
        >
          {[
            { icon: "☀", label: "Ден" },
            { icon: "▦", label: "Календар" },
            { icon: "✦", label: "Услуги" },
            { icon: "👤", label: "Клиенти" },
            { icon: "◈", label: "Финанси" },
          ].map((n) => (
            <div key={n.label} className="flex flex-col items-center gap-0.5">
              <span style={{ fontSize: 11, color: n.label === "Календар" ? "#C8A063" : "#9e9a93" }}>{n.icon}</span>
              <span style={{ fontSize: 6, color: n.label === "Календар" ? "#C8A063" : "#9e9a93", fontWeight: 600 }}>
                {n.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
