import {
  addCommentToResult,
  createCommunityResult,
  createDiyResult,
  getAllDiyPosts,
  getCommentsForResult,
  getCommunityResults,
  getDiyPostById,
  getResultsForDiyPost,
  getSavedDiyPosts,
  saveDiyPost
} from "../models/diyModel.js";

export async function listDiyPosts(req, res) {
  try {
    const posts = await getAllDiyPosts();
    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Error fetching DIY posts:", error);
    return res.status(500).json({ message: "Failed to fetch DIY inspiration" });
  }
}

export async function getDiyPost(req, res) {
  try {
    const post = await getDiyPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "DIY post not found" });
    }
    return res.status(200).json({ post });
  } catch (error) {
    console.error("Error fetching DIY post:", error);
    return res.status(500).json({ message: "Failed to fetch DIY post" });
  }
}

export async function generateDiyPost(req, res) {
  return res.status(501).json({
    message: "AI DIY generation is disabled for now. Static inspiration posts are seeded in the database for testing."
  });
}

export async function getDiyPostResults(req, res) {
  try {
    const results = await getResultsForDiyPost(req.params.id);
    return res.status(200).json({ results });
  } catch (error) {
    console.error("Error fetching DIY results:", error);
    return res.status(500).json({ message: "Failed to fetch DIY results" });
  }
}

export async function createResultForDiyPost(req, res) {
  try {
    const diyPostId = req.params.id;
    const { caption, image_url } = req.body;
    const file = req.file;

    const existingPost = await getDiyPostById(diyPostId);
    if (!existingPost) {
      return res.status(404).json({ message: "DIY post not found" });
    }

    let resolvedImageUrl = image_url;
    if (file) {
      resolvedImageUrl = `/uploads/${file.filename}`;
    }

    if (!resolvedImageUrl) {
      return res.status(400).json({ message: "An image is required" });
    }

    const result = await createDiyResult({
      userId: req.user.sub,
      diyPostId,
      imageUrl: resolvedImageUrl,
      caption: caption || ""
    });

    const hydratedResults = await getResultsForDiyPost(diyPostId);
    const created = hydratedResults.find((item) => item.id === result.id) || result;

    return res.status(201).json({ result: created });
  } catch (error) {
    console.error("Error creating DIY result:", error);
    return res.status(500).json({ message: "Failed to create result" });
  }
}

export async function saveDiyPostForUser(req, res) {
  try {
    const diyPostId = req.params.id;
    const saved = await saveDiyPost({ userId: req.user.sub, diyPostId });
    return res.status(200).json({ saved });
  } catch (error) {
    console.error("Error saving DIY post:", error);
    return res.status(500).json({ message: "Failed to save inspiration" });
  }
}

export async function listSavedDiyPosts(req, res) {
  try {
    const posts = await getSavedDiyPosts(req.user.sub);
    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Error fetching saved DIY posts:", error);
    return res.status(500).json({ message: "Failed to fetch saved inspirations" });
  }
}

export async function createCommunityPost(req, res) {
  try {
    const { image_url, caption } = req.body;
    const file = req.file;

    let resolvedImageUrl = image_url;
    if (file) {
      resolvedImageUrl = `/uploads/${file.filename}`;
    }

    if (!resolvedImageUrl) {
      return res.status(400).json({ message: "An image is required" });
    }

    const result = await createCommunityResult({
      userId: req.user.sub,
      imageUrl: resolvedImageUrl,
      caption: caption || ""
    });

    return res.status(201).json({ result });
  } catch (error) {
    console.error("Error creating community post:", error);
    return res.status(500).json({ message: "Failed to create community post" });
  }
}

export async function listCommunityPosts(req, res) {
  try {
    const results = await getCommunityResults();
    return res.status(200).json({ results });
  } catch (error) {
    console.error("Error fetching community posts:", error);
    return res.status(500).json({ message: "Failed to fetch community feed" });
  }
}

export async function addComment(req, res) {
  try {
    const resultId = req.params.id;
    const { comment_text } = req.body;

    if (!comment_text) {
      return res.status(400).json({ message: "comment_text is required" });
    }

    const comment = await addCommentToResult({
      resultId,
      userId: req.user.sub,
      commentText: comment_text
    });

    return res.status(201).json({ comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ message: "Failed to add comment" });
  }
}

export async function listComments(req, res) {
  try {
    const comments = await getCommentsForResult(req.params.id);
    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ message: "Failed to fetch comments" });
  }
}
