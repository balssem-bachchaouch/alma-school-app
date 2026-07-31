"use client";

const STARS = [
  { top: "8%",  left: "15%", size: 2, dur: 2.1, delay: 0 },
  { top: "14%", left: "72%", size: 3, dur: 1.8, delay: 0.5 },
  { top: "22%", left: "40%", size: 2, dur: 2.7, delay: 1.2 },
  { top: "6%",  left: "55%", size: 2, dur: 3.0, delay: 0.3 },
  { top: "35%", left: "88%", size: 3, dur: 1.5, delay: 0.8 },
  { top: "45%", left: "10%", size: 2, dur: 2.3, delay: 1.5 },
  { top: "52%", left: "65%", size: 2, dur: 1.9, delay: 0.2 },
  { top: "60%", left: "28%", size: 3, dur: 2.5, delay: 0.9 },
  { top: "70%", left: "80%", size: 2, dur: 1.7, delay: 1.1 },
  { top: "75%", left: "45%", size: 2, dur: 2.8, delay: 0.6 },
  { top: "82%", left: "18%", size: 3, dur: 2.0, delay: 1.4 },
  { top: "88%", left: "60%", size: 2, dur: 1.6, delay: 0.4 },
  { top: "30%", left: "5%",  size: 2, dur: 2.4, delay: 0.7 },
  { top: "92%", left: "35%", size: 3, dur: 2.2, delay: 1.0 },
];

export default function StarField() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: "white",
            animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
