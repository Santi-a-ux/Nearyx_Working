import { toCommentDto, toCommentInput } from '../dtos/comment.dto.js';

export class CommentController {
  constructor(commentService) {
    this.commentService = commentService;
  }

  list = async (req, res) => {
    const comments = await this.commentService.listByPost(req.valid.params.post_id);
    res.json({ comments: comments.map(toCommentDto), total: comments.length });
  };

  create = async (req, res) => {
    const comment = await this.commentService.create(
      req.user.userId,
      req.valid.params.post_id,
      toCommentInput(req.valid.body),
    );
    res.status(201).json(toCommentDto(comment));
  };

  delete = async (req, res) => {
    await this.commentService.delete(req.user.userId, req.valid.params.comment_id);
    res.json({ deleted: true });
  };
}
