-- Deterministic seed for Quartett runtime and local QA
-- Session UUID: 11111111-1111-1111-1111-111111111111
-- Session code: QRT001
-- Generated from content/decks/content-manifest.json

begin;

insert into public.decks (id, name, description, cover_image_url, is_hidden, is_builtin)
values
  ('military-jets-v1', 'Military Jets', 'Air-superiority icons and strike aircraft from modern military aviation.', '/decks/military-jets-v1/01.jpg', false, true),
  ('supercars-v1', 'Supercars', 'Hypercar legends and track-focused road missiles.', '/decks/supercars-v1/01.jpg', false, true),
  ('military-submarines-v1', 'Military Submarines', 'Nuclear and diesel-electric attack boats from major naval fleets.', '/decks/military-submarines-v1/01.jpg', false, true)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    cover_image_url = excluded.cover_image_url,
    is_hidden = excluded.is_hidden,
    is_builtin = excluded.is_builtin;

delete from public.deck_cards
where deck_id in ('military-jets-v1', 'supercars-v1', 'military-submarines-v1', 'pirate-ships-v1');

insert into public.deck_cards (id, deck_id, code, category, image_url, specs, sort_order)
values
  ('miljet-01', 'military-jets-v1', '01', 'F-22 Raptor', '/decks/military-jets-v1/01.jpg', '[{"key":"speed","label":"Speed","value":91},{"key":"range","label":"Range","value":91},{"key":"payload","label":"Payload","value":83},{"key":"ceiling","label":"Ceiling","value":92},{"key":"agility","label":"Agility","value":87},{"key":"stealth","label":"Stealth","value":78}]'::jsonb, 1),
  ('miljet-02', 'military-jets-v1', '02', 'F-35 Lightning II', '/decks/military-jets-v1/02.jpg', '[{"key":"speed","label":"Speed","value":97},{"key":"range","label":"Range","value":80},{"key":"payload","label":"Payload","value":87},{"key":"ceiling","label":"Ceiling","value":95},{"key":"agility","label":"Agility","value":86},{"key":"stealth","label":"Stealth","value":92}]'::jsonb, 2),
  ('miljet-03', 'military-jets-v1', '03', 'Eurofighter Typhoon', '/decks/military-jets-v1/03.jpg', '[{"key":"speed","label":"Speed","value":94},{"key":"range","label":"Range","value":80},{"key":"payload","label":"Payload","value":91},{"key":"ceiling","label":"Ceiling","value":92},{"key":"agility","label":"Agility","value":92},{"key":"stealth","label":"Stealth","value":97}]'::jsonb, 3),
  ('miljet-04', 'military-jets-v1', '04', 'Dassault Rafale', '/decks/military-jets-v1/04.jpg', '[{"key":"speed","label":"Speed","value":99},{"key":"range","label":"Range","value":92},{"key":"payload","label":"Payload","value":80},{"key":"ceiling","label":"Ceiling","value":91},{"key":"agility","label":"Agility","value":83},{"key":"stealth","label":"Stealth","value":100}]'::jsonb, 4),
  ('miljet-05', 'military-jets-v1', '05', 'Gripen E', '/decks/military-jets-v1/05.jpg', '[{"key":"speed","label":"Speed","value":90},{"key":"range","label":"Range","value":80},{"key":"payload","label":"Payload","value":83},{"key":"ceiling","label":"Ceiling","value":86},{"key":"agility","label":"Agility","value":77},{"key":"stealth","label":"Stealth","value":73}]'::jsonb, 5),
  ('miljet-06', 'military-jets-v1', '06', 'F-15 Eagle', '/decks/military-jets-v1/06.jpg', '[{"key":"speed","label":"Speed","value":85},{"key":"range","label":"Range","value":77},{"key":"payload","label":"Payload","value":80},{"key":"ceiling","label":"Ceiling","value":85},{"key":"agility","label":"Agility","value":79},{"key":"stealth","label":"Stealth","value":72}]'::jsonb, 6),
  ('miljet-07', 'military-jets-v1', '07', 'F-16 Fighting Falcon', '/decks/military-jets-v1/07.jpg', '[{"key":"speed","label":"Speed","value":88},{"key":"range","label":"Range","value":82},{"key":"payload","label":"Payload","value":76},{"key":"ceiling","label":"Ceiling","value":89},{"key":"agility","label":"Agility","value":78},{"key":"stealth","label":"Stealth","value":69}]'::jsonb, 7),
  ('miljet-08', 'military-jets-v1', '08', 'F/A-18 Super Hornet', '/decks/military-jets-v1/08.jpg', '[{"key":"speed","label":"Speed","value":85},{"key":"range","label":"Range","value":74},{"key":"payload","label":"Payload","value":81},{"key":"ceiling","label":"Ceiling","value":86},{"key":"agility","label":"Agility","value":85},{"key":"stealth","label":"Stealth","value":80}]'::jsonb, 8),
  ('miljet-09', 'military-jets-v1', '09', 'F/A-18 Hornet', '/decks/military-jets-v1/09.jpg', '[{"key":"speed","label":"Speed","value":87},{"key":"range","label":"Range","value":79},{"key":"payload","label":"Payload","value":85},{"key":"ceiling","label":"Ceiling","value":87},{"key":"agility","label":"Agility","value":73},{"key":"stealth","label":"Stealth","value":72}]'::jsonb, 9),
  ('miljet-10', 'military-jets-v1', '10', 'Su-57 Felon', '/decks/military-jets-v1/10.jpg', '[{"key":"speed","label":"Speed","value":100},{"key":"range","label":"Range","value":84},{"key":"payload","label":"Payload","value":82},{"key":"ceiling","label":"Ceiling","value":89},{"key":"agility","label":"Agility","value":86},{"key":"stealth","label":"Stealth","value":86}]'::jsonb, 10),
  ('miljet-11', 'military-jets-v1', '11', 'Su-35S', '/decks/military-jets-v1/11.jpg', '[{"key":"speed","label":"Speed","value":89},{"key":"range","label":"Range","value":77},{"key":"payload","label":"Payload","value":70},{"key":"ceiling","label":"Ceiling","value":92},{"key":"agility","label":"Agility","value":84},{"key":"stealth","label":"Stealth","value":79}]'::jsonb, 11),
  ('miljet-12', 'military-jets-v1', '12', 'Su-30SM', '/decks/military-jets-v1/12.jpg', '[{"key":"speed","label":"Speed","value":94},{"key":"range","label":"Range","value":74},{"key":"payload","label":"Payload","value":74},{"key":"ceiling","label":"Ceiling","value":88},{"key":"agility","label":"Agility","value":86},{"key":"stealth","label":"Stealth","value":87}]'::jsonb, 12),
  ('miljet-13', 'military-jets-v1', '13', 'Su-27 Flanker', '/decks/military-jets-v1/13.jpg', '[{"key":"speed","label":"Speed","value":92},{"key":"range","label":"Range","value":72},{"key":"payload","label":"Payload","value":76},{"key":"ceiling","label":"Ceiling","value":90},{"key":"agility","label":"Agility","value":81},{"key":"stealth","label":"Stealth","value":80}]'::jsonb, 13),
  ('miljet-14', 'military-jets-v1', '14', 'MiG-29 Fulcrum', '/decks/military-jets-v1/14.jpg', '[{"key":"speed","label":"Speed","value":83},{"key":"range","label":"Range","value":78},{"key":"payload","label":"Payload","value":81},{"key":"ceiling","label":"Ceiling","value":85},{"key":"agility","label":"Agility","value":88},{"key":"stealth","label":"Stealth","value":79}]'::jsonb, 14),
  ('miljet-15', 'military-jets-v1', '15', 'MiG-31 Foxhound', '/decks/military-jets-v1/15.jpg', '[{"key":"speed","label":"Speed","value":89},{"key":"range","label":"Range","value":77},{"key":"payload","label":"Payload","value":78},{"key":"ceiling","label":"Ceiling","value":83},{"key":"agility","label":"Agility","value":74},{"key":"stealth","label":"Stealth","value":89}]'::jsonb, 15),
  ('miljet-16', 'military-jets-v1', '16', 'Mirage 2000', '/decks/military-jets-v1/16.jpg', '[{"key":"speed","label":"Speed","value":78},{"key":"range","label":"Range","value":66},{"key":"payload","label":"Payload","value":77},{"key":"ceiling","label":"Ceiling","value":80},{"key":"agility","label":"Agility","value":69},{"key":"stealth","label":"Stealth","value":58}]'::jsonb, 16),
  ('miljet-17', 'military-jets-v1', '17', 'Tornado ADV', '/decks/military-jets-v1/17.jpg', '[{"key":"speed","label":"Speed","value":83},{"key":"range","label":"Range","value":72},{"key":"payload","label":"Payload","value":66},{"key":"ceiling","label":"Ceiling","value":75},{"key":"agility","label":"Agility","value":72},{"key":"stealth","label":"Stealth","value":63}]'::jsonb, 17),
  ('miljet-18', 'military-jets-v1', '18', 'F-14 Tomcat', '/decks/military-jets-v1/18.jpg', '[{"key":"speed","label":"Speed","value":90},{"key":"range","label":"Range","value":79},{"key":"payload","label":"Payload","value":78},{"key":"ceiling","label":"Ceiling","value":84},{"key":"agility","label":"Agility","value":83},{"key":"stealth","label":"Stealth","value":77}]'::jsonb, 18),
  ('miljet-19', 'military-jets-v1', '19', 'F-117 Nighthawk', '/decks/military-jets-v1/19.jpg', '[{"key":"speed","label":"Speed","value":84},{"key":"range","label":"Range","value":84},{"key":"payload","label":"Payload","value":73},{"key":"ceiling","label":"Ceiling","value":90},{"key":"agility","label":"Agility","value":87},{"key":"stealth","label":"Stealth","value":91}]'::jsonb, 19),
  ('miljet-20', 'military-jets-v1', '20', 'A-10 Thunderbolt II', '/decks/military-jets-v1/20.jpg', '[{"key":"speed","label":"Speed","value":84},{"key":"range","label":"Range","value":71},{"key":"payload","label":"Payload","value":76},{"key":"ceiling","label":"Ceiling","value":82},{"key":"agility","label":"Agility","value":77},{"key":"stealth","label":"Stealth","value":67}]'::jsonb, 20),
  ('miljet-21', 'military-jets-v1', '21', 'MiG-21', '/decks/military-jets-v1/21.jpg', '[{"key":"speed","label":"Speed","value":67},{"key":"range","label":"Range","value":71},{"key":"payload","label":"Payload","value":60},{"key":"ceiling","label":"Ceiling","value":70},{"key":"agility","label":"Agility","value":59},{"key":"stealth","label":"Stealth","value":69}]'::jsonb, 21),
  ('miljet-22', 'military-jets-v1', '22', 'MiG-25 Foxbat', '/decks/military-jets-v1/22.jpg', '[{"key":"speed","label":"Speed","value":74},{"key":"range","label":"Range","value":70},{"key":"payload","label":"Payload","value":76},{"key":"ceiling","label":"Ceiling","value":79},{"key":"agility","label":"Agility","value":65},{"key":"stealth","label":"Stealth","value":80}]'::jsonb, 22),
  ('miljet-23', 'military-jets-v1', '23', 'J-20 Mighty Dragon', '/decks/military-jets-v1/23.jpg', '[{"key":"speed","label":"Speed","value":100},{"key":"range","label":"Range","value":86},{"key":"payload","label":"Payload","value":77},{"key":"ceiling","label":"Ceiling","value":100},{"key":"agility","label":"Agility","value":87},{"key":"stealth","label":"Stealth","value":89}]'::jsonb, 23),
  ('miljet-24', 'military-jets-v1', '24', 'J-10C', '/decks/military-jets-v1/24.jpg', '[{"key":"speed","label":"Speed","value":90},{"key":"range","label":"Range","value":75},{"key":"payload","label":"Payload","value":69},{"key":"ceiling","label":"Ceiling","value":85},{"key":"agility","label":"Agility","value":80},{"key":"stealth","label":"Stealth","value":92}]'::jsonb, 24),
  ('miljet-25', 'military-jets-v1', '25', 'FC-31 Gyrfalcon', '/decks/military-jets-v1/25.jpg', '[{"key":"speed","label":"Speed","value":91},{"key":"range","label":"Range","value":84},{"key":"payload","label":"Payload","value":74},{"key":"ceiling","label":"Ceiling","value":88},{"key":"agility","label":"Agility","value":88},{"key":"stealth","label":"Stealth","value":91}]'::jsonb, 25),
  ('miljet-26', 'military-jets-v1', '26', 'HAL Tejas Mk1A', '/decks/military-jets-v1/26.jpg', '[{"key":"speed","label":"Speed","value":84},{"key":"range","label":"Range","value":64},{"key":"payload","label":"Payload","value":72},{"key":"ceiling","label":"Ceiling","value":78},{"key":"agility","label":"Agility","value":76},{"key":"stealth","label":"Stealth","value":66}]'::jsonb, 26),
  ('miljet-27', 'military-jets-v1', '27', 'KAI KF-21', '/decks/military-jets-v1/27.jpg', '[{"key":"speed","label":"Speed","value":90},{"key":"range","label":"Range","value":80},{"key":"payload","label":"Payload","value":73},{"key":"ceiling","label":"Ceiling","value":91},{"key":"agility","label":"Agility","value":86},{"key":"stealth","label":"Stealth","value":77}]'::jsonb, 27),
  ('miljet-28', 'military-jets-v1', '28', 'F-5 Tiger II', '/decks/military-jets-v1/28.jpg', '[{"key":"speed","label":"Speed","value":74},{"key":"range","label":"Range","value":65},{"key":"payload","label":"Payload","value":60},{"key":"ceiling","label":"Ceiling","value":70},{"key":"agility","label":"Agility","value":67},{"key":"stealth","label":"Stealth","value":70}]'::jsonb, 28),
  ('miljet-29', 'military-jets-v1', '29', 'Su-34 Fullback', '/decks/military-jets-v1/29.jpg', '[{"key":"speed","label":"Speed","value":91},{"key":"range","label":"Range","value":75},{"key":"payload","label":"Payload","value":81},{"key":"ceiling","label":"Ceiling","value":83},{"key":"agility","label":"Agility","value":80},{"key":"stealth","label":"Stealth","value":82}]'::jsonb, 29),
  ('miljet-30', 'military-jets-v1', '30', 'SEPECAT Jaguar', '/decks/military-jets-v1/30.jpg', '[{"key":"speed","label":"Speed","value":71},{"key":"range","label":"Range","value":71},{"key":"payload","label":"Payload","value":62},{"key":"ceiling","label":"Ceiling","value":65},{"key":"agility","label":"Agility","value":63},{"key":"stealth","label":"Stealth","value":62}]'::jsonb, 30),
  ('miljet-31', 'military-jets-v1', '31', 'Yak-141', '/decks/military-jets-v1/31.jpg', '[{"key":"speed","label":"Speed","value":74},{"key":"range","label":"Range","value":65},{"key":"payload","label":"Payload","value":67},{"key":"ceiling","label":"Ceiling","value":81},{"key":"agility","label":"Agility","value":69},{"key":"stealth","label":"Stealth","value":62}]'::jsonb, 31),
  ('miljet-32', 'military-jets-v1', '32', 'Harrier II', '/decks/military-jets-v1/32.jpg', '[{"key":"speed","label":"Speed","value":77},{"key":"range","label":"Range","value":68},{"key":"payload","label":"Payload","value":66},{"key":"ceiling","label":"Ceiling","value":83},{"key":"agility","label":"Agility","value":74},{"key":"stealth","label":"Stealth","value":79}]'::jsonb, 32),
  ('supercar-01', 'supercars-v1', '01', 'Bugatti Chiron Super Sport', '/decks/supercars-v1/01.jpg', '[{"key":"top_speed","label":"Top Speed","value":97},{"key":"acceleration","label":"Acceleration","value":89},{"key":"power","label":"Power","value":95},{"key":"handling","label":"Handling","value":86},{"key":"braking","label":"Braking","value":98},{"key":"rarity","label":"Rarity","value":99}]'::jsonb, 1),
  ('supercar-02', 'supercars-v1', '02', 'Bugatti Veyron Super Sport', '/decks/supercars-v1/02.jpg', '[{"key":"top_speed","label":"Top Speed","value":93},{"key":"acceleration","label":"Acceleration","value":98},{"key":"power","label":"Power","value":96},{"key":"handling","label":"Handling","value":93},{"key":"braking","label":"Braking","value":91},{"key":"rarity","label":"Rarity","value":85}]'::jsonb, 2),
  ('supercar-03', 'supercars-v1', '03', 'Koenigsegg Jesko', '/decks/supercars-v1/03.jpg', '[{"key":"top_speed","label":"Top Speed","value":98},{"key":"acceleration","label":"Acceleration","value":100},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":87},{"key":"braking","label":"Braking","value":87},{"key":"rarity","label":"Rarity","value":92}]'::jsonb, 3),
  ('supercar-04', 'supercars-v1', '04', 'Koenigsegg Regera', '/decks/supercars-v1/04.jpg', '[{"key":"top_speed","label":"Top Speed","value":97},{"key":"acceleration","label":"Acceleration","value":90},{"key":"power","label":"Power","value":95},{"key":"handling","label":"Handling","value":85},{"key":"braking","label":"Braking","value":98},{"key":"rarity","label":"Rarity","value":96}]'::jsonb, 4),
  ('supercar-05', 'supercars-v1', '05', 'Koenigsegg Agera RS', '/decks/supercars-v1/05.jpg', '[{"key":"top_speed","label":"Top Speed","value":93},{"key":"acceleration","label":"Acceleration","value":90},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":92},{"key":"braking","label":"Braking","value":94},{"key":"rarity","label":"Rarity","value":100}]'::jsonb, 5),
  ('supercar-06', 'supercars-v1', '06', 'Rimac Nevera', '/decks/supercars-v1/06.jpg', '[{"key":"top_speed","label":"Top Speed","value":96},{"key":"acceleration","label":"Acceleration","value":89},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":85},{"key":"braking","label":"Braking","value":95},{"key":"rarity","label":"Rarity","value":98}]'::jsonb, 6),
  ('supercar-07', 'supercars-v1', '07', 'Ferrari LaFerrari', '/decks/supercars-v1/07.jpg', '[{"key":"top_speed","label":"Top Speed","value":95},{"key":"acceleration","label":"Acceleration","value":91},{"key":"power","label":"Power","value":98},{"key":"handling","label":"Handling","value":95},{"key":"braking","label":"Braking","value":97},{"key":"rarity","label":"Rarity","value":98}]'::jsonb, 7),
  ('supercar-08', 'supercars-v1', '08', 'Ferrari SF90 Stradale', '/decks/supercars-v1/08.jpg', '[{"key":"top_speed","label":"Top Speed","value":98},{"key":"acceleration","label":"Acceleration","value":97},{"key":"power","label":"Power","value":98},{"key":"handling","label":"Handling","value":96},{"key":"braking","label":"Braking","value":88},{"key":"rarity","label":"Rarity","value":99}]'::jsonb, 8),
  ('supercar-09', 'supercars-v1', '09', 'Ferrari 812 Superfast', '/decks/supercars-v1/09.jpg', '[{"key":"top_speed","label":"Top Speed","value":97},{"key":"acceleration","label":"Acceleration","value":81},{"key":"power","label":"Power","value":86},{"key":"handling","label":"Handling","value":89},{"key":"braking","label":"Braking","value":77},{"key":"rarity","label":"Rarity","value":93}]'::jsonb, 9),
  ('supercar-10', 'supercars-v1', '10', 'Ferrari Enzo', '/decks/supercars-v1/10.jpg', '[{"key":"top_speed","label":"Top Speed","value":90},{"key":"acceleration","label":"Acceleration","value":91},{"key":"power","label":"Power","value":94},{"key":"handling","label":"Handling","value":81},{"key":"braking","label":"Braking","value":80},{"key":"rarity","label":"Rarity","value":87}]'::jsonb, 10),
  ('supercar-11', 'supercars-v1', '11', 'Lamborghini Revuelto', '/decks/supercars-v1/11.jpg', '[{"key":"top_speed","label":"Top Speed","value":100},{"key":"acceleration","label":"Acceleration","value":100},{"key":"power","label":"Power","value":94},{"key":"handling","label":"Handling","value":96},{"key":"braking","label":"Braking","value":83},{"key":"rarity","label":"Rarity","value":99}]'::jsonb, 11),
  ('supercar-12', 'supercars-v1', '12', 'Lamborghini Aventador SVJ', '/decks/supercars-v1/12.jpg', '[{"key":"top_speed","label":"Top Speed","value":86},{"key":"acceleration","label":"Acceleration","value":84},{"key":"power","label":"Power","value":86},{"key":"handling","label":"Handling","value":88},{"key":"braking","label":"Braking","value":86},{"key":"rarity","label":"Rarity","value":93}]'::jsonb, 12),
  ('supercar-13', 'supercars-v1', '13', 'Lamborghini Huracan STO', '/decks/supercars-v1/13.jpg', '[{"key":"top_speed","label":"Top Speed","value":96},{"key":"acceleration","label":"Acceleration","value":85},{"key":"power","label":"Power","value":96},{"key":"handling","label":"Handling","value":90},{"key":"braking","label":"Braking","value":76},{"key":"rarity","label":"Rarity","value":75}]'::jsonb, 13),
  ('supercar-14', 'supercars-v1', '14', 'McLaren P1', '/decks/supercars-v1/14.jpg', '[{"key":"top_speed","label":"Top Speed","value":95},{"key":"acceleration","label":"Acceleration","value":91},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":95},{"key":"braking","label":"Braking","value":93},{"key":"rarity","label":"Rarity","value":87}]'::jsonb, 14),
  ('supercar-15', 'supercars-v1', '15', 'McLaren 720S', '/decks/supercars-v1/15.jpg', '[{"key":"top_speed","label":"Top Speed","value":91},{"key":"acceleration","label":"Acceleration","value":81},{"key":"power","label":"Power","value":87},{"key":"handling","label":"Handling","value":90},{"key":"braking","label":"Braking","value":81},{"key":"rarity","label":"Rarity","value":80}]'::jsonb, 15),
  ('supercar-16', 'supercars-v1', '16', 'McLaren Senna', '/decks/supercars-v1/16.jpg', '[{"key":"top_speed","label":"Top Speed","value":100},{"key":"acceleration","label":"Acceleration","value":97},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":95},{"key":"braking","label":"Braking","value":91},{"key":"rarity","label":"Rarity","value":87}]'::jsonb, 16),
  ('supercar-17', 'supercars-v1', '17', 'Porsche 918 Spyder', '/decks/supercars-v1/17.jpg', '[{"key":"top_speed","label":"Top Speed","value":95},{"key":"acceleration","label":"Acceleration","value":86},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":91},{"key":"braking","label":"Braking","value":91},{"key":"rarity","label":"Rarity","value":97}]'::jsonb, 17),
  ('supercar-18', 'supercars-v1', '18', 'Porsche Carrera GT', '/decks/supercars-v1/18.jpg', '[{"key":"top_speed","label":"Top Speed","value":88},{"key":"acceleration","label":"Acceleration","value":94},{"key":"power","label":"Power","value":97},{"key":"handling","label":"Handling","value":82},{"key":"braking","label":"Braking","value":82},{"key":"rarity","label":"Rarity","value":92}]'::jsonb, 18),
  ('supercar-19', 'supercars-v1', '19', 'Pagani Huayra', '/decks/supercars-v1/19.jpg', '[{"key":"top_speed","label":"Top Speed","value":97},{"key":"acceleration","label":"Acceleration","value":94},{"key":"power","label":"Power","value":92},{"key":"handling","label":"Handling","value":86},{"key":"braking","label":"Braking","value":88},{"key":"rarity","label":"Rarity","value":88}]'::jsonb, 19),
  ('supercar-20', 'supercars-v1', '20', 'Pagani Zonda R', '/decks/supercars-v1/20.jpg', '[{"key":"top_speed","label":"Top Speed","value":84},{"key":"acceleration","label":"Acceleration","value":89},{"key":"power","label":"Power","value":86},{"key":"handling","label":"Handling","value":83},{"key":"braking","label":"Braking","value":75},{"key":"rarity","label":"Rarity","value":90}]'::jsonb, 20),
  ('supercar-21', 'supercars-v1', '21', 'Aston Martin Valkyrie', '/decks/supercars-v1/21.jpg', '[{"key":"top_speed","label":"Top Speed","value":100},{"key":"acceleration","label":"Acceleration","value":97},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":91},{"key":"braking","label":"Braking","value":89},{"key":"rarity","label":"Rarity","value":92}]'::jsonb, 21),
  ('supercar-22', 'supercars-v1', '22', 'Mercedes-AMG One', '/decks/supercars-v1/22.jpg', '[{"key":"top_speed","label":"Top Speed","value":100},{"key":"acceleration","label":"Acceleration","value":100},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":97},{"key":"braking","label":"Braking","value":95},{"key":"rarity","label":"Rarity","value":97}]'::jsonb, 22),
  ('supercar-23', 'supercars-v1', '23', 'Ford GT', '/decks/supercars-v1/23.jpg', '[{"key":"top_speed","label":"Top Speed","value":94},{"key":"acceleration","label":"Acceleration","value":86},{"key":"power","label":"Power","value":96},{"key":"handling","label":"Handling","value":89},{"key":"braking","label":"Braking","value":82},{"key":"rarity","label":"Rarity","value":91}]'::jsonb, 23),
  ('supercar-24', 'supercars-v1', '24', 'Chevrolet Corvette Z06', '/decks/supercars-v1/24.jpg', '[{"key":"top_speed","label":"Top Speed","value":76},{"key":"acceleration","label":"Acceleration","value":83},{"key":"power","label":"Power","value":80},{"key":"handling","label":"Handling","value":80},{"key":"braking","label":"Braking","value":67},{"key":"rarity","label":"Rarity","value":70}]'::jsonb, 24),
  ('supercar-25', 'supercars-v1', '25', 'Nissan GT-R Nismo', '/decks/supercars-v1/25.jpg', '[{"key":"top_speed","label":"Top Speed","value":89},{"key":"acceleration","label":"Acceleration","value":80},{"key":"power","label":"Power","value":80},{"key":"handling","label":"Handling","value":77},{"key":"braking","label":"Braking","value":71},{"key":"rarity","label":"Rarity","value":79}]'::jsonb, 25),
  ('supercar-26', 'supercars-v1', '26', 'Lexus LFA', '/decks/supercars-v1/26.jpg', '[{"key":"top_speed","label":"Top Speed","value":86},{"key":"acceleration","label":"Acceleration","value":83},{"key":"power","label":"Power","value":79},{"key":"handling","label":"Handling","value":73},{"key":"braking","label":"Braking","value":75},{"key":"rarity","label":"Rarity","value":79}]'::jsonb, 26),
  ('supercar-27', 'supercars-v1', '27', 'Audi R8 V10', '/decks/supercars-v1/27.jpg', '[{"key":"top_speed","label":"Top Speed","value":83},{"key":"acceleration","label":"Acceleration","value":72},{"key":"power","label":"Power","value":76},{"key":"handling","label":"Handling","value":74},{"key":"braking","label":"Braking","value":69},{"key":"rarity","label":"Rarity","value":76}]'::jsonb, 27),
  ('supercar-28', 'supercars-v1', '28', 'Honda NSX', '/decks/supercars-v1/28.jpg', '[{"key":"top_speed","label":"Top Speed","value":83},{"key":"acceleration","label":"Acceleration","value":85},{"key":"power","label":"Power","value":85},{"key":"handling","label":"Handling","value":77},{"key":"braking","label":"Braking","value":81},{"key":"rarity","label":"Rarity","value":65}]'::jsonb, 28),
  ('supercar-29', 'supercars-v1', '29', 'Maserati MC20', '/decks/supercars-v1/29.jpg', '[{"key":"top_speed","label":"Top Speed","value":75},{"key":"acceleration","label":"Acceleration","value":81},{"key":"power","label":"Power","value":80},{"key":"handling","label":"Handling","value":80},{"key":"braking","label":"Braking","value":79},{"key":"rarity","label":"Rarity","value":80}]'::jsonb, 29),
  ('supercar-30', 'supercars-v1', '30', 'Dodge Viper ACR', '/decks/supercars-v1/30.jpg', '[{"key":"top_speed","label":"Top Speed","value":88},{"key":"acceleration","label":"Acceleration","value":72},{"key":"power","label":"Power","value":78},{"key":"handling","label":"Handling","value":71},{"key":"braking","label":"Braking","value":66},{"key":"rarity","label":"Rarity","value":78}]'::jsonb, 30),
  ('supercar-31', 'supercars-v1', '31', 'Lotus Evija', '/decks/supercars-v1/31.jpg', '[{"key":"top_speed","label":"Top Speed","value":95},{"key":"acceleration","label":"Acceleration","value":82},{"key":"power","label":"Power","value":93},{"key":"handling","label":"Handling","value":78},{"key":"braking","label":"Braking","value":83},{"key":"rarity","label":"Rarity","value":89}]'::jsonb, 31),
  ('supercar-32', 'supercars-v1', '32', 'SSC Tuatara', '/decks/supercars-v1/32.jpg', '[{"key":"top_speed","label":"Top Speed","value":100},{"key":"acceleration","label":"Acceleration","value":97},{"key":"power","label":"Power","value":100},{"key":"handling","label":"Handling","value":90},{"key":"braking","label":"Braking","value":88},{"key":"rarity","label":"Rarity","value":87}]'::jsonb, 32),
  ('sub-01', 'military-submarines-v1', '01', 'Virginia-class', '/decks/military-submarines-v1/01.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":88},{"key":"dive_depth","label":"Dive Depth","value":93},{"key":"endurance","label":"Endurance","value":95},{"key":"quietness","label":"Quietness","value":100},{"key":"firepower","label":"Firepower","value":100},{"key":"sensors","label":"Sensors","value":85}]'::jsonb, 1),
  ('sub-02', 'military-submarines-v1', '02', 'Seawolf-class', '/decks/military-submarines-v1/02.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":92},{"key":"dive_depth","label":"Dive Depth","value":98},{"key":"endurance","label":"Endurance","value":96},{"key":"quietness","label":"Quietness","value":97},{"key":"firepower","label":"Firepower","value":92},{"key":"sensors","label":"Sensors","value":97}]'::jsonb, 2),
  ('sub-03', 'military-submarines-v1', '03', 'Los Angeles-class', '/decks/military-submarines-v1/03.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":85},{"key":"dive_depth","label":"Dive Depth","value":78},{"key":"endurance","label":"Endurance","value":83},{"key":"quietness","label":"Quietness","value":87},{"key":"firepower","label":"Firepower","value":85},{"key":"sensors","label":"Sensors","value":82}]'::jsonb, 3),
  ('sub-04', 'military-submarines-v1', '04', 'Columbia-class', '/decks/military-submarines-v1/04.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":91},{"key":"dive_depth","label":"Dive Depth","value":97},{"key":"endurance","label":"Endurance","value":84},{"key":"quietness","label":"Quietness","value":95},{"key":"firepower","label":"Firepower","value":93},{"key":"sensors","label":"Sensors","value":88}]'::jsonb, 4),
  ('sub-05', 'military-submarines-v1', '05', 'Ohio-class', '/decks/military-submarines-v1/05.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":85},{"key":"dive_depth","label":"Dive Depth","value":99},{"key":"endurance","label":"Endurance","value":86},{"key":"quietness","label":"Quietness","value":97},{"key":"firepower","label":"Firepower","value":100},{"key":"sensors","label":"Sensors","value":92}]'::jsonb, 5),
  ('sub-06', 'military-submarines-v1', '06', 'Astute-class', '/decks/military-submarines-v1/06.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":91},{"key":"dive_depth","label":"Dive Depth","value":96},{"key":"endurance","label":"Endurance","value":87},{"key":"quietness","label":"Quietness","value":99},{"key":"firepower","label":"Firepower","value":95},{"key":"sensors","label":"Sensors","value":93}]'::jsonb, 6),
  ('sub-07', 'military-submarines-v1', '07', 'Vanguard-class', '/decks/military-submarines-v1/07.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":87},{"key":"dive_depth","label":"Dive Depth","value":77},{"key":"endurance","label":"Endurance","value":87},{"key":"quietness","label":"Quietness","value":91},{"key":"firepower","label":"Firepower","value":88},{"key":"sensors","label":"Sensors","value":84}]'::jsonb, 7),
  ('sub-08', 'military-submarines-v1', '08', 'Trafalgar-class', '/decks/military-submarines-v1/08.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":83},{"key":"dive_depth","label":"Dive Depth","value":79},{"key":"endurance","label":"Endurance","value":86},{"key":"quietness","label":"Quietness","value":82},{"key":"firepower","label":"Firepower","value":84},{"key":"sensors","label":"Sensors","value":81}]'::jsonb, 8),
  ('sub-09', 'military-submarines-v1', '09', 'Triomphant-class', '/decks/military-submarines-v1/09.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":89},{"key":"dive_depth","label":"Dive Depth","value":92},{"key":"endurance","label":"Endurance","value":93},{"key":"quietness","label":"Quietness","value":99},{"key":"firepower","label":"Firepower","value":89},{"key":"sensors","label":"Sensors","value":86}]'::jsonb, 9),
  ('sub-10', 'military-submarines-v1', '10', 'Rubis-class', '/decks/military-submarines-v1/10.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":76},{"key":"dive_depth","label":"Dive Depth","value":80},{"key":"endurance","label":"Endurance","value":73},{"key":"quietness","label":"Quietness","value":71},{"key":"firepower","label":"Firepower","value":79},{"key":"sensors","label":"Sensors","value":81}]'::jsonb, 10),
  ('sub-11', 'military-submarines-v1', '11', 'Barracuda-class', '/decks/military-submarines-v1/11.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":82},{"key":"dive_depth","label":"Dive Depth","value":92},{"key":"endurance","label":"Endurance","value":85},{"key":"quietness","label":"Quietness","value":86},{"key":"firepower","label":"Firepower","value":90},{"key":"sensors","label":"Sensors","value":84}]'::jsonb, 11),
  ('sub-12', 'military-submarines-v1', '12', 'Type 212A', '/decks/military-submarines-v1/12.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":79},{"key":"dive_depth","label":"Dive Depth","value":82},{"key":"endurance","label":"Endurance","value":84},{"key":"quietness","label":"Quietness","value":81},{"key":"firepower","label":"Firepower","value":92},{"key":"sensors","label":"Sensors","value":78}]'::jsonb, 12),
  ('sub-13', 'military-submarines-v1', '13', 'Type 214', '/decks/military-submarines-v1/13.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":87},{"key":"dive_depth","label":"Dive Depth","value":93},{"key":"endurance","label":"Endurance","value":86},{"key":"quietness","label":"Quietness","value":88},{"key":"firepower","label":"Firepower","value":88},{"key":"sensors","label":"Sensors","value":76}]'::jsonb, 13),
  ('sub-14', 'military-submarines-v1', '14', 'Type 209', '/decks/military-submarines-v1/14.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":75},{"key":"dive_depth","label":"Dive Depth","value":77},{"key":"endurance","label":"Endurance","value":79},{"key":"quietness","label":"Quietness","value":71},{"key":"firepower","label":"Firepower","value":83},{"key":"sensors","label":"Sensors","value":72}]'::jsonb, 14),
  ('sub-15', 'military-submarines-v1', '15', 'Yuan-class', '/decks/military-submarines-v1/15.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":84},{"key":"dive_depth","label":"Dive Depth","value":86},{"key":"endurance","label":"Endurance","value":79},{"key":"quietness","label":"Quietness","value":84},{"key":"firepower","label":"Firepower","value":88},{"key":"sensors","label":"Sensors","value":77}]'::jsonb, 15),
  ('sub-16', 'military-submarines-v1', '16', 'Shang-class', '/decks/military-submarines-v1/16.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":85},{"key":"dive_depth","label":"Dive Depth","value":83},{"key":"endurance","label":"Endurance","value":89},{"key":"quietness","label":"Quietness","value":85},{"key":"firepower","label":"Firepower","value":82},{"key":"sensors","label":"Sensors","value":86}]'::jsonb, 16),
  ('sub-17', 'military-submarines-v1', '17', 'Jin-class', '/decks/military-submarines-v1/17.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":81},{"key":"dive_depth","label":"Dive Depth","value":91},{"key":"endurance","label":"Endurance","value":87},{"key":"quietness","label":"Quietness","value":90},{"key":"firepower","label":"Firepower","value":79},{"key":"sensors","label":"Sensors","value":86}]'::jsonb, 17),
  ('sub-18', 'military-submarines-v1', '18', 'Kilo-class', '/decks/military-submarines-v1/18.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":78},{"key":"dive_depth","label":"Dive Depth","value":92},{"key":"endurance","label":"Endurance","value":77},{"key":"quietness","label":"Quietness","value":87},{"key":"firepower","label":"Firepower","value":91},{"key":"sensors","label":"Sensors","value":85}]'::jsonb, 18),
  ('sub-19', 'military-submarines-v1', '19', 'Lada-class', '/decks/military-submarines-v1/19.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":73},{"key":"dive_depth","label":"Dive Depth","value":84},{"key":"endurance","label":"Endurance","value":72},{"key":"quietness","label":"Quietness","value":78},{"key":"firepower","label":"Firepower","value":76},{"key":"sensors","label":"Sensors","value":70}]'::jsonb, 19),
  ('sub-20', 'military-submarines-v1', '20', 'Yasen-class', '/decks/military-submarines-v1/20.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":87},{"key":"dive_depth","label":"Dive Depth","value":91},{"key":"endurance","label":"Endurance","value":87},{"key":"quietness","label":"Quietness","value":94},{"key":"firepower","label":"Firepower","value":97},{"key":"sensors","label":"Sensors","value":85}]'::jsonb, 20),
  ('sub-21', 'military-submarines-v1', '21', 'Borei-class', '/decks/military-submarines-v1/21.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":91},{"key":"dive_depth","label":"Dive Depth","value":86},{"key":"endurance","label":"Endurance","value":84},{"key":"quietness","label":"Quietness","value":95},{"key":"firepower","label":"Firepower","value":94},{"key":"sensors","label":"Sensors","value":85}]'::jsonb, 21),
  ('sub-22', 'military-submarines-v1', '22', 'Akula-class', '/decks/military-submarines-v1/22.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":81},{"key":"dive_depth","label":"Dive Depth","value":85},{"key":"endurance","label":"Endurance","value":83},{"key":"quietness","label":"Quietness","value":83},{"key":"firepower","label":"Firepower","value":86},{"key":"sensors","label":"Sensors","value":75}]'::jsonb, 22),
  ('sub-23', 'military-submarines-v1', '23', 'Typhoon-class', '/decks/military-submarines-v1/23.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":87},{"key":"dive_depth","label":"Dive Depth","value":82},{"key":"endurance","label":"Endurance","value":79},{"key":"quietness","label":"Quietness","value":96},{"key":"firepower","label":"Firepower","value":86},{"key":"sensors","label":"Sensors","value":86}]'::jsonb, 23),
  ('sub-24', 'military-submarines-v1', '24', 'Sierra-class', '/decks/military-submarines-v1/24.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":77},{"key":"dive_depth","label":"Dive Depth","value":78},{"key":"endurance","label":"Endurance","value":77},{"key":"quietness","label":"Quietness","value":83},{"key":"firepower","label":"Firepower","value":79},{"key":"sensors","label":"Sensors","value":79}]'::jsonb, 24),
  ('sub-25', 'military-submarines-v1', '25', 'Delta IV-class', '/decks/military-submarines-v1/25.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":80},{"key":"dive_depth","label":"Dive Depth","value":92},{"key":"endurance","label":"Endurance","value":77},{"key":"quietness","label":"Quietness","value":89},{"key":"firepower","label":"Firepower","value":81},{"key":"sensors","label":"Sensors","value":77}]'::jsonb, 25),
  ('sub-26', 'military-submarines-v1', '26', 'Romeo-class', '/decks/military-submarines-v1/26.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":61},{"key":"dive_depth","label":"Dive Depth","value":70},{"key":"endurance","label":"Endurance","value":66},{"key":"quietness","label":"Quietness","value":64},{"key":"firepower","label":"Firepower","value":72},{"key":"sensors","label":"Sensors","value":63}]'::jsonb, 26),
  ('sub-27', 'military-submarines-v1', '27', 'Scorpene-class', '/decks/military-submarines-v1/27.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":86},{"key":"dive_depth","label":"Dive Depth","value":93},{"key":"endurance","label":"Endurance","value":81},{"key":"quietness","label":"Quietness","value":93},{"key":"firepower","label":"Firepower","value":80},{"key":"sensors","label":"Sensors","value":89}]'::jsonb, 27),
  ('sub-28', 'military-submarines-v1', '28', 'Soryu-class', '/decks/military-submarines-v1/28.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":77},{"key":"dive_depth","label":"Dive Depth","value":87},{"key":"endurance","label":"Endurance","value":89},{"key":"quietness","label":"Quietness","value":81},{"key":"firepower","label":"Firepower","value":83},{"key":"sensors","label":"Sensors","value":79}]'::jsonb, 28),
  ('sub-29', 'military-submarines-v1', '29', 'Taigei-class', '/decks/military-submarines-v1/29.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":88},{"key":"dive_depth","label":"Dive Depth","value":77},{"key":"endurance","label":"Endurance","value":81},{"key":"quietness","label":"Quietness","value":83},{"key":"firepower","label":"Firepower","value":83},{"key":"sensors","label":"Sensors","value":75}]'::jsonb, 29),
  ('sub-30', 'military-submarines-v1', '30', 'Collins-class', '/decks/military-submarines-v1/30.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":68},{"key":"dive_depth","label":"Dive Depth","value":85},{"key":"endurance","label":"Endurance","value":70},{"key":"quietness","label":"Quietness","value":86},{"key":"firepower","label":"Firepower","value":76},{"key":"sensors","label":"Sensors","value":74}]'::jsonb, 30),
  ('sub-31', 'military-submarines-v1', '31', 'Gotland-class', '/decks/military-submarines-v1/31.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":87},{"key":"dive_depth","label":"Dive Depth","value":87},{"key":"endurance","label":"Endurance","value":80},{"key":"quietness","label":"Quietness","value":91},{"key":"firepower","label":"Firepower","value":86},{"key":"sensors","label":"Sensors","value":86}]'::jsonb, 31),
  ('sub-32', 'military-submarines-v1', '32', 'Dolphin-class', '/decks/military-submarines-v1/32.jpg', '[{"key":"submerged_speed","label":"Sub Speed","value":77},{"key":"dive_depth","label":"Dive Depth","value":82},{"key":"endurance","label":"Endurance","value":78},{"key":"quietness","label":"Quietness","value":89},{"key":"firepower","label":"Firepower","value":86},{"key":"sensors","label":"Sensors","value":81}]'::jsonb, 32);

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
  'military-jets-v1',
  null,
  '{}'::jsonb,
  1,
  now(),
  now()
);

insert into public.game_players (id, session_id, player_name, color, is_host, seat_index)
values
  ('p1', '11111111-1111-1111-1111-111111111111', 'You', '#01ADFF', true, 1),
  ('p2', '11111111-1111-1111-1111-111111111111', 'Opponent', '#C669FF', false, 2);

update public.game_sessions
set state = jsonb_build_object(
  'sessionId', '11111111-1111-1111-1111-111111111111',
  'sessionCode', 'QRT001',
  'status', 'running',
  'hostPlayerId', 'p1',
  'deckId', 'military-jets-v1',
  'winnerPlayerId', null,
  'players', jsonb_build_array(
    jsonb_build_object(
      'id', 'p1',
      'name', 'You',
      'color', '#01ADFF',
      'hand', (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'category', c.category,
            'imageUrl', c.image_url,
            'specs', c.specs
          )
          order by c.sort_order
        )
        from public.deck_cards c
        where c.deck_id = 'military-jets-v1'
          and c.sort_order in (1, 3, 5, 7, 9, 11, 13, 15)
      )
    ),
    jsonb_build_object(
      'id', 'p2',
      'name', 'Opponent',
      'color', '#C669FF',
      'hand', (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'category', c.category,
            'imageUrl', c.image_url,
            'specs', c.specs
          )
          order by c.sort_order
        )
        from public.deck_cards c
        where c.deck_id = 'military-jets-v1'
          and c.sort_order in (2, 4, 6, 8, 10, 12, 14, 16)
      )
    )
  ),
  'selectedSpecKey', null,
  'selectedByPlayerId', null,
  'pendingTransfer', null,
  'loseTieRequest', null,
  'tieState', jsonb_build_object(
    'active', false,
    'rounds', 0,
    'potCards', '[]'::jsonb,
    'pendingLoseTieRequestId', null
  ),
  'version', 1,
  'updatedAt', now()::text
)
where id = '11111111-1111-1111-1111-111111111111';

delete from public.decks where id = 'pirate-ships-v1';

commit;
