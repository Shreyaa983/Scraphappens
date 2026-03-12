import { fetchPexelsImage } from "../services/pexelsService.js";
import { sql } from "./client.js";

const DIY_SEED_POSTS = [
  {
    title: "Pallet Coffee Table",
    image_query: "wood pallet coffee table diy rustic living room",
    description: "Turn discarded wooden pallets into a rustic coffee table that fits beautifully in a living room or balcony seating area.",
    steps: [
      "Sand the wooden pallet thoroughly to remove splinters and rough edges.",
      "Trim the pallet to the desired size if needed.",
      "Attach small wheels or sturdy legs to the bottom for mobility and height.",
      "Add a glass sheet or smooth wooden plank on top for a flatter surface.",
      "Paint, stain, or varnish the table for a polished finish."
    ],
    estimated_cost: "Rs. 500",
    waste_saved: "15kg wood",
    main_image_url: "https://images.pexels.com/photos/6412/table-white-home-interior.jpg?cs=srgb&dl=pexels-karola-g2-6412.jpg&fm=jpg",
    materials: [
      { material_name: "Wooden pallet", material_category: "Wood", quantity_required: "1 pallet" },
      { material_name: "Sandpaper", material_category: "Finishing", quantity_required: "4 sheets" },
      { material_name: "Screws", material_category: "Hardware", quantity_required: "12 pieces" },
      { material_name: "Furniture wheels", material_category: "Hardware", quantity_required: "4 wheels" }
    ]
  },
  {
    title: "Vertical Bottle Garden",
    image_query: "plastic bottle vertical garden diy wall herbs",
    description: "Reuse plastic bottles to grow herbs vertically on a wall and create a compact green corner for small homes.",
    steps: [
      "Wash the plastic bottles and remove labels.",
      "Cut a rectangular opening on one side of each bottle.",
      "Make small drainage holes at the bottom.",
      "Fill the bottles with soil and compost.",
      "Plant herbs and hang the bottles vertically using rope or wire."
    ],
    estimated_cost: "Rs. 150",
    waste_saved: "10 plastic bottles",
    main_image_url: "https://images.pexels.com/photos/32103576/pexels-photo-32103576.jpeg?cs=srgb&dl=pexels-madhav-khanna-106387-32103576.jpg&fm=jpg",
    materials: [
      { material_name: "Plastic bottles", material_category: "Plastic", quantity_required: "10 bottles" },
      { material_name: "Soil", material_category: "Garden", quantity_required: "5 kg" },
      { material_name: "Herb plants", material_category: "Garden", quantity_required: "6 saplings" },
      { material_name: "Rope or wire", material_category: "Fasteners", quantity_required: "3 metres" }
    ]
  },
  {
    title: "Tin Can Desk Organizer",
    image_query: "tin can desk organizer diy painted cans stationery",
    description: "Convert empty tin cans into a colorful desk organizer for pens, scissors, brushes, and craft tools.",
    steps: [
      "Clean the cans and remove any sharp edges carefully.",
      "Paint them or wrap them with decorative paper.",
      "Arrange the cans on a wooden base to decide the layout.",
      "Glue the cans securely onto the base.",
      "Let everything dry before filling with stationery."
    ],
    estimated_cost: "Rs. 100",
    waste_saved: "5 metal cans",
    main_image_url: "https://images.pexels.com/photos/998592/pexels-photo-998592.jpeg?cs=srgb&dl=pexels-thepaintedsquare-998592.jpg&fm=jpg",
    materials: [
      { material_name: "Tin cans", material_category: "Metal", quantity_required: "5 cans" },
      { material_name: "Paint or paper", material_category: "Decor", quantity_required: "1 set" },
      { material_name: "Glue", material_category: "Adhesive", quantity_required: "1 tube" },
      { material_name: "Wooden board", material_category: "Wood", quantity_required: "1 base board" }
    ]
  },
  {
    title: "Wooden Crate Bookshelf",
    image_query: "wooden crate bookshelf diy stacked crates indoors",
    description: "Stack old wooden crates to create a modular bookshelf for books, plants, and small decor items.",
    steps: [
      "Clean the crates and sand any rough edges.",
      "Paint or stain the wood in the color you want.",
      "Arrange the crates in a stacked bookshelf pattern.",
      "Secure adjoining crates with screws.",
      "Fix the unit to the wall for extra stability."
    ],
    estimated_cost: "Rs. 600",
    waste_saved: "20kg wood",
    main_image_url: "https://images.pexels.com/photos/17135526/pexels-photo-17135526.jpeg?cs=srgb&dl=pexels-diego-bispo-574118374-17135526.jpg&fm=jpg",
    materials: [
      { material_name: "Wooden crates", material_category: "Wood", quantity_required: "4 crates" },
      { material_name: "Screws", material_category: "Hardware", quantity_required: "16 pieces" },
      { material_name: "Paint", material_category: "Finishing", quantity_required: "1 can" },
      { material_name: "Drill", material_category: "Tool", quantity_required: "1 tool" }
    ]
  },
  {
    title: "Old T-Shirt Tote Bag",
    image_query: "t shirt tote bag diy no sew reusable bag",
    description: "Turn an old T-shirt into a reusable tote bag without sewing, ideal for groceries and quick errands.",
    steps: [
      "Lay the T-shirt flat and smooth out wrinkles.",
      "Cut off both sleeves close to the seams.",
      "Cut a wider neck opening to form the bag handles.",
      "Cut small strips along the bottom hem.",
      "Tie the strips into tight knots and flip the bag inside out."
    ],
    estimated_cost: "Rs. 0",
    waste_saved: "1 clothing item",
    main_image_url: "https://images.pexels.com/photos/9324370/pexels-photo-9324370.jpeg?cs=srgb&dl=pexels-lara-jameson-9324370.jpg&fm=jpg",
    materials: [
      { material_name: "Old T-shirt", material_category: "Fabric", quantity_required: "1 shirt" }
    ]
  },
  {
    title: "Pallet Vertical Herb Garden",
    image_query: "pallet vertical herb garden diy planter",
    description: "Convert a discarded pallet into a compact vertical herb planter for kitchens, balconies, or terraces.",
    steps: [
      "Sand the pallet to smooth splinters and rough areas.",
      "Staple or nail landscape fabric behind each planting row.",
      "Secure the bottom edge to create planting pockets.",
      "Fill the pockets with soil and compost.",
      "Plant herbs and water lightly to settle the soil."
    ],
    estimated_cost: "Rs. 250",
    waste_saved: "12kg wood",
    main_image_url: "https://images.pexels.com/photos/33125616/pexels-photo-33125616.jpeg?cs=srgb&dl=pexels-2154236762-33125616.jpg&fm=jpg",
    materials: [
      { material_name: "Wooden pallet", material_category: "Wood", quantity_required: "1 pallet" },
      { material_name: "Soil", material_category: "Garden", quantity_required: "6 kg" },
      { material_name: "Herb plants", material_category: "Garden", quantity_required: "8 saplings" },
      { material_name: "Fabric lining", material_category: "Garden", quantity_required: "1 sheet" }
    ]
  },
  {
    title: "Cardboard Laptop Stand",
    image_query: "cardboard laptop stand diy desk setup",
    description: "Build a simple laptop stand using thick cardboard to improve posture while studying or working.",
    steps: [
      "Draw a side profile for the stand on thick cardboard.",
      "Cut identical side panels and support pieces.",
      "Glue several layers together for strength.",
      "Assemble the pieces into a stable stand shape.",
      "Test the angle and place the laptop carefully on top."
    ],
    estimated_cost: "Rs. 0",
    waste_saved: "2 cardboard boxes",
    main_image_url: "https://images.pexels.com/photos/4792717/pexels-photo-4792717.jpeg?cs=srgb&dl=pexels-anete-lusina-4792717.jpg&fm=jpg",
    materials: [
      { material_name: "Thick cardboard", material_category: "Cardboard", quantity_required: "2 boxes" },
      { material_name: "Glue", material_category: "Adhesive", quantity_required: "1 tube" }
    ]
  },
  {
    title: "Glass Jar Candle Holder",
    image_query: "glass jar candle holder diy decorated jars",
    description: "Reuse glass jars as decorative candle holders for cozy evening lighting and festive home decor.",
    steps: [
      "Wash the jars and remove labels completely.",
      "Wrap the outside with rope or paint decorative patterns.",
      "Let paint or glue dry fully before use.",
      "Place a candle or tealight safely inside the jar.",
      "Use the finished holders on tables, balconies, or shelves."
    ],
    estimated_cost: "Rs. 80",
    waste_saved: "3 glass jars",
    main_image_url: "https://images.pexels.com/photos/30393195/pexels-photo-30393195.jpeg?cs=srgb&dl=pexels-renan-almeida-3218109-30393195.jpg&fm=jpg",
    materials: [
      { material_name: "Glass jars", material_category: "Glass", quantity_required: "3 jars" },
      { material_name: "Rope or paint", material_category: "Decor", quantity_required: "1 set" },
      { material_name: "Candle", material_category: "Decor", quantity_required: "3 candles" }
    ]
  },
  {
    title: "Newspaper Woven Storage Basket",
    image_query: "newspaper woven basket diy storage basket handmade",
    description: "Transform old newspapers into a woven storage basket for lightweight items like chargers, scarves, or toiletries.",
    steps: [
      "Roll newspaper sheets into tight tubes using a skewer.",
      "Flatten a few tubes to create the base frame.",
      "Weave additional tubes around the base in a basket shape.",
      "Tuck in the ends neatly and secure with glue.",
      "Paint or seal the basket for a cleaner finish."
    ],
    estimated_cost: "Rs. 120",
    waste_saved: "30 newspaper sheets",
    main_image_url: "https://images.pexels.com/photos/34846770/pexels-photo-34846770.jpeg?cs=srgb&dl=pexels-magda-ehlers-pexels-34846770.jpg&fm=jpg",
    materials: [
      { material_name: "Old newspapers", material_category: "Paper", quantity_required: "30 sheets" },
      { material_name: "Glue", material_category: "Adhesive", quantity_required: "1 tube" },
      { material_name: "Paint", material_category: "Finishing", quantity_required: "1 small bottle" }
    ]
  }
];

export async function seedDiyInspirationPosts() {
  const existingRows = await sql`
    SELECT id, title, main_image_url
    FROM diy_posts
  `;

  const existingPostsByTitle = new Map(
    existingRows
      .map((row) => [String(row.title || "").trim().toLowerCase(), row])
      .filter(([title]) => Boolean(title))
  );

  let insertedCount = 0;
  let updatedCount = 0;

  for (const post of DIY_SEED_POSTS) {
    const normalizedTitle = post.title.trim().toLowerCase();
    const resolvedImageUrl = (await fetchPexelsImage(post.image_query || post.title)) || post.main_image_url;
    const existingPost = existingPostsByTitle.get(normalizedTitle);

    if (existingPost) {
      const shouldUpdateImage = resolvedImageUrl && resolvedImageUrl !== existingPost.main_image_url;

      if (shouldUpdateImage) {
        await sql`
          UPDATE diy_posts
          SET main_image_url = ${resolvedImageUrl}
          WHERE id = ${existingPost.id}
        `;
        updatedCount += 1;
      }

      continue;
    }

    const insertedPosts = await sql`
      INSERT INTO diy_posts (title, description, steps, estimated_cost, waste_saved, main_image_url)
      VALUES (
        ${post.title},
        ${post.description},
        ${JSON.stringify(post.steps)},
        ${post.estimated_cost},
        ${post.waste_saved},
        ${resolvedImageUrl}
      )
      RETURNING id
    `;

    const diyPostId = insertedPosts[0].id;

    for (const material of post.materials) {
      await sql`
        INSERT INTO diy_materials (diy_post_id, material_name, material_category, marketplace_material_id, quantity_required)
        VALUES (
          ${diyPostId},
          ${material.material_name},
          ${material.material_category},
          NULL,
          ${material.quantity_required}
        )
      `;
    }

    insertedCount += 1;
    existingPostsByTitle.set(normalizedTitle, {
      id: diyPostId,
      title: post.title,
      main_image_url: resolvedImageUrl
    });
  }

  return {
    inserted: insertedCount,
    updated: updatedCount,
    skipped: insertedCount === 0 && updatedCount === 0
  };
}
