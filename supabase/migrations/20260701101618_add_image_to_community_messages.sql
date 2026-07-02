/*
# Add image_url to community_messages

## Summary
Adds an optional image_url column to community_messages so users can send images in the community chat.

## Changes
- community_messages: new column `image_url` (text, nullable)
*/

ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS image_url text;
