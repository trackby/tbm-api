import { Service } from './service';
import { ShowService } from './ShowService';

export class WatchService extends Service {
  public async create(uid: number): Promise<number> {
    const client = await this.pool.connect();
    const sql = 'INSERT into watch (user_id) VALUES($1) RETURNING id';
    try {
      const res = await client.query(sql, [ uid ]);
      return res.rows[0].id;
    } catch (e) {
      throw new Error(e);
    } finally {
      client.release();
    }
  }

  public async delete(uid: number): Promise<number> {
    const client = await this.pool.connect();
    const sql = 'DELETE FROM watch WHERE id = $1 RETURNING id';
    try {
      const res = await client.query(sql, [ uid ]);
      return res.rows[0].id;
    } catch (e) {
      throw new Error(e);
    } finally {
      client.release();
    }
  }
}
