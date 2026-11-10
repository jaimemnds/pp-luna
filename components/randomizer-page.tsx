"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleHelp, RotateCcw, RotateCw, Spade, Sparkles, Users, X } from "lucide-react";

const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const confettiColors = ["#efba57", "#ec776b", "#8dd8ac", "#f4efe6", "#8ebee4"];

function polarPoint(radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: 160 + radius * Math.cos(radians), y: 160 + radius * Math.sin(radians) };
}

function randomInt(maxExclusive: number) {
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / maxExclusive) * maxExclusive;
  const values = new Uint32Array(1);
  let value: number;
  do {
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(values);
      value = values[0];
    } else {
      value = Math.floor(Math.random() * range);
    }
  } while (value >= limit);
  return value % maxExclusive;
}

export default function RandomizerPage() {
  const [draft, setDraft] = useState("Alex\nJamie\nMorgan\nRiley\nSam\nTaylor");
  const [ballRotation, setBallRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wheelRunning, setWheelRunning] = useState(false);
  const [ballLanded, setBallLanded] = useState(false);
  const [winner, setWinner] = useState("");
  const [drawnNumber, setDrawnNumber] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelStartedAt = useRef<number | null>(null);
  const candidates = useMemo(() => draft.split(/\n/).map((name) => name.trim()).filter(Boolean), [draft]);
  const slice = 360 / WHEEL_NUMBERS.length;
  const numbersPerCandidate = candidates.length ? Math.floor(36 / candidates.length) : 0;
  const availableMax = numbersPerCandidate * candidates.length;

  function spin() {
    if (spinning || candidates.length < 2 || !availableMax) return;
    // Commit the fair draw first; the animation is then aimed at this fixed pocket.
    const number = randomInt(availableMax) + 1;
    setDrawnNumber(number);
    const winnerIndex = Math.floor((number - 1) / numbersPerCandidate);
    const wheelIndex = WHEEL_NUMBERS.indexOf(number);
    // The wheel index determines the ball's final local angle, so extra laps
    // change only the animation and cannot change the preselected outcome.
    const targetAngle = (wheelIndex + 0.5) * slice;
    const currentBallAngle = ((ballRotation % 360) + 360) % 360;
    const target = ((targetAngle - currentBallAngle) % 360 + 360) % 360;
    if (wheelStartedAt.current === null) {
      wheelStartedAt.current = performance.now();
      setWheelRunning(true);
    }
    setWinner("");
    setCelebrate(false);
    setBallLanded(false);
    setSpinning(true);
    const ballLaps = 14 + randomInt(3);
    setBallRotation(ballRotation - 360 * ballLaps + target);
    timer.current = setTimeout(() => {
      setSpinning(false);
      setBallLanded(true);
      setWinner(candidates[winnerIndex]);
      setCelebrate(true);
      timer.current = setTimeout(() => setCelebrate(false), 3200);
    }, 14000);
  }

  function resetWheel() {
    if (timer.current) clearTimeout(timer.current);
    setSpinning(false);
    setWinner("");
    setDrawnNumber(null);
    setCelebrate(false);
    setBallLanded(false);
  }

  function addCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("candidate") ?? "").trim();
    if (!value || candidates.length >= 36) return;
    setDraft((current) => `${current.trim()}\n${value}`);
    event.currentTarget.reset();
  }

  const wedges = WHEEL_NUMBERS.map((number, index) => {
    const start = -90 + index * slice;
    const end = start + slice;
    const outerStart = polarPoint(137, start);
    const outerEnd = polarPoint(137, end);
    const ledgeInnerStart = polarPoint(112.5, start);
    const ledgeInnerEnd = polarPoint(112.5, end);
    const innerStart = polarPoint(88, start);
    const innerEnd = polarPoint(88, end);
    const label = polarPoint(124.5, start + slice / 2);
    const green = number === 0 || number > availableMax;
    const fill = green ? "#116239" : RED_NUMBERS.has(number) ? "#b5262e" : "#202321";
    return (
      <g key={number}>
        <path d={`M ${innerStart.x} ${innerStart.y} L ${outerStart.x} ${outerStart.y} A 137 137 0 0 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A 88 88 0 0 0 ${innerStart.x} ${innerStart.y} Z`} fill={fill} stroke="#18130f" strokeOpacity=".8" strokeWidth="1" />
        <path d={`M ${innerStart.x} ${innerStart.y} L ${ledgeInnerStart.x} ${ledgeInnerStart.y} A 112.5 112.5 0 0 1 ${ledgeInnerEnd.x} ${ledgeInnerEnd.y} L ${innerEnd.x} ${innerEnd.y} A 88 88 0 0 0 ${innerStart.x} ${innerStart.y} Z`} fill="#100d0a" fillOpacity=".2" />
        <path d={`M ${ledgeInnerStart.x} ${ledgeInnerStart.y} A 112.5 112.5 0 0 1 ${ledgeInnerEnd.x} ${ledgeInnerEnd.y}`} fill="none" stroke="#d6b35f" strokeOpacity=".8" strokeWidth="1.1" />
        <text x={label.x} y={label.y} transform={`rotate(${start + slice / 2 + 90}, ${label.x}, ${label.y})`} textAnchor="middle" dominantBaseline="middle" fill="#fff6db" fontFamily="Oswald, sans-serif" fontSize="11" fontWeight="500">{number}</text>
      </g>
    );
  });

  return (
    <main className="randomizer-page">
      <div className="noise" aria-hidden="true" />
      <nav className="randomizer-nav page-width">
        <Link className="brand-lockup" href="/" aria-label="Vegas home"><span className="brand-mark"><Spade size={19} fill="currentColor" /></span><span><strong>VEGAS</strong><small>PLANNING POKER</small></span></Link>
        <Link className="randomizer-back" href="/"><ArrowLeft size={15} /> Back to the house</Link>
      </nav>
      <section className="randomizer-content page-width">
        <header className="randomizer-heading">
          <div><div className="eyebrow"><span className="eyebrow-dot" /> THE HOUSE OF CHANCE / 01</div><h1>Let fate <em>deal.</em></h1><p>Every spin lands on a number. The table decides who it belongs to.</p></div>
          <div className="randomizer-count"><Users size={15} /><span>{candidates.length} {candidates.length === 1 ? "PLAYER" : "PLAYERS"}</span></div>
        </header>

        <div className="randomizer-layout">
          <section className="roulette-panel" aria-label="Roulette wheel">
            <div className="roulette-label"><span><i /> EUROPEAN ROULETTE</span><span>0—36 · SINGLE ZERO</span></div>
            <div className={`roulette-stage${spinning ? " is-spinning" : ""}${winner ? " has-winner" : ""}`}>
              <div className="roulette-wheel">
                <svg className="roulette-track" viewBox="0 0 320 320" aria-hidden="true">
                  <circle cx="160" cy="160" r="158" fill="url(#wood-track)" />
                  <circle cx="160" cy="160" r="138" fill="none" stroke="#24160e" strokeOpacity=".52" strokeWidth="4" filter="url(#wood-inner-shadow)" />
                  {Array.from({ length: 8 }, (_, index) => {
                    const angle = -90 + index * 45;
                    const grooveStart = polarPoint(137, angle);
                    const grooveEnd = polarPoint(157, angle);
                    return <line key={`track-${index}`} x1={grooveStart.x} y1={grooveStart.y} x2={grooveEnd.x} y2={grooveEnd.y} stroke="#3c2417" strokeOpacity=".72" strokeWidth="1.2" />;
                  })}
                  <circle cx="160" cy="160" r="137.5" fill="none" stroke="#d6b35f" strokeWidth="7.2" />
                  <defs>
                    <radialGradient id="wood-track" cx="45%" cy="36%" r="72%"><stop stopColor="#a76d3c" /><stop offset=".38" stopColor="#754322" /><stop offset=".72" stopColor="#4b2b19" /><stop offset=".91" stopColor="#8d5b31" /><stop offset="1" stopColor="#382116" /></radialGradient>
                    <filter id="wood-inner-shadow" x="0" y="0" width="320" height="320" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="1.5" /></filter>
                  </defs>
                </svg>
                <div className={`roulette-disc${wheelRunning ? " is-running" : ""}`}>
                  <svg viewBox="0 0 320 320" role="img" aria-label={`European roulette wheel with permanent numbered pockets from 0 through 36. Number 0 and unassigned pockets are green.`}>
                    {wedges}
                    {WHEEL_NUMBERS.map((_, index) => {
                      const angle = -90 + index * slice;
                      const inner = polarPoint(88, angle);
                      const outer = polarPoint(112.5, angle);
                      return <line key={`inner-divider-${index}`} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#d6b35f" strokeOpacity=".8" strokeWidth="1.1" />;
                    })}
                    <circle cx="160" cy="160" r="88" fill="url(#hub-wood)" />
                    <circle cx="160" cy="160" r="88" fill="none" stroke="#e9c678" strokeWidth="2" />
                    {Array.from({ length: 8 }, (_, index) => {
                      const angle = -90 + index * 45;
                      const grooveStart = polarPoint(34, angle);
                      const grooveEnd = polarPoint(86, angle);
                      return <line key={`hub-groove-${index}`} x1={grooveStart.x} y1={grooveStart.y} x2={grooveEnd.x} y2={grooveEnd.y} stroke="#2e1b12" strokeOpacity=".72" strokeWidth="1.2" />;
                    })}
                    <circle cx="160" cy="160" r="32" fill="#c29950" stroke="#f3d58a" strokeWidth="3" />
                    <circle cx="160" cy="160" r="18" fill="#e0bd70" stroke="#7f582b" strokeWidth="2" />
                    <defs>
                      <radialGradient id="hub-wood" cx="50%" cy="50%" r="50%"><stop offset=".34" stopColor="#a76d3c" /><stop offset=".58" stopColor="#8d5b31" /><stop offset="1" stopColor="#59331d" /></radialGradient>
                    </defs>
                  </svg>
                  <div className={`roulette-ball-orbit${spinning || winner ? " is-active" : ""}`} style={{ transform: `rotate(${ballRotation}deg)` }} aria-hidden="true"><span className={`roulette-ball${ballLanded ? " is-landed" : ""}`} /></div>
                </div>
              </div>
              {winner && !spinning && <div className="winner-burst" aria-live="polite"><span>NUMBER {drawnNumber} · THE HOUSE CHOOSES</span><strong>{winner}</strong><small>♠ &nbsp; LUCKY WINNER &nbsp; ♠</small></div>}
              {celebrate && <div className="roulette-confetti" aria-hidden="true">{Array.from({ length: 44 }, (_, index) => <i key={index} style={{ "--confetti-x": `${(index * 37) % 100}%`, "--confetti-delay": `${(index % 8) * 45}ms`, "--confetti-color": confettiColors[index % confettiColors.length], "--confetti-rotate": `${(index * 53) % 360}deg` } as React.CSSProperties} />)}</div>}
            </div>
            <div className="roulette-controls">
              <div className="roulette-control-buttons">
                {winner && <button className="button button-dark roulette-reset" onClick={resetWheel}><RotateCcw size={15} /> Reset</button>}
                <button className="button button-primary roulette-spin" onClick={spin} disabled={spinning || candidates.length < 2}><RotateCw size={17} className={spinning ? "spin-icon" : ""} />{spinning ? "The wheel is turning…" : winner ? "Spin again" : "Spin the wheel"}<Sparkles size={16} /></button>
              </div>
              <span>{candidates.length < 2 ? "Add at least two names to play." : spinning ? "The ball is losing speed…" : `${availableMax} numbers in play · ${37 - availableMax} green pockets`}</span>
            </div>
            <div className="roulette-footnote"><CircleHelp size={14} /> Every candidate gets {numbersPerCandidate} numbers. Green pockets are out of play.</div>
          </section>

          <aside className="candidate-panel">
            <div className="candidate-heading"><div><div className="eyebrow">THE GUEST LIST</div><h2>Who’s in?</h2></div><span className="candidate-total">{String(candidates.length).padStart(2, "0")}</span></div>
            <p className="candidate-intro">Each candidate gets the same number of slots. Add up to 36 names.</p>
            <form className="candidate-add" onSubmit={addCandidate}><input name="candidate" aria-label="Add a candidate" placeholder="Type a name…" maxLength={36} disabled={spinning || candidates.length >= 36} /><button type="submit" aria-label="Add candidate" disabled={spinning || candidates.length >= 36}>+</button></form>
            <div className="candidate-list-label"><span>CANDIDATES</span><span>NUMBER ASSIGNMENT</span></div>
            <div className="candidate-roster" aria-label="Candidates in the draw">
              {candidates.length > 0 ? candidates.map((name, index) => (
                <div className="roster-row candidate-row" key={`${index}-${name}`}>
                  <span className={`roster-avatar avatar-${["coral", "blue", "gold", "lavender", "mint", "rose", "sky", "orange"][index % 8]}`}>{name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                  <span className="roster-copy"><b>{name}</b><small>{numbersPerCandidate > 0 ? <>Numbers {index * numbersPerCandidate + 1}–{(index + 1) * numbersPerCandidate}</> : "Unassigned"}</small></span>
                  <span className="roster-vote-dot ready" title="In the draw" />
                  <button className="remove-player candidate-remove" onClick={() => { setDraft(candidates.filter((_, candidateIndex) => candidateIndex !== index).join("\n")); setWinner(""); }} disabled={spinning} aria-label={`Remove ${name}`}><X size={13} /></button>
                </div>
              )) : <div className="candidate-empty">No names in the draw yet. Add a candidate above.</div>}
            </div>
            <div className="candidate-note"><span className="candidate-note-dot" /> Entries are split into equal odds.</div>
          </aside>
        </div>
        <footer className="randomizer-footer"><span><span className="brand-mark small"><Spade size={13} fill="currentColor" /></span> VEGAS</span><span>THE WHEEL NEVER LIES <i /> HOUSE RULES APPLY</span></footer>
      </section>
    </main>
  );
}
