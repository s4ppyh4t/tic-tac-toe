import { useState } from 'react';
import './App.css';

type PlayerPos = {
    [key: string]: number | any
};

export enum GameStatus { "On", "Win", "Tie" };

// Will be divided into cases, from 0-7
const WINNING_STATE: number[] = [
    0b000_000_111, // first row
    0b000_111_000, // second row
    0b111_000_000, // third row
    0b001_001_001, // first col
    0b010_010_010, // second col
    0b100_100_100, // third col
    0b100_010_001, // topleft diag
    0b001_010_100, // topright diag
]

// Identical mapping to WINNING_STATE, only used to create winning draws
const WINNING_POS: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
]

// Default Player's position values
const DEFAULT_PLAYER_POS = {
    "X": 0b000_000_000,
    "O": 0b000_000_000,
    "overall": function overall(this: PlayerPos) {
        return this.X | this.O
    },
}

function App() {
    // VISUAL STATE
    // Visual gamestate and winning positions, only used for visual rendering
    const [gameState, setGameState] = useState<string[]>(Array(9).fill(""));
    const [winPos, setWinPos] = useState<number[]>();

    // GAME LOGIC'S STATE
    // 3-value state representing the game's status (Winner, Tied, On-going)
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.On);
    // Object representing player's position in 9-bit binary
    const [playerPos, setPlayerPos] = useState<PlayerPos>(DEFAULT_PLAYER_POS);

    // PLAYER'S STATES
    // X starts, then O. swap at "makeMove"
    const [currPlayer, setCurrPlayer] = useState<'X' | 'O'>("X");

    // swap the player who takes next move
    function switchPlayer(): void {
        setCurrPlayer(currPlayer == "X" ? "O" : "X");
    }

    // Return status of the game based on current move of current player
    function checkWinner(pos: PlayerPos, player: string): GameStatus {
        for (let i = 0; i < WINNING_STATE.length; i++) {
            if (pos[player] == (pos[player] | WINNING_STATE[i])) {
                setWinPos(WINNING_POS[i]);
                return GameStatus.Win;
            }
        }
        // Announce Tie game if all tiles are filled without Winner (tile values at 111_111_111)
        if (pos.overall() == 0b111_111_111) {
            return GameStatus.Tie
        }
        else {
            return GameStatus.On
        }
    }

    function updateAndCheckGameState(index: number): GameStatus {
        // Generate string array representing gamestate based on players' positions.
        const posAsString = (playPos: PlayerPos) : string[] => {
            const xPos: string = playPos.X.toString(2).padStart(9,'0').replaceAll('1','X');
            const oPos: string = playPos.O.toString(2).padStart(9,'0').replaceAll('1','O');
            const outPos: string[] | string = Array(9).fill('');
    
            for(let i = 0; i < xPos.length; i++) {
                outPos[i] = xPos[i] != '0' ? xPos[i] : oPos[i] != '0' ? oPos[i] : '';
            }
    
            return outPos.reverse();
        }

        // Make changes to player's positions on the board
        
        // !CHANGES: No longer mutate the immutable, stateful `playerPos` anymore. 
        // !Instead assigns a new variable with new values, and pass them in subsequent functions

        let newPlayerPos : PlayerPos = {
            ...playerPos,
            [currPlayer]: playerPos[currPlayer] | (0b000_000_000 | 2 ** index),
        }

        // Make changes to & Update "gameState" state
        setGameState(posAsString(newPlayerPos));
        
        // Update player's positions on the board
        setPlayerPos(newPlayerPos);

        // Return game's status (Win, On-going, Tie) 
        return checkWinner(newPlayerPos, currPlayer)
    }

    function makeMove(index: number): void {
        // Move of a player starts here
        // 1. Check and skip if current tile is filled
        if (gameState[index] != '') {
            return
        }
        
        // 2. Update game state based on current tile's index,  
        const status: GameStatus = updateAndCheckGameState(index);

        // 3. Update game status
        setGameStatus(status);
        
        // 4. Update next player's symbol (if game continues)
        status != GameStatus.Win ? switchPlayer() : 0;
    }

    // Refresh ALL game states into default state for next render
    function restartGame(): void {
        setGameStatus(GameStatus.On);
        setGameState(Array(9).fill(""));
        setWinPos(undefined);
        setPlayerPos(DEFAULT_PLAYER_POS);
        setCurrPlayer("X");
    }

    return (
        <>
            <div className="o-titleGrid">
                <h1>Tic-Tac-Toe game is <i>{gameStatus == GameStatus.On ? "on-going" : gameStatus == GameStatus.Tie ? "tied" : `finished! Winner is ${currPlayer}`}</i></h1>
                <p data-player={currPlayer}>Current Player: <b>{currPlayer}</b></p>
                <button id="restart-btn" onClick={restartGame}>Restart Game</button>
            </div>
            <div className='o-gameGrid'>
                {
                    gameState.map((tile, index) => {
                        return (
                            <button 
                                key={index} 
                                className={winPos?.includes(index) ? "u-highlight" : ""}
                                onClick={() => makeMove(index)} 
                                disabled={gameStatus > GameStatus.On ? true : false}
                                data-player={tile}
                            >
                                {tile}
                            </button>
                        )
                    })
                }
            </div>
        </>
    )
}

export default App
