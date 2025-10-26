/**
 * Crypto Game Controller - Web3 Multiplayer Evolution of Trust
 */

// Contract ABI (simplified - only the functions we need)
const CONTRACT_ABI = [
    "function createOrJoinGame() external payable returns (uint256)",
    "function submitMove(uint256 gameId, bool cooperate) external",
    "function withdrawWinnings(uint256 gameId) external",
    "function cancelGame(uint256 gameId) external",
    "function getGame(uint256 gameId) external view returns (address, address, uint8, int256, int256, uint8, bool)",
    "function getRoundMoves(uint256 gameId, uint8 round) external view returns (bool, bool, bool, bool)",
    "function getPendingGame() external view returns (uint256)",
    "event GameCreated(uint256 indexed gameId, address indexed playerA)",
    "event GameStarted(uint256 indexed gameId, address indexed playerA, address indexed playerB)",
    "event MoveSubmitted(uint256 indexed gameId, address indexed player, uint8 round)",
    "event RoundCompleted(uint256 indexed gameId, uint8 round, int256 scoreA, int256 scoreB)",
    "event GameFinalized(uint256 indexed gameId, address indexed winner, uint256 prize)"
];

// Deployed on Base Sepolia
const CONTRACT_ADDRESS = "0xa2eE3C8bc9511De79b3CA5868A42526a271Ccb35";
const EXPECTED_CHAIN_ID = 84532; // Base Sepolia
const NETWORK_NAME = "Base Sepolia";

const BOND_AMOUNT = "0.001"; // ETH

// Educational snippets to show between rounds
const EDUCATIONAL_SNIPPETS = [
    "Choose wisely. Your opponent is choosing simultaneously.",
    "This is a repeated game: reputation matters.",
    "Trust can be built over multiple rounds.",
    "In crypto, we built systems that don't require trust...",
    "Cooperation benefits both. Betrayal benefits one.",
    "Will you trust again after being betrayed?",
    "Blockchain remembers every move forever.",
    "Repetition builds reputation.",
    "The temptation to cheat is strong—but risky.",
    "The next challenge is building systems that deserve trust."
];

class CryptoGame {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.walletAddress = null;
        this.currentGameId = null;
        this.pendingGameId = null; // Game ID to load after wallet connection
        this.currentRound = 0;
        this.playerScores = { player: 0, opponent: 0 };
        this.isPlayerA = false;
        this.gameState = 'disconnected';
        this.pollInterval = null;
        this.ensCache = new Map(); // Cache for ENS lookups
    }

    /**
     * Connect to wallet
     */
    async connectWallet() {
        try {
            // Check if ethers is loaded
            if (typeof ethers === 'undefined') {
                alert('Web3 library is still loading. Please wait a moment and try again.');
                return;
            }

            // Check if MetaMask is installed
            if (typeof window.ethereum === 'undefined') {
                alert('Please install MetaMask to play! Visit https://metamask.io');
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.walletAddress = accounts[0];

            // Set up provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();

            // Check network
            const network = await this.provider.getNetwork();
            console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);

            // Check if on correct network
            if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
                alert(
                    `⚠️ Wrong Network Detected!\n\n` +
                    `You're on: ${network.name}\n` +
                    `Required: ${NETWORK_NAME}\n\n` +
                    `MetaMask will now prompt you to switch networks.`
                );

                try {
                    // Try to switch to Base Sepolia
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x' + EXPECTED_CHAIN_ID.toString(16) }],
                    });

                    // Wait a moment for the switch to complete
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Verify we're on the right network now
                    const newNetwork = await this.provider.getNetwork();
                    if (Number(newNetwork.chainId) !== EXPECTED_CHAIN_ID) {
                        alert('Network switch may have failed. Please check MetaMask and try again.');
                        return;
                    }

                    alert(`✅ Successfully switched to ${NETWORK_NAME}!`);

                } catch (switchError) {
                    // This error code indicates that the chain has not been added to MetaMask
                    if (switchError.code === 4902) {
                        alert(
                            `${NETWORK_NAME} not found in MetaMask.\n\n` +
                            `We'll add it for you now!`
                        );

                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x' + EXPECTED_CHAIN_ID.toString(16),
                                    chainName: 'Base Sepolia',
                                    nativeCurrency: {
                                        name: 'ETH',
                                        symbol: 'ETH',
                                        decimals: 18
                                    },
                                    rpcUrls: ['https://sepolia.base.org'],
                                    blockExplorerUrls: ['https://sepolia.basescan.org']
                                }]
                            });

                            alert(`✅ ${NETWORK_NAME} added successfully!\n\nPlease click Connect again.`);
                            return;

                        } catch (addError) {
                            console.error('Error adding network:', addError);
                            alert(
                                `❌ Failed to add ${NETWORK_NAME}\n\n` +
                                `Please add it manually:\n` +
                                `Network: Base Sepolia\n` +
                                `RPC: https://sepolia.base.org\n` +
                                `Chain ID: 84532`
                            );
                            return;
                        }
                    } else if (switchError.code === 4001) {
                        // User rejected the request
                        alert(`You must switch to ${NETWORK_NAME} to play the game.`);
                        return;
                    } else {
                        console.error('Error switching network:', switchError);
                        alert(
                            `❌ Failed to switch network\n\n` +
                            `Please switch to ${NETWORK_NAME} manually in MetaMask and try again.`
                        );
                        return;
                    }
                }
            }

            // Initialize contract
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);

            // Update UI
            this.updateWalletStatus();

            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                this.walletAddress = accounts[0];
                this.updateWalletStatus();
            });

            // Listen for network changes
            window.ethereum.on('chainChanged', (chainId) => {
                const newChainId = parseInt(chainId, 16);
                if (newChainId !== EXPECTED_CHAIN_ID) {
                    alert(
                        `⚠️ Network Changed!\n\n` +
                        `You switched away from ${NETWORK_NAME}.\n\n` +
                        `The page will reload. Please connect to ${NETWORK_NAME} to continue playing.`
                    );
                }
                // Reload page on any network change to reset state
                window.location.reload();
            });

            // Load game history and user's games
            await Promise.all([
                this.loadGameHistory(),
                this.loadMyGames()
            ]);

            // Check if there's a pending game ID to load
            if (this.pendingGameId) {
                const gameIdToLoad = this.pendingGameId;
                this.pendingGameId = null; // Clear it
                console.log('Loading pending game ID:', gameIdToLoad);
                await this.joinSpecificGame(gameIdToLoad);
            } else {
                // Automatically create or join game after connection
                this.showCreateGameScreen();
            }

        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    }

    /**
     * Update wallet status display
     */
    async updateWalletStatus() {
        const statusElement = document.getElementById('wallet-status');
        if (this.walletAddress) {
            // Resolve ENS name and format with link
            const addressWithLink = await this.formatAddressWithLink(this.walletAddress);

            // Check current network
            if (this.provider) {
                try {
                    const network = await this.provider.getNetwork();
                    const isCorrectNetwork = Number(network.chainId) === EXPECTED_CHAIN_ID;

                    if (isCorrectNetwork) {
                        statusElement.innerHTML = `✅ Connected: ${addressWithLink} <span style="color: #1F504A;">(${NETWORK_NAME})</span>`;
                        statusElement.style.color = '#1F504A'; // moss color
                    } else {
                        statusElement.innerHTML = `⚠️ Connected: ${addressWithLink} <span style="color: #EF7E5F;">(Wrong Network!)</span>`;
                        statusElement.style.color = '#EF7E5F'; // nectary color
                    }
                } catch (error) {
                    statusElement.innerHTML = `Connected: ${addressWithLink}`;
                    statusElement.style.color = '#1F504A';
                }
            } else {
                statusElement.innerHTML = `Connected: ${addressWithLink}`;
                statusElement.style.color = '#1F504A';
            }
        } else {
            statusElement.textContent = 'No wallet connected';
            statusElement.style.color = '#666';
        }
    }

    /**
     * Show create game screen (adds a button to create/join)
     */
    showCreateGameScreen() {
        const connectBtn = document.getElementById('connect-wallet-btn');
        connectBtn.textContent = '🎮 Create or Join Game';
        connectBtn.onclick = () => this.createOrJoinGame();
    }

    /**
     * Create or join a game
     */
    async createOrJoinGame() {
        try {
            this.showCryptoScreen('crypto-lobby');

            // Call smart contract
            const tx = await this.contract.createOrJoinGame({
                value: ethers.utils.parseEther(BOND_AMOUNT)
            });

            console.log('Transaction sent:', tx.hash);

            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            // Parse events to get game ID
            const gameCreatedEvent = receipt.events?.find(e => e.event === 'GameCreated');
            const gameStartedEvent = receipt.events?.find(e => e.event === 'GameStarted');

            if (gameStartedEvent) {
                // Game started immediately (we joined an existing game)
                this.currentGameId = gameStartedEvent.args.gameId.toNumber();
                this.isPlayerA = gameStartedEvent.args.playerA.toLowerCase() === this.walletAddress.toLowerCase();

                document.getElementById('current-game-id').textContent = this.currentGameId;

                // Update URL with game ID
                window.location.hash = `multiplayer/${this.currentGameId}`;

                // Start game (loads state internally)
                await this.startGame();

            } else if (gameCreatedEvent) {
                // We created a new game, waiting for opponent
                this.currentGameId = gameCreatedEvent.args.gameId.toNumber();
                this.isPlayerA = true;

                document.getElementById('current-game-id').textContent = this.currentGameId;
                document.getElementById('player-address').innerHTML = await this.formatAddressWithLink(this.walletAddress);

                // Update URL with game ID
                window.location.hash = `multiplayer/${this.currentGameId}`;

                // Start polling for opponent
                this.pollForOpponent();
            }

        } catch (error) {
            console.error('Error creating/joining game:', error);
            alert('Failed to create/join game. Please try again.');
            this.showCryptoScreen('crypto-connect');
        }
    }

    /**
     * Set a pending game ID to load after wallet connection
     */
    setPendingGame(gameId) {
        // Don't set if already pending or if already in this game
        if (this.pendingGameId === gameId || this.currentGameId === parseInt(gameId)) {
            console.log('Game ID already set:', gameId);
            return;
        }

        this.pendingGameId = gameId;
        console.log('Pending game ID set:', gameId);

        // If wallet is already connected, load the game immediately
        if (this.contract && this.walletAddress) {
            this.joinSpecificGame(gameId);
        } else {
            // Otherwise, show the connect screen and update the button
            console.log('Wallet not connected. Prompting user to connect for game', gameId);

            // Ensure multiplayer section is visible
            const multiplayerSection = document.getElementById('multiplayer');
            if (multiplayerSection && !multiplayerSection.classList.contains('active')) {
                console.log('Multiplayer section not active, activating it');
                multiplayerSection.classList.add('active');
                // Hide other sections
                document.querySelectorAll('.game-section').forEach(section => {
                    if (section.id !== 'multiplayer') {
                        section.classList.remove('active');
                    }
                });
            }

            // Show the crypto connect screen
            this.showCryptoScreen('crypto-connect');

            // Update the connect button to show there's a pending game
            const connectBtn = document.getElementById('connect-wallet-btn');
            if (connectBtn) {
                connectBtn.textContent = `🔗 Connect Wallet to Join Game #${gameId}`;
                connectBtn.style.animation = 'pulse 2s infinite';
            } else {
                console.error('Connect button not found!');
            }
        }
    }

    /**
     * Join a specific game by ID (when loading from URL)
     */
    async joinSpecificGame(gameId) {
        try {
            if (!this.contract) {
                console.log('Contract not initialized. Setting as pending game.');
                this.pendingGameId = gameId;
                return;
            }

            // Parse game ID
            this.currentGameId = parseInt(gameId);

            if (isNaN(this.currentGameId)) {
                alert('Invalid game ID');
                return;
            }

            console.log('Loading game:', this.currentGameId);

            // Show lobby screen
            this.showCryptoScreen('crypto-lobby');
            document.getElementById('current-game-id').textContent = this.currentGameId;

            // Try to load game state from contract
            const gameData = await this.contract.getGame(this.currentGameId);
            const [playerA, playerB, currentRound, scoreA, scoreB, state, fundsWithdrawn] = gameData;

            console.log('Game state:', { playerA, playerB, currentRound, scoreA: scoreA.toNumber(), scoreB: scoreB.toNumber(), state });

            // Check if we're one of the players
            const isPlayerA = playerA.toLowerCase() === this.walletAddress.toLowerCase();
            const isPlayerB = playerB.toLowerCase() === this.walletAddress.toLowerCase();
            const isPlayer = isPlayerA || isPlayerB;

            // Game states: 0 = WaitingForPlayer, 1 = InProgress, 2 = Finalized, 3 = Cancelled

            if (state === 0) {
                // Game is waiting for a player
                if (isPlayerA) {
                    // We created this game - show waiting screen
                    this.isPlayerA = true;
                    document.getElementById('player-address').innerHTML = await this.formatAddressWithLink(this.walletAddress);
                    this.pollForOpponent();
                } else {
                    // Someone else created it - show option to join
                    alert(
                        `Game ${this.currentGameId} is waiting for a player!\n\n` +
                        `Note: The smart contract will automatically match you with an available game when you click "Create or Join Game".\n\n` +
                        `Click OK to create or join a game.`
                    );
                    this.showCryptoScreen('crypto-connect');
                    this.showCreateGameScreen();
                }

            } else if (state === 1) {
                // Game is in progress
                if (!isPlayer) {
                    alert(
                        `Game ${this.currentGameId} is already in progress with other players.\n\n` +
                        `You can only view games you're participating in.`
                    );
                    this.showCryptoScreen('crypto-connect');
                    return;
                }

                // We're a player in this game - load and resume it
                this.isPlayerA = isPlayerA;
                await this.loadGameState();

                // Check if game is finished
                if (currentRound >= 10) {
                    // Game is complete, show results
                    await this.endGame();
                } else {
                    // Resume game (loads state internally)
                    await this.startGame();
                }

            } else if (state === 2) {
                // Game finalized
                if (!isPlayer) {
                    alert(`Game ${this.currentGameId} has been finalized.`);
                    this.showCryptoScreen('crypto-connect');
                } else {
                    // Show results for this player
                    this.isPlayerA = isPlayerA;
                    await this.loadGameState();
                    await this.endGame();
                }

            } else if (state === 3) {
                alert(`Game ${this.currentGameId} has been cancelled.`);
                this.showCryptoScreen('crypto-connect');
            }

        } catch (error) {
            console.error('Error loading specific game:', error);

            // Check if error is because game doesn't exist
            if (error.message && error.message.includes('call revert')) {
                alert(
                    `Game ${gameId} not found.\n\n` +
                    `It may not exist yet, or the game ID is invalid.`
                );
            } else {
                alert('Failed to load game. Please check the game ID and try again.');
            }

            this.showCryptoScreen('crypto-connect');
        }
    }

    /**
     * Start unified game state polling (1000ms interval)
     */
    startGamePolling() {
        // Clear any existing poll interval
        this.stopGamePolling();

        console.log('Starting game state polling for game', this.currentGameId);

        this.pollInterval = setInterval(async () => {
            try {
                if (!this.currentGameId || !this.contract) {
                    return;
                }

                const gameData = await this.contract.getGame(this.currentGameId);
                const [playerA, playerB, currentRound, scoreA, scoreB, state, fundsWithdrawn] = gameData;

                // Handle different game states
                if (state === 0) {
                    // Waiting for player - check if we're in the right screen
                    const lobbyScreen = document.getElementById('crypto-lobby');
                    if (!lobbyScreen || !lobbyScreen.classList.contains('active')) {
                        // We should be in lobby screen
                        this.showCryptoScreen('crypto-lobby');
                    }
                } else if (state === 1) {
                    // Game is in progress
                    await this.handleInProgressPolling(currentRound, scoreA, scoreB);
                } else if (state === 2) {
                    // Game finalized
                    this.stopGamePolling();
                    await this.endGame();
                } else if (state === 3) {
                    // Game cancelled
                    this.stopGamePolling();
                    alert('Game was cancelled.');
                    this.showCryptoScreen('crypto-connect');
                }
            } catch (error) {
                console.error('Error polling game state:', error);
            }
        }, 1000); // Poll every 1000ms for real-time updates
    }

    /**
     * Handle polling when game is in progress
     */
    async handleInProgressPolling(contractRound, scoreA, scoreB) {
        // If we're still in lobby, transition to game screen
        const lobbyScreen = document.getElementById('crypto-lobby');
        if (lobbyScreen && lobbyScreen.classList.contains('active')) {
            console.log('Opponent joined! Starting game...');
            await this.loadGameState();
            this.showCryptoScreen('crypto-game');
            // Don't reset - loadGameState() already set currentRound from contract
            this.updateGameUI();
            this.enableActionButtons();
            return;
        }

        // Check if we're in the game screen
        const gameScreen = document.getElementById('crypto-game');
        if (!gameScreen || !gameScreen.classList.contains('active')) {
            return; // Not in game screen yet
        }

        // Sync local round with contract round
        const localRound = this.currentRound;
        if (contractRound !== localRound) {
            console.log(`Round sync: local=${localRound}, contract=${contractRound}`);
            // Contract has moved forward, sync our state
            await this.loadGameState();
            this.updateGameUI();
        }

        // Check if opponent has completed their move for current round
        const waitingMessage = document.getElementById('waiting-message');
        if (waitingMessage && waitingMessage.style.display === 'block') {
            // We submitted our move, waiting for opponent
            try {
                const roundData = await this.contract.getRoundMoves(this.currentGameId, this.currentRound);
                const [moveA, moveB, submittedA, submittedB] = roundData;

                if (submittedA && submittedB) {
                    // Round is complete!
                    console.log(`Round ${this.currentRound + 1} completed!`);

                    const playerMove = this.isPlayerA ? moveA : moveB;
                    const opponentMove = this.isPlayerA ? moveB : moveA;

                    // Display round result
                    this.displayRoundResult(playerMove, opponentMove);
                    this.addToHistory(this.currentRound + 1, playerMove, opponentMove);

                    // Sync state from contract (scores and round number)
                    await this.loadGameState();
                    this.updateGameUI();

                    // Hide waiting message
                    waitingMessage.style.display = 'none';

                    if (this.currentRound >= 10) {
                        // Game complete - will be finalized and caught by state === 2
                        console.log('All rounds complete! Waiting for finalization...');
                    } else {
                        // Enable buttons for next round
                        this.enableActionButtons();
                        this.updateEducationalSnippet();
                    }
                }
            } catch (error) {
                console.error('Error checking round completion:', error);
            }
        }
    }

    /**
     * Stop game polling
     */
    stopGamePolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            console.log('Stopped game polling');
        }
    }

    /**
     * Poll for opponent to join (now uses unified polling)
     */
    pollForOpponent() {
        this.startGamePolling();
    }

    /**
     * Load game state from contract
     */
    async loadGameState() {
        try {
            const gameData = await this.contract.getGame(this.currentGameId);
            const [playerA, playerB, currentRound, scoreA, scoreB, state, fundsWithdrawn] = gameData;

            this.currentRound = currentRound;
            this.playerScores.player = this.isPlayerA ? scoreA.toNumber() : scoreB.toNumber();
            this.playerScores.opponent = this.isPlayerA ? scoreB.toNumber() : scoreA.toNumber();

            // Get opponent address
            const opponentAddress = this.isPlayerA ? playerB : playerA;

            // Update UI with ENS and clickable links
            document.getElementById('player-ens').innerHTML = await this.formatAddressWithLink(this.walletAddress);
            document.getElementById('opponent-ens').innerHTML = await this.formatAddressWithLink(opponentAddress);

        } catch (error) {
            console.error('Error loading game state:', error);
        }
    }

    /**
     * Start the game
     */
    async startGame() {
        // Load current state from contract first
        await this.loadGameState();

        this.showCryptoScreen('crypto-game');
        this.updateGameUI();
        this.enableActionButtons();

        // Start unified game polling
        this.startGamePolling();
    }

    /**
     * Submit a move
     */
    async submitMove(cooperate) {
        try {
            // Disable buttons
            this.disableActionButtons();

            // Show waiting message
            document.getElementById('waiting-message').style.display = 'block';

            // Submit move to smart contract
            const tx = await this.contract.submitMove(this.currentGameId, cooperate);
            console.log('Move submitted:', tx.hash);

            await tx.wait();
            console.log('Move confirmed');

            // Poll for round completion
            this.pollForRoundCompletion();

        } catch (error) {
            console.error('Error submitting move:', error);
            alert('Failed to submit move. Please try again.');
            this.enableActionButtons();
            document.getElementById('waiting-message').style.display = 'none';
        }
    }

    /**
     * Poll for opponent's move (deprecated - now uses unified polling)
     */
    pollForMoves() {
        // The unified startGamePolling() handles this
    }

    /**
     * Poll for round completion (deprecated - now uses unified polling)
     */
    pollForRoundCompletion() {
        // The unified startGamePolling() handles this
        // Just ensure polling is active
        if (!this.pollInterval) {
            this.startGamePolling();
        }
    }

    /**
     * Calculate scores based on moves (deprecated - now loaded from contract)
     * Kept for reference but scores should come from smart contract
     */
    calculateScores(playerMove, opponentMove) {
        // Note: Scores are now loaded from the smart contract via loadGameState()
        // This function is kept for backward compatibility but is not actively used
        // The contract is the source of truth for scores
    }

    /**
     * Display round result
     */
    displayRoundResult(playerMove, opponentMove) {
        const resultDiv = document.getElementById('crypto-round-result');

        const playerIcon = playerMove ? '🤝' : '💔';
        const opponentIcon = opponentMove ? '🤝' : '💔';

        let message = '';
        let bgColor = '';

        if (playerMove && opponentMove) {
            message = 'Both trusted!';
            bgColor = '#d4edda';
        } else if (!playerMove && !opponentMove) {
            message = 'Both cheated!';
            bgColor = '#f8d7da';
        } else if (!playerMove && opponentMove) {
            message = 'You betrayed them!';
            bgColor = '#fff3cd';
        } else {
            message = 'You were betrayed!';
            bgColor = '#f8d7da';
        }

        resultDiv.innerHTML = `
            <div style="background: ${bgColor}; padding: 15px; border-radius: 8px;">
                <div style="font-size: 2em; margin-bottom: 5px;">${playerIcon} vs ${opponentIcon}</div>
                <div>${message}</div>
            </div>
        `;
    }

    /**
     * Add round to history
     */
    addToHistory(roundNum, playerMove, opponentMove) {
        const historyDisplay = document.getElementById('crypto-history-display');
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const playerIcon = playerMove ? '🤝' : '💔';
        const opponentIcon = opponentMove ? '🤝' : '💔';

        historyItem.innerHTML = `
            <div class="round-number">Round ${roundNum}</div>
            <div class="moves">
                <span title="You">${playerIcon}</span>
                <span>vs</span>
                <span title="Opponent">${opponentIcon}</span>
            </div>
        `;

        historyDisplay.appendChild(historyItem);
    }

    /**
     * Update game UI
     */
    updateGameUI() {
        document.getElementById('crypto-round').textContent = this.currentRound + 1;
        document.getElementById('crypto-player-score').textContent = this.playerScores.player;
        document.getElementById('crypto-opponent-score').textContent = this.playerScores.opponent;
    }

    /**
     * Update educational snippet
     */
    updateEducationalSnippet() {
        const snippet = EDUCATIONAL_SNIPPETS[this.currentRound % EDUCATIONAL_SNIPPETS.length];
        document.getElementById('educational-snippet').innerHTML = `<p>${snippet}</p>`;
    }

    /**
     * End game
     */
    async endGame() {
        // First, load the latest game state from contract
        try {
            const gameData = await this.contract.getGame(this.currentGameId);
            const [playerA, playerB, currentRound, scoreA, scoreB, state, fundsWithdrawn] = gameData;

            // Update scores from contract
            this.playerScores.player = this.isPlayerA ? scoreA.toNumber() : scoreB.toNumber();
            this.playerScores.opponent = this.isPlayerA ? scoreB.toNumber() : scoreA.toNumber();

            console.log('Final game state:', {
                round: currentRound,
                state,
                fundsWithdrawn,
                playerScore: this.playerScores.player,
                opponentScore: this.playerScores.opponent
            });

            // Verify the game is actually finalized
            if (state !== 2) {
                console.warn('Game not finalized yet. State:', state);
                // Don't show results screen yet if game isn't finalized
                return;
            }
        } catch (error) {
            console.error('Error loading final game state:', error);
        }

        this.showCryptoScreen('crypto-results');

        // Update final scores
        document.getElementById('final-player-score').textContent = this.playerScores.player;
        document.getElementById('final-opponent-score').textContent = this.playerScores.opponent;

        // Update outcome title
        const outcomeTitle = document.getElementById('game-outcome-title');
        if (this.playerScores.player > this.playerScores.opponent) {
            outcomeTitle.textContent = '🎉 You Won!';
        } else if (this.playerScores.player < this.playerScores.opponent) {
            outcomeTitle.textContent = '😔 You Lost';
        } else {
            outcomeTitle.textContent = '🤝 It\'s a Tie!';
        }

        // Withdraw winnings (only if game is finalized and funds not already withdrawn)
        try {
            const gameData = await this.contract.getGame(this.currentGameId);
            const [playerA, playerB, currentRound, scoreA, scoreB, state, fundsWithdrawn] = gameData;

            const payoutStatus = document.getElementById('payout-status');

            if (fundsWithdrawn) {
                // Funds already withdrawn
                payoutStatus.innerHTML = '<p style="color: #1F504A;">✓ Funds already withdrawn</p>';
                return;
            }

            if (state !== 2) {
                // Game not finalized yet
                payoutStatus.innerHTML = '<p style="color: #EF7E5F;">⚠ Game not finalized yet. Please wait...</p>';
                return;
            }

            // Attempt withdrawal
            payoutStatus.innerHTML = '<p>Processing payout...</p>';

            const tx = await this.contract.withdrawWinnings(this.currentGameId);
            await tx.wait();

            payoutStatus.innerHTML = '<p style="color: #1F504A;">✓ Payout complete!</p>';

        } catch (error) {
            console.error('Error withdrawing winnings:', error);
            const payoutStatus = document.getElementById('payout-status');

            // Check if it's because funds were already withdrawn
            if (error.message && error.message.includes('revert')) {
                payoutStatus.innerHTML = '<p style="color: #1F504A;">✓ Funds already processed</p>';
            } else {
                payoutStatus.innerHTML = '<p style="color: #EF7E5F;">⚠ Error processing payout. You can try withdrawing manually later.</p>';
            }
        }
    }

    /**
     * Cancel game and withdraw
     */
    async cancelGame() {
        try {
            const tx = await this.contract.cancelGame(this.currentGameId);
            await tx.wait();

            alert('Game cancelled and funds returned!');
            this.showCryptoScreen('crypto-connect');

            // Stop polling
            this.stopGamePolling();

        } catch (error) {
            console.error('Error cancelling game:', error);
            alert('Failed to cancel game. Please try again.');
        }
    }

    /**
     * Play again
     */
    playAgain() {
        this.currentGameId = null;
        this.currentRound = 0;
        this.playerScores = { player: 0, opponent: 0 };
        document.getElementById('crypto-history-display').innerHTML = '';
        this.showCryptoScreen('crypto-connect');
        this.showCreateGameScreen();
    }

    /**
     * Share results
     */
    async shareResults() {
        const text = `I just played Evolution of Trust on-chain and scored ${this.playerScores.player} points! Can you beat me?`;

        // Build URL with game ID
        const baseUrl = window.location.origin + window.location.pathname;
        const url = this.currentGameId
            ? `${baseUrl}#multiplayer/${this.currentGameId}`
            : window.location.href;

        try {
            await navigator.clipboard.writeText(`${text}\n${url}`);
            alert('Results copied to clipboard!');
        } catch (error) {
            alert(`${text}\n${url}`);
        }
    }

    /**
     * Show crypto screen
     */
    showCryptoScreen(screenId) {
        console.log('showCryptoScreen called with:', screenId);
        const screens = document.querySelectorAll('.crypto-screen');
        console.log('Found crypto screens:', screens.length);
        screens.forEach(screen => screen.classList.remove('active'));

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log('Activated screen:', screenId);
        } else {
            console.error('Target screen not found:', screenId);
        }
    }

    /**
     * Enable action buttons
     */
    enableActionButtons() {
        document.getElementById('trust-btn').disabled = false;
        document.getElementById('cheat-btn').disabled = false;
    }

    /**
     * Disable action buttons
     */
    disableActionButtons() {
        document.getElementById('trust-btn').disabled = true;
        document.getElementById('cheat-btn').disabled = true;
    }

    /**
     * Load game history from contract events
     */
    async loadGameHistory() {
        try {
            const historyContainer = document.getElementById('game-history-container');

            if (!this.contract) {
                historyContainer.innerHTML = '<p class="history-note">Connect wallet to view game history</p>';
                return;
            }

            historyContainer.innerHTML = '<p class="loading-history">Loading recent games...</p>';

            // Query GameFinalized events to get recent games
            const filter = this.contract.filters.GameFinalized();
            const currentBlock = await this.provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 900); // Last ~900 blocks (RPC limit is 1000)

            const events = await this.contract.queryFilter(filter, fromBlock, 'latest');

            if (events.length === 0) {
                historyContainer.innerHTML = '<p class="history-note">No games have been completed yet. Be the first!</p>';
                return;
            }

            // Sort by most recent first
            const sortedEvents = events.sort((a, b) => b.blockNumber - a.blockNumber);

            // Take only the 10 most recent
            const recentGames = sortedEvents.slice(0, 10);

            // Build history HTML
            let historyHTML = '<div class="game-history-list">';

            for (const event of recentGames) {
                const gameId = event.args.gameId.toNumber();
                const winner = event.args.winner;
                const prize = ethers.utils.formatEther(event.args.prize);

                // Get game details
                const gameData = await this.contract.getGame(gameId);
                const [playerA, playerB] = gameData;

                const loser = winner.toLowerCase() === playerA.toLowerCase() ? playerB : playerA;
                const isTie = winner === '0x0000000000000000000000000000000000000000';

                // Format addresses with ENS and links
                const playerAFormatted = await this.formatAddressWithLink(playerA);
                const playerBFormatted = await this.formatAddressWithLink(playerB);
                const winnerFormatted = isTie ? null : await this.formatAddressWithLink(winner);

                historyHTML += `
                    <div class="game-history-item" onclick="window.location.hash = 'multiplayer/${gameId}'">
                        <div class="game-id">Game #${gameId}</div>
                        <div class="game-players">
                            <span class="player">${playerAFormatted}</span>
                            <span class="vs">vs</span>
                            <span class="player">${playerBFormatted}</span>
                        </div>
                        <div class="game-outcome">
                            ${isTie
                                ? '<span class="tie">🤝 Tie</span>'
                                : `<span class="winner">🏆 ${winnerFormatted}</span>`
                            }
                        </div>
                        <div class="game-prize">${prize} ETH</div>
                    </div>
                `;
            }

            historyHTML += '</div>';
            historyContainer.innerHTML = historyHTML;

        } catch (error) {
            console.error('Error loading game history:', error);
            document.getElementById('game-history-container').innerHTML =
                '<p class="history-error">Error loading game history. Please try again later.</p>';
        }
    }

    /**
     * Load games for the currently connected user
     */
    async loadMyGames() {
        try {
            const myGamesContainer = document.getElementById('my-games-container');

            if (!this.contract || !this.walletAddress) {
                myGamesContainer.innerHTML = '<p class="history-note">Connect wallet to view your games</p>';
                return;
            }

            myGamesContainer.innerHTML = '<p class="loading-history">Loading your games...</p>';

            const currentBlock = await this.provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 900); // Last ~900 blocks (RPC limit is 1000)

            // Get games where user is playerA
            const filterPlayerA = this.contract.filters.GameCreated(null, this.walletAddress);
            const eventsAsPlayerA = await this.contract.queryFilter(filterPlayerA, fromBlock, 'latest');

            // Get games where user is playerB (GameStarted events)
            const filterPlayerB = this.contract.filters.GameStarted(null, null, this.walletAddress);
            const eventsAsPlayerB = await this.contract.queryFilter(filterPlayerB, fromBlock, 'latest');

            // Combine and get unique game IDs
            const gameIds = new Set();
            eventsAsPlayerA.forEach(e => gameIds.add(e.args.gameId.toNumber()));
            eventsAsPlayerB.forEach(e => gameIds.add(e.args.gameId.toNumber()));

            if (gameIds.size === 0) {
                myGamesContainer.innerHTML = '<p class="history-note">You haven\'t played any games yet. Create one to get started!</p>';
                return;
            }

            // Load details for each game
            const myGames = [];
            for (const gameId of gameIds) {
                try {
                    const gameData = await this.contract.getGame(gameId);
                    const [playerA, playerB, currentRound, scoreA, scoreB, state, fundsWithdrawn] = gameData;

                    const isPlayerA = playerA.toLowerCase() === this.walletAddress.toLowerCase();
                    const opponent = isPlayerA ? playerB : playerA;
                    const myScore = isPlayerA ? scoreA.toNumber() : scoreB.toNumber();
                    const opponentScore = isPlayerA ? scoreB.toNumber() : scoreA.toNumber();

                    myGames.push({
                        gameId,
                        opponent,
                        myScore,
                        opponentScore,
                        state, // 0=WaitingForPlayer, 1=InProgress, 2=Finalized, 3=Cancelled
                        currentRound: currentRound
                    });
                } catch (error) {
                    console.error(`Error loading game ${gameId}:`, error);
                }
            }

            // Sort by game ID (most recent first)
            myGames.sort((a, b) => b.gameId - a.gameId);

            // Build HTML
            let gamesHTML = '<div class="my-games-list">';

            for (const game of myGames) {
                const stateLabels = {
                    0: '<span class="status waiting">⏳ Waiting</span>',
                    1: '<span class="status in-progress">🎮 In Progress</span>',
                    2: '<span class="status finished">✅ Finished</span>',
                    3: '<span class="status cancelled">❌ Cancelled</span>'
                };

                let outcomeHTML = '';
                if (game.state === 2) { // Finalized
                    if (game.myScore > game.opponentScore) {
                        outcomeHTML = '<span class="outcome-win">🏆 Won</span>';
                    } else if (game.myScore < game.opponentScore) {
                        outcomeHTML = '<span class="outcome-loss">😔 Lost</span>';
                    } else {
                        outcomeHTML = '<span class="outcome-tie">🤝 Tie</span>';
                    }
                }

                // Format opponent with ENS and link
                const opponentFormatted = await this.formatAddressWithLink(game.opponent);

                gamesHTML += `
                    <div class="my-game-item" onclick="window.location.hash = 'multiplayer/${game.gameId}'">
                        <div class="my-game-header">
                            <span class="game-id">Game #${game.gameId}</span>
                            ${stateLabels[game.state]}
                        </div>
                        <div class="my-game-opponent">
                            vs ${opponentFormatted}
                        </div>
                        ${game.state >= 1 ? `
                            <div class="my-game-score">
                                <span class="my-score">${game.myScore}</span>
                                <span class="score-separator">-</span>
                                <span class="opponent-score">${game.opponentScore}</span>
                            </div>
                        ` : ''}
                        ${outcomeHTML}
                    </div>
                `;
            }

            gamesHTML += '</div>';
            myGamesContainer.innerHTML = gamesHTML;

        } catch (error) {
            console.error('Error loading my games:', error);
            document.getElementById('my-games-container').innerHTML =
                '<p class="history-error">Error loading your games. Please try again later.</p>';
        }
    }

    /**
     * Resolve ENS name for an address (with caching)
     */
    async resolveENS(address) {
        if (!address || !this.provider) return null;

        // Check cache first
        const lowerAddress = address.toLowerCase();
        if (this.ensCache.has(lowerAddress)) {
            return this.ensCache.get(lowerAddress);
        }

        try {
            const ensName = await this.provider.lookupAddress(address);
            this.ensCache.set(lowerAddress, ensName);
            return ensName;
        } catch (error) {
            // ENS lookup failed - cache null to avoid retrying
            this.ensCache.set(lowerAddress, null);
            return null;
        }
    }

    /**
     * Get Etherscan URL for an address
     */
    getEtherscanUrl(address) {
        return `https://sepolia.basescan.org/address/${address}`;
    }

    /**
     * Format address with ENS and clickable link
     */
    async formatAddressWithLink(address) {
        if (!address) return '<span class="address">0x...</span>';

        const ensName = await this.resolveENS(address);
        const displayName = ensName || this.formatAddress(address);
        const etherscanUrl = this.getEtherscanUrl(address);

        return `<a href="${etherscanUrl}" target="_blank" class="address-link" title="${address}">${displayName}</a>`;
    }

    /**
     * Format address to short version
     */
    formatAddress(address) {
        if (!address) return '0x...';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
}

// Initialize crypto game controller
let cryptoGame;

// Wait for both DOM and ethers to be ready
async function initializeCryptoGame() {
    if (typeof ethers !== 'undefined') {
        cryptoGame = new CryptoGame();
        console.log('Crypto game initialized successfully');

        // Check if there's a game ID in the URL hash
        const hash = window.location.hash;
        if (hash.startsWith('#multiplayer/')) {
            const gameId = hash.split('/')[1]?.split('?')[0];
            if (gameId) {
                console.log('Found game ID in URL on init:', gameId);

                // Check if wallet is already connected (from previous session)
                if (typeof window.ethereum !== 'undefined') {
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                        if (accounts && accounts.length > 0) {
                            // Wallet already connected, set pending game ID then auto-connect
                            console.log('Wallet already connected, auto-connecting to game', gameId);
                            cryptoGame.pendingGameId = gameId; // Set it directly before connecting
                            await cryptoGame.connectWallet();
                        } else {
                            // No wallet connected, set as pending
                            cryptoGame.setPendingGame(gameId);
                        }
                    } catch (error) {
                        console.log('Error checking wallet connection:', error);
                        cryptoGame.setPendingGame(gameId);
                    }
                } else {
                    // No MetaMask, set as pending
                    cryptoGame.setPendingGame(gameId);
                }
            }
        }
    } else {
        console.error('ethers.js not loaded. Web3 features will not work.');
        console.log('Please check that ethers.js CDN is accessible');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCryptoGame);
} else {
    // DOM already loaded
    initializeCryptoGame();
}
