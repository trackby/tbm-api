import * as bcrypt from 'bcrypt';
import { request } from 'http';
import * as jwt from 'jsonwebtoken';
import { BadRequest } from '../errors/BadRequest';
import { User } from '../models/user';
import { Service } from './service';

export class AuthService extends Service {
  private key: string;

  constructor() {
    super();
    this.key = process.env.SECRET_KEY;
  }

  public async isUserExists(username: string, email?: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      let res = await client.query('SELECT * FROM users WHERE username = $1', [ username ]);
      if (res.rows[0]) {
        return res.rows[0];
      } else if (email) {
        res = await client.query('SELECT * FROM users WHERE email = $1', [ email ]);
        if (res.rows[0]) {
          return res.rows[0];
        }
      }
    } catch (e) {
      throw new Error(e);
    } finally {
      client.release();
    }
    return false;
  }
  public async save(user: User): Promise<boolean> {
    const { username, password, email } = user;
    const salt = await bcrypt.genSalt(10).catch((error) => {
      throw new Error(error);
    });
    const hashedPass = await bcrypt.hash(password, salt).catch((error) => {
      throw new Error(error);
    });

    const values = [ username, hashedPass, email ];
    const sql = 'INSERT INTO users(username, password, email) VALUES($1, $2, $3) RETURNING *';
    const client = await this.pool.connect();

    try {
      const res = await client.query(sql, values);
      if (res.rows[0]) {
        user.id = res.rows[0].id;
        return true;
      }
    } catch (e) {
      throw new Error(e);
    } finally {
      client.release();
    }
    return false;
  }

  public async comparePass(given: string, username: string) {
    const user: User = await this.findOne(username);
    const stored: string = user.password;

    const isMatch: boolean = await bcrypt.compare(given, stored).catch((error) => {
      throw new Error(error);
    });
    return isMatch;
  }

  public async findOne(username: string): Promise<User> {
    const client = await this.pool.connect();
    const sql = 'SELECT * FROM users WHERE username = $1';
    try {
      const res = await client.query(sql, [ username ]);
      if (res.rows[0]) {
        return res.rows[0];
      }
    } catch (e) {
      throw new Error(e);
    } finally {
      client.release();
    }
    return null;
  }

  public signJWT(id: number, role: string) {
    const token = jwt.sign({ id, role }, this.key, {
      algorithm: 'HS384',
      expiresIn: 60 * 60 * 24,
      issuer: 'trackby',
    });
    if (token) {
      return token;
    }
  }

  public verifyJWT(token: string): string |object {
    if (token) {
      try {
        const decoded: string | object = jwt.verify(token, this.key, {
            algorithms: ['HS384'],
            issuer: 'trackby',
          });
        return decoded;
      } catch (e) {
        throw new Error(e);
      }
    }
  }
}
