'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

interface MathQuestion {
  question: string
  answer: number
  options: number[]
  position: number
}

function Road() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[10, 1000]} />
      <meshStandardMaterial color="#333333" />
    </mesh>
  )
}

function Lane({ position, color }: { position: number; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position, -0.49, 0]}>
      <planeGeometry args={[0.1, 1000]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function Car({ position }: { position: number }) {
  return (
    <group position={[position, 0, 10]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.5, 0.6, 2.5]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      <mesh position={[0, 0.8, -0.3]}>
        <boxGeometry args={[1.4, 0.6, 1.2]} />
        <meshStandardMaterial color="#660000" />
      </mesh>
      <mesh position={[-0.6, -0.1, 0.6]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.6, -0.1, 0.6]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[-0.6, -0.1, -0.6]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.6, -0.1, -0.6]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  )
}

function AnswerGate({ position, value, isCorrect, speed, onCollision }: {
  position: number;
  value: number;
  isCorrect: boolean;
  speed: number;
  onCollision: (isCorrect: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hasCollided, setHasCollided] = useState(false)

  useEffect(() => {
    if (meshRef.current && !hasCollided) {
      const gateZ = meshRef.current.position.z
      if (gateZ > 9 && gateZ < 11) {
        setHasCollided(true)
        onCollision(isCorrect)
      }
    }
  }, [speed, isCorrect, onCollision, hasCollided])

  return (
    <group position={[position, 0.5, -50 + speed * 0.02]}>
      <mesh ref={meshRef} position={[0, 1, 0]}>
        <boxGeometry args={[2, 2, 0.5]} />
        <meshStandardMaterial
          color={isCorrect ? '#00ff00' : '#ff0000'}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh position={[-1.2, 0, 0]}>
        <boxGeometry args={[0.3, 2, 0.3]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[1.2, 0, 0]}>
        <boxGeometry args={[0.3, 2, 0.3]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function Scene({
  carPosition,
  questions,
  speed,
  onAnswer
}: {
  carPosition: number;
  questions: MathQuestion[];
  speed: number;
  onAnswer: (isCorrect: boolean) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />

      <Road />
      <Lane position={-3} color="#ffff00" />
      <Lane position={0} color="#ffff00" />
      <Lane position={3} color="#ffff00" />

      <Car position={carPosition} />

      {questions.map((q, idx) => (
        <AnswerGate
          key={idx}
          position={q.position}
          value={q.options[0]}
          isCorrect={q.options[0] === q.answer}
          speed={speed}
          onCollision={onAnswer}
        />
      ))}
    </>
  )
}

function generateQuestion(difficulty: number): MathQuestion {
  const operations = ['+', '-', '*']
  const op = operations[Math.floor(Math.random() * operations.length)]

  let a, b, answer

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * (10 + difficulty * 5)) + 1
      b = Math.floor(Math.random() * (10 + difficulty * 5)) + 1
      answer = a + b
      break
    case '-':
      a = Math.floor(Math.random() * (10 + difficulty * 5)) + 10
      b = Math.floor(Math.random() * a) + 1
      answer = a - b
      break
    case '*':
      a = Math.floor(Math.random() * (5 + difficulty * 2)) + 2
      b = Math.floor(Math.random() * (5 + difficulty * 2)) + 2
      answer = a * b
      break
    default:
      a = 1
      b = 1
      answer = 2
  }

  const wrongAnswers = new Set<number>()
  while (wrongAnswers.size < 2) {
    const wrong: number = answer + (Math.floor(Math.random() * 10) - 5)
    if (wrong !== answer && wrong > 0) {
      wrongAnswers.add(wrong)
    }
  }

  const options = [answer, ...Array.from(wrongAnswers)]
  const positions = [-3, 0, 3]

  return {
    question: `${a} ${op} ${b} = ?`,
    answer,
    options: options.sort(() => Math.random() - 0.5),
    position: positions[Math.floor(Math.random() * positions.length)]
  }
}

export default function Game() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu')
  const [score, setScore] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [carPosition, setCarPosition] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null)
  const [questions, setQuestions] = useState<MathQuestion[]>([])

  useEffect(() => {
    if (gameState !== 'playing') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && carPosition > -3) {
        setCarPosition(carPosition - 3)
      } else if (e.key === 'ArrowRight' && carPosition < 3) {
        setCarPosition(carPosition + 3)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, carPosition])

  useEffect(() => {
    if (gameState !== 'playing') return

    const interval = setInterval(() => {
      setSpeed(s => s + 1)
    }, 50)

    return () => clearInterval(interval)
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing' && speed % 100 === 0) {
      const newQuestion = generateQuestion(Math.floor(score / 5))
      setCurrentQuestion(newQuestion)
      setQuestions([newQuestion])
    }
  }, [speed, gameState, score])

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 1)
    } else {
      setGameState('gameover')
    }
    setQuestions([])
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setSpeed(0)
    setCarPosition(0)
    setQuestions([])
    setCurrentQuestion(null)
  }

  if (gameState === 'menu') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #1e3a8a, #7c3aed)',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '2rem', fontWeight: 'bold' }}>3D Math Racer</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '3rem' }}>Drive through the correct answers!</p>
        <button
          onClick={startGame}
          style={{
            fontSize: '1.5rem',
            padding: '1rem 3rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Start Game
        </button>
        <p style={{ marginTop: '2rem', fontSize: '1.2rem' }}>Use ← → arrow keys to move</p>
      </div>
    )
  }

  if (gameState === 'gameover') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #7f1d1d, #dc2626)',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '2rem', fontWeight: 'bold' }}>Game Over!</h1>
        <p style={{ fontSize: '2rem', marginBottom: '3rem' }}>Final Score: {score}</p>
        <button
          onClick={startGame}
          style={{
            fontSize: '1.5rem',
            padding: '1rem 3rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Play Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        color: 'white',
        fontSize: '2rem',
        fontWeight: 'bold',
        zIndex: 10,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        Score: {score}
      </div>

      {currentQuestion && (
        <div style={{
          position: 'absolute',
          top: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          zIndex: 10,
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          {currentQuestion.question}
        </div>
      )}

      <Canvas camera={{ position: [0, 5, 20], fov: 75 }}>
        <Suspense fallback={null}>
          <Scene
            carPosition={carPosition}
            questions={questions}
            speed={speed}
            onAnswer={handleAnswer}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
