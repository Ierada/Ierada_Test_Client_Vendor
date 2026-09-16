IERADA Bulk Product Listing templates
=====================================

Images first, then seller ops Excel.
AI writes title, category tree, HSN/GST and copy after SKU-image map.
Step 4 = download completed Excel, edit, re-upload on the same step, then submit.

Files
-----
- IERADA_Bulk_Listing_Single_Products.xlsx
  Products sheet: SKU, brand type, brand, colour, size, prices, stock, package, What's in the Box (seller-filled).
  Size column is a dropdown of admin Size attributes. Multiple sizes: 6, 7, 8.
  Completed (example) sheet: same rows plus AI copy + staged image counts.

- IERADA_Bulk_Listing_Color_Size_Variations.xlsx
  Products (parent, including seller-filled What's in the Box) + Variations (colour × size). Use Image SKU so all sizes of one colour share photos.

- IERADA_Bulk_Listing_Custom_Variations.xlsx
  Products (including seller-filled What's in the Box) + Attributes (up to 4) + Variations (combination rows).
  Size is not used here — variation axes are Attribute 1–4.

Colour key
----------
Orange  Mandatory seller input (first upload)
Purple  AI copy (Step 4 completed file only — seller may edit there)
Blue    Lookup — live catalogue title or ID
Slate   Optional seller input (Image SKU, extra attributes, barcode)
Green   System — image staging / Country of Origin default

Do not write descriptions, SEO or an AI prompt on the first upload.

Image rule
----------
Upload images FIRST. Do not embed files in the xlsx.
Filename: {SKU}-{n}.jpg | .png | .webp
SKU-1 is cover. Parser uses the last -{n} before the extension.
Max 10 images per SKU. Prefer 1000 × 1000 px.

Step 4 loop
-----------
Download completed file → verify / edit any cell → re-upload on Preview →
re-validate (images stay mapped unless SKU changed) → submit.
Vendor publish stays Hidden + pending_review.

SAMPLE rows
-----------
Delete SAMPLE rows before a live upload.
Ignore Completed (example) on first upload; the wizard generates the real file.

Regenerate
----------
node Ierada_Test_Server/scripts/generateBulkListingTemplates.js
