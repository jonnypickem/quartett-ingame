-- Deterministic seed for Quartett runtime and local QA
-- Session UUID: 11111111-1111-1111-1111-111111111111
-- Session code: QRT001

begin;

insert into public.decks (id, name, is_builtin)
values ('pirate-ships-v1', 'Pirate Ships', true)
on conflict (id) do update
set name = excluded.name,
    is_builtin = excluded.is_builtin;

delete from public.deck_cards
where deck_id = 'pirate-ships-v1';

insert into public.deck_cards (id, deck_id, code, category, image_url, specs, sort_order) values
(
  'card-a1',
  'pirate-ships-v1',
  'A1',
  'Pirate Ships',
  'https://images.unsplash.com/photo-1517999349371-c43520457b23?auto=format&fit=crop&w=900&q=80',
  '[{"key":"speed","label":"Speed","value":78},{"key":"armor","label":"Armor","value":61},{"key":"firepower","label":"Firepower","value":73},{"key":"crew","label":"Crew","value":88},{"key":"luck","label":"Luck","value":64},{"key":"range","label":"Range","value":71},{"key":"stealth","label":"Stealth","value":53},{"key":"cargo","label":"Cargo","value":69}]'::jsonb,
  1
),
(
  'card-a2',
  'pirate-ships-v1',
  'A2',
  'Pirate Ships',
  'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=900&q=80',
  '[{"key":"speed","label":"Speed","value":81},{"key":"armor","label":"Armor","value":52},{"key":"firepower","label":"Firepower","value":67},{"key":"crew","label":"Crew","value":74},{"key":"luck","label":"Luck","value":70},{"key":"range","label":"Range","value":66}]'::jsonb,
  2
),
(
  'card-a3',
  'pirate-ships-v1',
  'A3',
  'Pirate Ships',
  'https://images.unsplash.com/photo-1469844796476-19ebf3ab8f57?auto=format&fit=crop&w=900&q=80',
  '[{"key":"speed","label":"Speed","value":75},{"key":"armor","label":"Armor","value":79},{"key":"firepower","label":"Firepower","value":72},{"key":"crew","label":"Crew","value":83},{"key":"luck","label":"Luck","value":49},{"key":"range","label":"Range","value":65},{"key":"stealth","label":"Stealth","value":62}]'::jsonb,
  3
),
(
  'card-b1',
  'pirate-ships-v1',
  'B1',
  'Pirate Ships',
  'https://images.unsplash.com/photo-1500930287596-c1ecaa373bb2?auto=format&fit=crop&w=900&q=80',
  '[{"key":"speed","label":"Speed","value":74},{"key":"armor","label":"Armor","value":68},{"key":"firepower","label":"Firepower","value":80},{"key":"crew","label":"Crew","value":82},{"key":"luck","label":"Luck","value":56},{"key":"range","label":"Range","value":71},{"key":"stealth","label":"Stealth","value":54},{"key":"cargo","label":"Cargo","value":71}]'::jsonb,
  4
),
(
  'card-b2',
  'pirate-ships-v1',
  'B2',
  'Pirate Ships',
  'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&w=900&q=80',
  '[{"key":"speed","label":"Speed","value":84},{"key":"armor","label":"Armor","value":55},{"key":"firepower","label":"Firepower","value":63},{"key":"crew","label":"Crew","value":76},{"key":"luck","label":"Luck","value":72},{"key":"range","label":"Range","value":68}]'::jsonb,
  5
),
(
  'card-b3',
  'pirate-ships-v1',
  'B3',
  'Pirate Ships',
  'https://images.unsplash.com/photo-1473447772217-3260a431d0d4?auto=format&fit=crop&w=900&q=80',
  '[{"key":"speed","label":"Speed","value":70},{"key":"armor","label":"Armor","value":81},{"key":"firepower","label":"Firepower","value":75},{"key":"crew","label":"Crew","value":77},{"key":"luck","label":"Luck","value":59},{"key":"range","label":"Range","value":62},{"key":"stealth","label":"Stealth","value":66}]'::jsonb,
  6
);

delete from public.game_events
where session_id = '11111111-1111-1111-1111-111111111111';

delete from public.game_players
where session_id = '11111111-1111-1111-1111-111111111111';

delete from public.game_sessions
where id = '11111111-1111-1111-1111-111111111111'
   or session_code = 'QRT001';

insert into public.game_sessions (
  id,
  session_code,
  status,
  host_player_id,
  deck_id,
  winner_player_id,
  state,
  version,
  created_at,
  updated_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  'QRT001',
  'running',
  'p1',
  'pirate-ships-v1',
  null,
  $$
  {
    "sessionId": "11111111-1111-1111-1111-111111111111",
    "sessionCode": "QRT001",
    "status": "running",
    "hostPlayerId": "p1",
    "deckId": "pirate-ships-v1",
    "winnerPlayerId": null,
    "players": [
      {
        "id": "p1",
        "name": "You",
        "color": "#01ADFF",
        "hand": [
          {
            "id": "card-a1",
            "code": "A1",
            "category": "Pirate Ships",
            "imageUrl": "https://images.unsplash.com/photo-1517999349371-c43520457b23?auto=format&fit=crop&w=900&q=80",
            "specs": [
              { "key": "speed", "label": "Speed", "value": 78 },
              { "key": "armor", "label": "Armor", "value": 61 },
              { "key": "firepower", "label": "Firepower", "value": 73 },
              { "key": "crew", "label": "Crew", "value": 88 },
              { "key": "luck", "label": "Luck", "value": 64 },
              { "key": "range", "label": "Range", "value": 71 },
              { "key": "stealth", "label": "Stealth", "value": 53 },
              { "key": "cargo", "label": "Cargo", "value": 69 }
            ]
          },
          {
            "id": "card-a2",
            "code": "A2",
            "category": "Pirate Ships",
            "imageUrl": "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=900&q=80",
            "specs": [
              { "key": "speed", "label": "Speed", "value": 81 },
              { "key": "armor", "label": "Armor", "value": 52 },
              { "key": "firepower", "label": "Firepower", "value": 67 },
              { "key": "crew", "label": "Crew", "value": 74 },
              { "key": "luck", "label": "Luck", "value": 70 },
              { "key": "range", "label": "Range", "value": 66 }
            ]
          },
          {
            "id": "card-a3",
            "code": "A3",
            "category": "Pirate Ships",
            "imageUrl": "https://images.unsplash.com/photo-1469844796476-19ebf3ab8f57?auto=format&fit=crop&w=900&q=80",
            "specs": [
              { "key": "speed", "label": "Speed", "value": 75 },
              { "key": "armor", "label": "Armor", "value": 79 },
              { "key": "firepower", "label": "Firepower", "value": 72 },
              { "key": "crew", "label": "Crew", "value": 83 },
              { "key": "luck", "label": "Luck", "value": 49 },
              { "key": "range", "label": "Range", "value": 65 },
              { "key": "stealth", "label": "Stealth", "value": 62 }
            ]
          }
        ]
      },
      {
        "id": "p2",
        "name": "Opponent",
        "color": "#C669FF",
        "hand": [
          {
            "id": "card-b1",
            "code": "B1",
            "category": "Pirate Ships",
            "imageUrl": "https://images.unsplash.com/photo-1500930287596-c1ecaa373bb2?auto=format&fit=crop&w=900&q=80",
            "specs": [
              { "key": "speed", "label": "Speed", "value": 74 },
              { "key": "armor", "label": "Armor", "value": 68 },
              { "key": "firepower", "label": "Firepower", "value": 80 },
              { "key": "crew", "label": "Crew", "value": 82 },
              { "key": "luck", "label": "Luck", "value": 56 },
              { "key": "range", "label": "Range", "value": 71 },
              { "key": "stealth", "label": "Stealth", "value": 54 },
              { "key": "cargo", "label": "Cargo", "value": 71 }
            ]
          },
          {
            "id": "card-b2",
            "code": "B2",
            "category": "Pirate Ships",
            "imageUrl": "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&w=900&q=80",
            "specs": [
              { "key": "speed", "label": "Speed", "value": 84 },
              { "key": "armor", "label": "Armor", "value": 55 },
              { "key": "firepower", "label": "Firepower", "value": 63 },
              { "key": "crew", "label": "Crew", "value": 76 },
              { "key": "luck", "label": "Luck", "value": 72 },
              { "key": "range", "label": "Range", "value": 68 }
            ]
          },
          {
            "id": "card-b3",
            "code": "B3",
            "category": "Pirate Ships",
            "imageUrl": "https://images.unsplash.com/photo-1473447772217-3260a431d0d4?auto=format&fit=crop&w=900&q=80",
            "specs": [
              { "key": "speed", "label": "Speed", "value": 70 },
              { "key": "armor", "label": "Armor", "value": 81 },
              { "key": "firepower", "label": "Firepower", "value": 75 },
              { "key": "crew", "label": "Crew", "value": 77 },
              { "key": "luck", "label": "Luck", "value": 59 },
              { "key": "range", "label": "Range", "value": 62 },
              { "key": "stealth", "label": "Stealth", "value": 66 }
            ]
          }
        ]
      }
    ],
    "selectedSpecKey": null,
    "selectedByPlayerId": null,
    "pendingTransfer": null,
    "loseTieRequest": null,
    "tieState": {
      "active": false,
      "rounds": 0,
      "potCards": [],
      "pendingLoseTieRequestId": null
    },
    "version": 1,
    "updatedAt": "2026-04-01T00:00:00.000Z"
  }
  $$::jsonb,
  1,
  now(),
  now()
);

insert into public.game_players (id, session_id, player_name, color, is_host, seat_index)
values
  ('p1', '11111111-1111-1111-1111-111111111111', 'You', '#01ADFF', true, 1),
  ('p2', '11111111-1111-1111-1111-111111111111', 'Opponent', '#C669FF', false, 2);

commit;
