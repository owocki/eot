# Quick Start Guide - Evolution of Trust

Get up and running in 30 seconds!

## Step 1: Start the Server

```bash
cd /Users/owocki/Sites/eot
python3 -m http.server 8000
```

## Step 2: Open in Browser

Navigate to: **http://localhost:8000**

## Step 3: Play!

### 📚 Tutorial (2 minutes)
1. Read the game introduction
2. Study the payoff matrix
3. Click "Start Playing"

### 🎮 Playground (5 minutes)
1. Play 10 rounds against "Always Cooperate"
   - Try different strategies to see the results
2. Continue through all 5 AI opponents:
   - Always Cooperate 😊
   - Always Cheat 😈
   - Tit for Tat 🔄
   - Grudger 😤
   - Detective 🕵️
3. Notice how your choices affect outcomes

### 🧬 Evolution (3 minutes)
1. Click "Start Evolution"
2. Watch the population chart
3. See which strategies survive over 50 generations
4. Key insight: Cooperative strategies often win!

### 🔬 Sandbox (5 minutes)
1. Adjust parameters:
   - Try high mutation rate (15%)
   - Try high noise rate (8%)
   - Try different population sizes
2. Run simulations
3. Compare results to standard evolution
4. Learn how environment affects cooperation

---

## Game Controls

### Playground Mode
- **🤝 Cooperate** - Trust your opponent
- **💔 Defect** - Betray your opponent
- **Next Strategy** - Move to next AI opponent

### Evolution Mode
- **Start Evolution** - Begin simulation
- **Pause** - Pause the simulation
- **Reset** - Start over from generation 0

### Sandbox Mode
- **Sliders** - Adjust parameters
- **Run Simulation** - Start custom simulation
- **Reset** - Return to defaults

---

## Quick Tips

### Winning Strategies
- Against Cooperator: Defect (but morally questionable!)
- Against Defector: Defect (protect yourself)
- Against Tit for Tat: Cooperate (mutual benefit)
- Against Grudger: Always cooperate (one mistake = game over)
- Against Detective: Defect early to prevent exploitation

### Key Insights
1. **Repetition matters** - One-off games favor defection
2. **Cooperation pays** - Long-term cooperation beats exploitation
3. **Mistakes happen** - Noise can destroy trust
4. **Forgiveness helps** - Too much grudge-holding hurts everyone
5. **Context is key** - Different environments favor different strategies

---

## What to Observe

### In Playground
- Your total score vs opponent's score
- Which strategy you score highest against
- How different strategies react to your choices
- The history of moves

### In Evolution
- Which strategies die out first (usually Always Cooperate)
- Which strategies dominate (often Grudger or Tit for Tat)
- How quickly the population stabilizes
- Effect of random mutations

### In Sandbox
- Higher noise = less cooperation
- Higher mutation = more diversity
- More rounds = cooperative strategies do better
- Population size affects stability

---

## Troubleshooting

### Game won't load?
1. Check server is running: `ps aux | grep http.server`
2. Try different port: `python3 -m http.server 8001`
3. Clear browser cache
4. Try different browser

### Buttons not working?
1. Check browser console (F12) for errors
2. Verify all files loaded (Network tab)
3. Try refreshing the page

### Evolution too fast/slow?
- Edit `app.js` line ~285: Change `500` to different millisecond value
- Lower = faster, Higher = slower

---

## Testing

Run automated tests:
```bash
node test.js
```

Run verification:
```bash
./verify.sh
```

View integration tests:
```
http://localhost:8000/integration-test.html
```

---

## Next Steps

After playing through all modes:

1. **Experiment** - Try to maximize your score
2. **Analyze** - Why do certain strategies dominate?
3. **Apply** - How does this relate to real life?
4. **Extend** - Can you think of new strategies?

---

## Real World Applications

Think about where you see these dynamics:

- **Social Media** - Why does outrage spread? (Defection is visible)
- **Open Source** - Why do people contribute? (Repeated interactions)
- **Business** - Why do companies partner? (Long-term gains)
- **International Relations** - Why cooperate? (Future matters)
- **Climate Change** - Why is it hard? (No repetition with future)

---

## Have Fun! 🎮

The game is designed to be both fun and educational. Take your time, experiment, and discover the surprising dynamics of trust and cooperation!

**Estimated Play Time:** 15-20 minutes for full experience

**Replay Value:** High - try different strategies each time!
