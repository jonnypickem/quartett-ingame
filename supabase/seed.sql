-- Deterministic seed for Quartett runtime and local QA
-- Session UUID: 11111111-1111-1111-1111-111111111111
-- Session code: QRT001

begin;

insert into public.decks (id, name, description, cover_image_url, is_hidden, is_builtin)
values (
  'pirate-ships-v1',
  'Pirate Ships',
  'Legacy hidden deck retained for deterministic regression checks.',
  '/decks/military-jets-v1/01.svg',
  true,
  true
)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    cover_image_url = excluded.cover_image_url,
    is_hidden = excluded.is_hidden,
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

insert into public.decks (id, name, description, cover_image_url, is_hidden, is_builtin)
values
  (
    'military-jets-v1',
    'Military Jets',
    'Air-superiority icons and strike aircraft from modern military aviation.',
    '/decks/military-jets-v1/01.svg',
    false,
    true
  ),
  (
    'supercars-v1',
    'Supercars',
    'Hypercar legends and track-focused road missiles.',
    '/decks/supercars-v1/01.svg',
    false,
    true
  ),
  (
    'military-submarines-v1',
    'Military Submarines',
    'Nuclear and diesel-electric attack boats from major naval fleets.',
    '/decks/military-submarines-v1/01.svg',
    false,
    true
  )
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    cover_image_url = excluded.cover_image_url,
    is_hidden = excluded.is_hidden,
    is_builtin = excluded.is_builtin;

delete from public.deck_cards
where deck_id in ('military-jets-v1', 'supercars-v1', 'military-submarines-v1');

with jets(name, tier, ord) as (
  values
    ('F-22 Raptor', 5, 1), ('F-35 Lightning II', 5, 2), ('Eurofighter Typhoon', 5, 3), ('Dassault Rafale', 5, 4),
    ('Gripen E', 4, 5), ('F-15 Eagle', 4, 6), ('F-16 Fighting Falcon', 4, 7), ('F/A-18 Super Hornet', 4, 8),
    ('F/A-18 Hornet', 4, 9), ('Su-57 Felon', 5, 10), ('Su-35S', 4, 11), ('Su-30SM', 4, 12),
    ('Su-27 Flanker', 4, 13), ('MiG-29 Fulcrum', 4, 14), ('MiG-31 Foxhound', 4, 15), ('Mirage 2000', 3, 16),
    ('Tornado ADV', 3, 17), ('F-14 Tomcat', 4, 18), ('F-117 Nighthawk', 4, 19), ('A-10 Thunderbolt II', 3, 20),
    ('MiG-21', 2, 21), ('MiG-25 Foxbat', 3, 22), ('J-20 Mighty Dragon', 5, 23), ('J-10C', 4, 24),
    ('FC-31 Gyrfalcon', 4, 25), ('HAL Tejas Mk1A', 3, 26), ('KAI KF-21', 4, 27), ('F-5 Tiger II', 2, 28),
    ('Su-34 Fullback', 4, 29), ('SEPECAT Jaguar', 2, 30), ('Yak-141', 3, 31), ('Harrier II', 3, 32)
)
insert into public.deck_cards (id, deck_id, code, category, image_url, specs, sort_order)
select
  format('miljet-%s', lpad(ord::text, 2, '0')),
  'military-jets-v1',
  lpad(ord::text, 2, '0'),
  name,
  format('/decks/military-jets-v1/%s.svg', lpad(ord::text, 2, '0')),
  jsonb_build_array(
    jsonb_build_object('key','speed','label','Speed','value', greatest(1, least(100, 56 + tier * 8 + ((abs(hashtext(name || ':speed')) % 13) - 6)))),
    jsonb_build_object('key','range','label','Range','value', greatest(1, least(100, 50 + tier * 7 + ((abs(hashtext(name || ':range')) % 15) - 7)))),
    jsonb_build_object('key','payload','label','Payload','value', greatest(1, least(100, 45 + tier * 8 + ((abs(hashtext(name || ':payload')) % 17) - 8)))),
    jsonb_build_object('key','ceiling','label','Ceiling','value', greatest(1, least(100, 54 + tier * 8 + ((abs(hashtext(name || ':ceiling')) % 13) - 6)))),
    jsonb_build_object('key','agility','label','Agility','value', greatest(1, least(100, 52 + tier * 7 + ((abs(hashtext(name || ':agility')) % 17) - 8)))),
    jsonb_build_object('key','stealth','label','Stealth','value', greatest(1, least(100, 40 + tier * 10 + ((abs(hashtext(name || ':stealth')) % 25) - 12))))
  ),
  ord
from jets;

with cars(name, tier, ord) as (
  values
    ('Bugatti Chiron Super Sport', 5, 1), ('Bugatti Veyron Super Sport', 5, 2), ('Koenigsegg Jesko', 5, 3), ('Koenigsegg Regera', 5, 4),
    ('Koenigsegg Agera RS', 5, 5), ('Rimac Nevera', 5, 6), ('Ferrari LaFerrari', 5, 7), ('Ferrari SF90 Stradale', 5, 8),
    ('Ferrari 812 Superfast', 4, 9), ('Ferrari Enzo', 4, 10), ('Lamborghini Revuelto', 5, 11), ('Lamborghini Aventador SVJ', 4, 12),
    ('Lamborghini Huracan STO', 4, 13), ('McLaren P1', 5, 14), ('McLaren 720S', 4, 15), ('McLaren Senna', 5, 16),
    ('Porsche 918 Spyder', 5, 17), ('Porsche Carrera GT', 4, 18), ('Pagani Huayra', 4, 19), ('Pagani Zonda R', 4, 20),
    ('Aston Martin Valkyrie', 5, 21), ('Mercedes-AMG One', 5, 22), ('Ford GT', 4, 23), ('Chevrolet Corvette Z06', 3, 24),
    ('Nissan GT-R Nismo', 3, 25), ('Lexus LFA', 3, 26), ('Audi R8 V10', 3, 27), ('Honda NSX', 3, 28),
    ('Maserati MC20', 3, 29), ('Dodge Viper ACR', 3, 30), ('Lotus Evija', 4, 31), ('SSC Tuatara', 5, 32)
)
insert into public.deck_cards (id, deck_id, code, category, image_url, specs, sort_order)
select
  format('supercar-%s', lpad(ord::text, 2, '0')),
  'supercars-v1',
  lpad(ord::text, 2, '0'),
  name,
  format('/decks/supercars-v1/%s.svg', lpad(ord::text, 2, '0')),
  jsonb_build_array(
    jsonb_build_object('key','top_speed','label','Top Speed','value', greatest(1, least(100, 58 + tier * 8 + ((abs(hashtext(name || ':top_speed')) % 15) - 7)))),
    jsonb_build_object('key','acceleration','label','Acceleration','value', greatest(1, least(100, 54 + tier * 8 + ((abs(hashtext(name || ':acceleration')) % 17) - 8)))),
    jsonb_build_object('key','power','label','Power','value', greatest(1, least(100, 55 + tier * 9 + ((abs(hashtext(name || ':power')) % 13) - 6)))),
    jsonb_build_object('key','handling','label','Handling','value', greatest(1, least(100, 52 + tier * 8 + ((abs(hashtext(name || ':handling')) % 15) - 7)))),
    jsonb_build_object('key','braking','label','Braking','value', greatest(1, least(100, 50 + tier * 8 + ((abs(hashtext(name || ':braking')) % 17) - 8)))),
    jsonb_build_object('key','rarity','label','Rarity','value', greatest(1, least(100, 44 + tier * 10 + ((abs(hashtext(name || ':rarity')) % 19) - 9))))
  ),
  ord
from cars;

with subs(name, tier, ord) as (
  values
    ('Virginia-class', 5, 1), ('Seawolf-class', 5, 2), ('Los Angeles-class', 4, 3), ('Columbia-class', 5, 4),
    ('Ohio-class', 5, 5), ('Astute-class', 5, 6), ('Vanguard-class', 4, 7), ('Trafalgar-class', 4, 8),
    ('Triomphant-class', 5, 9), ('Rubis-class', 3, 10), ('Barracuda-class', 4, 11), ('Type 212A', 4, 12),
    ('Type 214', 4, 13), ('Type 209', 3, 14), ('Yuan-class', 4, 15), ('Shang-class', 4, 16),
    ('Jin-class', 4, 17), ('Kilo-class', 4, 18), ('Lada-class', 3, 19), ('Yasen-class', 5, 20),
    ('Borei-class', 5, 21), ('Akula-class', 4, 22), ('Typhoon-class', 4, 23), ('Sierra-class', 3, 24),
    ('Delta IV-class', 4, 25), ('Romeo-class', 2, 26), ('Scorpene-class', 4, 27), ('Soryu-class', 4, 28),
    ('Taigei-class', 4, 29), ('Collins-class', 3, 30), ('Gotland-class', 4, 31), ('Dolphin-class', 4, 32)
)
insert into public.deck_cards (id, deck_id, code, category, image_url, specs, sort_order)
select
  format('sub-%s', lpad(ord::text, 2, '0')),
  'military-submarines-v1',
  lpad(ord::text, 2, '0'),
  name,
  format('/decks/military-submarines-v1/%s.svg', lpad(ord::text, 2, '0')),
  jsonb_build_array(
    jsonb_build_object('key','submerged_speed','label','Sub Speed','value', greatest(1, least(100, 50 + tier * 8 + ((abs(hashtext(name || ':sub_speed')) % 15) - 7)))),
    jsonb_build_object('key','dive_depth','label','Dive Depth','value', greatest(1, least(100, 53 + tier * 8 + ((abs(hashtext(name || ':dive_depth')) % 17) - 8)))),
    jsonb_build_object('key','endurance','label','Endurance','value', greatest(1, least(100, 55 + tier * 7 + ((abs(hashtext(name || ':endurance')) % 13) - 6)))),
    jsonb_build_object('key','quietness','label','Quietness','value', greatest(1, least(100, 52 + tier * 9 + ((abs(hashtext(name || ':quietness')) % 17) - 8)))),
    jsonb_build_object('key','firepower','label','Firepower','value', greatest(1, least(100, 50 + tier * 9 + ((abs(hashtext(name || ':firepower')) % 15) - 7)))),
    jsonb_build_object('key','sensors','label','Sensors','value', greatest(1, least(100, 50 + tier * 8 + ((abs(hashtext(name || ':sensors')) % 15) - 7))))
  ),
  ord
from subs;

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
