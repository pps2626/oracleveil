import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera,
  useTexture,
  Sparkles
} from "@react-three/drei";
import { 
  EffectComposer, 
  Bloom, 
  Vignette
} from "@react-three/postprocessing";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import * as Tone from "tone";
import "@fontsource/inter";
import { Route, Switch } from "wouter";
import { AdminPanel } from "./pages/AdminPanel";

const TAROT_CARDS = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World",
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
  "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
  "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles",
  "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles",
  "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles",
  "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
  "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
  "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands"
];

interface CardData {
  id: number;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

function Card({ 
  card, 
  onClick, 
  isSelected, 
  isRevealing, 
  revealProgress,
  isInSpread,
  spreadPosition
}: { 
  card: CardData;
  onClick: () => void;
  isSelected: boolean;
  isRevealing: boolean;
  revealProgress: number;
  isInSpread: boolean;
  spreadPosition?: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const frontRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const woodTexture = useTexture("/textures/wood.jpg");
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(0.5, 0.7);

  const cardFaceTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 768);
    gradient.addColorStop(0, '#fef3c7');
    gradient.addColorStop(0.5, '#fde68a');
    gradient.addColorStop(1, '#fcd34d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 768);
    
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.strokeRect(20, 20, 472, 728);
    
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#78350f';
    ctx.shadowBlur = 5;
    
    const lines = card.name.match(/.{1,15}/g) || [card.name];
    lines.forEach((line, i) => {
      ctx.fillText(line, 256, 350 + i * 30);
    });
    
    ctx.fillStyle = '#d97706';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 256 + Math.cos(angle) * 100;
      const y = 200 + Math.sin(angle) * 100;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add inner circle pattern
    ctx.fillStyle = '#92400e';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 256 + Math.cos(angle) * 60;
      const y = 200 + Math.sin(angle) * 60;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [card.name]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered]);

  useFrame(() => {
    if (!meshRef.current) return;
    
    if (isRevealing) {
      const targetY = card.position[1] + 3 + revealProgress * 2;
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.05
      );
      
      meshRef.current.rotation.y = revealProgress * Math.PI;
    } else if (isInSpread && spreadPosition !== undefined) {
      const targetX = (spreadPosition - 1) * 2.5;
      const targetY = 1;
      const targetZ = 0;
      
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        targetX,
        0.05
      );
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.05
      );
      meshRef.current.position.z = THREE.MathUtils.lerp(
        meshRef.current.position.z,
        targetZ,
        0.05
      );
      meshRef.current.rotation.y = Math.PI;
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.z = 0;
    }
    
    if (frontRef.current && isInSpread) {
      const time = Date.now() * 0.001;
      const material = frontRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.2;
    }
  });

  return (
    <group
      ref={meshRef}
      position={card.position}
      rotation={card.rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.011, 0]}>
        <boxGeometry args={[0.6, 0.001, 1]} />
        <meshStandardMaterial
          color="#c2410c"
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      
      <mesh ref={frontRef} position={[0, -0.011, 0]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[0.6, 0.001, 1]} />
        <meshStandardMaterial
          map={cardFaceTexture}
          roughness={0.3}
          metalness={0.2}
          emissive="#fbbf24"
          emissiveIntensity={isInSpread ? 0.2 : 0}
          normalScale={new THREE.Vector2(1, 1)}
        />
      </mesh>
      
      <mesh>
        <boxGeometry args={[0.6, 0.02, 1]} />
        <meshStandardMaterial
          map={woodTexture}
          roughness={0.4}
          metalness={0.3}
          emissive={isSelected || hovered ? "#fbbf24" : "#000000"}
          emissiveIntensity={isSelected ? 0.4 : hovered ? 0.2 : 0}
          normalScale={new THREE.Vector2(2, 2)}
        />
      </mesh>
    </group>
  );
}

function CameraRig({ revealingCard, revealProgress }: { revealingCard: CardData | null; revealProgress: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    if (revealingCard) {
      const cardX = revealingCard.position[0];
      const cardZ = revealingCard.position[2];
      const cardY = revealingCard.position[1] + 3 + revealProgress * 2;
      
      const distance = THREE.MathUtils.lerp(12, 6, revealProgress);
      const angle = Math.atan2(cardX, cardZ);
      
      const targetX = cardX + Math.sin(angle) * distance * 0.3;
      const targetY = THREE.MathUtils.lerp(8, cardY + 2, revealProgress);
      const targetZ = cardZ + Math.cos(angle) * distance * 0.3;
      
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
      camera.lookAt(cardX, cardY, cardZ);
    } else {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 12, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 8, 0.05);
      camera.lookAt(0, 0, 0);
    }
  });
  
  return null;
}

function TarotScene({ 
  onCardSelect,
  selectedCards,
  revealingCard,
  revealProgress,
  spreadCards,
  darkMode
}: {
  onCardSelect: (card: CardData) => void;
  selectedCards: CardData[];
  revealingCard: CardData | null;
  revealProgress: number;
  spreadCards: CardData[];
  darkMode: boolean;
}) {
  const [cards] = useState<CardData[]>(() => {
    return TAROT_CARDS.map((name, index) => ({
      id: index,
      name,
      position: [
        (Math.random() - 0.5) * 15,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 15
      ] as [number, number, number],
      rotation: [
        0,
        Math.random() * Math.PI * 2,
        0
      ] as [number, number, number]
    }));
  });

  const velvetTexture = useTexture("/textures/wood.jpg");
  velvetTexture.wrapS = velvetTexture.wrapT = THREE.RepeatWrapping;
  velvetTexture.repeat.set(8, 8);

  return (
    <>
      <CameraRig revealingCard={revealingCard} revealProgress={revealProgress} />
      <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={50} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={8}
        maxDistance={25}
        enabled={!revealingCard}
      />

      <ambientLight intensity={darkMode ? 0.4 : 0.8} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={darkMode ? 1.2 : 2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        color={darkMode ? "#ffffff" : "#fffbeb"}
      />
      <pointLight position={[0, 8, 0]} intensity={darkMode ? 0.8 : 1.5} color="#fbbf24" />
      <pointLight position={[5, 5, 5]} intensity={darkMode ? 0.5 : 1.0} color="#fef3c7" />
      <pointLight position={[-5, 5, -5]} intensity={darkMode ? 0.5 : 1.0} color="#fef3c7" />
      
      <Sparkles
        count={darkMode ? 80 : 150}
        scale={[20, 10, 20]}
        size={darkMode ? 1.5 : 3}
        speed={0.4}
        color={darkMode ? "#fbbf24" : "#fde68a"}
        opacity={darkMode ? 0.5 : 0.8}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          map={velvetTexture}
          color={darkMode ? "#3b2814" : "#d97706"}
          roughness={darkMode ? 0.9 : 0.7}
          metalness={0.1}
          envMapIntensity={darkMode ? 0.3 : 0.6}
        />
      </mesh>

      {cards.map((card) => {
        const isInSpread = spreadCards.some(sc => sc.id === card.id);
        const spreadPosition = spreadCards.findIndex(sc => sc.id === card.id);
        
        return (
          <Card
            key={card.id}
            card={card}
            onClick={() => !isInSpread && selectedCards.length < 3 && onCardSelect(card)}
            isSelected={selectedCards.some(sc => sc.id === card.id)}
            isRevealing={revealingCard?.id === card.id}
            revealProgress={revealProgress}
            isInSpread={isInSpread}
            spreadPosition={isInSpread ? spreadPosition : undefined}
          />
        );
      })}

      <Environment preset={darkMode ? "sunset" : "dawn"} />
      
      <fog attach="fog" args={[darkMode ? "#1a1520" : "#fef3c7", 15, 45]} />
      
      <EffectComposer multisampling={8}>
        <Bloom
          intensity={spreadCards.length > 0 ? 1.2 : 0.5}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.8}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.15} darkness={darkMode ? 0.4 : 0.2} />
      </EffectComposer>
    </>
  );
}

function AccessGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });

      if (response.ok) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setError(false), 1000);
      }
    } catch (err) {
      setError(true);
      setTimeout(() => setError(false), 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-6xl font-bold text-amber-400 mb-4" style={{ fontFamily: "serif" }}>
          ဗေဒင်၏ ဖုံးအုပ်ချက်
        </h1>
        <p className="text-amber-200 text-xl mb-8">The Oracle's Veil</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-amber-100 mb-3 text-lg">
              ဝင်ရောက်ခွင့် ကုဒ်နံပါတ်
            </label>
            <input
              type="text"
              maxLength={12}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-64 px-6 py-4 text-center text-2xl tracking-widest rounded-lg bg-slate-800 border-2 ${
                error ? "border-red-500 shake" : "border-amber-500"
              } text-amber-100 focus:outline-none focus:border-amber-400 transition-colors`}
              placeholder="Enter token"
              autoFocus
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-105 text-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Validating..." : "ဝင်ရောက်ရန်"}
          </button>
        </form>

        <p className="text-amber-200 text-sm mt-8">
          သင့်ကံကြမ္မာကို ရှာဖွေပါ
        </p>
      </div>
    </div>
  );
}

function ReadingPanel({ 
  cards, 
  reading, 
  onNewReading,
  darkMode 
}: { 
  cards: CardData[];
  reading: string;
  onNewReading: () => void;
  darkMode: boolean;
}) {
  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-slate-900/95' : 'bg-amber-50/95'} overflow-auto z-10`}>
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-amber-400' : 'text-slate-800'}`}>
            သင့်၏ တာရို ဖတ်ရှုမှု
          </h2>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className={`text-sm mb-2 ${darkMode ? 'text-amber-200' : 'text-slate-600'}`}>အတိတ်</p>
              <p className={`font-bold ${darkMode ? 'text-amber-100' : 'text-slate-800'}`}>{cards[0]?.name}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm mb-2 ${darkMode ? 'text-amber-200' : 'text-slate-600'}`}>ပစ္စုပ္ပန်</p>
              <p className={`font-bold ${darkMode ? 'text-amber-100' : 'text-slate-800'}`}>{cards[1]?.name}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm mb-2 ${darkMode ? 'text-amber-200' : 'text-slate-600'}`}>အနာဂတ်</p>
              <p className={`font-bold ${darkMode ? 'text-amber-100' : 'text-slate-800'}`}>{cards[2]?.name}</p>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-8 mb-6 shadow-2xl border-2 ${darkMode ? 'border-amber-600' : 'border-amber-400'}`}>
          <p className={`text-lg leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-amber-50' : 'text-slate-800'}`}>
            {reading}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onNewReading}
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-105"
          >
            အသစ် ဖတ်ရှုရန်
          </button>
        </div>
      </div>
    </div>
  );
}

function TarotApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [selectedCards, setSelectedCards] = useState<CardData[]>([]);
  const [revealingCard, setRevealingCard] = useState<CardData | null>(null);
  const [revealProgress, setRevealProgress] = useState(0);
  const [spreadCards, setSpreadCards] = useState<CardData[]>([]);
  const [reading, setReading] = useState<string>("");
  const [showReading, setShowReading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const synthRef = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    synthRef.current = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 1 }
    }).toDestination();
    
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const playSound = async () => {
    await Tone.start();
    synthRef.current?.triggerAttackRelease("C5", "0.5");
  };

  useEffect(() => {
    if (revealingCard) {
      const interval = setInterval(() => {
        setRevealProgress(prev => {
          if (prev >= 1) {
            clearInterval(interval);
            playSound();
            
            setTimeout(() => {
              setSpreadCards(prev => {
                const updatedSpreadCards = [...prev, revealingCard];
                // After all 3 cards are revealed and added to spread, fetch the reading
                if (selectedCards.length === 3 && updatedSpreadCards.length === 3) {
                  setTimeout(() => fetchReading(), 100);
                }
                return updatedSpreadCards;
              });
              setRevealingCard(null);
              setRevealProgress(0);
            }, 500);
            
            return 1;
          }
          return prev + 0.008;
        });
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [revealingCard, selectedCards.length, spreadCards.length]);

  const handleCardSelect = (card: CardData) => {
    if (selectedCards.length < 3) {
      const newSelected = [...selectedCards, card];
      setSelectedCards(newSelected);
      setRevealingCard(card);
    }
  };

  const fetchReading = async () => {
    try {
      const response = await fetch("/api/tarot-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: [...spreadCards.map(c => c.name), selectedCards[selectedCards.length - 1].name]
        })
      });
      
      const data = await response.json();
      setReading(data.reading || "ဖတ်ရှုမှု မရနိုင်ပါ။");
      setShowReading(true);
    } catch (error) {
      console.error("Failed to fetch reading:", error);
      setReading("ချိတ်ဆက်မှု အမှား။ ထပ်မံကြိုးစားပါ။");
      setShowReading(true);
    }
  };

  const handleNewReading = () => {
    setSelectedCards([]);
    setSpreadCards([]);
    setReading("");
    setShowReading(false);
    setRevealingCard(null);
    setRevealProgress(0);
  };

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="w-screen h-screen relative">
      <div className="fixed top-4 right-4 z-20 flex gap-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-lg transition-all"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {showReading && (
        <ReadingPanel
          cards={spreadCards}
          reading={reading}
          onNewReading={handleNewReading}
          darkMode={darkMode}
        />
      )}

      {!showReading && (
        <>
          <div className="fixed top-4 left-4 z-20">
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} p-4 rounded-lg shadow-lg border-2 ${darkMode ? 'border-amber-600' : 'border-amber-400'}`}>
              <p className={`${darkMode ? 'text-amber-400' : 'text-slate-800'} font-bold mb-2`}>
                ရွေးချယ်ထားသော ကတ်များ: {selectedCards.length}/3
              </p>
              <p className={`text-sm ${darkMode ? 'text-amber-200' : 'text-slate-600'}`}>
                သင့်ကံကြမ္မာ အတွက် ကတ် သုံးချပ် ရွေးချယ်ပါ
              </p>
            </div>
          </div>

          <Canvas shadows gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={[darkMode ? "#0f0a1a" : "#fef3c7"]} />
            <Suspense fallback={null}>
              <TarotScene
                onCardSelect={handleCardSelect}
                selectedCards={selectedCards}
                revealingCard={revealingCard}
                revealProgress={revealProgress}
                spreadCards={spreadCards}
                darkMode={darkMode}
              />
            </Suspense>
          </Canvas>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <Switch>
      <Route path="/admin" component={AdminPanel} />
      <Route path="/" component={TarotApp} />
    </Switch>
  );
}

export default App;
