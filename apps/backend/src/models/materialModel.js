import { sql } from "../db/client.js";

export async function createMaterial(materialData) {
  const {
    title,
    description,
    material_type,
    category,
    condition,
    quantity,
    quantity_unit,
    location,
    image_url,
    price,
    is_free,
    delivery_option,
    sustainability_impact,
    listed_by,
  } = materialData;

  const result = await sql`
    INSERT INTO materials (
      title, description, material_type, category, condition, quantity, quantity_unit, 
      location, image_url, price, is_free, delivery_option, sustainability_impact, listed_by
    ) VALUES (
      ${title}, ${description}, ${material_type}, ${category}, ${condition}, ${quantity}, 
      ${quantity_unit ?? "kg"}, ${location}, ${image_url}, ${price}, ${is_free ?? false}, 
      ${delivery_option ?? "pickup_only"}, ${sustainability_impact}, ${listed_by}
    )
    RETURNING *;
  `;
  return result[0];
}

export async function getAllMaterials() {
  const rows = await sql`SELECT * FROM materials ORDER BY created_at DESC;`;
  return rows;
}

export async function getMaterialsByUser(userId) {
  const rows = await sql`SELECT * FROM materials WHERE listed_by = ${userId} ORDER BY created_at DESC;`;
  return rows;
}

export async function getMaterialById(id) {
  const result = await sql`SELECT * FROM materials WHERE id = ${id};`;
  return result[0] || null;
}

export async function updateMaterial(id, userId, updates) {
  const { 
    title, description, material_type, category, condition, quantity, quantity_unit, 
    location, image_url, price, is_free, delivery_option, sustainability_impact 
  } = updates;
  const result = await sql`
    UPDATE materials SET
      title = ${title},
      description = ${description},
      material_type = ${material_type},
      category = ${category},
      condition = ${condition},
      quantity = ${quantity},
      quantity_unit = ${quantity_unit ?? "kg"},
      location = ${location},
      image_url = ${image_url},
      price = ${price},
      is_free = ${is_free ?? false},
      delivery_option = ${delivery_option ?? "pickup_only"},
      sustainability_impact = ${sustainability_impact}
    WHERE id = ${id} AND listed_by = ${userId}
    RETURNING *;
  `;
  return result[0] || null;
}

export async function deleteMaterial(id, listed_by) {
  const rows = await sql`
    DELETE FROM materials
    WHERE id = ${id} AND listed_by = ${listed_by}
    RETURNING *;
  `;
  return rows[0] || null;
}

