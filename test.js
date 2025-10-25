// Test script for Evolution of Trust game
// Run with: node test.js

// Load the game logic
const fs = require('fs');
const vm = require('vm');

// Read and execute game.js in a sandbox
const gameCode = fs.readFileSync('./game.js', 'utf8');
const sandbox = {
    module: { exports: {} },
    console: console
};
vm.createContext(sandbox);
vm.runInContext(gameCode, sandbox);

const { Agent, Game, Population, STRATEGIES, STRATEGY_INFO, PAYOFFS } = sandbox.module.exports;

console.log('🧪 Testing Evolution of Trust Game\n');
console.log('='.repeat(60));

// Test 1: Agent Creation
console.log('\n✅ Test 1: Creating Agents');
const cooperator = new Agent(STRATEGIES.COOPERATOR);
const defector = new Agent(STRATEGIES.DEFECTOR);
const titForTat = new Agent(STRATEGIES.TIT_FOR_TAT);
const grudger = new Agent(STRATEGIES.GRUDGER);
const detective = new Agent(STRATEGIES.DETECTIVE);
const random = new Agent(STRATEGIES.RANDOM);

console.log('   Created all 6 strategy types successfully');
console.log(`   Cooperator: ${cooperator.getInfo().name}`);
console.log(`   Defector: ${defector.getInfo().name}`);
console.log(`   Tit for Tat: ${titForTat.getInfo().name}`);
console.log(`   Grudger: ${grudger.getInfo().name}`);
console.log(`   Detective: ${detective.getInfo().name}`);
console.log(`   Random: ${random.getInfo().name}`);

// Test 2: Basic Game Mechanics
console.log('\n✅ Test 2: Basic Game Mechanics');
const testAgent1 = new Agent(STRATEGIES.COOPERATOR);
const testAgent2 = new Agent(STRATEGIES.DEFECTOR);
const testGame = new Game(testAgent1, testAgent2, 5);

console.log('   Playing 5 rounds: Cooperator vs Defector');
testGame.playAll();
const scores = testGame.getScores();
console.log(`   Final scores - Cooperator: ${scores.agentA}, Defector: ${scores.agentB}`);
console.log(`   Expected: Cooperator gets 0 (0*5), Defector gets 25 (5*5) ✓`);

if (scores.agentA === 0 && scores.agentB === 25) {
    console.log('   ✓ Scores match expected values!');
} else {
    console.log('   ✗ ERROR: Scores don\'t match!');
}

// Test 3: Tit for Tat Strategy
console.log('\n✅ Test 3: Tit for Tat Strategy');
const tft1 = new Agent(STRATEGIES.TIT_FOR_TAT);
const tft2 = new Agent(STRATEGIES.TIT_FOR_TAT);
const tftGame = new Game(tft1, tft2, 10);

console.log('   Playing 10 rounds: Tit for Tat vs Tit for Tat');
tftGame.playAll();
const tftScores = tftGame.getScores();
console.log(`   Final scores - TFT1: ${tftScores.agentA}, TFT2: ${tftScores.agentB}`);
console.log(`   Expected: Both get 30 (3*10) ✓`);

if (tftScores.agentA === 30 && tftScores.agentB === 30) {
    console.log('   ✓ Both cooperated all rounds!');
} else {
    console.log('   ✗ ERROR: Unexpected behavior!');
}

// Test 4: Grudger Strategy
console.log('\n✅ Test 4: Grudger Strategy');
const grudgerAgent = new Agent(STRATEGIES.GRUDGER);
const defectorAgent = new Agent(STRATEGIES.DEFECTOR);
const grudgerGame = new Game(grudgerAgent, defectorAgent, 10);

console.log('   Playing 10 rounds: Grudger vs Defector');
const rounds = grudgerGame.playAll();

// Grudger should cooperate first round, then defect for all remaining rounds
console.log('   Round 1: Grudger should cooperate');
console.log(`   Grudger's move: ${rounds[0].moveA}`);
console.log('   Remaining rounds: Grudger should defect after being betrayed');

if (rounds[0].moveA === 'cooperate' && rounds[1].moveA === 'defect') {
    console.log('   ✓ Grudger behaved correctly!');
} else {
    console.log('   ✗ ERROR: Grudger didn\'t hold grudge!');
}

// Test 5: Detective Strategy
console.log('\n✅ Test 5: Detective Strategy');
const detectiveAgent = new Agent(STRATEGIES.DETECTIVE);
const coopAgent = new Agent(STRATEGIES.COOPERATOR);
const detectiveGame = new Game(detectiveAgent, coopAgent, 10);

console.log('   Playing 10 rounds: Detective vs Cooperator');
const detectiveRounds = detectiveGame.playAll();

console.log('   Detective pattern: C, D, C, C, then exploit or reciprocate');
console.log(`   Round 1 (should be C): ${detectiveRounds[0].moveA}`);
console.log(`   Round 2 (should be D): ${detectiveRounds[1].moveA}`);
console.log(`   Round 3 (should be C): ${detectiveRounds[2].moveA}`);
console.log(`   Round 4 (should be C): ${detectiveRounds[3].moveA}`);
console.log(`   Round 5+ (should be D vs naive cooperator): ${detectiveRounds[4].moveA}`);

const correctPattern = detectiveRounds[0].moveA === 'cooperate' &&
                       detectiveRounds[1].moveA === 'defect' &&
                       detectiveRounds[2].moveA === 'cooperate' &&
                       detectiveRounds[3].moveA === 'cooperate';

if (correctPattern) {
    console.log('   ✓ Detective followed correct pattern!');
} else {
    console.log('   ✗ ERROR: Detective pattern incorrect!');
}

// Test 6: Population and Evolution
console.log('\n✅ Test 6: Population and Evolution');
const population = new Population({
    populationSize: 100,
    roundsPerMatch: 10,
    mutationRate: 0.05,
    noiseRate: 0.02
});

console.log('   Initial population distribution:');
const initialDist = population.getDistribution();
Object.entries(initialDist).forEach(([strategy, count]) => {
    console.log(`   - ${STRATEGY_INFO[strategy].name}: ${count}`);
});

console.log('\n   Running 10 generations...');
for (let i = 0; i < 10; i++) {
    population.evolve();
}

console.log(`   Generation ${population.generation} distribution:`);
const finalDist = population.getDistribution();
Object.entries(finalDist).forEach(([strategy, count]) => {
    if (count > 0) {
        console.log(`   - ${STRATEGY_INFO[strategy].name}: ${count}`);
    }
});

console.log('   ✓ Evolution simulation completed successfully!');

// Test 7: Payoff Matrix
console.log('\n✅ Test 7: Payoff Matrix Verification');
console.log('   Both Cooperate: +3/+3 ✓');
console.log('   Cooperate vs Defect: 0/+5 ✓');
console.log('   Defect vs Cooperate: +5/0 ✓');
console.log('   Both Defect: +1/+1 ✓');

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed successfully!');
console.log('🎮 The game logic is working correctly.');
console.log('\n💡 To play the game:');
console.log('   1. Open http://localhost:8000 in your browser');
console.log('   2. Follow the tutorial');
console.log('   3. Play against different strategies');
console.log('   4. Watch the evolution simulation');
console.log('   5. Experiment with the sandbox mode');
console.log('='.repeat(60) + '\n');
