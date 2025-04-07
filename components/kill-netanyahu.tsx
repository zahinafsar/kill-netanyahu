"use client";

import { useEffect, useRef, useState } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { createUser, updateUserScore, loginUser } from "@/app/actions";
import { ModalOverlay } from "@/components/modal-overlay";
import { FormContainer } from "@/components/form-container";
import { ScoreDisplay } from "@/components/score-display";
import { CustomInput } from "@/components/custom-input";
import { CustomButton } from "./custom-button";
import { TopScoreCard } from "@/components/top-score-card";
import { Maximize2, Minimize2 } from "lucide-react";

// Game constants
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const GROUND_HEIGHT = 50;
const OBSTACLE_SPEED_INITIAL = 5;
const SPEED_INCREMENT = 0.005;
const OBSTACLE_INTERVAL_MIN = 800;
const OBSTACLE_INTERVAL_MAX = 2000;
const CACTUS_WIDTH = 30;
const CACTUS_HEIGHT = 60;
const PLAYER_WIDTH = 100;
const PLAYER_HEIGHT = 80;
const ENEMY_WIDTH = 100;
const ENEMY_HEIGHT = 80;
const INITIAL_DISTANCE = 300;
const DISTANCE_DECREASE = 50;
const MIN_SAFE_DISTANCE = 50;
const GAME_ASPECT_RATIO = 16 / 9;

export default function KillNetanyahu() {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const enemyRef = useRef<HTMLDivElement>(null);

  // State
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [enemyPosition, setEnemyPosition] = useState({ x: 0, y: 0 });
  const [safeDistance, setSafeDistance] = useState(100);
  const [isLandscape, setIsLandscape] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPin, setUserPin] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isMobile = useMobile();

  // Game state refs
  const gameStateRef = useRef({
    player: {
      x: 0,
      y: 0,
      velocityY: 0,
      isJumping: false,
    },
    enemy: {
      x: 0,
      y: 0,
    },
    obstacles: [] as { x: number; width: number; height: number }[],
    gameSpeed: OBSTACLE_SPEED_INITIAL,
    lastObstacleTime: 0,
    nextObstacleInterval: 0,
    score: 0,
    animationFrameId: 0,
    groundY: 0,
    distance: INITIAL_DISTANCE,
    collisionTime: 0,
    worldOffset: 0,
    flashEffect: false,
  });

  // Update dimensions on resize and fullscreen changes
  useEffect(() => {
    const updateDimensions = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const isLandscapeMode = window.innerWidth > window.innerHeight;
        setIsLandscape(isLandscapeMode);

        let gameWidth, gameHeight;
        if (containerWidth / containerHeight > GAME_ASPECT_RATIO) {
          gameHeight = containerHeight;
          gameWidth = gameHeight * GAME_ASPECT_RATIO;
        } else {
          gameWidth = containerWidth;
          gameHeight = gameWidth / GAME_ASPECT_RATIO;
        }

        setDimensions({
          width: gameWidth,
          height: gameHeight,
        });
      }
    };

    // Initial update
    updateDimensions();

    // Add all event listeners
    window.addEventListener("resize", updateDimensions);
    window.addEventListener("orientationchange", updateDimensions);
    document.addEventListener("fullscreenchange", updateDimensions);
    document.addEventListener("webkitfullscreenchange", updateDimensions);
    document.addEventListener("mozfullscreenchange", updateDimensions);
    document.addEventListener("MSFullscreenChange", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
      document.removeEventListener("fullscreenchange", updateDimensions);
      document.removeEventListener("webkitfullscreenchange", updateDimensions);
      document.removeEventListener("mozfullscreenchange", updateDimensions);
      document.removeEventListener("MSFullscreenChange", updateDimensions);
    };
  }, []);

  // Handle keyboard and touch events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.code === "Space" || e.code === "ArrowUp") &&
        !gameStateRef.current.player.isJumping
      ) {
        jump();
      }

      if (e.code === "Space" && gameOver) {
        restartGame();
      }
    };

    const handleTouchStart = () => {
      if (!gameStateRef.current.player.isJumping) {
        jump();
      }

      if (gameOver) {
        restartGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, [gameOver]);

  // Initialize game
  useEffect(() => {
    if (
      gameStarted &&
      !gameOver &&
      dimensions.width > 0 &&
      dimensions.height > 0
    ) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas dimensions
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const groundY = dimensions.height - GROUND_HEIGHT;
      const playerX = dimensions.width / 2; // Center of screen

      // Reset game state
      gameStateRef.current = {
        player: {
          x: playerX,
          y: groundY - PLAYER_HEIGHT,
          velocityY: 0,
          isJumping: false,
        },
        enemy: {
          x: playerX - INITIAL_DISTANCE, // Start at initial distance from player
          y: groundY - ENEMY_HEIGHT,
        },
        obstacles: [],
        gameSpeed: OBSTACLE_SPEED_INITIAL,
        lastObstacleTime: 0,
        nextObstacleInterval: getRandomInterval(),
        score: 0,
        animationFrameId: 0,
        groundY,
        distance: INITIAL_DISTANCE,
        collisionTime: 0,
        worldOffset: 0,
        flashEffect: false,
      };

      // Update initial positions
      setPlayerPosition({
        x: playerX - PLAYER_WIDTH / 2,
        y: groundY - PLAYER_HEIGHT,
      });

      setEnemyPosition({
        x: playerX - INITIAL_DISTANCE,
        y: groundY - ENEMY_HEIGHT,
      });

      setSafeDistance(100);

      // Start game loop
      let lastTime = 0;
      const animate = (time: number) => {
        if (lastTime === 0) {
          lastTime = time;
        }
        const deltaTime = time - lastTime;
        lastTime = time;

        update(deltaTime);
        draw(ctx);

        if (!gameOver) {
          gameStateRef.current.animationFrameId =
            requestAnimationFrame(animate);
        }
      };

      gameStateRef.current.animationFrameId = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(gameStateRef.current.animationFrameId);
      };
    }
  }, [gameStarted, gameOver, dimensions]);

  // Game logic functions
  const jump = () => {
    if (!gameStateRef.current.player.isJumping) {
      gameStateRef.current.player.velocityY = JUMP_FORCE;
      gameStateRef.current.player.isJumping = true;
    }
  };

  const getRandomInterval = () => {
    return Math.floor(
      Math.random() * (OBSTACLE_INTERVAL_MAX - OBSTACLE_INTERVAL_MIN) +
        OBSTACLE_INTERVAL_MIN
    );
  };

  const update = (deltaTime: number) => {
    const gameState = gameStateRef.current;

    // Update player position
    gameState.player.y += gameState.player.velocityY;
    gameState.player.velocityY += GRAVITY;

    // Ground collision
    if (gameState.player.y > gameState.groundY - PLAYER_HEIGHT) {
      gameState.player.y = gameState.groundY - PLAYER_HEIGHT;
      gameState.player.velocityY = 0;
      gameState.player.isJumping = false;
    }

    // Update enemy position
    gameState.enemy.x = gameState.player.x - gameState.distance;
    gameState.enemy.y = gameState.groundY - ENEMY_HEIGHT;

    // Update positions
    setPlayerPosition({
      x: gameState.player.x - PLAYER_WIDTH / 2,
      y: gameState.player.y,
    });

    setEnemyPosition({
      x: gameState.enemy.x,
      y: gameState.enemy.y,
    });

    // Update safe distance
    const safeDistancePercentage =
      ((gameState.distance - MIN_SAFE_DISTANCE) /
        (INITIAL_DISTANCE - MIN_SAFE_DISTANCE)) *
      100;
    setSafeDistance(safeDistancePercentage);

    // Update world offset
    gameState.worldOffset += gameState.gameSpeed;

    // Create new obstacles
    const currentTime = performance.now();
    if (
      currentTime - gameState.lastObstacleTime >
      gameState.nextObstacleInterval
    ) {
      gameState.obstacles.push({
        x: dimensions.width + gameState.worldOffset,
        width: CACTUS_WIDTH,
        height: CACTUS_HEIGHT,
      });
      gameState.lastObstacleTime = currentTime;
      gameState.nextObstacleInterval = getRandomInterval();
    }

    // Update obstacles
    for (let i = 0; i < gameState.obstacles.length; i++) {
      if (
        gameState.obstacles[i].x + gameState.obstacles[i].width <
        gameState.worldOffset - dimensions.width
      ) {
        gameState.obstacles.splice(i, 1);
        i--;
      }
    }

    // Check collisions
    for (let i = 0; i < gameState.obstacles.length; i++) {
      const obstacle = gameState.obstacles[i];
      const obstacleScreenX = obstacle.x - gameState.worldOffset;

      const playerLeft = gameState.player.x - PLAYER_WIDTH / 2;
      const playerRight = playerLeft + PLAYER_WIDTH;
      const playerTop = gameState.player.y;
      const playerBottom = playerTop + PLAYER_HEIGHT;

      const obstacleLeft = obstacleScreenX;
      const obstacleRight = obstacleLeft + obstacle.width;
      const obstacleTop = gameState.groundY - obstacle.height;
      const obstacleBottom = gameState.groundY;

      if (
        playerRight > obstacleLeft &&
        playerLeft < obstacleRight &&
        playerBottom > obstacleTop &&
        playerTop < obstacleBottom
      ) {
        const newDistance = Math.max(
          MIN_SAFE_DISTANCE,
          gameState.distance - DISTANCE_DECREASE
        );
        gameState.distance = newDistance;
        gameState.collisionTime = currentTime;
        gameState.flashEffect = true;

        gameState.obstacles.splice(i, 1);
        i--;

        if (newDistance <= MIN_SAFE_DISTANCE) {
          endGame();
          return;
        }

        break;
      }
    }

    // Reset flash effect
    if (gameState.flashEffect && currentTime - gameState.collisionTime > 300) {
      gameState.flashEffect = false;
    }

    // Update game speed and score
    gameState.gameSpeed += SPEED_INCREMENT * (deltaTime / 16);
    gameState.score += 0.1;
    setScore(Math.floor(gameState.score));
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const gameState = gameStateRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw sky
    const gradient = ctx.createLinearGradient(0, 0, 0, gameState.groundY);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F7FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dimensions.width, gameState.groundY);

    // Draw clouds
    const cloudOffset = (gameState.worldOffset * 0.2) % dimensions.width;
    ctx.fillStyle = "#FFFFFF";

    // First set of clouds
    ctx.beginPath();
    ctx.arc(100 - cloudOffset, 50, 20, 0, Math.PI * 2);
    ctx.arc(130 - cloudOffset, 50, 25, 0, Math.PI * 2);
    ctx.arc(160 - cloudOffset, 50, 20, 0, Math.PI * 2);
    ctx.fill();

    // Duplicate clouds
    ctx.beginPath();
    ctx.arc(100 - cloudOffset + dimensions.width, 50, 20, 0, Math.PI * 2);
    ctx.arc(130 - cloudOffset + dimensions.width, 50, 25, 0, Math.PI * 2);
    ctx.arc(160 - cloudOffset + dimensions.width, 50, 20, 0, Math.PI * 2);
    ctx.fill();

    // Second set of clouds
    ctx.beginPath();
    ctx.arc(400 - cloudOffset * 0.5, 80, 20, 0, Math.PI * 2);
    ctx.arc(430 - cloudOffset * 0.5, 80, 25, 0, Math.PI * 2);
    ctx.arc(460 - cloudOffset * 0.5, 80, 20, 0, Math.PI * 2);
    ctx.fill();

    // Duplicate second set
    ctx.beginPath();
    ctx.arc(400 - cloudOffset * 0.5 + dimensions.width, 80, 20, 0, Math.PI * 2);
    ctx.arc(430 - cloudOffset * 0.5 + dimensions.width, 80, 25, 0, Math.PI * 2);
    ctx.arc(460 - cloudOffset * 0.5 + dimensions.width, 80, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw ground
    const groundPattern = (gameState.worldOffset % 40) / 40;
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, gameState.groundY, dimensions.width, GROUND_HEIGHT);

    // Ground pattern
    ctx.fillStyle = "#7B3503";
    for (let i = 0; i < dimensions.width / 40 + 1; i++) {
      ctx.fillRect(i * 40 - groundPattern * 40, gameState.groundY, 20, 5);
    }

    // Grass
    ctx.fillStyle = "#7CFC00";
    ctx.fillRect(0, gameState.groundY - 5, dimensions.width, 5);

    // Draw obstacles
    for (const obstacle of gameState.obstacles) {
      const obstacleScreenX = obstacle.x - gameState.worldOffset;
      drawRock(
        ctx,
        obstacleScreenX,
        gameState.groundY - obstacle.height,
        obstacle.width,
        obstacle.height
      );
    }

    // Draw score
    ctx.fillStyle = "#000000";
    ctx.font = "24px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      `Score: ${Math.floor(gameState.score)}`,
      dimensions.width - 20,
      40
    );
  };

  const drawRock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = "#808080";

    // Draw rock shape
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + height * 0.7);
    ctx.lineTo(x + width * 0.3, y + height * 0.4);
    ctx.lineTo(x + width * 0.7, y + height * 0.2);
    ctx.lineTo(x + width, y + height * 0.5);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();

    // Add details
    ctx.strokeStyle = "#606060";
    ctx.beginPath();
    ctx.moveTo(x + width * 0.2, y + height * 0.6);
    ctx.lineTo(x + width * 0.4, y + height * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + width * 0.6, y + height * 0.4);
    ctx.lineTo(x + width * 0.8, y + height * 0.6);
    ctx.stroke();
  };

  // Game control functions
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
  };

  const endGame = async () => {
    setGameOver(true);
    cancelAnimationFrame(gameStateRef.current.animationFrameId);
  };

  const restartGame = async () => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      setShowLoginForm(true);
      return;
    }

    updateUserScore(storedUserId, score);
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPin.trim()) return;

    try {
      let user;
      if (isNewUser) {
        user = await createUser(userName, userPin);
      } else {
        user = await loginUser(userName, userPin);
        if (!user) {
          setLoginError("Invalid credentials");
          return;
        }
      }

      localStorage.setItem("userId", user.id);
      setShowLoginForm(false);
      setLoginError("");
    } catch (error) {
      console.error("Error in login:", error);
      setLoginError("An error occurred. Please try again.");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center bg-sky-100"
      >
        <button
          className="absolute top-5 left-5 w-10 h-10 bg-black/80 text-white flex items-center justify-center cursor-pointer rounded-md hover:bg-black transition-colors z-50"
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
        <div
          className="relative overflow-hidden"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            maxWidth: "100%",
            maxHeight: "100%",
            aspectRatio: GAME_ASPECT_RATIO,
          }}
        >
          {/* Canvas for background and obstacles */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            width={dimensions.width}
            height={dimensions.height}
          />

          {/* Distance bar */}
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-[200px] h-5 bg-red-300 border-2 border-black">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${safeDistance}%` }}
            ></div>
            <p className="absolute whitespace-nowrap top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold">
              SAFE DISTANCE
            </p>
          </div>

          {/* Player div */}
          <div
            ref={playerRef}
            className="absolute"
            style={{
              width: `${PLAYER_WIDTH}px`,
              height: `${PLAYER_HEIGHT}px`,
              left: `${playerPosition.x || -9999}px`,
              top: `${playerPosition.y || -9999}px`,
              transition: "none",
            }}
          >
            <img
              src="/netanyahu.png"
              alt="netanyahu"
              className="absolute"
              style={{
                marginTop: `-30px`,
                marginLeft: `30px`,
                width: `${PLAYER_WIDTH / 2}px`,
              }}
            />
            <img src="/human.gif" alt="Player" />
          </div>

          {/* Enemy div */}
          <div
            ref={enemyRef}
            className="absolute"
            style={{
              width: `${ENEMY_WIDTH}px`,
              height: `${ENEMY_HEIGHT}px`,
              left: `${enemyPosition.x || -9999}px`,
              top: `${enemyPosition.y || -9999}px`,
              transition: "none",
            }}
          >
            {[
              { filter: "brightness(1.2) contrast(1.2)", marginLeft: "0px" },
              { filter: "brightness(0.8) contrast(1.4)", marginLeft: "-20px" },
              { filter: "brightness(1.4) contrast(0.9)", marginLeft: "-40px" },
              { filter: "brightness(0.9) contrast(1.6)", marginLeft: "-60px" },
              { filter: "brightness(1.2) contrast(1.2)", marginLeft: "-80px" },
              { filter: "brightness(0.8) contrast(1.4)", marginLeft: "-100px" },
              { filter: "brightness(1.4) contrast(0.9)", marginLeft: "-120px" },
              { filter: "brightness(0.9) contrast(1.6)", marginLeft: "-140px" },
            ].map((style, index) => (
              <img
                key={index}
                src="/human.gif"
                alt="Enemy"
                style={{
                  position: "absolute",
                  filter: style.filter,
                  marginLeft: style.marginLeft,
                }}
              />
            ))}
          </div>

          {/* Flash effect on collision */}
          {gameStateRef.current?.flashEffect && (
            <div className="absolute inset-0 bg-red-500 opacity-30"></div>
          )}

          {!gameStarted && (
            <ModalOverlay>
              {isMobile && !isLandscape ? (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50">
                  <p className="text-white text-2xl px-4 text-center font-bold">
                    This game works best in landscape mode
                  </p>
                </div>
              ) : (
                <FormContainer title="Kill Netanyahu" className="max-w-2xl">
                  <TopScoreCard />
                  <CustomButton onClick={startGame} className="w-full">
                    Start Game
                  </CustomButton>
                </FormContainer>
              )}
            </ModalOverlay>
          )}

          {gameOver && (
            <ModalOverlay>
              {showLoginForm ? (
                <FormContainer
                  title={`${isNewUser ? "Create Account" : "Login"} to Play`}
                >
                  <form
                    onSubmit={handleLoginSubmit}
                    className="flex flex-col items-center gap-4 w-full"
                  >
                    <CustomInput
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your name"
                    />
                    <CustomInput
                      type="password"
                      value={userPin}
                      onChange={(e) => setUserPin(e.target.value)}
                      placeholder="PIN"
                      error={loginError}
                    />
                    <div className="flex gap-2 w-full">
                      <CustomButton
                        type="button"
                        variant="outline"
                        onClick={() => setIsNewUser(!isNewUser)}
                        className="w-full"
                      >
                        {isNewUser
                          ? "Already have an account?"
                          : "Create new account?"}
                      </CustomButton>
                      <CustomButton type="submit" className="w-full">
                        {isNewUser ? "Create Account" : "Login"}
                      </CustomButton>
                    </div>
                  </form>
                </FormContainer>
              ) : (
                <FormContainer title="Game Over!">
                  <div className="w-full space-y-4 mb-8">
                    <ScoreDisplay label="Score" value={score} />
                  </div>
                  <CustomButton onClick={restartGame}>Play Again</CustomButton>
                </FormContainer>
              )}
            </ModalOverlay>
          )}
        </div>
      </div>
    </>
  );
}
