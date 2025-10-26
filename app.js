/**
 * Main Application Controller
 */
class GameController {
    constructor() {
        this.currentSection = 'tutorial';
        this.currentStrategyIndex = 0;
        this.strategiesToTest = [
            STRATEGIES.COOPERATOR,
            STRATEGIES.DEFECTOR,
            STRATEGIES.TIT_FOR_TAT,
            STRATEGIES.GRUDGER,
            STRATEGIES.DETECTIVE
        ];
        this.currentGame = null;
        this.playerAgent = null;
        this.opponentAgent = null;
        this.customParams = null; // Store custom parameters from sandbox
        this.matchResults = []; // Store results from each match

        this.initializeUI();
        this.loadParamsFromURL();
    }

    /**
     * Initialize UI event listeners
     */
    initializeUI() {
        // Sandbox sliders
        const sliders = [
            { id: 'sandbox-population', valueId: 'sandbox-pop-value' },
            { id: 'sandbox-rounds', valueId: 'sandbox-rounds-value' },
            { id: 'sandbox-mutation', valueId: 'sandbox-mutation-value' },
            { id: 'sandbox-noise', valueId: 'sandbox-noise-value' }
        ];

        sliders.forEach(({ id, valueId }) => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const valueDisplay = document.getElementById(valueId);
                    if (valueDisplay) {
                        valueDisplay.textContent = value;
                    }
                });
            }
        });

        // Payoff matrix inputs
        this.initializePayoffInputs();
    }

    /**
     * Initialize payoff matrix input listeners
     */
    initializePayoffInputs() {
        const updatePayoffDisplay = () => {
            const reward = document.getElementById('payoff-reward')?.value || 3;
            const sucker = document.getElementById('payoff-sucker')?.value || 0;
            const temptation = document.getElementById('payoff-temptation')?.value || 5;
            const punishment = document.getElementById('payoff-punishment')?.value || 1;

            // Update all display spans
            const updates = [
                { id: 'display-reward', value: `+${reward}` },
                { id: 'display-reward-2', value: `+${reward}` },
                { id: 'display-sucker', value: sucker },
                { id: 'display-sucker-2', value: sucker },
                { id: 'display-temptation', value: `+${temptation}` },
                { id: 'display-temptation-2', value: `+${temptation}` },
                { id: 'display-punishment', value: `+${punishment}` },
                { id: 'display-punishment-2', value: `+${punishment}` }
            ];

            updates.forEach(({ id, value }) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
        };

        // Add listeners to all payoff inputs
        const payoffInputs = ['payoff-reward', 'payoff-sucker', 'payoff-temptation', 'payoff-punishment'];
        payoffInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', updatePayoffDisplay);
            }
        });
    }

    /**
     * Switch between game sections
     */
    showSection(sectionId) {
        document.querySelectorAll('.game-section').forEach(section => {
            section.classList.remove('active');
        });
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
        this.currentSection = sectionId;

        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Navigate to home/landing page
     */
    goToHome() {
        // Reset custom params
        this.customParams = null;

        // Clear URL parameters
        window.history.pushState({}, '', window.location.pathname);

        // Go to tutorial section
        this.showSection('tutorial');
    }

    /**
     * Start Playground mode
     */
    startPlayground(keepCustomParams = false) {
        this.showSection('playground');
        this.currentStrategyIndex = 0;
        this.matchResults = []; // Reset match results for new session
        // Reset custom params unless we're coming from sandbox
        if (!keepCustomParams) {
            this.customParams = null;
        }
        this.loadNextStrategy();
    }

    /**
     * Load the next strategy to play against
     */
    loadNextStrategy() {
        if (this.currentStrategyIndex >= this.strategiesToTest.length) {
            // All strategies completed - this shouldn't be reached as nextStrategy handles completion
            this.showSection('tutorial');
            return;
        }

        // Remove any existing scoreboard and restore game UI
        const playgroundSection = document.getElementById('playground');
        const existingScoreboard = playgroundSection.querySelector('.final-scoreboard');
        if (existingScoreboard) {
            existingScoreboard.remove();
        }

        // Show game UI elements
        playgroundSection.querySelector('.narrative-text').style.display = 'block';
        playgroundSection.querySelector('.payoff-matrix').style.display = 'block';
        playgroundSection.querySelector('.game-board').style.display = 'grid';
        playgroundSection.querySelector('.history-container').style.display = 'block';
        playgroundSection.querySelector('.action-buttons').style.display = 'flex';

        const strategy = this.strategiesToTest[this.currentStrategyIndex];
        this.opponentAgent = new Agent(strategy);
        this.playerAgent = new Agent('player');

        // Use custom parameters if available
        const rounds = this.customParams?.rounds || 7;
        const noiseRate = this.customParams?.noiseRate || 0;
        const payoffs = this.customParams?.payoffs || null;

        this.currentGame = new Game(this.playerAgent, this.opponentAgent, rounds, noiseRate, payoffs);

        this.updatePlaygroundUI();
        this.enableActionButtons();
    }

    /**
     * Update playground UI with current strategy info
     */
    updatePlaygroundUI() {
        const info = this.opponentAgent.getInfo();
        document.getElementById('opponent-name').textContent = info.name;

        // Update description with custom params info if applicable
        let description = info.description;
        if (this.customParams) {
            description += ' (Using custom sandbox settings)';
        }
        document.getElementById('strategy-description').textContent = description;

        // Update payoff matrix display
        this.updatePlaygroundPayoffMatrix();

        // Reset scores
        document.getElementById('player-score').textContent = '0';
        document.getElementById('opponent-score').textContent = '0';

        // Reset round counter with custom rounds if applicable
        const totalRounds = this.customParams?.rounds || 7;
        document.getElementById('current-round').textContent = '1';
        document.getElementById('total-rounds').textContent = totalRounds;

        // Clear history
        document.getElementById('history-display').innerHTML = '';

        // Clear last result
        document.getElementById('last-result').innerHTML = '';

        // Reset visual indicators
        document.getElementById('player-visual').className = 'agent-visual';
        document.getElementById('player-visual').textContent = '👤';
        document.getElementById('opponent-visual').className = 'agent-visual';
        document.getElementById('opponent-visual').textContent = info.emoji;

        // Hide next strategy button
        document.getElementById('next-strategy-btn').style.display = 'none';
    }

    /**
     * Update the playground payoff matrix to show custom values if applicable
     */
    updatePlaygroundPayoffMatrix() {
        const indicator = document.getElementById('custom-params-indicator');

        if (this.customParams && this.customParams.payoffs) {
            const p = this.customParams.payoffs;

            // Update matrix cells
            document.getElementById('playground-both-cooperate').textContent =
                `+${p.BOTH_COOPERATE.player} / +${p.BOTH_COOPERATE.opponent}`;
            document.getElementById('playground-sucker').textContent =
                `${p.PLAYER_COOPERATE_OPP_DEFECT.player} / +${p.PLAYER_COOPERATE_OPP_DEFECT.opponent}`;
            document.getElementById('playground-temptation').textContent =
                `+${p.PLAYER_DEFECT_OPP_COOPERATE.player} / ${p.PLAYER_DEFECT_OPP_COOPERATE.opponent}`;
            document.getElementById('playground-both-defect').textContent =
                `+${p.BOTH_DEFECT.player} / +${p.BOTH_DEFECT.opponent}`;

            // Show indicator
            indicator.style.display = 'inline';
        } else {
            // Reset to defaults
            document.getElementById('playground-both-cooperate').textContent = '+3 / +3';
            document.getElementById('playground-sucker').textContent = '0 / +5';
            document.getElementById('playground-temptation').textContent = '+5 / 0';
            document.getElementById('playground-both-defect').textContent = '+1 / +1';

            // Hide indicator
            indicator.style.display = 'none';
        }
    }

    /**
     * Handle player move
     */
    playerMove(move) {
        if (!this.currentGame || this.currentGame.isOver()) return;

        this.disableActionButtons();

        // Player's decision
        const playerMove = move;

        // Get opponent's decision (with custom noise rate if applicable)
        const opponentMove = this.opponentAgent.decide(
            this.opponentAgent.opponentMemory,
            this.currentGame.currentRound,
            this.currentGame.noiseRate
        );

        // Calculate payoffs using game's payoff matrix (supports custom payoffs)
        const gamePayoffs = this.currentGame.payoffs;
        let payoffPlayer, payoffOpponent;
        if (playerMove === 'cooperate' && opponentMove === 'cooperate') {
            payoffPlayer = gamePayoffs.BOTH_COOPERATE.player;
            payoffOpponent = gamePayoffs.BOTH_COOPERATE.opponent;
        } else if (playerMove === 'cooperate' && opponentMove === 'defect') {
            payoffPlayer = gamePayoffs.PLAYER_COOPERATE_OPP_DEFECT.player;
            payoffOpponent = gamePayoffs.PLAYER_COOPERATE_OPP_DEFECT.opponent;
        } else if (playerMove === 'defect' && opponentMove === 'cooperate') {
            payoffPlayer = gamePayoffs.PLAYER_DEFECT_OPP_COOPERATE.player;
            payoffOpponent = gamePayoffs.PLAYER_DEFECT_OPP_COOPERATE.opponent;
        } else {
            payoffPlayer = gamePayoffs.BOTH_DEFECT.player;
            payoffOpponent = gamePayoffs.BOTH_DEFECT.opponent;
        }

        // Update scores
        this.playerAgent.addScore(payoffPlayer);
        this.opponentAgent.addScore(payoffOpponent);

        // Record moves
        this.playerAgent.recordMove(playerMove, opponentMove);
        this.opponentAgent.recordMove(opponentMove, playerMove);

        // Update UI
        this.updateRoundResult(playerMove, opponentMove, payoffPlayer, payoffOpponent);
        this.addToHistory(this.currentGame.currentRound + 1, playerMove, opponentMove, payoffPlayer, payoffOpponent);

        // Increment round
        this.currentGame.currentRound++;
        document.getElementById('current-round').textContent = this.currentGame.currentRound + 1;

        // Check if game is over
        setTimeout(() => {
            if (this.currentGame.isOver()) {
                this.endPlaygroundRound();
            } else {
                this.enableActionButtons();
            }
        }, 100);
    }

    /**
     * Update the round result display
     */
    updateRoundResult(playerMove, opponentMove, playerPayoff, opponentPayoff) {
        // Update visual indicators
        const playerVisual = document.getElementById('player-visual');
        const opponentVisual = document.getElementById('opponent-visual');

        playerVisual.className = 'agent-visual ' + (playerMove === 'cooperate' ? 'cooperated' : 'defected');
        opponentVisual.className = 'agent-visual ' + (opponentMove === 'cooperate' ? 'cooperated' : 'defected');

        // Update scores
        document.getElementById('player-score').textContent = this.playerAgent.score;
        document.getElementById('opponent-score').textContent = this.opponentAgent.score;

        // Show result message
        const resultDiv = document.getElementById('last-result');
        const playerMoveText = playerMove === 'cooperate' ? '🤝' : '💔';
        const opponentMoveText = opponentMove === 'cooperate' ? '🤝' : '💔';

        let message = '';
        if (playerMove === 'cooperate' && opponentMove === 'cooperate') {
            message = `Both cooperated! +${playerPayoff} each`;
            resultDiv.style.background = '#d4edda';
        } else if (playerMove === 'defect' && opponentMove === 'defect') {
            message = `Both defected! +${playerPayoff} each`;
            resultDiv.style.background = '#f8d7da';
        } else if (playerMove === 'cooperate') {
            message = `You were betrayed! You: +${playerPayoff}, Them: +${opponentPayoff}`;
            resultDiv.style.background = '#f8d7da';
        } else {
            message = `You betrayed them! You: +${playerPayoff}, Them: +${opponentPayoff}`;
            resultDiv.style.background = '#fff3cd';
        }

        resultDiv.innerHTML = `
            <div>
                <div style="font-size: 2em; margin-bottom: 5px;">${playerMoveText} vs ${opponentMoveText}</div>
                <div>${message}</div>
            </div>
        `;
    }

    /**
     * Add round to history display
     */
    addToHistory(roundNum, playerMove, opponentMove, playerPayoff, opponentPayoff) {
        const historyDisplay = document.getElementById('history-display');
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const playerIcon = playerMove === 'cooperate' ? '🤝' : '💔';
        const opponentIcon = opponentMove === 'cooperate' ? '🤝' : '💔';

        historyItem.innerHTML = `
            <div class="round-number">Round ${roundNum}</div>
            <div class="moves">
                <span title="You">${playerIcon}</span>
                <span>vs</span>
                <span title="Opponent">${opponentIcon}</span>
            </div>
            <div class="result">${playerPayoff} - ${opponentPayoff}</div>
        `;

        historyDisplay.appendChild(historyItem);
    }

    /**
     * End current playground round
     */
    endPlaygroundRound() {
        this.disableActionButtons();

        const resultDiv = document.getElementById('last-result');
        const finalMessage = this.playerAgent.score > this.opponentAgent.score
            ? '🎉 You won this round!'
            : this.playerAgent.score < this.opponentAgent.score
            ? '😔 You lost this round.'
            : '🤝 It\'s a tie!';

        resultDiv.innerHTML = `
            <div>
                <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 10px;">${finalMessage}</div>
                <div>Final Score - You: ${this.playerAgent.score}, Opponent: ${this.opponentAgent.score}</div>
            </div>
        `;

        document.getElementById('next-strategy-btn').style.display = 'block';
    }

    /**
     * Move to next strategy
     */
    nextStrategy() {
        // Store results from completed match
        if (this.playerAgent && this.opponentAgent) {
            this.matchResults.push({
                strategy: this.opponentAgent.strategy,
                playerScore: this.playerAgent.score,
                opponentScore: this.opponentAgent.score
            });
        }

        this.currentStrategyIndex++;
        if (this.currentStrategyIndex >= this.strategiesToTest.length) {
            // All strategies completed - show scoreboard
            this.showFinalScoreboard();
        } else {
            this.loadNextStrategy();
        }
    }

    /**
     * Show final scoreboard after all matches
     */
    showFinalScoreboard() {
        // Calculate totals
        let totalPlayerScore = 0;
        let totalOpponentScore = 0;
        let wins = 0;
        let losses = 0;
        let ties = 0;

        this.matchResults.forEach(result => {
            totalPlayerScore += result.playerScore;
            totalOpponentScore += result.opponentScore;

            if (result.playerScore > result.opponentScore) {
                wins++;
            } else if (result.playerScore < result.opponentScore) {
                losses++;
            } else {
                ties++;
            }
        });

        // Create scoreboard HTML
        let scoreboardHTML = `
            <div class="final-scoreboard">
                <h2>🎮 Game Complete!</h2>
                <div class="scoreboard-summary">
                    <div class="summary-card">
                        <div class="summary-label">Total Score</div>
                        <div class="summary-value">${totalPlayerScore}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Record</div>
                        <div class="summary-value">${wins}W - ${losses}L - ${ties}T</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Average</div>
                        <div class="summary-value">${(totalPlayerScore / this.matchResults.length).toFixed(1)}</div>
                    </div>
                </div>

                <h3>Match Results</h3>
                <div class="scoreboard-matches">
        `;

        // Add individual match results
        this.matchResults.forEach(result => {
            const info = STRATEGY_INFO[result.strategy];
            const outcome = result.playerScore > result.opponentScore ? 'win' :
                           result.playerScore < result.opponentScore ? 'loss' : 'tie';
            const outcomeText = outcome === 'win' ? '✓ Win' :
                               outcome === 'loss' ? '✗ Loss' : '− Tie';

            scoreboardHTML += `
                <div class="match-row ${outcome}">
                    <div class="match-opponent">
                        <span class="opponent-emoji">${info.emoji}</span>
                        <span class="opponent-name">${info.name}</span>
                    </div>
                    <div class="match-score">${result.playerScore} - ${result.opponentScore}</div>
                    <div class="match-outcome">${outcomeText}</div>
                </div>
            `;
        });

        scoreboardHTML += `
                </div>
                <div class="scoreboard-actions">
                    <button class="btn-primary" onclick="gameController.startPlayground()">Play Again</button>
                    <button class="btn-primary" onclick="gameController.startSandbox()">Try Sandbox Mode</button>
                    <button class="btn-secondary" onclick="gameController.showSection('tutorial')">Back to Menu</button>
                </div>
            </div>
        `;

        // Display scoreboard in the playground section
        const playgroundSection = document.getElementById('playground');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = scoreboardHTML;

        // Hide game UI and show scoreboard
        playgroundSection.querySelector('.narrative-text').style.display = 'none';
        playgroundSection.querySelector('.payoff-matrix').style.display = 'none';
        playgroundSection.querySelector('.game-board').style.display = 'none';
        playgroundSection.querySelector('.history-container').style.display = 'none';
        playgroundSection.querySelector('.action-buttons').style.display = 'none';
        document.getElementById('next-strategy-btn').style.display = 'none';

        playgroundSection.appendChild(tempDiv.firstElementChild);
    }

    /**
     * Enable action buttons
     */
    enableActionButtons() {
        document.getElementById('cooperate-btn').disabled = false;
        document.getElementById('defect-btn').disabled = false;
    }

    /**
     * Disable action buttons
     */
    disableActionButtons() {
        document.getElementById('cooperate-btn').disabled = true;
        document.getElementById('defect-btn').disabled = true;
    }


    /**
     * Start sandbox mode
     */
    startSandbox(skipReset = false) {
        this.showSection('sandbox');
        if (!skipReset) {
            this.resetSandbox();
        }
        this.initializeSandboxChart();
    }

    /**
     * Get custom parameters from sandbox inputs
     */
    getCustomParamsFromSandbox() {
        const reward = parseInt(document.getElementById('payoff-reward')?.value || 3);
        const sucker = parseInt(document.getElementById('payoff-sucker')?.value || 0);
        const temptation = parseInt(document.getElementById('payoff-temptation')?.value || 5);
        const punishment = parseInt(document.getElementById('payoff-punishment')?.value || 1);

        const rounds = parseInt(document.getElementById('sandbox-rounds')?.value || 7);
        const noiseRate = parseInt(document.getElementById('sandbox-noise')?.value || 2) / 100;

        return {
            rounds: rounds,
            noiseRate: noiseRate,
            payoffs: {
                BOTH_COOPERATE: { player: reward, opponent: reward },
                PLAYER_COOPERATE_OPP_DEFECT: { player: sucker, opponent: temptation },
                PLAYER_DEFECT_OPP_COOPERATE: { player: temptation, opponent: sucker },
                BOTH_DEFECT: { player: punishment, opponent: punishment }
            }
        };
    }

    /**
     * Start playground with custom parameters from sandbox
     */
    playWithCustomParams() {
        this.customParams = this.getCustomParamsFromSandbox();
        this.saveParamsToURL();
        this.startPlayground(true); // Keep custom params
    }

    /**
     * Save current parameters to URL (for playground mode)
     */
    saveParamsToURL() {
        if (!this.customParams) return;

        const params = new URLSearchParams();

        // Add game parameters
        params.set('rounds', this.customParams.rounds);
        params.set('noise', Math.round(this.customParams.noiseRate * 100));

        // Add payoff matrix values
        const p = this.customParams.payoffs;
        params.set('reward', p.BOTH_COOPERATE.player);
        params.set('sucker', p.PLAYER_COOPERATE_OPP_DEFECT.player);
        params.set('temptation', p.PLAYER_DEFECT_OPP_COOPERATE.player);
        params.set('punishment', p.BOTH_DEFECT.player);

        // Update URL without reloading
        const newURL = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newURL);
    }

    /**
     * Save sandbox simulation parameters to URL
     */
    saveSandboxParamsToURL() {
        const params = new URLSearchParams();

        // Add simulation parameters
        params.set('mode', 'sandbox');
        params.set('pop', document.getElementById('sandbox-population').value);
        params.set('rounds', document.getElementById('sandbox-rounds').value);
        params.set('mutation', document.getElementById('sandbox-mutation').value);
        params.set('noise', document.getElementById('sandbox-noise').value);

        // Add payoff matrix values
        params.set('reward', document.getElementById('payoff-reward').value);
        params.set('sucker', document.getElementById('payoff-sucker').value);
        params.set('temptation', document.getElementById('payoff-temptation').value);
        params.set('punishment', document.getElementById('payoff-punishment').value);

        // Update URL without reloading
        const newURL = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newURL);
    }

    /**
     * Load parameters from URL on page load
     */
    loadParamsFromURL() {
        const params = new URLSearchParams(window.location.search);

        // Check if we have any params in URL
        if (params.toString() === '') return;

        const mode = params.get('mode');

        // Get values from URL or use defaults
        const rounds = parseInt(params.get('rounds')) || 7;
        const noise = parseInt(params.get('noise')) || 2;
        const reward = parseInt(params.get('reward')) || 3;
        const sucker = parseInt(params.get('sucker')) || 0;
        const temptation = parseInt(params.get('temptation')) || 5;
        const punishment = parseInt(params.get('punishment')) || 1;

        // Apply to sandbox controls
        document.getElementById('sandbox-rounds').value = rounds;
        document.getElementById('sandbox-rounds-value').textContent = rounds;
        document.getElementById('sandbox-noise').value = noise;
        document.getElementById('sandbox-noise-value').textContent = noise;
        document.getElementById('payoff-reward').value = reward;
        document.getElementById('payoff-sucker').value = sucker;
        document.getElementById('payoff-temptation').value = temptation;
        document.getElementById('payoff-punishment').value = punishment;

        // Update payoff matrix display
        document.getElementById('display-reward').textContent = `+${reward}`;
        document.getElementById('display-reward-2').textContent = `+${reward}`;
        document.getElementById('display-sucker').textContent = sucker;
        document.getElementById('display-sucker-2').textContent = sucker;
        document.getElementById('display-temptation').textContent = `+${temptation}`;
        document.getElementById('display-temptation-2').textContent = `+${temptation}`;
        document.getElementById('display-punishment').textContent = `+${punishment}`;
        document.getElementById('display-punishment-2').textContent = `+${punishment}`;

        // If sandbox mode, also apply population and mutation
        if (mode === 'sandbox') {
            const pop = parseInt(params.get('pop')) || 100;
            const mutation = parseInt(params.get('mutation')) || 5;

            document.getElementById('sandbox-population').value = pop;
            document.getElementById('sandbox-pop-value').textContent = pop;
            document.getElementById('sandbox-mutation').value = mutation;
            document.getElementById('sandbox-mutation-value').textContent = mutation;

            // Navigate to sandbox (skip reset to preserve URL params)
            this.startSandbox(true);
        } else {
            // Set custom params for playground
            this.customParams = {
                rounds: rounds,
                noiseRate: noise / 100,
                payoffs: {
                    BOTH_COOPERATE: { player: reward, opponent: reward },
                    PLAYER_COOPERATE_OPP_DEFECT: { player: sucker, opponent: temptation },
                    PLAYER_DEFECT_OPP_COOPERATE: { player: temptation, opponent: sucker },
                    BOTH_DEFECT: { player: punishment, opponent: punishment }
                }
            };

            // Auto-navigate to playground if params are present
            this.startPlayground(true);
        }
    }

    /**
     * Initialize sandbox population chart
     */
    initializeSandboxChart() {
        const chartDiv = document.getElementById('sandbox-population-chart');
        chartDiv.innerHTML = '';

        // Create chart bars
        Object.values(STRATEGIES).forEach(strategy => {
            const info = STRATEGY_INFO[strategy];
            const barDiv = document.createElement('div');
            barDiv.className = 'strategy-bar';
            barDiv.innerHTML = `
                <div class="label">${info.emoji} ${info.name}</div>
                <div class="bar-container">
                    <div class="bar-fill strategy-${strategy}" data-strategy="${strategy}"></div>
                </div>
            `;
            chartDiv.appendChild(barDiv);
        });
    }

    /**
     * Update sandbox population chart
     */
    updateSandboxChart(population) {
        const distribution = population.getDistribution();
        const chartDiv = document.getElementById('sandbox-population-chart');
        const total = population.populationSize;

        Object.entries(distribution).forEach(([strategy, count]) => {
            const percentage = (count / total) * 100;
            const barFill = chartDiv.querySelector(`[data-strategy="${strategy}"]`);
            if (barFill) {
                barFill.style.width = percentage + '%';
                barFill.textContent = count > 0 ? count : '';
            }
        });
    }

    /**
     * Run sandbox simulation
     */
    runSandboxSimulation() {
        const populationSize = parseInt(document.getElementById('sandbox-population').value);
        const roundsPerMatch = parseInt(document.getElementById('sandbox-rounds').value);
        const mutationRate = parseInt(document.getElementById('sandbox-mutation').value) / 100;
        const noiseRate = parseInt(document.getElementById('sandbox-noise').value) / 100;

        // Save simulation parameters to URL
        this.saveSandboxParamsToURL();

        const sandboxPopulation = new Population({
            populationSize,
            roundsPerMatch,
            mutationRate,
            noiseRate
        });

        // Initialize chart with starting population
        this.updateSandboxChart(sandboxPopulation);

        // Update stats
        document.getElementById('sandbox-population-size').textContent = populationSize;
        document.getElementById('sandbox-status').textContent = 'Running...';

        // Clear previous results
        const resultsDiv = document.getElementById('sandbox-results');
        resultsDiv.innerHTML = '';

        let generation = 0;
        const interval = setInterval(() => {
            // Log generation header
            this.logSandboxGeneration(generation + 1);

            // Evolve with logging enabled
            const matchLog = sandboxPopulation.evolve(true);
            generation++;

            // Log matches from this generation
            if (matchLog && matchLog.length > 0) {
                matchLog.forEach(match => {
                    this.logSandboxMatch(match.agentA, match.agentB, match.scoreA, match.scoreB);
                });
            }

            // Update live stats
            document.getElementById('sandbox-generation').textContent = generation;
            this.updateSandboxChart(sandboxPopulation);

            if (generation >= 50) {
                clearInterval(interval);
                document.getElementById('sandbox-status').textContent = 'Complete';
                this.displaySandboxResults(sandboxPopulation);
            }
        }, 100);
    }

    /**
     * Display sandbox results
     */
    displaySandboxResults(population) {
        const resultsDiv = document.getElementById('sandbox-results');
        const distribution = population.getDistribution();
        const total = population.populationSize;

        // Calculate statistics
        const dominant = Object.entries(distribution).reduce((a, b) => a[1] > b[1] ? a : b);
        const dominantInfo = STRATEGY_INFO[dominant[0]];
        const extinct = Object.entries(distribution).filter(([_, count]) => count === 0).map(([strategy, _]) => STRATEGY_INFO[strategy].name);
        const surviving = Object.entries(distribution).filter(([_, count]) => count > 0).length;

        let html = `
            <div class="narrative-text">
                <h3>Simulation Analysis</h3>
                <div style="margin-top: 20px;">
                    <p><strong>Dominant Strategy:</strong> ${dominantInfo.emoji} ${dominantInfo.name} (${dominant[1]} agents, ${((dominant[1]/total)*100).toFixed(1)}%)</p>
                    <p><strong>Strategies Surviving:</strong> ${surviving} out of ${Object.keys(STRATEGIES).length}</p>
                    ${extinct.length > 0 ? `<p><strong>Extinct Strategies:</strong> ${extinct.join(', ')}</p>` : '<p><strong>All strategies survived!</strong></p>'}
                    <p style="margin-top: 15px;">${this.getInsight(dominant[0], distribution)}</p>
                </div>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
                    <h4>What This Means</h4>
                    <p>${this.getParameterInsight(population)}</p>
                </div>
            </div>
        `;

        resultsDiv.innerHTML = html;
    }

    /**
     * Get insight based on simulation parameters
     */
    getParameterInsight(population) {
        const insights = [];

        if (population.mutationRate > 0.1) {
            insights.push('High mutation rate led to more diversity and unpredictability.');
        } else if (population.mutationRate === 0) {
            insights.push('With no mutations, strategies compete purely on merit.');
        }

        if (population.noiseRate > 0.05) {
            insights.push('High noise made cooperation more difficult, as mistakes were common.');
        } else if (population.noiseRate === 0) {
            insights.push('Perfect information allowed strategies to execute flawlessly.');
        }

        if (population.roundsPerMatch < 5) {
            insights.push('Short matches favored simple strategies.');
        } else if (population.roundsPerMatch > 12) {
            insights.push('Long matches allowed complex patterns to emerge.');
        }

        if (insights.length === 0) {
            return 'Try adjusting the parameters to see how they affect which strategies thrive!';
        }

        return insights.join(' ');
    }

    /**
     * Get insight based on dominant strategy
     */
    getInsight(dominantStrategy, distribution) {
        switch (dominantStrategy) {
            case STRATEGIES.COOPERATOR:
                return 'Pure cooperation dominated! This usually happens in low-noise environments where trust can flourish.';
            case STRATEGIES.DEFECTOR:
                return 'Defection took over. This often happens when there\'s too much noise or when cooperative strategies can\'t establish themselves.';
            case STRATEGIES.TIT_FOR_TAT:
                return 'Tit for Tat succeeded! This reciprocal strategy often wins in repeated games, rewarding cooperation and punishing defection.';
            case STRATEGIES.GRUDGER:
                return 'Grudger dominated! While unforgiving, this strategy can thrive when betrayal is rare.';
            case STRATEGIES.DETECTIVE:
                return 'Detective outsmarted the competition! This adaptive strategy exploits cooperative agents while defending against defectors.';
            default:
                return 'The population reached an interesting equilibrium.';
        }
    }

    /**
     * Copy current settings link to clipboard
     */
    async copySettingsLink() {
        const params = new URLSearchParams();

        // Add simulation parameters
        params.set('mode', 'sandbox');
        params.set('pop', document.getElementById('sandbox-population').value);
        params.set('rounds', document.getElementById('sandbox-rounds').value);
        params.set('mutation', document.getElementById('sandbox-mutation').value);
        params.set('noise', document.getElementById('sandbox-noise').value);

        // Add payoff matrix values
        params.set('reward', document.getElementById('payoff-reward').value);
        params.set('sucker', document.getElementById('payoff-sucker').value);
        params.set('temptation', document.getElementById('payoff-temptation').value);
        params.set('punishment', document.getElementById('payoff-punishment').value);

        // Generate full URL
        const fullURL = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

        // Copy to clipboard
        try {
            await navigator.clipboard.writeText(fullURL);

            // Show feedback
            const button = document.getElementById('copy-link-btn');
            const originalText = button.textContent;
            button.textContent = '✓ Copied!';
            button.style.background = '#27ae60';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            alert('Copy this link to share your settings:\n\n' + fullURL);
        }
    }

    /**
     * Reset sandbox
     */
    resetSandbox() {
        document.getElementById('sandbox-results').innerHTML = '';
        document.getElementById('sandbox-population').value = 100;
        document.getElementById('sandbox-rounds').value = 7;
        document.getElementById('sandbox-mutation').value = 5;
        document.getElementById('sandbox-noise').value = 2;

        document.getElementById('sandbox-pop-value').textContent = 100;
        document.getElementById('sandbox-rounds-value').textContent = 7;
        document.getElementById('sandbox-mutation-value').textContent = 5;
        document.getElementById('sandbox-noise-value').textContent = 2;

        // Reset payoff matrix to defaults
        document.getElementById('payoff-reward').value = 3;
        document.getElementById('payoff-sucker').value = 0;
        document.getElementById('payoff-temptation').value = 5;
        document.getElementById('payoff-punishment').value = 1;

        document.getElementById('display-reward').textContent = '+3';
        document.getElementById('display-reward-2').textContent = '+3';
        document.getElementById('display-sucker').textContent = '0';
        document.getElementById('display-sucker-2').textContent = '0';
        document.getElementById('display-temptation').textContent = '+5';
        document.getElementById('display-temptation-2').textContent = '+5';
        document.getElementById('display-punishment').textContent = '+1';
        document.getElementById('display-punishment-2').textContent = '+1';

        document.getElementById('sandbox-generation').textContent = 0;
        document.getElementById('sandbox-population-size').textContent = 100;
        document.getElementById('sandbox-status').textContent = 'Ready';

        this.initializeSandboxChart();

        // Clear log
        const sandboxLog = document.getElementById('sandbox-log');
        if (sandboxLog) {
            sandboxLog.innerHTML = '';
        }

        // Clear URL parameters
        window.history.pushState({}, '', window.location.pathname);
    }

    /**
     * Toggle sandbox log visibility
     */
    toggleSandboxLog() {
        const container = document.getElementById('sandbox-log-container');
        const button = document.getElementById('toggle-sandbox-log-btn');

        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            button.textContent = '📊 Hide Match Log';
        } else {
            container.classList.add('hidden');
            button.textContent = '📊 Show Match Log';
        }
    }

    /**
     * Log a generation header in sandbox
     */
    logSandboxGeneration(generation) {
        const logDiv = document.getElementById('sandbox-log');
        if (!logDiv) return;

        const entry = document.createElement('div');
        entry.className = 'sandbox-log-entry generation-header';
        entry.textContent = `━━━ Generation ${generation} ━━━`;

        logDiv.appendChild(entry);

        // Auto-scroll to bottom
        logDiv.scrollTop = logDiv.scrollHeight;

        // Keep only last 200 entries to avoid memory issues
        while (logDiv.children.length > 200) {
            logDiv.removeChild(logDiv.firstChild);
        }
    }

    /**
     * Log a match result in sandbox
     */
    logSandboxMatch(agentA, agentB, scoreA, scoreB) {
        const logDiv = document.getElementById('sandbox-log');
        if (!logDiv) return;

        const infoA = STRATEGY_INFO[agentA];
        const infoB = STRATEGY_INFO[agentB];

        const entry = document.createElement('div');
        entry.className = 'sandbox-log-entry match-result';

        let scoreClassA = 'score';
        let scoreClassB = 'score';

        if (scoreA > scoreB) {
            scoreClassA += ' winner';
            scoreClassB += ' loser';
        } else if (scoreB > scoreA) {
            scoreClassA += ' loser';
            scoreClassB += ' winner';
        } else {
            scoreClassA += ' tie';
            scoreClassB += ' tie';
        }

        entry.innerHTML = `
            <div class="agent-name">${infoA.emoji} ${infoA.name}</div>
            <div class="vs">vs</div>
            <div class="agent-name">${infoB.emoji} ${infoB.name}</div>
            <div class="${scoreClassA}">${scoreA} - ${scoreB}</div>
        `;

        logDiv.appendChild(entry);

        // Auto-scroll to bottom
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}

// Initialize the game controller when the page loads
let gameController;
window.addEventListener('DOMContentLoaded', () => {
    gameController = new GameController();
});
