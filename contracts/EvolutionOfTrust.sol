// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Evolution of Trust
 * @notice A blockchain-based Iterated Prisoner's Dilemma game
 * @dev Players stake ETH to play a 10-round trust game. Winner takes all.
 */
contract EvolutionOfTrust is ReentrancyGuard {

    // Game Constants
    uint256 public constant BOND_AMOUNT = 0.001 ether;
    uint8 public constant MAX_ROUNDS = 10;
    uint256 public constant TREASURY_FEE_BPS = 50; // 0.5% in basis points

    // Payoff Matrix
    int8 public constant BOTH_COOPERATE = 3;
    int8 public constant SUCKER_PAYOFF = 0;
    int8 public constant TEMPTATION = 5;
    int8 public constant BOTH_DEFECT = 1;

    // Game States
    enum GameState {
        WaitingForPlayers,
        InProgress,
        WaitingForMoves,
        RoundComplete,
        Finalized
    }

    // Game Struct
    struct Game {
        address playerA;
        address playerB;
        uint256 bondAmount;
        uint8 currentRound;
        bool[MAX_ROUNDS] movesA;      // true = cooperate, false = defect
        bool[MAX_ROUNDS] movesB;
        bool[MAX_ROUNDS] submittedA;  // track which rounds have been submitted
        bool[MAX_ROUNDS] submittedB;
        int256 scoreA;
        int256 scoreB;
        GameState state;
        uint256 createdAt;
        bool fundsWithdrawn;
    }

    // Storage
    mapping(uint256 => Game) public games;
    uint256 public gameCounter;
    uint256 public pendingGameId; // Game waiting for a second player
    address public treasury;

    // Events
    event GameCreated(uint256 indexed gameId, address indexed playerA);
    event GameStarted(uint256 indexed gameId, address indexed playerA, address indexed playerB);
    event MoveSubmitted(uint256 indexed gameId, address indexed player, uint8 round);
    event RoundCompleted(uint256 indexed gameId, uint8 round, int256 scoreA, int256 scoreB);
    event GameFinalized(uint256 indexed gameId, address indexed winner, uint256 prize);
    event FundsWithdrawn(uint256 indexed gameId, address indexed player, uint256 amount);

    // Errors
    error InvalidBondAmount();
    error GameNotFound();
    error NotAPlayer();
    error InvalidGameState();
    error MoveAlreadySubmitted();
    error GameNotFinalized();
    error FundsAlreadyWithdrawn();
    error NoGameToCancel();
    error TransferFailed();

    constructor(address _treasury) {
        treasury = _treasury;
    }

    /**
     * @notice Create a new game or join existing one
     * @dev First player creates game, second player joins automatically
     */
    function createOrJoinGame() external payable nonReentrant returns (uint256) {
        if (msg.value != BOND_AMOUNT) revert InvalidBondAmount();

        // Check if there's a pending game
        if (pendingGameId != 0) {
            Game storage game = games[pendingGameId];

            // Make sure the pending game is still waiting
            if (game.state == GameState.WaitingForPlayers) {
                // Join the existing game
                game.playerB = msg.sender;
                game.state = GameState.InProgress;
                game.bondAmount = BOND_AMOUNT * 2;

                uint256 gameId = pendingGameId;
                pendingGameId = 0; // Clear pending game

                emit GameStarted(gameId, game.playerA, game.playerB);
                return gameId;
            } else {
                // Pending game is no longer valid, clear it
                pendingGameId = 0;
            }
        }

        // Create a new game
        gameCounter++;
        uint256 gameId = gameCounter;

        Game storage newGame = games[gameId];
        newGame.playerA = msg.sender;
        newGame.bondAmount = BOND_AMOUNT;
        newGame.state = GameState.WaitingForPlayers;
        newGame.createdAt = block.timestamp;

        pendingGameId = gameId;

        emit GameCreated(gameId, msg.sender);
        return gameId;
    }

    /**
     * @notice Submit a move for the current round
     * @param gameId The game identifier
     * @param cooperate true for cooperate, false for defect
     */
    function submitMove(uint256 gameId, bool cooperate) external nonReentrant {
        Game storage game = games[gameId];

        if (game.state != GameState.InProgress && game.state != GameState.WaitingForMoves) {
            revert InvalidGameState();
        }

        bool isPlayerA = msg.sender == game.playerA;
        bool isPlayerB = msg.sender == game.playerB;

        if (!isPlayerA && !isPlayerB) revert NotAPlayer();

        uint8 round = game.currentRound;
        if (round >= MAX_ROUNDS) revert InvalidGameState();

        // Check if player already submitted for this round
        if (isPlayerA && game.submittedA[round]) revert MoveAlreadySubmitted();
        if (isPlayerB && game.submittedB[round]) revert MoveAlreadySubmitted();

        // Record the move
        if (isPlayerA) {
            game.movesA[round] = cooperate;
            game.submittedA[round] = true;
        } else {
            game.movesB[round] = cooperate;
            game.submittedB[round] = true;
        }

        emit MoveSubmitted(gameId, msg.sender, round);

        // Check if both players have submitted
        if (game.submittedA[round] && game.submittedB[round]) {
            _processRound(gameId, round);
        } else {
            game.state = GameState.WaitingForMoves;
        }
    }

    /**
     * @notice Process a round and calculate scores
     * @param gameId The game identifier
     * @param round The round number
     */
    function _processRound(uint256 gameId, uint8 round) internal {
        Game storage game = games[gameId];

        bool moveA = game.movesA[round];
        bool moveB = game.movesB[round];

        int8 payoffA;
        int8 payoffB;

        // Calculate payoffs based on moves
        if (moveA && moveB) {
            // Both cooperate
            payoffA = BOTH_COOPERATE;
            payoffB = BOTH_COOPERATE;
        } else if (moveA && !moveB) {
            // A cooperates, B defects
            payoffA = SUCKER_PAYOFF;
            payoffB = TEMPTATION;
        } else if (!moveA && moveB) {
            // A defects, B cooperates
            payoffA = TEMPTATION;
            payoffB = SUCKER_PAYOFF;
        } else {
            // Both defect
            payoffA = BOTH_DEFECT;
            payoffB = BOTH_DEFECT;
        }

        game.scoreA += payoffA;
        game.scoreB += payoffB;

        emit RoundCompleted(gameId, round, game.scoreA, game.scoreB);

        // Move to next round or finalize
        game.currentRound++;

        if (game.currentRound >= MAX_ROUNDS) {
            _finalizeGame(gameId);
        } else {
            game.state = GameState.InProgress;
        }
    }

    /**
     * @notice Finalize the game and determine winner
     * @param gameId The game identifier
     */
    function _finalizeGame(uint256 gameId) internal {
        Game storage game = games[gameId];

        game.state = GameState.Finalized;

        address winner;
        if (game.scoreA > game.scoreB) {
            winner = game.playerA;
        } else if (game.scoreB > game.scoreA) {
            winner = game.playerB;
        }
        // If tie, winner stays address(0)

        uint256 totalPrize = game.bondAmount;

        emit GameFinalized(gameId, winner, totalPrize);
    }

    /**
     * @notice Withdraw winnings after game is finalized
     * @param gameId The game identifier
     */
    function withdrawWinnings(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];

        if (game.state != GameState.Finalized) revert GameNotFinalized();
        if (game.fundsWithdrawn) revert FundsAlreadyWithdrawn();

        bool isPlayerA = msg.sender == game.playerA;
        bool isPlayerB = msg.sender == game.playerB;

        if (!isPlayerA && !isPlayerB) revert NotAPlayer();

        game.fundsWithdrawn = true;

        uint256 totalPrize = game.bondAmount;
        uint256 treasuryFee = (totalPrize * TREASURY_FEE_BPS) / 10000;
        uint256 netPrize = totalPrize - treasuryFee;

        // Determine payout
        if (game.scoreA > game.scoreB) {
            // Player A wins
            if (!isPlayerA) revert NotAPlayer();

            _transfer(game.playerA, netPrize);
            if (treasuryFee > 0) {
                _transfer(treasury, treasuryFee);
            }

            emit FundsWithdrawn(gameId, game.playerA, netPrize);

        } else if (game.scoreB > game.scoreA) {
            // Player B wins
            if (!isPlayerB) revert NotAPlayer();

            _transfer(game.playerB, netPrize);
            if (treasuryFee > 0) {
                _transfer(treasury, treasuryFee);
            }

            emit FundsWithdrawn(gameId, game.playerB, netPrize);

        } else {
            // Tie - split evenly
            uint256 halfPrize = netPrize / 2;

            _transfer(game.playerA, halfPrize);
            _transfer(game.playerB, halfPrize);

            if (treasuryFee > 0) {
                _transfer(treasury, treasuryFee);
            }

            emit FundsWithdrawn(gameId, msg.sender, halfPrize);
        }
    }

    /**
     * @notice Cancel a game that hasn't started yet and get refund
     */
    function cancelGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];

        if (game.state != GameState.WaitingForPlayers) revert InvalidGameState();
        if (msg.sender != game.playerA) revert NotAPlayer();
        if (game.fundsWithdrawn) revert FundsAlreadyWithdrawn();

        game.fundsWithdrawn = true;
        game.state = GameState.Finalized;

        // Clear pending game if this was it
        if (pendingGameId == gameId) {
            pendingGameId = 0;
        }

        _transfer(game.playerA, BOND_AMOUNT);

        emit FundsWithdrawn(gameId, game.playerA, BOND_AMOUNT);
    }

    /**
     * @notice Helper function to transfer ETH safely
     */
    function _transfer(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Get game details
     */
    function getGame(uint256 gameId) external view returns (
        address playerA,
        address playerB,
        uint8 currentRound,
        int256 scoreA,
        int256 scoreB,
        GameState state,
        bool fundsWithdrawn
    ) {
        Game storage game = games[gameId];
        return (
            game.playerA,
            game.playerB,
            game.currentRound,
            game.scoreA,
            game.scoreB,
            game.state,
            game.fundsWithdrawn
        );
    }

    /**
     * @notice Get moves for a specific round (only after round is complete)
     */
    function getRoundMoves(uint256 gameId, uint8 round) external view returns (
        bool moveA,
        bool moveB,
        bool submittedA,
        bool submittedB
    ) {
        Game storage game = games[gameId];

        return (
            game.movesA[round],
            game.movesB[round],
            game.submittedA[round],
            game.submittedB[round]
        );
    }

    /**
     * @notice Get pending game ID
     */
    function getPendingGame() external view returns (uint256) {
        return pendingGameId;
    }
}
