// Payoff matrix constants
const PAYOFFS = {
    BOTH_COOPERATE: { player: 3, opponent: 3 },
    PLAYER_COOPERATE_OPP_DEFECT: { player: 0, opponent: 5 },
    PLAYER_DEFECT_OPP_COOPERATE: { player: 5, opponent: 0 },
    BOTH_DEFECT: { player: 1, opponent: 1 }
};

// Strategy types
const STRATEGIES = {
    COOPERATOR: 'cooperator',
    DEFECTOR: 'defector',
    TIT_FOR_TAT: 'tit-for-tat',
    GRUDGER: 'grudger',
    RANDOM: 'random',
    DETECTIVE: 'detective'
};

// Strategy descriptions
const STRATEGY_INFO = {
    'cooperator': {
        name: 'Always Cooperate',
        description: 'This naive optimist always cooperates, trusting everyone no matter what.',
        emoji: '😊'
    },
    'defector': {
        name: 'Always Cheat',
        description: 'This cynical exploiter always defects, never trusting anyone.',
        emoji: '😈'
    },
    'tit-for-tat': {
        name: 'Tit for Tat',
        description: 'This reciprocator starts with cooperation, then mirrors your last move.',
        emoji: '🔄'
    },
    'grudger': {
        name: 'Grudger',
        description: 'This agent cooperates until you defect once, then holds a grudge forever.',
        emoji: '😤'
    },
    'random': {
        name: 'Random',
        description: 'This unpredictable agent has a 50% chance of cooperating each round.',
        emoji: '🎲'
    },
    'detective': {
        name: 'Detective',
        description: 'This clever agent tests you first, then adapts based on your responses.',
        emoji: '🕵️'
    }
};

/**
 * Base Agent class
 */
class Agent {
    constructor(strategy) {
        this.strategy = strategy;
        this.memory = [];
        this.opponentMemory = [];
        this.score = 0;
        this.hasBeenBetrayed = false;
    }

    /**
     * Decide whether to cooperate or defect
     * @param {Array} opponentHistory - Array of opponent's previous moves
     * @param {number} roundNumber - Current round number (0-indexed)
     * @param {number} noiseRate - Probability of making a mistake (0-1)
     * @returns {string} 'cooperate' or 'defect'
     */
    decide(opponentHistory, roundNumber = 0, noiseRate = 0) {
        let decision;

        switch (this.strategy) {
            case STRATEGIES.COOPERATOR:
                decision = 'cooperate';
                break;

            case STRATEGIES.DEFECTOR:
                decision = 'defect';
                break;

            case STRATEGIES.TIT_FOR_TAT:
                if (opponentHistory.length === 0) {
                    decision = 'cooperate';
                } else {
                    decision = opponentHistory[opponentHistory.length - 1];
                }
                break;

            case STRATEGIES.GRUDGER:
                if (opponentHistory.includes('defect')) {
                    decision = 'defect';
                } else {
                    decision = 'cooperate';
                }
                break;

            case STRATEGIES.RANDOM:
                decision = Math.random() < 0.5 ? 'cooperate' : 'defect';
                break;

            case STRATEGIES.DETECTIVE:
                // Detective's strategy: C, D, C, C, then adapt
                if (roundNumber === 0) {
                    decision = 'cooperate';
                } else if (roundNumber === 1) {
                    decision = 'defect';
                } else if (roundNumber === 2 || roundNumber === 3) {
                    decision = 'cooperate';
                } else {
                    // After testing, if opponent never defected, always defect
                    // Otherwise, play Tit for Tat
                    if (!opponentHistory.slice(0, 4).includes('defect')) {
                        decision = 'defect';
                    } else {
                        decision = opponentHistory[opponentHistory.length - 1];
                    }
                }
                break;

            default:
                decision = 'cooperate';
        }

        // Apply noise (mistakes)
        if (noiseRate > 0 && Math.random() < noiseRate) {
            decision = decision === 'cooperate' ? 'defect' : 'cooperate';
        }

        return decision;
    }

    /**
     * Record the result of a round
     */
    recordMove(myMove, opponentMove) {
        this.memory.push(myMove);
        this.opponentMemory.push(opponentMove);
        if (opponentMove === 'defect') {
            this.hasBeenBetrayed = true;
        }
    }

    /**
     * Add points to score
     */
    addScore(points) {
        this.score += points;
    }

    /**
     * Reset the agent for a new game
     */
    reset() {
        this.memory = [];
        this.opponentMemory = [];
        this.score = 0;
        this.hasBeenBetrayed = false;
    }

    /**
     * Get info about this agent
     */
    getInfo() {
        return STRATEGY_INFO[this.strategy] || { name: 'Unknown', description: '', emoji: '❓' };
    }
}

/**
 * Game class - manages a single match between two agents
 */
class Game {
    constructor(agentA, agentB, rounds = 10, noiseRate = 0, customPayoffs = null) {
        this.agentA = agentA;
        this.agentB = agentB;
        this.rounds = rounds;
        this.noiseRate = noiseRate;
        this.currentRound = 0;
        this.history = [];
        this.payoffs = customPayoffs || PAYOFFS;
    }

    /**
     * Play a single round
     */
    playRound() {
        const moveA = this.agentA.decide(this.agentA.opponentMemory, this.currentRound, this.noiseRate);
        const moveB = this.agentB.decide(this.agentB.opponentMemory, this.currentRound, this.noiseRate);

        // Calculate payoffs
        let payoffA, payoffB;
        if (moveA === 'cooperate' && moveB === 'cooperate') {
            payoffA = this.payoffs.BOTH_COOPERATE.player;
            payoffB = this.payoffs.BOTH_COOPERATE.opponent;
        } else if (moveA === 'cooperate' && moveB === 'defect') {
            payoffA = this.payoffs.PLAYER_COOPERATE_OPP_DEFECT.player;
            payoffB = this.payoffs.PLAYER_COOPERATE_OPP_DEFECT.opponent;
        } else if (moveA === 'defect' && moveB === 'cooperate') {
            payoffA = this.payoffs.PLAYER_DEFECT_OPP_COOPERATE.player;
            payoffB = this.payoffs.PLAYER_DEFECT_OPP_COOPERATE.opponent;
        } else {
            payoffA = this.payoffs.BOTH_DEFECT.player;
            payoffB = this.payoffs.BOTH_DEFECT.opponent;
        }

        // Update scores
        this.agentA.addScore(payoffA);
        this.agentB.addScore(payoffB);

        // Record moves
        this.agentA.recordMove(moveA, moveB);
        this.agentB.recordMove(moveB, moveA);

        // Store history
        this.history.push({
            round: this.currentRound,
            moveA,
            moveB,
            payoffA,
            payoffB
        });

        this.currentRound++;

        return { moveA, moveB, payoffA, payoffB };
    }

    /**
     * Play all rounds
     */
    playAll() {
        const results = [];
        for (let i = 0; i < this.rounds; i++) {
            results.push(this.playRound());
        }
        return results;
    }

    /**
     * Check if game is over
     */
    isOver() {
        return this.currentRound >= this.rounds;
    }

    /**
     * Get final scores
     */
    getScores() {
        return {
            agentA: this.agentA.score,
            agentB: this.agentB.score
        };
    }
}

/**
 * Population class - manages evolution simulation
 */
class Population {
    constructor(config = {}) {
        this.populationSize = config.populationSize || 100;
        this.roundsPerMatch = config.roundsPerMatch || 10;
        this.mutationRate = config.mutationRate || 0.05;
        this.noiseRate = config.noiseRate || 0.02;
        this.generation = 0;

        // Initialize population with equal distribution
        this.agents = this.initializePopulation();
        this.history = [];
    }

    /**
     * Initialize population with equal distribution of strategies
     */
    initializePopulation() {
        const agents = [];
        const strategies = Object.values(STRATEGIES);
        const agentsPerStrategy = Math.floor(this.populationSize / strategies.length);
        const remainder = this.populationSize % strategies.length;

        for (let i = 0; i < strategies.length; i++) {
            const count = agentsPerStrategy + (i < remainder ? 1 : 0);
            for (let j = 0; j < count; j++) {
                agents.push(new Agent(strategies[i]));
            }
        }

        return agents;
    }

    /**
     * Get population distribution
     */
    getDistribution() {
        const distribution = {};
        Object.values(STRATEGIES).forEach(strategy => {
            distribution[strategy] = 0;
        });

        this.agents.forEach(agent => {
            distribution[agent.strategy]++;
        });

        return distribution;
    }

    /**
     * Run a tournament where each agent plays against random opponents
     */
    runTournament(logMatches = false) {
        // Reset all agents
        this.agents.forEach(agent => agent.reset());

        // Each agent plays multiple matches
        const matchesPerAgent = 5;
        const matchLog = [];

        for (let agent of this.agents) {
            for (let i = 0; i < matchesPerAgent; i++) {
                // Pick random opponent
                const opponent = this.agents[Math.floor(Math.random() * this.agents.length)];
                if (agent === opponent) continue;

                // Play game
                const game = new Game(agent, opponent, this.roundsPerMatch, this.noiseRate);
                game.playAll();

                // Log match if requested (only log first few to avoid performance issues)
                if (logMatches && matchLog.length < 20) {
                    matchLog.push({
                        agentA: agent.strategy,
                        agentB: opponent.strategy,
                        scoreA: agent.score,
                        scoreB: opponent.score
                    });
                }
            }
        }

        return matchLog;
    }

    /**
     * Evolve to next generation
     */
    evolve(logMatches = false) {
        const matchLog = this.runTournament(logMatches);

        // Record current distribution
        this.history.push({
            generation: this.generation,
            distribution: this.getDistribution()
        });

        // Sort agents by score
        const sortedAgents = [...this.agents].sort((a, b) => b.score - a.score);

        // Selection and reproduction
        const newAgents = [];
        const totalScore = sortedAgents.reduce((sum, agent) => sum + Math.max(0, agent.score), 0);

        // Fitness-proportional selection
        for (let i = 0; i < this.populationSize; i++) {
            let selectedAgent;

            if (totalScore === 0) {
                // If all scores are 0 or negative, select randomly
                selectedAgent = sortedAgents[Math.floor(Math.random() * sortedAgents.length)];
            } else {
                // Roulette wheel selection
                let pick = Math.random() * totalScore;
                let current = 0;
                for (let agent of sortedAgents) {
                    current += Math.max(0, agent.score);
                    if (current >= pick) {
                        selectedAgent = agent;
                        break;
                    }
                }
                if (!selectedAgent) {
                    selectedAgent = sortedAgents[0];
                }
            }

            // Create offspring with possible mutation
            let strategy = selectedAgent.strategy;
            if (Math.random() < this.mutationRate) {
                const strategies = Object.values(STRATEGIES);
                strategy = strategies[Math.floor(Math.random() * strategies.length)];
            }

            newAgents.push(new Agent(strategy));
        }

        this.agents = newAgents;
        this.generation++;

        return matchLog;
    }

    /**
     * Reset population
     */
    reset() {
        this.agents = this.initializePopulation();
        this.generation = 0;
        this.history = [];
    }

    /**
     * Run multiple generations
     */
    runGenerations(count, callback) {
        for (let i = 0; i < count; i++) {
            this.evolve();
            if (callback) {
                callback(this.generation, this.getDistribution());
            }
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Agent, Game, Population, STRATEGIES, STRATEGY_INFO, PAYOFFS };
}
