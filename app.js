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
    }

    /**
     * Start Playground mode
     */
    startPlayground(keepCustomParams = false) {
        this.showSection('playground');
        this.currentStrategyIndex = 0;
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
            // All strategies completed, return to tutorial
            alert('Great job! You\'ve played against all strategies. Try the Sandbox to experiment with custom settings!');
            this.showSection('tutorial');
            return;
        }

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
     * Start sandbox mode
     */
    startSandbox() {
        this.showSection('sandbox');
        this.resetSandbox();
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
        this.startPlayground(true); // Keep custom params
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

        document.getElementById('sandbox-generation').textContent = 0;
        document.getElementById('sandbox-population-size').textContent = 100;
        document.getElementById('sandbox-status').textContent = 'Ready';

        this.initializeSandboxChart();

        // Clear log
        const sandboxLog = document.getElementById('sandbox-log');
        if (sandboxLog) {
            sandboxLog.innerHTML = '';
        }
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
