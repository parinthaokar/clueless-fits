# Data audit - Polyvore (owj0421/polyvore)

- Rows: **251,008**  |  Columns: item_id, url_name, title, description, category
- Duplicate item_id: **0**  |  Duplicate full rows: 0
- Same url_name + title under different ids (possible duplicate products): 26,736
- URL-encoded url_name values (e.g. %C3%A9): 5,558
- Items with non-English / non-ASCII text in title or description: 10,496
- Category imbalance (largest / smallest class): **9.2x**
- Image check: 300 sampled, 0 failed to open

## Missing values (null + empty string)

|             |   null |   empty_string |   pct_missing_total |
|:------------|-------:|---------------:|--------------------:|
| item_id     |      0 |              0 |                0    |
| url_name    |      0 |              0 |                0    |
| title       |      0 |         176156 |               70.18 |
| description |      0 |         178856 |               71.26 |
| category    |      0 |              0 |                0    |

## Category counts

| category    |   count |   pct |
|:------------|--------:|------:|
| shoes       |   44850 | 17.87 |
| jewellery   |   41414 | 16.5  |
| bags        |   40717 | 16.22 |
| tops        |   32998 | 13.15 |
| bottoms     |   27670 | 11.02 |
| all-body    |   18478 |  7.36 |
| outerwear   |   17065 |  6.8  |
| sunglasses  |    9874 |  3.93 |
| accessories |    6973 |  2.78 |
| hats        |    6071 |  2.42 |
| scarves     |    4898 |  1.95 |

## Description length (characters, empty counted as 0)

|       |    chars |
|:------|---------:|
| count | 251008   |
| mean  |     70.7 |
| std   |    150.3 |
| min   |      0   |
| 25%   |      0   |
| 50%   |      0   |
| 75%   |     82   |
| max   |   4096   |

## Image sizes in sample

|         |   count |
|:--------|--------:|
| 300x300 |     300 |

## Cleaning log

- url_name: 0 empty strings set to missing
- title: 176,156 empty strings set to missing
- description: 178,856 empty strings set to missing
- url_name: 5,558 values URL-decoded
- duplicate item_id rows dropped: 0
- rows without category dropped: 0
- final rows: 251,008
