UPDATE Product
SET displayPrice = sourcePrice
WHERE slug = 'lenovo-v15-g5-i7-13620h-512gb-ssd-16gb-ddr5-15-6-business-laptop-lenovo-v15'
  AND sourcePrice IS NOT NULL;

SELECT slug, displayPrice, sourcePrice, comparePrice, sourceUrl
FROM Product
WHERE slug = 'lenovo-v15-g5-i7-13620h-512gb-ssd-16gb-ddr5-15-6-business-laptop-lenovo-v15';
