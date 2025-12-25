/**
 * Owencyclopedia MVP v2 — data model
 *
 * Design goals:
 * - Easy to edit by hand
 * - Stable ids (don’t auto-generate from titles)
 * - Tree-first (children), with optional sparse cross-links (related)
 */

window.OWEN_MVP = {
  rootId: "home",

  /**
   * Node shape
   * - id: string (unique)
   * - title: string (display)
   * - blurb?: string (1–2 line hint)
   * - content?: string (long-form reader text; simple Markdown-ish supported)
   * - aliases?: string[] (search helpers)
   * - children?: string[] (tree)
   * - related?: string[] (rare cross-links)
   */
  nodes: [
    {
      id: "home",
      title: "Owencyclopedia",
      blurb:
        "A living fractal map of my life — major domains up top, infinite specificity as you zoom in.",
      aliases: ["owen", "home", "life map", "fractal"],
      children: [
        "health",
        "relationships",
        "mastery",
        "wealth",
        "work",
        "purpose",
        "play",
      ],
    },

    // Health
    {
      id: "health",
      title: "Health",
      blurb: "Body + mind maintenance and optimization.",
      aliases: ["fitness", "wellbeing"],
      children: ["health-physical", "health-mental", "health-diet", "health-sleep", "health-other"],
      related: ["purpose-values"],
    },
    {
      id: "health-physical",
      title: "Physical",
      blurb: "The hardware.",
      children: ["health-physical-training", "health-physical-injuries", "health-physical-metrics"],
    },
    { id: "health-physical-training", title: "Training", aliases: ["exercise", "gym", "running"] },
    { id: "health-physical-injuries", title: "Injuries & Recovery", aliases: ["rehab", "PT"] },
    { id: "health-physical-metrics", title: "Body Metrics", aliases: ["biomarkers", "tracking"] },

    {
      id: "health-mental",
      title: "Mental",
      blurb: "The software.",
      children: ["health-mental-meditation", "health-mental-therapy", "health-mental-models"],
      related: ["purpose-mission"],
    },
    {
      id: "health-mental-meditation",
      title: "Meditation",
      content: `# Meditation

This page is for **how I practice**, not what meditation “is”.

## Defaults
- Minimum: 10 minutes
- Preferred: mornings
- Output: one sentence note afterwards (what I noticed)

## When I’m stuck
- Do less. Do it today.
- Pick one technique (breath, body scan, open awareness) and stay with it.`
    },
    { id: "health-mental-therapy", title: "Therapy Notes", aliases: ["reflection"] },
    { id: "health-mental-models", title: "Mental Models", aliases: ["psychology"] },

    {
      id: "health-diet",
      title: "Diet",
      blurb: "Fuel + constraints + experiments.",
      children: ["health-diet-principles", "health-diet-meals", "health-diet-supplements"],
      aliases: ["nutrition"],
    },
    {
      id: "health-diet-principles",
      title: "Nutrition Principles",
      content: `# Nutrition Principles

This is where I keep the “rules of thumb” that survive fads.

## The point
My diet is a tool for energy, mood stability, and long-term health.

## Principles (draft)
- Protein as an anchor
- Fiber most days
- Eat like an adult 80% of the time, play the other 20%
- Track when experimenting; otherwise keep it simple`
    },
    { id: "health-diet-meals", title: "Favorite Meals" },
    { id: "health-diet-supplements", title: "Supplements", aliases: ["stack"] },

    {
      id: "health-sleep",
      title: "Sleep",
      blurb: "Recovery, rhythm, and dreams.",
      children: ["health-sleep-optimization", "health-sleep-dreams"],
    },
    { id: "health-sleep-optimization", title: "Sleep Optimization" },
    { id: "health-sleep-dreams", title: "Dream Journal" },
    { id: "health-other", title: "Other", children: ["health-other-medical", "health-other-experiments"] },
    { id: "health-other-medical", title: "Medical Records" },
    { id: "health-other-experiments", title: "Experiments" },

    // Relationships
    {
      id: "relationships",
      title: "Relationships",
      blurb: "The people who shape my world.",
      children: ["rel-family", "rel-friends", "rel-romantic", "rel-professional"],
      related: ["purpose", "play-hosting"],
    },
    { id: "rel-family", title: "Family", children: ["rel-family-history", "rel-family-traditions"] },
    { id: "rel-family-history", title: "History" },
    { id: "rel-family-traditions", title: "Traditions" },
    { id: "rel-friends", title: "Friends", children: ["rel-friends-core", "rel-friends-groups"] },
    { id: "rel-friends-core", title: "Core Circle" },
    { id: "rel-friends-groups", title: "Groups" },
    { id: "rel-romantic", title: "Romantic", children: ["rel-romantic-philosophy", "rel-romantic-lessons"] },
    { id: "rel-romantic-philosophy", title: "Philosophy" },
    { id: "rel-romantic-lessons", title: "Lessons" },
    { id: "rel-professional", title: "Professional", children: ["rel-pro-mentors", "rel-pro-collaborators"] },
    { id: "rel-pro-mentors", title: "Mentors" },
    { id: "rel-pro-collaborators", title: "Collaborators" },

    // Mastery
    {
      id: "mastery",
      title: "Mastery",
      blurb: "Skills, learning, and growth.",
      children: ["mastery-skills", "mastery-projects", "mastery-knowledge", "mastery-principles"],
      related: ["work", "purpose-mission"],
    },
    { id: "mastery-skills", title: "Skills", children: ["mastery-skills-technical", "mastery-skills-soft", "mastery-skills-log"] },
    { id: "mastery-skills-technical", title: "Technical" },
    { id: "mastery-skills-soft", title: "Soft Skills" },
    { id: "mastery-skills-log", title: "Practice Log" },
    { id: "mastery-projects", title: "Projects", children: ["mastery-projects-current", "mastery-projects-past", "mastery-projects-ideas"] },
    { id: "mastery-projects-current", title: "Current" },
    { id: "mastery-projects-past", title: "Past" },
    { id: "mastery-projects-ideas", title: "Ideas" },
    { id: "mastery-knowledge", title: "Knowledge", children: ["mastery-knowledge-books", "mastery-knowledge-courses", "mastery-knowledge-notes"] },
    { id: "mastery-knowledge-books", title: "Books" },
    { id: "mastery-knowledge-courses", title: "Courses" },
    { id: "mastery-knowledge-notes", title: "Notes" },
    { id: "mastery-principles", title: "Principles", children: ["mastery-principles-beliefs", "mastery-principles-frameworks"] },
    { id: "mastery-principles-beliefs", title: "Beliefs" },
    { id: "mastery-principles-frameworks", title: "Frameworks" },

    // Wealth
    {
      id: "wealth",
      title: "Wealth",
      blurb: "Resources and stability.",
      children: ["wealth-finances", "wealth-career", "wealth-assets"],
      related: ["work"],
    },
    { id: "wealth-finances", title: "Finances", children: ["wealth-finances-budget", "wealth-finances-investments", "wealth-finances-networth"] },
    { id: "wealth-finances-budget", title: "Budget" },
    { id: "wealth-finances-investments", title: "Investments" },
    { id: "wealth-finances-networth", title: "Net Worth" },
    { id: "wealth-career", title: "Career", children: ["wealth-career-path", "wealth-career-history"] },
    { id: "wealth-career-path", title: "Path" },
    { id: "wealth-career-history", title: "History" },
    { id: "wealth-assets", title: "Assets", children: ["wealth-assets-realestate", "wealth-assets-equity"] },
    { id: "wealth-assets-realestate", title: "Real Estate" },
    { id: "wealth-assets-equity", title: "Equity" },

    // Work
    {
      id: "work",
      title: "Work",
      blurb: "Contribution and vocation.",
      children: ["work-current", "work-past", "work-side"],
      related: ["purpose-mission", "mastery-projects"],
    },
    { id: "work-current", title: "Current Role", children: ["work-current-responsibilities", "work-current-projects", "work-current-team"] },
    { id: "work-current-responsibilities", title: "Responsibilities" },
    { id: "work-current-projects", title: "Projects" },
    { id: "work-current-team", title: "Team" },
    { id: "work-past", title: "Past Roles", children: ["work-past-history", "work-past-lessons"] },
    { id: "work-past-history", title: "History" },
    { id: "work-past-lessons", title: "Lessons" },
    { id: "work-side", title: "Side Projects", children: ["work-side-active", "work-side-archived"] },
    { id: "work-side-active", title: "Active" },
    { id: "work-side-archived", title: "Archived" },

    // Purpose
    {
      id: "purpose",
      title: "Purpose",
      blurb: "The why.",
      children: ["purpose-mission", "purpose-values", "purpose-legacy"],
      related: ["relationships", "mastery"],
    },
    { id: "purpose-mission", title: "Mission", children: ["purpose-mission-statement", "purpose-mission-evolution"] },
    {
      id: "purpose-mission-statement",
      title: "Statement",
      content: `# Mission Statement

Write the one sentence that you’d be proud to fail at.

## Current draft
(Put the real sentence here.)

## Notes
- It should feel slightly too ambitious.
- It should be legible to a stranger.`
    },
    { id: "purpose-mission-evolution", title: "Evolution" },
    { id: "purpose-values", title: "Values", children: ["purpose-values-core", "purpose-values-conflicts"] },
    { id: "purpose-values-core", title: "Core" },
    { id: "purpose-values-conflicts", title: "Conflicts" },
    { id: "purpose-legacy", title: "Legacy", children: ["purpose-legacy-impact", "purpose-legacy-wants"] },
    { id: "purpose-legacy-impact", title: "Impact" },
    { id: "purpose-legacy-wants", title: "Wants" },

    // Play
    {
      id: "play",
      title: "Play",
      blurb: "Joy, leisure, and exploration.",
      children: [
        "play-sports",
        "play-food",
        "play-nature",
        "play-music",
        "play-art",
        "play-writing",
        "play-reading",
        "play-making",
        "play-travel",
        "play-games",
        "play-goingout",
        "play-visualarts",
        "play-languages",
        "play-hosting",
        "play-stylecare",
        "play-tech",
        "play-dreamhouse",
        "play-collectables",
      ],
      related: ["relationships"],
    },
    { id: "play-sports", title: "Sports" },
    { id: "play-food", title: "Food" },
    { id: "play-nature", title: "Nature" },
    { id: "play-music", title: "Music" },
    { id: "play-art", title: "Art" },
    { id: "play-writing", title: "Writing" },
    { id: "play-reading", title: "Reading" },
    { id: "play-making", title: "Making" },
    {
      id: "play-travel",
      title: "Travel",
      children: ["play-travel-places", "play-travel-logs", "play-travel-favorites", "play-travel-planning"],
      aliases: ["trips", "planes", "hotels"],
      related: ["relationships", "work"],
    },
    { id: "play-travel-places", title: "Places I’ve Visited", aliases: ["visited"] },
    {
      id: "play-travel-logs",
      title: "Travel Logs",
      aliases: ["journals"],
      content: `# Travel Logs

This is the long-form record: what I did, what I learned, what I’d repeat.

## Template
- Where / when
- People
- Highlights
- Frictions
- One photo / one sentence

## Open questions
- What places changed me the most?
- What kinds of trips reliably reset me?`
    },
    {
      id: "play-travel-favorites",
      title: "Favorite Flights & Hotels",
      content: `# Favorite Flights & Hotels

This is where I keep the “worth it” list (comfort, value, vibe).

## Rules
- If I wouldn’t recommend it twice, it doesn’t stay.
- Notes > star ratings.`
    },
    { id: "play-travel-planning", title: "Planning" },
    { id: "play-games", title: "Games" },
    { id: "play-goingout", title: "Going Out" },
    { id: "play-visualarts", title: "Visual Arts" },
    { id: "play-languages", title: "Languages" },
    { id: "play-hosting", title: "Hosting" },
    { id: "play-stylecare", title: "Style & Care" },
    { id: "play-tech", title: "Tech" },
    { id: "play-dreamhouse", title: "Dream House" },
    { id: "play-collectables", title: "Collectables" },
  ],
};


