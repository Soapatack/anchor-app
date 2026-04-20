import { useState, useEffect, useCallback, useRef } from "react";

const DEMO_PEOPLE = [
  {
    id: 1, name: "Asha", relationship: "Your Daughter", photo: "👩🏽",
    emotionalMemory: "She brought you sunflowers last Sunday. You both laughed about the time she tried to plant them upside down as a little girl.",
    recentContext: "She visited you yesterday. She just started a new job as a graphic designer.",
    conversationStarters: ["Ask her how her new job is going", "Tell her you loved the sunflowers", "Ask about her little cartoon foxes"],
    lastSeen: "Yesterday", color: "#D4845A",
  },
  {
    id: 2, name: "David", relationship: "Your Son", photo: "👨🏽",
    emotionalMemory: "He taught you how to video call last month. You were so proud when you called him on your own for the first time.",
    recentContext: "He called two days ago. He's training for a half-marathon in May.",
    conversationStarters: ["Ask about his marathon training", "Tell him you tried the video call trick", "Ask about grandson Leo's soccer"],
    lastSeen: "2 days ago", color: "#5A9E8F",
  },
  {
    id: 3, name: "Margaret", relationship: "Your Best Friend", photo: "👩🏻‍🦳",
    emotionalMemory: "You've been friends for 52 years. She was your maid of honor. You both love crossword puzzles together.",
    recentContext: "She's coming over this afternoon for tea. She recently adopted a cat named Biscuit.",
    conversationStarters: ["Ask how Biscuit the cat is doing", "See if she finished the crossword", "Talk about the botanical garden trip"],
    lastSeen: "Last Thursday", color: "#A8729A",
  },
  {
    id: 4, name: "Dr. Ramirez", relationship: "Your Doctor", photo: "👨‍⚕️",
    emotionalMemory: "He's been your doctor for 8 years. He always asks about your garden and remembers your dahlias.",
    recentContext: "Your next appointment is this Friday at 10 AM. He adjusted your medication last visit.",
    conversationStarters: ["Tell him how you've been feeling", "Ask about the medication change", "Mention the dahlias are blooming"],
    lastSeen: "2 weeks ago", color: "#6B8DB5",
  },
  {
    id: 5, name: "James", relationship: "Your Husband", photo: "👴🏽",
    emotionalMemory: "You've been married 48 years. He still hums your wedding song when he makes morning coffee.",
    recentContext: "He's in the next room reading. He made your favorite oatmeal this morning.",
    conversationStarters: ["Ask him what he's reading today", "Tell him the oatmeal was perfect", "Listen to some Coltrane together"],
    lastSeen: "This morning", color: "#C49A6C",
  },
];

const PHASES = { IDLE: 0, CAMERA: 1, SCANNING: 2, RESULT: 3 };

export default function Anchor() {
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [activeStarter, setActiveStarter] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [settings, setSettings] = useState({
    faceRecognition: true,
    reminders: true,
    conversationHelp: true,
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const runScan = useCallback((withImage) => {
    setPhase(PHASES.SCANNING);
    setScanProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const randomPerson = DEMO_PEOPLE[Math.floor(Math.random() * DEMO_PEOPLE.length)];
        setSelected(randomPerson);
        setActiveStarter(null);
        setPhase(PHASES.RESULT);
      }
    }, 30);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setPhase(PHASES.CAMERA);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera access was denied. Please allow camera access and try again.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Using demo mode instead.");
      }
      setTimeout(() => {
        stopCamera();
        runScan(false);
      }, 2500);
    }
  }, [stopCamera, runScan]);

  const captureAndRecognize = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedImage(dataUrl);
    }
    stopCamera();
    runScan(true);
  }, [stopCamera, runScan]);

  const handleSelectFromList = useCallback((person) => {
    setPhase(PHASES.SCANNING);
    setCapturedImage(null);
    setScanProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 3;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setSelected(person);
        setActiveStarter(null);
        setPhase(PHASES.RESULT);
      }
    }, 25);
  }, []);

  const handleBack = useCallback(() => {
    stopCamera();
    setSelected(null);
    setPhase(PHASES.IDLE);
    setActiveStarter(null);
    setCapturedImage(null);
    setCameraError(null);
  }, [stopCamera]);

  const handleCancelCamera = useCallback(() => {
    stopCamera();
    setPhase(PHASES.IDLE);
    setCameraError(null);
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #FFF8F2 0%, #FCEEE4 35%, #FFF5ED 70%, #FDF0E8 100%)",
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Lora:ital,wght@0,500;0,600;0,700;1,500&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gentlePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        @keyframes slideReveal { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanSweep { 0% { top: 0%; } 50% { top: 85%; } 100% { top: 0%; } }
        @keyframes cornerPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button:active { transform: scale(0.97) !important; }
      `}</style>

      <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, #F5D5BF40, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, #E8C5B040, transparent 70%)", pointerEvents: "none" }} />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 40px", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #D4845A, #C49A6C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 14px rgba(212,132,90,0.3)" }}>⚓</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#3D2E22", fontFamily: "'Lora', Georgia, serif", letterSpacing: "-0.3px" }}>Anchor</div>
              <div style={{ fontSize: 12.5, color: "#9E8B7E", fontWeight: 600, marginTop: -1 }}>Keeping you connected</div>
            </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} style={{
            all: "unset", cursor: "pointer", width: 48, height: 48, borderRadius: 16,
            background: showSettings ? "#F0DDD0" : "#FFF5ED",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, border: "2px solid #EDE0D4", transition: "all 0.2s",
          }}>⚙️</button>
        </div>

        {/* Privacy */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "8px 16px", borderRadius: 12,
          background: "rgba(90, 158, 143, 0.08)", border: "1.5px solid rgba(90, 158, 143, 0.15)",
          marginBottom: 20,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5A9E8F" }} />
          <span style={{ fontSize: 13, color: "#5A9E8F", fontWeight: 700 }}>Private & Secure · All data stays on your device</span>
        </div>

        {/* SETTINGS */}
        {showSettings && (
          <div style={{ animation: "fadeUp 0.3s ease-out", background: "#FFFFFF", borderRadius: 24, padding: 24, marginBottom: 20, border: "2px solid #EDE0D4", boxShadow: "0 4px 20px rgba(139,107,80,0.08)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#3D2E22", marginBottom: 20, fontFamily: "'Lora', serif" }}>⚖️ Your Controls</div>
            {[
              { key: "faceRecognition", label: "Camera Recognition", desc: "Never leaves your device", icon: "📷" },
              { key: "reminders", label: "Gentle Reminders", desc: "Helpful memory prompts", icon: "🔔" },
              { key: "conversationHelp", label: "Conversation Help", desc: "Suggests what to say", icon: "💬" },
            ].map((item) => (
              <button key={item.key} onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key] }))} style={{
                all: "unset", cursor: "pointer", width: "100%",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 0", borderBottom: "1.5px solid #F5EDE6",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 26 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#3D2E22" }}>{item.label}</div>
                    <div style={{ fontSize: 13.5, color: "#9E8B7E", marginTop: 2, fontWeight: 500 }}>{item.desc}</div>
                  </div>
                </div>
                <div style={{
                  width: 56, height: 32, borderRadius: 16,
                  background: settings[item.key] ? "linear-gradient(135deg, #5A9E8F, #4A8D7E)" : "#DDD5CD",
                  position: "relative", transition: "all 0.3s", flexShrink: 0,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3, left: settings[item.key] ? 27 : 3,
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }} />
                </div>
              </button>
            ))}
            <div style={{ marginTop: 18, padding: "14px 18px", borderRadius: 16, background: "#FFF8F2", border: "1.5px solid #EDE0D4", fontSize: 14, color: "#7A6B5E", lineHeight: 1.6, fontWeight: 500 }}>
              🔒 Your data is encrypted and never shared. You can turn anything off at any time.
            </div>
          </div>
        )}

        {/* CAMERA VIEW */}
        {phase === PHASES.CAMERA && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "#1a1a1a",
            display: "flex", flexDirection: "column",
            animation: "fadeUp 0.25s ease-out",
          }}>
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />

              {/* Face guide */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{
                  width: 220, height: 290, borderRadius: "50%",
                  border: "3px solid rgba(255,255,255,0.5)",
                  boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)",
                  animation: "cornerPulse 2s ease-in-out infinite",
                }} />
              </div>

              {/* Scan line */}
              <div style={{
                position: "absolute", left: "15%", right: "15%",
                height: 3, borderRadius: 2,
                background: "linear-gradient(90deg, transparent, rgba(212,132,90,0.8), transparent)",
                animation: "scanSweep 2.5s ease-in-out infinite",
                pointerEvents: "none",
              }} />

              {/* Instruction */}
              <div style={{ position: "absolute", top: 60, left: 0, right: 0, textAlign: "center" }}>
                <div style={{
                  display: "inline-block",
                  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
                  borderRadius: 16, padding: "12px 24px",
                  color: "#fff", fontSize: 18, fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                }}>Point at the person's face</div>
              </div>

              {/* Camera error */}
              {cameraError && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.7)", padding: 40,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, textAlign: "center", lineHeight: 1.6, fontFamily: "'Nunito', sans-serif" }}>
                    {cameraError}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginTop: 12, fontWeight: 500, textAlign: "center" }}>
                    Switching to demo mode...
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{
              background: "#111", padding: "24px 20px 40px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 32,
            }}>
              <button onClick={handleCancelCamera} style={{
                all: "unset", cursor: "pointer",
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, color: "#fff", fontWeight: 800,
              }}>✕</button>

              <button onClick={captureAndRecognize} style={{
                all: "unset", cursor: "pointer",
                width: 88, height: 88, borderRadius: "50%",
                background: "#fff",
                border: "5px solid rgba(255,255,255,0.3)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 70, height: 70, borderRadius: "50%",
                  background: "linear-gradient(135deg, #D4845A, #C49A6C)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30,
                }}>📸</div>
              </button>

              <div style={{ width: 64 }} />
            </div>
          </div>
        )}

        {/* SCANNING OVERLAY */}
        {phase === PHASES.SCANNING && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(253, 248, 242, 0.95)", backdropFilter: "blur(12px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            animation: "fadeUp 0.25s ease-out",
          }}>
            <div style={{
              width: 140, height: 140, borderRadius: "50%", overflow: "hidden",
              border: "4px solid #E8C5B0",
              boxShadow: "0 8px 40px rgba(212,132,90,0.2)",
              animation: "gentlePulse 1.5s ease-in-out infinite",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: capturedImage ? "transparent" : "linear-gradient(135deg, #F5D5BF, #FCEEE4)",
            }}>
              {capturedImage ? (
                <img src={capturedImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 64 }}>👤</span>
              )}
            </div>
            <div style={{ marginTop: 28, fontSize: 24, fontWeight: 700, color: "#3D2E22", fontFamily: "'Lora', serif" }}>
              {scanProgress < 40 ? "Looking..." : scanProgress < 75 ? "Recognizing..." : "Found them!"}
            </div>
            <div style={{ marginTop: 8, fontSize: 16, color: "#9E8B7E", fontWeight: 500 }}>
              {scanProgress < 75 ? "Stays private on your device" : "Loading their info..."}
            </div>
            <div style={{ marginTop: 28, width: 240, height: 8, borderRadius: 4, background: "#EDE0D4", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: scanProgress >= 75 ? "linear-gradient(90deg, #5A9E8F, #4A8D7E)" : "linear-gradient(90deg, #D4845A, #C49A6C)",
                width: `${scanProgress}%`,
                transition: "width 0.1s linear, background 0.3s",
              }} />
            </div>
          </div>
        )}

        {/* IDLE — Main List */}
        {phase === PHASES.IDLE && (
          <>
            <button onClick={startCamera} style={{
              all: "unset", cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
              padding: "24px 24px", borderRadius: 24,
              background: "linear-gradient(135deg, #D4845A, #C49A6C)",
              color: "#FFF", fontSize: 22, fontWeight: 800,
              boxShadow: "0 6px 24px rgba(212,132,90,0.35)",
              transition: "all 0.2s", marginBottom: 28,
              fontFamily: "'Nunito', sans-serif",
            }}>
              <span style={{ fontSize: 32 }}>📷</span>
              Who Is This?
            </button>

            <div style={{ fontSize: 14, fontWeight: 800, color: "#9E8B7E", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 14, padding: "0 6px" }}>Your People</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {DEMO_PEOPLE.map((person, i) => (
                <button key={person.id} onClick={() => handleSelectFromList(person)} style={{
                  all: "unset", cursor: "pointer", width: "100%",
                  display: "flex", alignItems: "center", gap: 18,
                  padding: "20px 22px", borderRadius: 22,
                  background: "#FFFFFF", border: "2px solid #EDE0D4",
                  boxShadow: "0 2px 12px rgba(139,107,80,0.06)",
                  transition: "all 0.25s",
                  animation: `fadeUp 0.4s ease-out ${i * 0.06}s both`,
                }}>
                  <div style={{
                    width: 68, height: 68, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${person.color}30, ${person.color}15)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 36, flexShrink: 0, border: `3px solid ${person.color}40`,
                  }}>{person.photo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#3D2E22", fontFamily: "'Lora', Georgia, serif" }}>{person.name}</div>
                    <div style={{ fontSize: 15, color: person.color, fontWeight: 700, marginTop: 3 }}>{person.relationship}</div>
                  </div>
                  <div style={{ fontSize: 13.5, color: "#B5A598", fontWeight: 600, textAlign: "right", flexShrink: 0 }}>{person.lastSeen}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* RESULT VIEW */}
        {phase === PHASES.RESULT && selected && (
          <div style={{ animation: "fadeUp 0.4s ease-out" }}>
            <button onClick={handleBack} style={{
              all: "unset", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 22px", borderRadius: 18,
              background: "#FFFFFF", border: "2px solid #EDE0D4",
              fontSize: 17, fontWeight: 700, color: "#7A6B5E",
              marginBottom: 20, transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(139,107,80,0.06)",
            }}>← Go Back</button>

            {/* Hero */}
            <div style={{
              background: "#FFFFFF", borderRadius: 28, padding: "32px 28px",
              border: "2px solid #EDE0D4",
              boxShadow: "0 4px 20px rgba(139,107,80,0.08)",
              textAlign: "center", marginBottom: 16,
              position: "relative", overflow: "hidden",
            }}>
              {capturedImage && (
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url(${capturedImage})`,
                  backgroundSize: "cover", backgroundPosition: "center",
                  filter: "blur(30px) brightness(1.3)", opacity: 0.12,
                }} />
              )}
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 100, height: 100, borderRadius: "50%", margin: "0 auto 18px",
                  overflow: "hidden",
                  background: capturedImage ? "transparent" : `linear-gradient(135deg, ${selected.color}30, ${selected.color}12)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 54, border: `4px solid ${selected.color}45`,
                  animation: "gentlePulse 3s ease-in-out infinite",
                }}>
                  {capturedImage ? (
                    <img src={capturedImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : selected.photo}
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#3D2E22", fontFamily: "'Lora', Georgia, serif" }}>{selected.name}</div>
                <div style={{ fontSize: 18, color: selected.color, fontWeight: 700, marginTop: 6 }}>{selected.relationship}</div>
                <div style={{ fontSize: 14, color: "#B5A598", fontWeight: 600, marginTop: 8 }}>Last seen: {selected.lastSeen}</div>
              </div>
            </div>

            {/* Memory */}
            <div style={{
              background: "#FFFFFF", borderRadius: 24, padding: 24,
              border: "2px solid #EDE0D4", marginBottom: 16,
              boxShadow: "0 2px 12px rgba(139,107,80,0.05)",
              animation: "slideReveal 0.5s ease-out 0.15s both",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>💛</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#D4845A", textTransform: "uppercase", letterSpacing: "1px" }}>A Memory You Share</span>
              </div>
              <div style={{ fontSize: 18, lineHeight: 1.7, color: "#5C4D42", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>
                "{selected.emotionalMemory}"
              </div>
            </div>

            {/* Context */}
            <div style={{
              background: "#FFFFFF", borderRadius: 24, padding: 24,
              border: "2px solid #EDE0D4", marginBottom: 16,
              boxShadow: "0 2px 12px rgba(139,107,80,0.05)",
              animation: "slideReveal 0.5s ease-out 0.3s both",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>📋</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#5A9E8F", textTransform: "uppercase", letterSpacing: "1px" }}>What's New</span>
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.7, color: "#5C4D42", fontWeight: 500 }}>
                {selected.recentContext}
              </div>
            </div>

            {/* Starters */}
            <div style={{ animation: "slideReveal 0.5s ease-out 0.45s both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "0 6px" }}>
                <span style={{ fontSize: 24 }}>💬</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#A8729A", textTransform: "uppercase", letterSpacing: "1px" }}>Things You Could Say</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selected.conversationStarters.map((starter, i) => (
                  <button key={i} onClick={() => setActiveStarter(activeStarter === i ? null : i)} style={{
                    all: "unset", cursor: "pointer", width: "100%",
                    padding: "20px 22px", borderRadius: 22,
                    background: activeStarter === i ? `linear-gradient(135deg, ${selected.color}15, ${selected.color}08)` : "#FFFFFF",
                    border: `2.5px solid ${activeStarter === i ? selected.color + "60" : "#EDE0D4"}`,
                    fontSize: 18, lineHeight: 1.55, color: "#3D2E22",
                    fontWeight: activeStarter === i ? 700 : 600,
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: activeStarter === i ? `0 4px 20px ${selected.color}18` : "0 2px 8px rgba(139,107,80,0.04)",
                    display: "flex", alignItems: "center", gap: 16,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: activeStarter === i ? selected.color + "25" : "#F5EDE6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 17, fontWeight: 800,
                      color: activeStarter === i ? selected.color : "#B5A598",
                      transition: "all 0.3s",
                    }}>
                      {activeStarter === i ? "✨" : i + 1}
                    </div>
                    <span style={{ flex: 1 }}>{starter}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Try again */}
            <button onClick={startCamera} style={{
              all: "unset", cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              padding: "20px", borderRadius: 22, marginTop: 20,
              background: "#FFF5ED", border: "2px solid #EDE0D4",
              fontSize: 17, fontWeight: 700, color: "#D4845A",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 22 }}>📷</span>
              Recognize Someone Else
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 36, padding: "0 20px" }}>
          <div style={{ fontSize: 13, color: "#B5A598", fontWeight: 600, lineHeight: 1.6 }}>⚓ Anchor — Keeping you connected to the people you love</div>
          <div style={{ fontSize: 11.5, color: "#CBBFB4", fontWeight: 500, marginTop: 4 }}>Private · Encrypted · Always yours to control</div>
        </div>
      </div>
    </div>
  );
}
