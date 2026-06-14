import "./globals.css";

export const metadata = {
  title: "질문 북마크 타임라인 v0.2 — HID 프로토타입",
  description:
    "질문 문장을 쓰기 전에 시간 맥락을 저장해 듣기 흐름과 질문 만들기의 충돌을 줄이는 LLM 채팅 인터랙션 프로토타입",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
