"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TRANSCRIPT, DURATION, KB, conceptCands, conceptMeta, fmt } from "./data";

export default function Page() {
  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [mode, setMode] = useState("bookmark"); // 'bookmark' | 'chat'
  const [marks, setMarks] = useState([]);
  const [missed, setMissed] = useState(0);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [editVals, setEditVals] = useState({});
  const [review, setReview] = useState(false);
  const [flash, setFlash] = useState(false);
  const [stateLabel, setStateLabel] = useState("Listening");

  const clockRef = useRef(0);
  const chatTypingRef = useRef(false);
  const lastTrackRef = useRef(0);
  const seqRef = useRef(1);
  const streamRef = useRef(null);
  const curLineRef = useRef(null);

  // 현재 자막 인덱스
  let curIdx = 0;
  for (let k = 0; k < TRANSCRIPT.length; k++) {
    if (TRANSCRIPT[k][0] <= clock) curIdx = k;
    else break;
  }

  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);

  // 재생 틱
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const c = clockRef.current;
      let nc = c + 0.1 * speed;
      if (nc >= DURATION) nc = DURATION;
      if (mode === "chat" && chatTypingRef.current) {
        const before = TRANSCRIPT.filter((l) => l[0] <= lastTrackRef.current).length;
        const now = TRANSCRIPT.filter((l) => l[0] <= nc).length;
        if (now > before) setMissed((m) => m + (now - before));
        lastTrackRef.current = nc;
      }
      clockRef.current = nc;
      setClock(nc);
      if (nc >= DURATION) {
        setPlaying(false);
        setStateLabel("Review");
      }
    }, 100);
    return () => clearInterval(id);
  }, [playing, speed, mode]);

  // 현재 자막을 화면 안으로 스크롤
  useEffect(() => {
    if (curLineRef.current) curLineRef.current.scrollIntoView({ block: "nearest" });
  }, [curIdx]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const np = !p;
      if (np) lastTrackRef.current = clockRef.current;
      return np;
    });
  }, []);

  // 막힘 표시 — 북마크 핵심 인터랙션
  const mark = useCallback(() => {
    if (mode !== "bookmark") return;
    const t = clockRef.current;
    const from = Math.max(0, t - 28);
    const ctx = TRANSCRIPT.filter((l) => l[0] >= from && l[0] <= t).map((l) => l[1]);
    let idx = 0;
    for (let k = 0; k < TRANSCRIPT.length; k++) {
      if (TRANSCRIPT[k][0] <= t) idx = k;
      else break;
    }
    const concept = TRANSCRIPT[idx][2];
    const meta = conceptMeta(concept);
    const m = {
      id: seqRef.current++,
      t,
      rangeStart: from,
      rangeEnd: t,
      ctx,
      concept,
      conceptLabel: meta.label,
      summary: meta.summary,
      stage: "cand",
      question: null,
      answer: null,
    };
    setMarks((ms) => [...ms, m].sort((a, b) => a.t - b.t));
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    setStateLabel("Marked");
  }, [mode]);

  const chooseQuestion = (id, q, a) => {
    setMarks((ms) => ms.map((m) => (m.id === id ? { ...m, question: q, answer: a, stage: "answered" } : m)));
    setStateLabel("Answered");
  };

  const customQuestion = (id) => {
    const text = (editVals[id] || "").trim();
    if (!text) return;
    setMarks((ms) =>
      ms.map((m) => {
        if (m.id !== id) return m;
        const base = (KB[m.concept] || KB._generic).cands[0][1];
        const a = "말씀하신 ‘" + (m.ctx[m.ctx.length - 1] || "") + "’ 맥락을 기준으로 보면, " + base;
        return { ...m, question: text, answer: a, stage: "answered" };
      })
    );
    setEditVals((v) => ({ ...v, [id]: "" }));
    setStateLabel("Answered");
  };

  const reask = (id) => {
    setMarks((ms) => ms.map((m) => (m.id === id ? { ...m, stage: "cand", question: null, answer: null } : m)));
    setStateLabel("Question Candidate");
  };

  const sendChat = () => {
    const v = chatInput.trim();
    if (!v) return;
    setChat((c) => [
      ...c,
      { u: true, text: v },
      {
        u: false,
        text:
          "어느 부분을 말씀하시는지 조금 더 설명해주실 수 있을까요? 방금 강의에서 다룬 내용이 여러 개라, 정확한 맥락을 알려주시면 답변드리겠습니다.",
      },
    ]);
    setChatInput("");
    chatTypingRef.current = false;
  };

  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nc = Math.min(DURATION, Math.max(0, ((e.clientX - r.left) / r.width) * DURATION));
    clockRef.current = nc;
    setClock(nc);
  };

  const switchMode = (m) => {
    setMode(m);
    if (m === "bookmark") setStateLabel("Listening");
  };

  const openReview = () => {
    setReview(true);
    setStateLabel("Review");
  };

  // 키보드 단축키
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && e.target.tagName === "INPUT") return;
      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        mark();
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mark, togglePlay]);

  const answered = marks.filter((m) => m.stage === "answered").length;
  const pending = marks.length - answered;
  const capturedSeconds = marks.reduce((sum, m) => sum + Math.max(0, Math.round(m.rangeEnd - m.rangeStart)), 0);
  const continuityLabel = mode === "chat" ? (missed > 0 ? "흐름 손실" : "입력 대기") : marks.length > 0 ? "맥락 보존" : "청취 중";
  const started = clock <= 0 && !playing;

  return (
    <>
      <div className={"flash" + (flash ? " on" : "")} />

      <div className="wrap">
        <header className="top">
          <div className="brand">
            <h1>질문 북마크 타임라인</h1>
            <p className="sub">v0.2 · 질문 문장보다 먼저 시간 맥락을 저장하는 입력 구조</p>
          </div>
          <div className="spacer" />
          <div className="statebadge">
            <span className="dot" />
            <span>{stateLabel}</span>
          </div>
          <div className="mode">
            <button className={mode === "bookmark" ? "active" : ""} onClick={() => switchMode("bookmark")}>
              질문 북마크 방식
            </button>
            <button className={mode === "chat" ? "active" : ""} onClick={() => switchMode("chat")}>
              기존 채팅 방식
            </button>
          </div>
          <button className="btn" onClick={openReview}>
            ⟲ 복습 모드
          </button>
        </header>

        <section className="evidence" aria-label="프로토타입 검증 지표">
          <div>
            <span className="metric-label">목표</span>
            <strong>흐름 유지 + 막힘 회수</strong>
          </div>
          <div>
            <span className="metric-label">현재 판정</span>
            <strong>{continuityLabel}</strong>
          </div>
          <div>
            <span className="metric-label">놓친 자막</span>
            <strong>{missed}줄</strong>
          </div>
          <div>
            <span className="metric-label">보존 맥락</span>
            <strong>{capturedSeconds}초</strong>
          </div>
          <div>
            <span className="metric-label">해결률</span>
            <strong>
              {answered}/{marks.length || 0}
            </strong>
          </div>
        </section>

        <div className="grid">
          {/* ===== Player ===== */}
          <section className="card player">
            <div className="lec-head">
              <div className="lec-title">
                실시간 온라인 강의 · A/B 테스트 기초: 통계적 유의성 이해하기
                {playing && (
                  <span className="live beating">
                    <span className="pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <div className="lec-time">
                {fmt(clock)} / {fmt(DURATION)}
              </div>
            </div>

            <div className={"caption" + (started ? " dim" : "")}>
              {started ? "재생 버튼(▶)을 눌러 강의를 시작하세요." : TRANSCRIPT[curIdx][1]}
            </div>

            <div className="stream" ref={streamRef}>
              {TRANSCRIPT.map((ln, k) => (
                <div
                  key={k}
                  ref={k === curIdx ? curLineRef : null}
                  className={"ln" + (k === curIdx ? " cur" : k < curIdx ? " past" : "")}
                >
                  <span className="t">{fmt(ln[0])}</span>
                  {ln[1]}
                </div>
              ))}
            </div>

            <div className="controls">
              <button className="play" onClick={togglePlay}>
                {playing ? "⏸" : "▶"}
              </button>
              <div className="progress" onClick={seek}>
                <div className="fill" style={{ width: (clock / DURATION) * 100 + "%" }} />
                {marks.map((m) => (
                  <div
                    key={m.id}
                    className="pin"
                    style={{ left: (m.t / DURATION) * 100 + "%" }}
                    title={"막힌 지점 " + fmt(m.t)}
                  />
                ))}
              </div>
              <div className="speed">
                속도
                <select value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}>
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="4">4x</option>
                  <option value="8">8x</option>
                </select>
              </div>
            </div>

            {mode === "bookmark" && (
              <>
                <div className="markbar">
                  <button className="markbtn" onClick={mark}>
                    막힘 핀 찍기
                    <small>질문을 쓰지 않고 직전 맥락만 저장</small>
                  </button>
                </div>
                <div className="markbar" style={{ marginTop: 8, justifyContent: "space-between" }}>
                  <span className="kbd">
                    단축키: <b>Q</b> 막힘 표시 · <b>K</b> 재생/정지
                  </span>
                </div>
              </>
            )}

            {mode === "chat" && (
              <div className="note">
                <b>기존 채팅 방식 체험:</b> 질문을 입력하는 동안에도 강의는 계속 흐릅니다. 입력창에 글을 쓰는 중 지나가는
                자막은 “놓친 구간”으로 집계됩니다. 이 방식의 마찰을 직접 느껴보세요.
              </div>
            )}
          </section>

          {/* ===== Right rail ===== */}
          <section className="card rail">
            {mode === "bookmark" ? (
              <>
                <div className="rail-head">
                  <h2>🔖 질문 타임라인</h2>
                  <span className="count">{marks.length}개 표시됨</span>
                </div>
                {marks.length === 0 ? (
                  <div className="empty">
                    <div className="big">🎧</div>
                    <p>
                      강의를 들으며 이해가 막히는 순간 <b>막힘 핀</b>(또는 <b>Q</b>)을 누르세요.
                      <br />
                      흐름을 멈추지 않고 그 순간의 맥락이 카드로 저장됩니다.
                    </p>
                  </div>
                ) : (
                  <div className="cards">
                    {marks.map((m) => (
                      <div className="qcard" key={m.id}>
                        <div className="qhead">
                          <span className="ts">{fmt(m.t)} 막힌 지점</span>
                          <span className="stage">{m.stage === "answered" ? "Answered" : "질문 후보"}</span>
                        </div>
                        <div className="context-summary">
                          <span>{m.conceptLabel}</span>
                          <strong>{m.summary}</strong>
                        </div>
                        <div className="ctx">
                          <span className="lbl">
                            자동 저장된 구간 {fmt(m.rangeStart)}-{fmt(m.rangeEnd)}
                          </span>
                          {m.ctx.map((c, i) => (
                            <div key={i}>· {c}</div>
                          ))}
                        </div>
                        {m.stage === "cand" ? (
                          <>
                            <div className="cands">
                              {conceptCands(m.concept).map((c, i) => (
                                <button className="chip" key={i} onClick={() => chooseQuestion(m.id, c[0], c[1])}>
                                  <span className="q">Q{i + 1}</span>
                                  {c[0]}
                                </button>
                              ))}
                            </div>
                            <div className="editrow">
                              <input
                                type="text"
                                placeholder="직접 질문을 다듬어 입력…"
                                value={editVals[m.id] || ""}
                                onChange={(e) => setEditVals((v) => ({ ...v, [m.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") customQuestion(m.id);
                                }}
                              />
                              <button onClick={() => customQuestion(m.id)}>보내기</button>
                            </div>
                          </>
                        ) : (
                          <div className="answer">
                            <div className="qline">{m.question}</div>
                            <div className="aline">{m.answer}</div>
                            <div className="reask">
                              <button onClick={() => reask(m.id)}>↺ 다른 질문으로 다시 묻기</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="rail-head">
                  <h2>기존 채팅 방식</h2>
                  <span className="count">선형 로그</span>
                </div>
                {missed > 0 && (
                  <div className="miss">
                    질문을 작성하는 동안 지나간 자막: <b>{missed}줄</b>
                    <br />
                    질문 하나 만드느라 강의 흐름을 그만큼 놓쳤습니다.
                  </div>
                )}
                <div className="chatlog">
                  {chat.map((m, i) => (
                    <div className={"bub " + (m.u ? "u" : "a")} key={i}>
                      {m.text}
                    </div>
                  ))}
                </div>
                <div className="chatin">
                  <input
                    type="text"
                    placeholder="질문을 입력하세요 (예: 방금 그 p값 부분이…)"
                    value={chatInput}
                    onFocus={() => {
                      chatTypingRef.current = true;
                      lastTrackRef.current = clockRef.current;
                    }}
                    onBlur={() => {
                      chatTypingRef.current = false;
                    }}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      chatTypingRef.current = e.target.value.length > 0;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendChat();
                    }}
                  />
                  <button onClick={sendChat}>전송</button>
                </div>
              </>
            )}
          </section>
        </div>

      </div>

      {/* Review overlay */}
      <div
        className={"overlay" + (review ? " on" : "")}
        onClick={(e) => {
          if (e.target === e.currentTarget) setReview(false);
        }}
      >
        <div className="review">
          <div className="rh">
            <h2>⟲ 복습 — 내가 막힌 지점들</h2>
            <button className="close" onClick={() => setReview(false)}>
              ✕
            </button>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="n">{marks.length}</span>
              <span className="l">막힌 지점</span>
            </div>
            <div className="stat">
              <span className="n">{answered}</span>
              <span className="l">해결한 질문</span>
            </div>
            <div className="stat">
              <span className="n">{pending}</span>
              <span className="l">미해결</span>
            </div>
          </div>
          <div className="rbody">
            {marks.length === 0 ? (
              <div className="empty">
                <p>아직 표시한 막힌 지점이 없습니다. 강의를 들으며 막히는 순간을 표시해보세요.</p>
              </div>
            ) : (
              marks.map((m) => (
                <div className="ritem" key={m.id}>
                  <div className="rts">{fmt(m.t)} · {m.conceptLabel}</div>
                  <div className="rsummary">{m.summary}</div>
                  {m.stage === "answered" ? (
                    <>
                      <div className="rq">Q. {m.question}</div>
                      <div className="ra">A. {m.answer}</div>
                    </>
                  ) : (
                    <>
                      <div className="rq">{m.ctx[m.ctx.length - 1] || ""}</div>
                      <div className="pending">· 아직 질문을 고르지 않았어요 (미해결)</div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
