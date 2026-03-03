import Post from "../models/postModel.js";
import { NotFoundError, ValidationError } from "../middlewares/errorHandler.js";

// Fetch all posts that belong to the authenticated tenant
export const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ tenantId: req.tenantId, isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
};

// Create a post for the authenticated tenant
export const createPost = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      throw new ValidationError("Title is required");
    }

    const newPost = await Post.create({
      title,
      description,
      tenantId: req.tenantId,
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    next(err);
  }
};

// Delete a post if it belongs to the authenticated tenant (soft delete)
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!post) {
      throw new NotFoundError("Post not found or unauthorized");
    }

    res.status(200).json({ success: true, data: post, message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
};
