# Data dictionary - Polyvore (cleaned)

One row = one clothing item or accessory. Rows after cleaning: 251,008.

| Field           | Type          | Source   | Description                                                                            | % missing   | Example                                  |
|:----------------|:--------------|:---------|:---------------------------------------------------------------------------------------|:------------|:-----------------------------------------|
| item_id         | str           | raw      | Unique Polyvore item identifier (string). Primary key.                                 | 0.0%        | 211990161                                |
| image           | image (bytes) | raw      | 300px product photo (stored as image bytes). Not in the metadata table.                | -           | 300x300 JPEG                             |
| url_name        | string        | raw      | Short item name taken from the product URL; URL-decoded during cleaning.               | 0.0%        | neck print chiffon plus size             |
| title           | string        | raw      | Product title from the retailer. Often missing.                                        | 70.2%       | Christian Pellizzari floral jacquard tro |
| description     | string        | raw      | Retailer description; may mention color, material, pattern, size. Often missing.       | 71.3%       | Gold and black silk blend floral jacquar |
| category        | str           | raw      | Item category (11 classes, e.g. tops, bottoms, shoes). Target for item classification. | 0.0%        | tops                                     |
| has_title       | bool          | derived  | Derived: True if title is present.                                                     | 0.0%        | False                                    |
| has_description | bool          | derived  | Derived: True if description is present.                                               | 0.0%        | False                                    |
| desc_len        | Int64         | derived  | Derived: description length in characters (0 if missing).                              | 0.0%        | 0                                        |
| non_ascii       | bool          | derived  | Derived: True if title/description contains non-ASCII text (often non-English).        | 0.0%        | False                                    |

**Category values:** accessories, all-body, bags, bottoms, hats, jewellery, outerwear, scarves, shoes, sunglasses, tops
