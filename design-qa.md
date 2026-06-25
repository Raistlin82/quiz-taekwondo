# Design QA

Reference: `/var/folders/9m/rg5ck8h53r7_9c0j7qxwc59w0000gn/T/codex-clipboard-d151412b-e279-483d-97b5-693ca03f3de0.png`

Prototype captures:
- `/tmp/hanji-light-final-home.png`
- `/tmp/hanji-light-final-quiz.png`
- `/tmp/hanji-light-final-result.png`
- `/tmp/hanji-dark-final2-home.png`
- `/tmp/hanji-dark-final2-quiz.png`
- `/tmp/hanji-dark-final2-result.png`

## Comparison

- Home now follows the mockup section-by-section: brush logotype asset, exam title, ink-mountain wash, overlapping progress avatar/card, name/belt/difficulty controls, red brush CTA, study/review actions, login in the home flow, and bottom navigation.
- Settings are separated from login and contain only app preferences.
- Belt graphics are no longer simple bars; the selector and shared belt component use tied-belt bitmap assets.
- Quiz uses a tighter header/timer/pill/question-card/answer-card hierarchy with dedicated flame/category/hourglass assets.
- Result screen now uses a continuous bitmap enso ring, pine asset, avatar asset, compact stat cards, top leaderboard card, and paired replay/home actions. The confetti overlay was removed from the result surface to preserve the mockup composition.
- XP now uses the circular mockup-style kicking avatar badge rather than an unrelated icon.
- Typography is Fraunces + Newsreader with the brush wordmark asset for the Taekwon-Do title.
- Dark mode was checked on home, quiz, and result; icon filters were corrected so secondary actions, navigation, auth, timer, stat, and result actions remain readable.
- Sound effects were replaced with muted wood/campana/tamburo Web Audio cues, and background music was lowered into an ambient layer instead of an arcade loop.
- Remaining visual differences are acceptable P3 polish: exact phone chrome/status bar is not represented because this is a web app viewport, and generated ink assets are approximate rather than the original ImageGen pixels.

final result: passed
