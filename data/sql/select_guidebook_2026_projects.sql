-- Mark only the 68 officially selected 2026 Guidebook projects as APPROVED.
-- All other P-coded submissions remain as SUBMITTED (not shown on public map).
-- Source: official selection list provided by UIA, April 2026.

UPDATE projects
SET workflow_status = 'SUBMITTED'
WHERE external_code LIKE 'P%'
  AND workflow_status = 'APPROVED'
  AND external_code NOT IN (
    'P2','P3','P5','P8','P14','P15','P16','P25','P32','P44','P46','P50',
    'P55','P58','P59','P60','P61','P62','P64','P65','P66','P67','P70',
    'P71','P74','P75','P76','P79','P80','P81','P82','P84','P88','P91',
    'P94','P96','P98','P103','P104','P105','P109','P110','P113','P118',
    'P119','P126','P131','P133','P134','P137','P146','P147','P149','P152',
    'P153','P154','P155','P156','P159','P160','P162','P163','P164','P166',
    'P167','P168','P170','P173'
  );
