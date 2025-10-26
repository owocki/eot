Demo: https://eot.owocki.com/

# Evolution of Trust - Interactive Game

An interactive remake/remix of Nicky Case's "Evolution of Trust" game, exploring how cooperation and trust emerge through repeated social dilemmas using game theory.

## Overview

This game simulates the Prisoner's Dilemma and demonstrates how different strategies perform when agents repeatedly interact. Players can:
- Learn the fundamentals of trust and cooperation
- Play against different AI strategies
- Watch evolution simulations unfold
- Experiment with custom parameters

## Features

### 🎓 Tutorial Mode
Learn the basics of the game through an interactive tutorial explaining the payoff matrix and core mechanics.

### 🎮 Playground Mode
Play 10 rounds against each of these strategies:
- **Always Cooperate** 😊 - Naive optimist who always trusts
- **Always Cheat** 😈 - Cynical exploiter who never trusts
- **Tit for Tat** 🔄 - Reciprocator who mirrors your last move
- **Grudger** 😤 - Forgives until betrayed once, then never again
- **Detective** 🕵️ - Tests you first, then adapts strategically

### 🧬 Evolution Simulation
Watch a population of 100 agents compete over 50 generations:
- Successful strategies reproduce
- Failed strategies die out
- See which approaches dominate over time
- Real-time population distribution visualization

### 🔬 Sandbox Mode
Experiment with custom parameters:
- Adjust population size (20-200)
- Change rounds per match (3-20)
- Set mutation rate (0-20%)
- Control noise/mistake rate (0-10%)

## Payoff Matrix

|                | Opponent Cooperates | Opponent Defects |
|----------------|---------------------|------------------|
| You Cooperate  | +3 / +3             | 0 / +5           |
| You Defect     | +5 / 0              | +1 / +1          |

## Game Mechanics

### Core Principles
Trust emerges when:
1. **Repeated interactions** - Not just one-off encounters
2. **Communication/memory** - Agents remember past actions
3. **Win-win possibility** - Mutual cooperation beats mutual defection

### Strategy Behaviors

**Always Cooperate**
```
Always returns: Cooperate
```

**Always Defect**
```
Always returns: Defect
```

**Tit for Tat**
```
Round 1: Cooperate
Round N: Copy opponent's last move
```

**Grudger**
```
If opponent ever defected: Defect
Else: Cooperate
```

**Detective**
```
Round 1: Cooperate
Round 2: Defect (testing)
Round 3-4: Cooperate
Round 5+: If opponent never defected in rounds 1-4, always defect
        Else: Play Tit for Tat
```

**Random**
```
50% chance: Cooperate
50% chance: Defect
```

## How to Run

### Option 1: Local Web Server (Python)
```bash
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

### Option 2: Local Web Server (Node.js)
```bash
npx http-server -p 8000
# Open http://localhost:8000 in your browser
```

### Option 3: Simple File Open
Just open `index.html` in your web browser (some features may require a web server).

## Testing

Run the automated test suite:
```bash
node test.js
```

This verifies:
- All 6 strategies work correctly
- Payoff calculations are accurate
- Evolution simulation runs properly
- Agent behaviors match specifications

## Project Structure

```
eot/
├── index.html          # Main HTML structure
├── styles.css          # All styling and animations
├── game.js             # Core game logic and AI strategies
├── app.js              # UI controller and game flow
├── test.js             # Automated test suite
├── spec.md             # Original game specification
└── README.md           # This file
```

## Technology Stack

- **HTML5** - Structure
- **CSS3** - Styling with animations
- **Vanilla JavaScript** - Game logic and UI
- **p5.js** - Visualization library (loaded via CDN)

## Educational Outcomes

After playing, users should understand:
- Why cooperation is hard but valuable
- How repetition enables trust
- Why memory and reciprocity matter
- How mistakes affect cooperation
- Real-world applications (social media, open source, etc.)

## Game Theory Insights

The simulation demonstrates key concepts:
- **Nash Equilibrium** - Both defect is stable but suboptimal
- **Pareto Efficiency** - Both cooperate is better for everyone
- **Evolution of Cooperation** - Reciprocal strategies often win
- **Noise Effects** - Mistakes can destroy trust
- **Population Dynamics** - Strategies rise and fall over generations

## Credits

- Inspired by Nicky Case's original "Evolution of Trust"
- Based on game theory research by Robert Axelrod
- Implements the classic Prisoner's Dilemma

## License

Educational use - Feel free to learn from and remix this code!

---

**Have fun exploring the evolution of trust!** 🤝
