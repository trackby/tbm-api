import { Request, Response } from 'express';
import { BadRequest } from '../errors/BadRequest';
import { NotFound } from '../errors/NotFound';
import { UnprocessableEntity } from '../errors/UnprocessableEntity';
import { Comment } from '../models/comment';
import { WatchService } from '../services/WatchService';

const watchService = new WatchService();
export class WatchController {
  public static async unmarkWatch(req: Request, res: Response) {
    const { watchid } = req.params;

    const r = await watchService.delete(watchid);
    if (r) {
      return res.status(200).send(r);
    }
    return res.status(404).send(new NotFound());
  }
}
