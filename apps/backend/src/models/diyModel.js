import { sql } from "../db/client.js";

export async function createDiyPost({ title, description, steps, estimated_cost, waste_saved, main_image_url }) {
  const rows = await sql`
    INSERT INTO diy_posts (title, description, steps, estimated_cost, waste_saved, main_image_url)
    VALUES (${title}, ${description}, ${steps}, ${estimated_cost}, ${waste_saved}, ${main_image_url})
    RETURNING id, title, description, steps, main_image_url, estimated_cost, waste_saved, created_at
  `;
  return rows[0];
}

export async function addMaterialsForDiyPost(diyPostId, materials) {
  if (!Array.isArray(materials) || materials.length === 0) return [];

  const values = materials.map((material) => sql`(
    ${diyPostId},
    ${material.material_name},
    ${material.material_category || null},
    ${material.marketplace_material_id || null},
    ${material.quantity_required || null}
  )`);

  const rows = await sql`
    INSERT INTO diy_materials (diy_post_id, material_name, material_category, marketplace_material_id, quantity_required)
    VALUES ${sql.join(values, sql`, `)}
    RETURNING id, diy_post_id, material_name, material_category, marketplace_material_id, quantity_required
  `;

  return rows;
}

export async function getAllDiyPosts() {
  const rows = await sql`
    SELECT id, title, description, steps, main_image_url, estimated_cost, waste_saved, created_at
    FROM diy_posts
    ORDER BY created_at DESC
  `;
  return rows;
}

export async function getDiyPostById(id) {
  const posts = await sql`
    SELECT id, title, description, steps, main_image_url, estimated_cost, waste_saved, created_at
    FROM diy_posts
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!posts[0]) return null;

  const materials = await sql`
    SELECT id, diy_post_id, material_name, material_category, marketplace_material_id, quantity_required
    FROM diy_materials
    WHERE diy_post_id = ${id}
    ORDER BY material_name ASC
  `;

  return { ...posts[0], materials };
}

export async function getResultsForDiyPost(diyPostId) {
  const rows = await sql`
    SELECT
      r.id,
      r.user_id,
      r.diy_post_id,
      r.image_url,
      r.caption,
      r.created_at,
      u.name AS user_name
    FROM diy_results r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.diy_post_id = ${diyPostId}
    ORDER BY r.created_at DESC
  `;
  return rows;
}

export async function createDiyResult({ userId, diyPostId, imageUrl, caption }) {
  const rows = await sql`
    INSERT INTO diy_results (user_id, diy_post_id, image_url, caption)
    VALUES (${userId}, ${diyPostId}, ${imageUrl}, ${caption})
    RETURNING id, user_id, diy_post_id, image_url, caption, created_at
  `;
  return rows[0];
}

export async function createCommunityResult({ userId, imageUrl, caption }) {
  const rows = await sql`
    INSERT INTO diy_results (user_id, diy_post_id, image_url, caption, also_share_community)
    VALUES (${userId}, NULL, ${imageUrl}, ${caption}, TRUE)
    RETURNING id, user_id, diy_post_id, image_url, caption, also_share_community, created_at
  `;
  return rows[0];
}

export async function getCommunityResults() {
  const rows = await sql`
    SELECT
      r.id,
      r.user_id,
      r.diy_post_id,
      r.image_url,
      r.caption,
      r.also_share_community,
      r.created_at,
      u.name AS user_name,
      p.title AS diy_title
    FROM diy_results r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN diy_posts p ON p.id = r.diy_post_id
    WHERE r.also_share_community = TRUE OR r.diy_post_id IS NULL
    ORDER BY r.created_at DESC
  `;
  return rows;
}

export async function addCommentToResult({ resultId, userId, commentText }) {
  const rows = await sql`
    INSERT INTO diy_result_comments (result_id, user_id, comment_text)
    VALUES (${resultId}, ${userId}, ${commentText})
    RETURNING id, result_id, user_id, comment_text, created_at
  `;
  return rows[0];
}

export async function getCommentsForResult(resultId) {
  const rows = await sql`
    SELECT c.id, c.result_id, c.user_id, c.comment_text, c.created_at, u.name AS user_name
    FROM diy_result_comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.result_id = ${resultId}
    ORDER BY c.created_at ASC
  `;
  return rows;
}

export async function saveDiyPost({ userId, diyPostId }) {
  const rows = await sql`
    INSERT INTO diy_saved_posts (user_id, diy_post_id)
    VALUES (${userId}, ${diyPostId})
    ON CONFLICT (user_id, diy_post_id) DO UPDATE SET diy_post_id = EXCLUDED.diy_post_id
    RETURNING id, user_id, diy_post_id, created_at
  `;
  return rows[0];
}

export async function getSavedDiyPosts(userId) {
  const rows = await sql`
    SELECT
      s.id,
      s.created_at,
      p.id AS diy_post_id,
      p.title,
      p.description,
      p.main_image_url,
      p.estimated_cost,
      p.waste_saved
    FROM diy_saved_posts s
    JOIN diy_posts p ON p.id = s.diy_post_id
    WHERE s.user_id = ${userId}
    ORDER BY s.created_at DESC
  `;
  return rows;
}

export async function findBestMarketplaceMaterialMatch(materialName, materialCategory) {
  if (!materialName && !materialCategory) {
    return null;
  }

  const nameQuery = materialName ? `%${materialName.trim()}%` : null;
  const categoryQuery = materialCategory ? `%${materialCategory.trim()}%` : null;

  const rows = await sql`
    SELECT id, title, material_type, category, condition, quantity, quantity_unit, location, image_url, created_at
    FROM materials
    WHERE (
      ${nameQuery} IS NOT NULL AND (
        title ILIKE ${nameQuery}
        OR COALESCE(material_type, '') ILIKE ${nameQuery}
        OR COALESCE(category, '') ILIKE ${nameQuery}
        OR COALESCE(description, '') ILIKE ${nameQuery}
      )
    )
    OR (
      ${categoryQuery} IS NOT NULL AND (
        COALESCE(category, '') ILIKE ${categoryQuery}
        OR COALESCE(material_type, '') ILIKE ${categoryQuery}
      )
    )
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return rows[0] || null;
}

export async function getRandomMarketplaceMaterialSeed() {
  const rows = await sql`
    SELECT title, material_type, category
    FROM materials
    ORDER BY RANDOM()
    LIMIT 1
  `;

  return rows[0] || null;
}
