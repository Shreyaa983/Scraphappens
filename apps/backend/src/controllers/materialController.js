import {
  createMaterial,
  deleteMaterial,
  getAllMaterials,
  getMaterialById,
  getMaterialsByUser,
  updateMaterial,
} from "../models/materialModel.js";

export async function createMaterialListing(req, res) {
  try {
    const { 
      title, description, material_type, category, condition, quantity, quantity_unit, 
      location, image_url, price, is_free, delivery_option, sustainability_impact 
    } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });

    console.log("Creating new material listing");
    console.log("User creating listing:", req.user.sub);

    const listing = await createMaterial({
      title,
      description: description || null,
      material_type: material_type || null,
      category: category || null,
      condition: condition || null,
      quantity: quantity ? Number(quantity) : null,
      quantity_unit: quantity_unit || "kg",
      location: location || null,
      image_url: image_url || null,
      price: price ? Number(price) : null,
      is_free: is_free || false,
      delivery_option: delivery_option || "pickup_only",
      sustainability_impact: sustainability_impact || null,
      listed_by: req.user.sub,
    });

    console.log("Material stored successfully");
    return res.status(201).json({ material: listing });
  } catch (error) {
    console.error("Error creating material:", error);
    return res.status(500).json({ message: "Failed to create material" });
  }
}

export async function getMaterials(req, res) {
  try {
    const materials = await getAllMaterials();
    return res.status(200).json({ materials });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return res.status(500).json({ message: "Unexpected error fetching materials" });
  }
}

export async function getMyMaterials(req, res) {
  try {
    const materials = await getMaterialsByUser(req.user.sub);
    return res.status(200).json({ materials });
  } catch (error) {
    console.error("Error fetching my materials:", error);
    return res.status(500).json({ message: "Unexpected error" });
  }
}

export async function getSingleMaterial(req, res) {
  try {
    const material = await getMaterialById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });
    return res.status(200).json({ material });
  } catch (error) {
    console.error("Error fetching material:", error);
    return res.status(500).json({ message: "Unexpected error" });
  }
}

export async function updateMaterialListing(req, res) {
  try {
    const { 
      title, description, material_type, category, condition, quantity, quantity_unit, 
      location, image_url, price, is_free, delivery_option, sustainability_impact 
    } = req.body;
    const updated = await updateMaterial(req.params.id, req.user.sub, {
      title,
      description: description || null,
      material_type: material_type || null,
      category: category || null,
      condition: condition || null,
      quantity: quantity ? Number(quantity) : null,
      quantity_unit: quantity_unit || "kg",
      location: location || null,
      image_url: image_url || null,
      price: price ? Number(price) : null,
      is_free: is_free || false,
      delivery_option: delivery_option || "pickup_only",
      sustainability_impact: sustainability_impact || null,
    });
    if (!updated) return res.status(404).json({ message: "Not found or not authorized" });
    return res.status(200).json({ material: updated });
  } catch (error) {
    console.error("Error updating material:", error);
    return res.status(500).json({ message: "Failed to update material" });
  }
}

export async function deleteMaterialListing(req, res) {
  try {
    const material = await deleteMaterial(req.params.id, req.user.sub);
    if (!material) return res.status(404).json({ message: "Not found or not authorized" });
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
    return res.status(500).json({ message: "Unexpected error" });
  }
}

