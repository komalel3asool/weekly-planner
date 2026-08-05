export const DUMMY_DATA = {
  "habits": [
    {
      "id": "habit-001",
      "name": "Morning Routine",
      "type": "daily",
      "color": "blue",
      "icon": "\ud83c\udf05",
      "status": "active",
      "createdAt": "2026-07-15T08:00:00Z",
      "currentStreak": 12,
      "longestStreak": 23
    },
    {
      "id": "habit-002",
      "name": "Exercise",
      "type": "daily",
      "color": "red",
      "icon": "\ud83d\udcaa",
      "status": "active",
      "createdAt": "2026-07-01T09:00:00Z",
      "currentStreak": 8,
      "longestStreak": 18
    },
    {
      "id": "habit-003",
      "name": "Read",
      "type": "daily",
      "color": "orange",
      "icon": "\ud83d\udcda",
      "status": "active",
      "createdAt": "2026-07-20T19:00:00Z",
      "currentStreak": 4,
      "longestStreak": 4
    },
    {
      "id": "habit-004",
      "name": "Meditation",
      "type": "daily",
      "color": "purple",
      "icon": "\ud83e\uddd8",
      "status": "active",
      "createdAt": "2026-07-10T06:00:00Z",
      "currentStreak": 6,
      "longestStreak": 14
    },
    {
      "id": "habit-005",
      "name": "Weekly Review",
      "type": "weekly",
      "color": "cyan",
      "icon": "\ud83d\udccb",
      "status": "active",
      "createdAt": "2026-06-01T18:00:00Z",
      "currentStreak": 3,
      "longestStreak": 5
    },
    {
      "id": "habit-006",
      "name": "Cold Shower",
      "type": "daily",
      "color": "cyan",
      "icon": "\ud83d\udebf",
      "status": "paused",
      "createdAt": "2026-07-05T07:00:00Z",
      "currentStreak": 0,
      "longestStreak": 10,
      "pausedAt": "2026-08-01T07:00:00Z"
    }
  ],
  "weeks": {
    "2026-W32": {
      "weekKey": "2026-W32",
      "year": 2026,
      "week": 32,
      "focus": "Focus: Crush the trading plan + finish reading Atomic Habits",
      "days": {
        "Monday": {
          "date": "2026-08-03",
          "done": [
            "Reviewed market setup",
            "Completed 30min workout",
            "Read 20 pages"
          ],
          "todos": [
            { "text": "Review weekly goals", "completed": false },
            { "text": "Catch up on emails", "completed": false },
            { "text": "Call with mentor", "completed": false }
          ],
          "meetings": [
            "Weekly sync with team - 1pm"
          ],
          "results": [
            "Identified 3 trading setups",
            "Got positive feedback on project"
          ],
          "habitLog": {
            "habit-001": {
              "count": 1,
              "notes": "Great morning flow"
            },
            "habit-002": {
              "count": 1,
              "notes": "30min run"
            },
            "habit-003": {
              "count": 2,
              "notes": "Finished chapter 3"
            },
            "habit-004": {
              "count": 1,
              "notes": "10min meditation"
            }
          }
        },
        "Tuesday": {
          "date": "2026-08-04",
          "done": [
            "Took 2 trades",
            "Morning run",
            "Coded new feature"
          ],
          "todos": [
            { "text": "Review trade results", "completed": false },
            { "text": "Update documentation", "completed": false },
            { "text": "Meal prep for week", "completed": false }
          ],
          "meetings": [],
          "results": [
            "1 winning trade (+2R)",
            "Merged 3 PRs"
          ],
          "habitLog": {
            "habit-001": {
              "count": 1
            },
            "habit-002": {
              "count": 1,
              "notes": "Morning run 5km"
            },
            "habit-003": {
              "count": 1
            },
            "habit-004": {
              "count": 1
            }
          }
        },
        "Wednesday": {
          "date": "2026-08-05",
          "done": [
            "Analyzed market",
            "Met with designer"
          ],
          "todos": [
            { "text": "Write trading journal", "completed": false },
            { "text": "Follow up with leads", "completed": false },
            { "text": "Plan Friday agenda", "completed": false }
          ],
          "meetings": [
            "Design review - 2pm",
            "1:1 with manager - 3:30pm"
          ],
          "results": [
            "Clarified product roadmap"
          ],
          "habitLog": {
            "habit-001": {
              "count": 1
            },
            "habit-003": {
              "count": 1
            },
            "habit-004": {
              "count": 0
            }
          }
        },
        "Thursday": {
          "date": "2026-08-06",
          "done": [
            "Executed trade setup",
            "Finished documentation",
            "Gym session"
          ],
          "todos": [
            { "text": "Prepare for presentation", "completed": false },
            { "text": "Review competitor analysis", "completed": false }
          ],
          "meetings": [
            "Client call - 10am"
          ],
          "results": [
            "Strong client feedback",
            "Lost 1 trade (-1R) but good execution"
          ],
          "habitLog": {
            "habit-001": {
              "count": 1
            },
            "habit-002": {
              "count": 1,
              "notes": "Gym - chest day"
            },
            "habit-003": {
              "count": 2
            },
            "habit-004": {
              "count": 1
            }
          }
        },
        "Friday": {
          "date": "2026-08-07",
          "done": [
            "Reviewed week",
            "Planning for next week",
            "Team celebration"
          ],
          "todos": [
            { "text": "Finalize monthly report", "completed": false },
            { "text": "Organize notes", "completed": false }
          ],
          "meetings": [
            "Team standup - 9am",
            "Weekly celebration - 5pm"
          ],
          "results": [
            "Week 2W-1L (67% win rate)",
            "Team shipped 2 features",
            "Great feedback from stakeholders"
          ],
          "habitLog": {
            "habit-001": {
              "count": 1
            },
            "habit-003": {
              "count": 1
            },
            "habit-004": {
              "count": 1
            },
            "habit-005": {
              "count": 1,
              "notes": "Full weekly review completed"
            }
          }
        }
      }
    }
  },
  "trades": [
    {
      "id": "trade-001",
      "date": "2026-08-04",
      "ticker": "AAPL",
      "strategy": "Breakout above resistance",
      "direction": "long",
      "outcome": "win",
      "r": 2.1,
      "note": "Clean break, good risk management"
    },
    {
      "id": "trade-002",
      "date": "2026-08-06",
      "ticker": "TSLA",
      "strategy": "Support bounce",
      "direction": "long",
      "outcome": "loss",
      "r": -1.0,
      "note": "Stopped at support, reversal failed"
    },
    {
      "id": "trade-003",
      "date": "2026-08-03",
      "ticker": "SPY",
      "strategy": "Trend continuation",
      "direction": "short",
      "outcome": "loss",
      "r": -0.5,
      "note": "Early entry, pulled back"
    },
    {
      "id": "trade-004",
      "date": "2026-07-31",
      "ticker": "QQQ",
      "strategy": "Breakout above resistance",
      "direction": "long",
      "outcome": "win",
      "r": 1.5,
      "note": "Nice scalp, took profits early"
    },
    {
      "id": "trade-005",
      "date": "2026-07-30",
      "ticker": "MSFT",
      "strategy": "Support bounce",
      "direction": "long",
      "outcome": "win",
      "r": 2.8,
      "note": "Perfect entry, held through target"
    }
  ],
  "pdfReader": {
    "url": "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table.pdf",
    "currentPage": 1,
    "notes": "Chapter 3 - Building Atomic Habits\n\nKey insights:\n- Make it obvious (cue)\n- Make it attractive (craving)\n- Make it easy (response)\n- Make it satisfying (reward)\n\nNeed to apply this to my trading journal and morning routine.\n\nIdea: Create visual checklist for habit setup instead of text."
  },
  "focus": "Value first - Husband, Lover, Engineer, Trader *VALUE FIRST*"
}
