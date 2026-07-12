import type {Metadata} from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Context Attach',
  description: '이전 대화의 맥락을 찾아 현재 채팅에 연결하는 작업공간',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
