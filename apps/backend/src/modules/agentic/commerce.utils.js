export function computeCartSummary(items = []) {
  const lines = (items || []).map((it) => {
    const unitPrice = it?.is_free ? 0 : Number(it?.price) || 0;
    const qty = Number(it?.quantity) || 0;
    const lineTotal = unitPrice * qty;
    return {
      cart_item_id: it.id,
      material_id: it.material_id,
      title: it.title,
      quantity: qty,
      unit_price: unitPrice,
      line_total: lineTotal,
      seller_name: it.seller_name || null,
      location: it.location || null,
      image_url: it.image_url || null,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + (Number(l.line_total) || 0), 0);
  return { lines, subtotal };
}


