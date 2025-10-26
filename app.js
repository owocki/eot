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
        this.population = null;
        this.evolutionInterval = null;
        this.p5Instance = null;

        this.initializeUI();
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
    }

    /**
     * Start Playground mode
     */
    startPlayground() {
        this.showSection('playground');
        this.currentStrategyIndex = 0;
        this.loadNextStrategy();
    }

    /**
     * Load the next strategy to play against
     */
    loadNextStrategy() {
        if (this.currentStrategyIndex >= this.strategiesToTest.length) {
            this.showSection('evolution');
            return;
        }

        const strategy = this.strategiesToTest[this.currentStrategyIndex];
        this.opponentAgent = new Agent(strategy);
        this.playerAgent = new Agent('player');
        this.currentGame = new Game(this.playerAgent, this.opponentAgent, 7);

        this.updatePlaygroundUI();
        this.enableActionButtons();
    }

    /**
     * Update playground UI with current strategy info
     */
    updatePlaygroundUI() {
        const info = this.opponentAgent.getInfo();
        document.getElementById('opponent-name').textContent = info.name;
        document.getElementById('strategy-description').textContent = info.description;

        // Reset scores
        document.getElementById('player-score').textContent = '0';
        document.getElementById('opponent-score').textContent = '0';

        // Reset round counter
        document.getElementById('current-round').textContent = '1';
        document.getElementById('total-rounds').textContent = '7';

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
     * Handle player move
     */
    playerMove(move) {
        if (!this.currentGame || this.currentGame.isOver()) return;

        this.disableActionButtons();

        // Player's decision
        const playerMove = move;

        // Get opponent's decision
        const opponentMove = this.opponentAgent.decide(
            this.opponentAgent.opponentMemory,
            this.currentGame.currentRound
        );

        // Calculate payoffs
        let payoffPlayer, payoffOpponent;
        if (playerMove === 'cooperate' && opponentMove === 'cooperate') {
            payoffPlayer = PAYOFFS.BOTH_COOPERATE.player;
            payoffOpponent = PAYOFFS.BOTH_COOPERATE.opponent;
        } else if (playerMove === 'cooperate' && opponentMove === 'defect') {
            payoffPlayer = PAYOFFS.PLAYER_COOPERATE_OPP_DEFECT.player;
            payoffOpponent = PAYOFFS.PLAYER_COOPERATE_OPP_DEFECT.opponent;
        } else if (playerMove === 'defect' && opponentMove === 'cooperate') {
            payoffPlayer = PAYOFFS.PLAYER_DEFECT_OPP_COOPERATE.player;
            payoffOpponent = PAYOFFS.PLAYER_DEFECT_OPP_COOPERATE.opponent;
        } else {
            payoffPlayer = PAYOFFS.BOTH_DEFECT.player;
            payoffOpponent = PAYOFFS.BOTH_DEFECT.opponent;
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
        this.currentStrategyIndex++;
        if (this.currentStrategyIndex >= this.strategiesToTest.length) {
            this.showSection('evolution');
        } else {
            this.loadNextStrategy();
        }
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
     * Start evolution from menu
     */
    startEvolutionFromMenu() {
        this.showSection('evolution');
        this.resetEvolution();
    }

    /**
     * Start evolution simulation
     */
    startEvolution() {
        if (!this.population) {
            this.population = new Population({
                populationSize: 100,
                roundsPerMatch: 7,
                mutationRate: 0.05,
                noiseRate: 0.02
            });
            this.updatePopulationChart();
        }

        document.getElementById('start-evolution-btn').style.display = 'none';
        document.getElementById('pause-evolution-btn').style.display = 'inline-block';

        this.evolutionInterval = setInterval(() => {
            this.population.evolve();
            this.updateEvolutionDisplay();

            if (this.population.generation >= 50) {
                this.pauseEvolution();
            }
        }, 500);
    }

    /**
     * Pause evolution simulation
     */
    pauseEvolution() {
        if (this.evolutionInterval) {
            clearInterval(this.evolutionInterval);
            this.evolutionInterval = null;
        }
        document.getElementById('start-evolution-btn').style.display = 'inline-block';
        document.getElementById('pause-evolution-btn').style.display = 'none';
    }

    /**
     * Reset evolution simulation
     */
    resetEvolution() {
        this.pauseEvolution();
        this.population = new Population({
            populationSize: 100,
            roundsPerMatch: 7,
            mutationRate: 0.05,
            noiseRate: 0.02
        });
        this.updateEvolutionDisplay();
    }

    /**
     * Update evolution display
     */
    updateEvolutionDisplay() {
        document.getElementById('generation').textContent = this.population.generation;
        this.updatePopulationChart();
    }

    /**
     * Update population chart
     */
    updatePopulationChart() {
        const distribution = this.population.getDistribution();
        const chartDiv = document.getElementById('population-chart');

        if (!chartDiv.hasChildNodes()) {
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

        // Update bar widths
        const total = this.population.populationSize;
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
     * Start sandbox mode
     */
    startSandbox() {
        this.showSection('sandbox');
        this.resetSandbox();
    }

    /**
     * Run sandbox simulation
     */
    runSandboxSimulation() {
        const populationSize = parseInt(document.getElementById('sandbox-population').value);
        const roundsPerMatch = parseInt(document.getElementById('sandbox-rounds').value);
        const mutationRate = parseInt(document.getElementById('sandbox-mutation').value) / 100;
        const noiseRate = parseInt(document.getElementById('sandbox-noise').value) / 100;

        const sandboxPopulation = new Population({
            populationSize,
            roundsPerMatch,
            mutationRate,
            noiseRate
        });

        // Run 50 generations
        const resultsDiv = document.getElementById('sandbox-results');
        resultsDiv.innerHTML = '<h3>Running simulation...</h3>';

        let generation = 0;
        const interval = setInterval(() => {
            sandboxPopulation.evolve();
            generation++;

            if (generation >= 50) {
                clearInterval(interval);
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

        let html = '<h3>Final Results (Generation 50)</h3>';
        html += '<div style="margin-top: 20px;">';

        Object.entries(distribution).forEach(([strategy, count]) => {
            const info = STRATEGY_INFO[strategy];
            const percentage = ((count / total) * 100).toFixed(1);
            html += `
                <div class="strategy-bar">
                    <div class="label">${info.emoji} ${info.name}</div>
                    <div class="bar-container">
                        <div class="bar-fill strategy-${strategy}" style="width: ${percentage}%;">
                            ${count > 0 ? count : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Add insights
        const dominant = Object.entries(distribution).reduce((a, b) => a[1] > b[1] ? a : b);
        const dominantInfo = STRATEGY_INFO[dominant[0]];

        html += `
            <div class="narrative-text" style="margin-top: 30px;">
                <h4>Analysis</h4>
                <p><strong>Dominant Strategy:</strong> ${dominantInfo.emoji} ${dominantInfo.name} (${dominant[1]} agents)</p>
                <p>${this.getInsight(dominant[0], distribution)}</p>
            </div>
        `;

        resultsDiv.innerHTML = html;
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
    }
}

// Initialize the game controller when the page loads
let gameController;
window.addEventListener('DOMContentLoaded', () => {
    gameController = new GameController();
});
