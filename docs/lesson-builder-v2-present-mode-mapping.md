# Lesson Builder V2 Present Mode Mapping

The V2 presenter is isolated from the classic Teach Today planner and the V1 Live Lesson Flow files. It reads the same compatible lesson payload shape that V1 saves in group history, then renders a full-screen slide runtime from that payload.

V1 Live Lesson Flow is currently bound to fixed DOM nodes inside `TeachToday.html`, so the V2 presenter does not import or mutate those V1 DOM handlers directly. The adapter keeps the data contract aligned so the V2 lesson can still be saved as a Teach Today compatible history record and opened by the existing planner path.

| V2 slide | V1 runtime section | V2/V1-compatible fields used | Notes |
| --- | --- | --- | --- |
| Opening | Lesson launch | `groupName`, `substep`, `focus`, `chartingPageNumber`, `lessonParts` | Presentation-only launch slide. |
| 1. Sounds Quick Drill | `section1` | `dictationPlanOverride` sound blocks, `realWords`, `nonsenseWords` | Uses the same selected sound targets that feed V2 dictation/reverse drill content. |
| 2. Teach and Review for Reading | `section2` | `sectionTwoReviewWords`, `sectionTwoCurrentWords` | Presents the current V1-compatible concept word sets one at a time. |
| 3. Word Cards | `section3` | `sectionThreeReviewWords`, `sectionThreeCurrentWords`, `highFrequencyWords` | Uses the same review/current card fields V1 expects. |
| 4. Wordlist Reading / Charting | `section4` | `wordlistPageNumber`, `chartingPageNumber`, `realWords`, `nonsenseWords` | Reads the selected charting page words and preserves V2 teacher markings in presenter state. |
| 5. Sentence Reading | `section5` | `sentencePageNumber`, `readerSentences`, `highFrequencyWords` | Uses the selected Reader sentence page content. |
| 6. Quick Drill in Reverse | `section6` | `dictationPlanOverride` sound and word-element blocks | Uses the same prompt values selected by the V2 adapter. |
| 7. Spelling Concepts | `section7` | `sectionSevenReviewWords`, `sectionSevenNonsenseWords`, `sectionSevenCurrentWords` | Mirrors V1 spelling set names without touching V1 replacement logic. |
| 8. Dictation | `section8` | `dictationPlanOverride` | Teacher Display shows prompts. Student Display hides prompt answers. |
| 9. Controlled Text / Fluency | `section9` | `readerSentences`, `highFrequencyWords`, optional `section9Story` | Uses the selected reader content available in V2; compatible with future richer passage data. |
| 10. Comprehension | `section10` | `highFrequencyWords`, `readerSentences`, optional `section9Story` | Renders vocabulary, retell, and comprehension prompts without answer keys. |

Rollback boundary:

- Classic planner route remains `TeachToday.html?devRoute=planner`.
- V1 Live Lesson Flow remains `TeachToday.html?devRoute=lesson-flow&developer=1`.
- V2 Present Mode is only available through `lesson-planner-v2.html` and `lesson-planner-v2-presenter.js`.
