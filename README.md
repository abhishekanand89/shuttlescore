# shuttlescore
Shuttle Score is a mobile-first web app for tracking badminton matches. You tap to score points live, and the app handles server rotation, game transitions, and match completion automatically.

Who uses it: Casual badminton groups and amateur league players who want something better than a whiteboard to track scores and see who's actually
improving.

What it does: 
 - Live scoring (singles/doubles), 
 - player profiles with Elo ratings, 
 - shot-by-shot analytics, 
 - Shapley values showing who actually carries their doubles team, 
 - error-prone shot breakdowns, and 
 - league/season management with scoped standings.

What's missing:
- No user accounts or login — anyone with the URL can do anything
- No live spectator view for people watching from the sideline
- No head-to-head comparison between two players
- No match scheduling or fixture generation for leagues
- No way to share a scorecard after a match
- Analytics get slower as data grows — no caching yet
- Elo history is a single number, no trend graph over time
