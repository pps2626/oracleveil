import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import { 
  OrbitControls, 
  PerspectiveCamera,
  useTexture,
  Environment,
  Text
} from "@react-three/drei";
import { 
  EffectComposer, 
  Bloom
} from "@react-three/postprocessing";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
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

const cryptoShuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  const randomValues = new Uint32Array(newArray.length);
  crypto.getRandomValues(randomValues);
  
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

interface CardData {
  id: number;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

const POSITION_LABELS = ["အတိတ်", "ပစ္စုပ္ပန်", "အနာဂတ်"];
const POSITION_LABELS_EN = ["Past", "Present", "Future"];

function Card({ 
  card, 
  onClick, 
  isSelected, 
  isRevealing, 
  revealProgress,
  isInSpread,
  spreadPosition,
  sharedGeometry,
  sharedBackMaterial,
  darkMode
}: { 
  card: CardData;
  onClick: () => void;
  isSelected: boolean;
  isRevealing: boolean;
  revealProgress: number;
  isInSpread: boolean;
  spreadPosition?: number;
  sharedGeometry: THREE.BoxGeometry;
  sharedBackMaterial: THREE.MeshStandardMaterial;
  darkMode: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const frontRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const cardFaceTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 384);
    gradient.addColorStop(0, '#fef9c3');
    gradient.addColorStop(0.5, '#fef08a');
    gradient.addColorStop(1, '#fde047');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 384);
    
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 236, 364);
    
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#78350f';
    ctx.shadowBlur = 3;
    
    const lines = card.name.match(/.{1,12}/g) || [card.name];
    lines.forEach((line, i) => {
      ctx.fillText(line, 128, 175 + i * 18);
    });
    
    ctx.fillStyle = '#ea580c';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = 128 + Math.cos(angle) * 50;
      const y = 100 + Math.sin(angle) * 50;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [card.name]);

  useEffect(() => {
    document.body.style.cursor = hovered && !isInSpread ? "pointer" : "auto";
  }, [hovered, isInSpread]);

  useFrame(() => {
    if (!meshRef.current) return;
    
    if (isRevealing) {
      const targetY = card.position[1] + 3 + revealProgress * 2;
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.08
      );
      
      meshRef.current.rotation.y = revealProgress * Math.PI;
    } else if (isInSpread && spreadPosition !== undefined) {
      const targetX = (spreadPosition - 1) * 2.5;
      const targetY = 1;
      const targetZ = 2;
      
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        targetX,
        0.08
      );
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.08
      );
      meshRef.current.position.z = THREE.MathUtils.lerp(
        meshRef.current.position.z,
        targetZ,
        0.08
      );
      meshRef.current.rotation.y = Math.PI;
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.z = 0;
    }
    
    if (frontRef.current && isInSpread) {
      const time = Date.now() * 0.001;
      const material = frontRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.4 + Math.sin(time * 2) * 0.3;
    }
  });

  return (
    <group
      ref={meshRef}
      position={card.position}
      rotation={card.rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (!isInSpread) onClick();
      }}
      onPointerOver={() => !isInSpread && setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.011, 0]}>
        <boxGeometry args={[0.6, 0.001, 1]} />
        <meshStandardMaterial
          color={darkMode ? "#c2410c" : "#ea580c"}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      
      <mesh ref={frontRef} position={[0, -0.011, 0]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[0.6, 0.001, 1]} />
        <meshStandardMaterial
          map={cardFaceTexture}
          roughness={0.2}
          metalness={0.1}
          emissive="#fbbf24"
          emissiveIntensity={isInSpread ? 0.3 : 0}
        />
      </mesh>
      
      <mesh geometry={sharedGeometry} material={sharedBackMaterial}>
        <meshStandardMaterial
          attach="material"
          color={darkMode ? "#78350f" : "#92400e"}
          roughness={0.4}
          metalness={0.3}
          emissive={isSelected || hovered ? "#fbbf24" : "#000000"}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
        />
      </mesh>
    </group>
  );
}

function PositionLabels({ spreadCards, darkMode }: { spreadCards: CardData[]; darkMode: boolean }) {
  if (spreadCards.length === 0) return null;

  return (
    <>
      {[0, 1, 2].map((index) => (
        <group key={index} position={[(index - 1) * 2.5, 0.02, 3.5]}>
          <Text
            fontSize={0.25}
            color={darkMode ? "#fbbf24" : "#ea580c"}
            anchorX="center"
            anchorY="middle"
            font="/fonts/Inter-Bold.woff"
          >
            {POSITION_LABELS[index]}
          </Text>
          <Text
            fontSize={0.15}
            color={darkMode ? "#fde68a" : "#fb923c"}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.35, 0]}
          >
            {POSITION_LABELS_EN[index]}
          </Text>
        </group>
      ))}
    </>
  );
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
    const shuffled = cryptoShuffleArray(TAROT_CARDS);
    return shuffled.map((name, index) => ({
      id: index,
      name,
      position: [
        (Math.random() - 0.5) * 15,
        Math.random() * 0.15,
        (Math.random() - 0.5) * 15
      ] as [number, number, number],
      rotation: [
        0,
        Math.random() * Math.PI * 2,
        0
      ] as [number, number, number]
    }));
  });

  const sharedGeometry = useMemo(() => new THREE.BoxGeometry(0.6, 0.02, 1), []);
  const woodTexture = useTexture("/textures/wood.jpg");
  const sharedBackMaterial = useMemo(() => {
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(0.5, 0.7);
    return new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.4,
      metalness: 0.3,
    });
  }, [woodTexture]);

  const velvetTexture = useTexture("/textures/wood.jpg");
  velvetTexture.wrapS = velvetTexture.wrapT = THREE.RepeatWrapping;
  velvetTexture.repeat.set(8, 8);

  const isMobile = useMemo(() => window.innerWidth < 768, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={50} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={8}
        maxDistance={25}
        enabled={!revealingCard}
      />

      <ambientLight intensity={darkMode ? 0.6 : 1.2} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={darkMode ? 1.5 : 3.0}
        castShadow
        shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]}
        color={darkMode ? "#fffbeb" : "#fef3c7"}
      />
      <pointLight position={[0, 8, 0]} intensity={darkMode ? 1.0 : 2.0} color="#fbbf24" />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          map={velvetTexture}
          color={darkMode ? "#451a03" : "#f59e0b"}
          roughness={darkMode ? 0.8 : 0.6}
          metalness={0.1}
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
            sharedGeometry={sharedGeometry}
            sharedBackMaterial={sharedBackMaterial}
            darkMode={darkMode}
          />
        );
      })}

      <PositionLabels spreadCards={spreadCards} darkMode={darkMode} />

      <Environment preset={darkMode ? "sunset" : "dawn"} />
      
      <fog attach="fog" args={[darkMode ? "#1a1520" : "#fef3c7", 15, 45]} />
      
      {!isMobile && (
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={spreadCards.length > 0 ? 1.5 : 0.8}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      )}
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
    <div className="fixed inset-0 bg-gradient-to-b from-violet-950 via-fuchsia-950 to-violet-950 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-6xl font-bold text-amber-300 mb-4" style={{ fontFamily: "serif" }}>
          ဗေဒင်၏ ဖုံးအုပ်ချက်
        </h1>
        <p className="text-amber-100 text-xl mb-8">The Oracle's Veil</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-amber-50 mb-3 text-lg">
              ဝင်ရောက်ခွင့် ကုဒ်နံပါတ်
            </label>
            <input
              type="text"
              maxLength={12}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-64 px-6 py-4 text-center text-2xl tracking-widest rounded-lg bg-violet-900 border-2 ${
                error ? "border-red-500 shake" : "border-amber-400"
              } text-amber-50 focus:outline-none focus:border-amber-300 transition-colors`}
              placeholder="Enter token"
              autoFocus
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-violet-950 font-bold rounded-lg transition-all transform hover:scale-105 text-lg disabled:opacity-50 shadow-lg shadow-amber-500/50"
            disabled={loading}
          >
            {loading ? "Validating..." : "ဝင်ရောက်ရန်"}
          </button>
        </form>

        <p className="text-amber-100 text-sm mt-8">
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
          <h2 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
            သင့်၏ တာရို ဖတ်ရှုမှု
          </h2>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className={`text-sm mb-2 ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>အတိတ် (Past)</p>
              <p className={`font-bold ${darkMode ? 'text-amber-100' : 'text-amber-900'}`}>{cards[0]?.name}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm mb-2 ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>ပစ္စုပ္ပန် (Present)</p>
              <p className={`font-bold ${darkMode ? 'text-amber-100' : 'text-amber-900'}`}>{cards[1]?.name}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm mb-2 ${darkMode ? 'text-amber-200' : 'text-amber-700'}`}>အနာဂတ် (Future)</p>
              <p className={`font-bold ${darkMode ? 'text-amber-100' : 'text-amber-900'}`}>{cards[2]?.name}</p>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-8 mb-6 shadow-2xl border-2 ${darkMode ? 'border-amber-500' : 'border-amber-400'}`}>
          <p className={`text-lg leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-amber-50' : 'text-slate-800'}`}>
            {reading}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onNewReading}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/50"
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
  const [darkMode, setDarkMode] = useState(false);
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
          return prev + 0.01;
        });
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [revealingCard, selectedCards.length]);

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
          cards: spreadCards.map(c => c.name).concat(selectedCards[selectedCards.length - 1].name)
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
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all shadow-lg shadow-amber-500/50"
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
            <div className={`${darkMode ? 'bg-slate-800 border-amber-500' : 'bg-white border-amber-400'} p-4 rounded-lg shadow-lg border-2`}>
              <p className={`${darkMode ? 'text-amber-300' : 'text-amber-900'} font-bold mb-2`}>
                ရွေးချယ်ထားသော ကတ်များ: {selectedCards.length}/3
              </p>
              <p className={`text-sm ${darkMode ? 'text-amber-100' : 'text-amber-700'}`}>
                သင့်ကံကြမ္မာ အတွက် ကတ် သုံးချပ် ရွေးချယ်ပါ
              </p>
              {selectedCards.length > 0 && (
                <div className="mt-3 space-y-1">
                  {selectedCards.map((card, idx) => (
                    <p key={card.id} className={`text-xs ${darkMode ? 'text-amber-200' : 'text-amber-600'}`}>
                      {POSITION_LABELS_EN[idx]}: {card.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Canvas shadows gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
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
