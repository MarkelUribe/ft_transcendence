import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';

import { readFileSync } from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: readFileSync('/run/secrets/jwt_secret', 'utf8').trim(),
		});
	}

	async validate(payload: { sub: number; username: string }) {
		// This object becomes `req.user`
		return { id: payload.sub, username: payload.username };
	}
}