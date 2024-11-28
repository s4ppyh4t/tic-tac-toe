import { useState } from 'react';
import './App.css';

type PlayerPos = {
    [key: string]: number | any
};

enum GameStatus { "On", "Win", "Tie" };

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

function App() {
    // VISUAL STATE
    // Visual gamestate and winning positions, only used for visual rendering
    const [gameState, setGameState] = useState<string[]>(Array(9).fill(""));
    const [winPos, setWinPos] = useState<number[]>();

    // GAME LOGIC'S STATE
    // 3-value state representing the game's status (Winner, Tied, On-going)
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.On);

    // PLAYER'S STATES
    // X starts, then O. swap at "makeMove"
    const [currPlayer, setCurrPlayer] = useState<string>("X");
    // Object representing player's points
    const [playerPos, setPlayerPos] = useState<PlayerPos>({
        "X": 0b000_000_000,
        "O": 0b000_000_000,
        "overall": function overall(this: PlayerPos) {
            return this.X | this.O
        },
    });

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
        const stateAsString = (playState: PlayerPos) : string[] => {
            const xState: string = playState.X.toString(2).padStart(9,'0').replaceAll('1','X');
            const oState: string = playState.O.toString(2).padStart(9,'0').replaceAll('1','O');
            const outState: string[] | string = Array(9).fill('');
    
            for(let i = 0; i < xState.length; i++) {
                outState[i] = xState[i] != '0' ? xState[i] : oState[i] != '0' ? oState[i] : '';
            }
    
            return outState.reverse();
        }

        // Make changes to player's positions on the board
        playerPos[currPlayer] |= (0b000_000_000 | 2 ** index);

        // Make changes to & Update "gameState" state
        setGameState(stateAsString(playerPos));
        
        // Update player's positions on the board
        setPlayerPos(
            {
                [currPlayer]: (playerPos[currPlayer] | (0b000_000_000 | 2 ** index)),
                ...playerPos
            }
        );

        // Return game's status (Win, On-going, Tie) 
        return checkWinner(playerPos, currPlayer)
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

    return (
        <>
            <div className="o-titleGrid">
                <h1>Tic-Tac-Toe game is <i>{gameStatus == GameStatus.On ? "on-going" : gameStatus == GameStatus.Tie ? "tied" : `finished! Winner is ${currPlayer}`}</i></h1>
                <p data-player={currPlayer}>Current Player: <b>{currPlayer}</b></p>
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
